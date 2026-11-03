from collections.abc import Iterator
from datetime import timedelta
from typing import Any

import httpx
import pytest
import respx
from django.core.cache import cache
from django.test import Client
from django.utils import timezone

from stormlane.core.polyline import decode
from stormlane.routing.valhalla import ROUTES_URL
from stormlane.weather.openmeteo import GEOCODE_URL, NOMINATIM_REVERSE_URL
from tests.fakes import (
    open_meteo_responder,
    straight_line,
    valhalla_payload,
    valhalla_trip,
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

CHICAGO = {"lat": 41.8781, "lon": -87.6298}
INDIANAPOLIS = {"lat": 39.7684, "lon": -86.1581}


def stormy_west_of(lon_limit: float) -> Any:
    def weather(_: float, lon: float) -> dict[str, float]:
        wind = 50.0 if lon < lon_limit else 10.0
        return {"wind": wind, "gust": wind, "rain": 0.0, "showers": 0.0, "snow": 0.0}

    return weather


def routes_payload() -> dict[str, Any]:
    direct = straight_line((41.8781, -87.6298), (39.7684, -86.1581), 60)
    western = [
        *straight_line((41.8781, -87.6298), (40.5, -88.5), 30),
        *straight_line((40.5, -88.5), (39.7684, -86.1581), 31)[1:],
    ]
    return valhalla_payload(
        valhalla_trip(western, length_km=300.0, time_s=10_800),
        valhalla_trip(direct, length_km=290.0, time_s=11_400),
    )


def reverse_place(request: httpx.Request) -> httpx.Response:
    lat = float(request.url.params["lat"])
    if lat >= 40.5:
        city, state = "Chicago", "Illinois"
    else:
        city, state = "Indianapolis", "Indiana"
    return httpx.Response(
        200,
        json={
            "name": city,
            "address": {
                "city": city,
                "state": state,
                "country": "United States",
                "country_code": "us",
            },
        },
    )


@pytest.fixture
def upstream() -> Iterator[respx.MockRouter]:
    with respx.mock(assert_all_called=False) as router:
        router.get(ROUTES_URL).respond(json=routes_payload())
        router.get(OPEN_METEO_URL).mock(side_effect=open_meteo_responder(stormy_west_of(-87.8)))
        router.get(NOMINATIM_REVERSE_URL).mock(side_effect=reverse_place)
        yield router


def trip(**overrides: Any) -> dict[str, Any]:
    body = {
        "origin": {**CHICAGO, "name": "Chicago, Illinois, United States"},
        "destination": {**INDIANAPOLIS, "name": "Indianapolis, Indiana, United States"},
        "departure": (timezone.now() + timedelta(hours=1)).isoformat(),
        "load_lb": 36_000,
        "interval_miles": 10,
    }
    body.update(overrides)
    return body


def post_plan(client: Client, body: dict[str, Any]) -> Any:
    return client.post("/api/plan", body, content_type="application/json")


def test_plans_and_recommends_the_safer_route(client: Client, upstream: respx.MockRouter) -> None:
    response = post_plan(client, trip())

    assert response.status_code == 200
    body = response.json()
    assert len(body["plan_id"]) == 32
    assert [r["id"] for r in body["routes"]] == ["A", "B"]

    recommendation = body["recommendation"]
    assert recommendation["route_id"] == "B"
    assert recommendation["order"] == ["B", "A"]
    assert recommendation["no_safe_route"] is False
    assert recommendation["reason"].startswith("Route B avoids No Travel conditions")

    stormy, calm = body["routes"]
    assert stormy["summary"]["no_travel_miles"] > 0
    assert calm["summary"]["max_level"] == 0
    assert stormy["checkpoints"][0]["eta"] <= stormy["checkpoints"][-1]["eta"]

    lat, _ = decode(calm["polyline"])
    assert lat.size == 60
    checkpoint = calm["checkpoints"][1]
    assert checkpoint["distance_m"] == pytest.approx(16_093, abs=1)
    assert checkpoint["level_label"] == "Low"
    assert checkpoint["factor"] == "No significant weather"


def test_defaults(client: Client, upstream: respx.MockRouter) -> None:
    body = trip()
    del body["departure"], body["interval_miles"]

    response = post_plan(client, body)

    assert response.status_code == 200
    assert response.json()["interval_miles"] == 25
    assert response.json()["gust_aware"] is True


def test_get_plan(client: Client, upstream: respx.MockRouter) -> None:
    created = post_plan(client, trip()).json()

    response = client.get("/api/plan", {"plan_id": created["plan_id"]})

    assert response.status_code == 200
    assert response.json() == created
    assert created["origin"]["name"] == "Chicago, Illinois, United States"
    assert created["destination"]["name"] == "Indianapolis, Indiana, United States"


def test_plan_names_places_when_labels_missing(client: Client, upstream: respx.MockRouter) -> None:
    body = trip(origin=dict(CHICAGO), destination=dict(INDIANAPOLIS))

    response = post_plan(client, body)

    assert response.status_code == 200
    payload = response.json()
    assert payload["origin"]["name"] == "Chicago, Illinois, United States"
    assert payload["destination"]["name"] == "Indianapolis, Indiana, United States"


def test_get_plan_resolves_coordinate_labels(client: Client, upstream: respx.MockRouter) -> None:
    created = post_plan(client, trip()).json()
    plan_id = created["plan_id"]
    stored = cache.get(f"plan:{plan_id}")
    assert stored is not None
    stored["payload"]["origin"] = {**CHICAGO, "name": "41.8781, -87.6298"}
    stored["payload"]["destination"] = {**INDIANAPOLIS, "name": "39.7684, -86.1581"}
    cache.set(f"plan:{plan_id}", stored)

    response = client.get("/api/plan", {"plan_id": plan_id})

    assert response.status_code == 200
    body = response.json()
    assert body["origin"]["name"] == "Chicago, Illinois, United States"
    assert body["destination"]["name"] == "Indianapolis, Indiana, United States"


def test_get_plan_survives_heatmap(client: Client, upstream: respx.MockRouter) -> None:
    created = post_plan(client, trip()).json()
    assert client.get("/api/heatmap", {"plan_id": created["plan_id"]}).status_code == 200

    response = client.get("/api/plan", {"plan_id": created["plan_id"]})

    assert response.status_code == 200
    assert response.json() == created


def test_get_unknown_plan(client: Client) -> None:
    response = client.get("/api/plan", {"plan_id": "0" * 32})

    assert response.status_code == 404


def test_get_plan_rejects_malformed_plan_id(client: Client) -> None:
    assert client.get("/api/plan", {"plan_id": "nope"}).status_code == 400


def test_heatmap_for_a_plan(client: Client, upstream: respx.MockRouter) -> None:
    plan_id = post_plan(client, trip()).json()["plan_id"]

    response = client.get("/api/heatmap", {"plan_id": plan_id})

    assert response.status_code == 200
    body = response.json()
    assert body["hours"] == 49
    assert 0 < len(body["cells"]) <= 600
    assert all(len(cell["risk"]) == 49 for cell in body["cells"])
    levels = {level for cell in body["cells"] for level in cell["risk"]}
    assert {0, 4} <= levels


def test_heatmap_for_unknown_plan(client: Client) -> None:
    response = client.get("/api/heatmap", {"plan_id": "0" * 32})

    assert response.status_code == 404


def test_heatmap_rejects_malformed_plan_id(client: Client) -> None:
    assert client.get("/api/heatmap", {"plan_id": "nope"}).status_code == 400


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"departure": "2020-01-01T00:00:00Z"}, "departure"),
        ({"departure": (timezone.now() + timedelta(hours=49)).isoformat()}, "departure"),
        ({"interval_miles": 30}, "interval_miles"),
        ({"load_lb": -1}, "load_lb"),
        ({"destination": {"lat": 95, "lon": 0}}, "destination"),
        ({"destination": CHICAGO}, "non_field_errors"),
        (
            {"destination": {"lat": 25.76, "lon": -80.19}, "origin": {"lat": 61.2, "lon": -149.9}},
            "non_field_errors",
        ),
    ],
)
def test_validation(client: Client, overrides: dict[str, Any], field: str) -> None:
    response = post_plan(client, trip(**overrides))

    assert response.status_code == 400
    assert field in response.json()


