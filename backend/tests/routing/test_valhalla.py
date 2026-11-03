import json
from collections.abc import AsyncIterator
from datetime import UTC, datetime

import httpx
import numpy as np
import pytest
import respx

from weighcast.routing.types import NoRouteError
from weighcast.routing.valhalla import ROUTES_URL, ValhallaClient
from tests.fakes import straight_line, valhalla_payload, valhalla_trip

DEPARTURE = datetime(2026, 11, 3, 10, tzinfo=UTC)
ORIGIN = (41.8781, -87.6298)
DESTINATION = (39.7684, -86.1581)


@pytest.fixture
async def valhalla() -> AsyncIterator[ValhallaClient]:
    async with httpx.AsyncClient() as http:
        yield ValhallaClient(http)


@respx.mock
async def test_sends_truck_weight_and_parses_alternates(valhalla: ValhallaClient) -> None:
    points = straight_line(ORIGIN, DESTINATION, 8)
    western = [
        *straight_line(ORIGIN, (40.5, -88.5), 4),
        *straight_line((40.5, -88.5), DESTINATION, 5)[1:],
    ]
    call = respx.get(ROUTES_URL).respond(
        json=valhalla_payload(
            valhalla_trip(points, length_km=290.0, time_s=11_400),
            valhalla_trip(western, length_km=330.0, time_s=13_400),
        )
    )

    routes = await valhalla.truck_routes(ORIGIN, DESTINATION, DEPARTURE, 36_000)

    body = json.loads(call.calls.last.request.url.params["json"])
    assert body["costing"] == "truck"
    assert body["costing_options"]["truck"]["weight"] == pytest.approx(16.329)
    assert body["alternates"] == 2
    assert "date_time" not in body

    assert [route.length_m for route in routes] == [290_000, 330_000]
    np.testing.assert_allclose(routes[0].lat[0], ORIGIN[0], atol=1e-5)
    np.testing.assert_allclose(routes[0].lon[-1], DESTINATION[1], atol=1e-5)
    assert routes[0].departure == DEPARTURE
    assert routes[0].spans[0].offset == 0


@respx.mock
async def test_no_route(valhalla: ValhallaClient) -> None:
    respx.get(ROUTES_URL).respond(400, json={"error": "No path could be found for input"})

    with pytest.raises(NoRouteError, match="No path"):
        await valhalla.truck_routes(ORIGIN, DESTINATION, DEPARTURE, 36_000)


@respx.mock
async def test_serves_repeat_requests_from_cache(valhalla: ValhallaClient) -> None:
    call = respx.get(ROUTES_URL).respond(
        json=valhalla_payload(valhalla_trip(straight_line(ORIGIN, DESTINATION, 4)))
    )

    await valhalla.truck_routes(ORIGIN, DESTINATION, DEPARTURE, 36_000)
    await valhalla.truck_routes(ORIGIN, DESTINATION, DEPARTURE, 36_000)

    assert call.call_count == 1