def test_no_route(client: Client) -> None:
    with respx.mock:
        respx.get(ROUTES_URL).respond(400, json={"error": "No path could be found for input"})
        response = post_plan(client, trip())

    assert response.status_code == 422
    assert response.json()["detail"] == "No path could be found for input"


def test_weather_outage(client: Client) -> None:
    with respx.mock:
        respx.get(ROUTES_URL).respond(json=routes_payload())
        respx.get(OPEN_METEO_URL).respond(500)
        response = post_plan(client, trip())

    assert response.status_code == 502


def test_geocode(client: Client) -> None:
    with respx.mock:
        respx.get(GEOCODE_URL).respond(
            json={
                "results": [
                    {
                        "name": "Chicago",
                        "latitude": 41.85,
                        "longitude": -87.65,
                        "admin1": "Illinois",
                        "country": "United States",
                        "country_code": "US",
                    }
                ]
            }
        )
        response = client.get("/api/geocode", {"q": "Chicago"})

    assert response.status_code == 200
    assert response.json() == {
        "results": [{"name": "Chicago, Illinois, United States", "lat": 41.85, "lon": -87.65}]
    }


def test_geocode_needs_three_characters(client: Client) -> None:
    assert client.get("/api/geocode", {"q": "ch"}).status_code == 400


def test_openapi_schema(client: Client) -> None:
    response = client.get("/api/schema", HTTP_ACCEPT="application/json")

    assert response.status_code == 200
    assert {"/api/plan", "/api/heatmap", "/api/geocode"} <= set(response.json()["paths"])
