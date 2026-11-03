import hashlib
import json
from datetime import datetime, timedelta
from typing import Any

import httpx
import numpy as np
from django.core.cache import cache

from stormlane.core.geometry import FloatArray, Span
from stormlane.core.polyline import decode
from stormlane.http import get_with_retry
from stormlane.routing.types import KG_PER_LB, ROUTES_CACHE_TTL_S, LatLon, NoRouteError, TruckRoute

ROUTES_URL = "https://valhalla1.openstreetmap.de/route"
KG_PER_TONNE = 1000.0


class ValhallaClient:
    def __init__(self, http: httpx.AsyncClient, url: str = ROUTES_URL) -> None:
        self._http = http
        self._url = url

    async def truck_routes(
        self,
        origin: LatLon,
        destination: LatLon,
        departure: datetime,
        gross_weight_lb: float,
        alternatives: int = 2,
    ) -> list[TruckRoute]:
        payload = {
            "locations": [
                {"lat": origin[0], "lon": origin[1]},
                {"lat": destination[0], "lon": destination[1]},
            ],
            "costing": "truck",
            "costing_options": {
                "truck": {"weight": round(gross_weight_lb * KG_PER_LB / KG_PER_TONNE, 3)}
            },
            "alternates": alternatives,
            "units": "kilometers",
        }
        body = await self._get_cached(payload)
        return parse_routes(body, departure)

    async def _get_cached(self, payload: dict[str, Any]) -> dict[str, Any]:
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        key = f"valhalla:routes:{digest}"
        cached: dict[str, Any] | None = await cache.aget(key)
        if cached is not None:
            return cached

        encoded = json.dumps(payload, separators=(",", ":"))
        response = await get_with_retry(
            self._http, self._url, {"json": encoded}, service="Valhalla"
        )
        if response.status_code >= 400:
            raise NoRouteError(_error_message(response))
        body: dict[str, Any] = response.json()
        if not body.get("trip"):
            raise NoRouteError(_error_message(response) or "No truck route found")
        await cache.aset(key, body, ROUTES_CACHE_TTL_S)
        return body


def parse_routes(payload: dict[str, Any], departure: datetime) -> list[TruckRoute]:
    trips = [payload["trip"]]
    trips.extend(item["trip"] for item in payload.get("alternates") or [] if "trip" in item)
    routes = [_parse_trip(trip, departure, str(index)) for index, trip in enumerate(trips)]
    if not routes:
        raise NoRouteError("No truck route found")
    return routes


def _parse_trip(trip: dict[str, Any], departure: datetime, route_id: str) -> TruckRoute:
    lat_parts: list[FloatArray] = []
    lon_parts: list[FloatArray] = []
    spans: list[Span] = []
    vertex_count = 0

    for leg in trip.get("legs") or []:
        lat, lon = decode(leg["shape"])
        joins_previous = (
            vertex_count > 0 and lat[0] == lat_parts[-1][-1] and lon[0] == lon_parts[-1][-1]
        )
        skip = 1 if joins_previous else 0
        base = vertex_count - skip
        for maneuver in leg.get("maneuvers") or []:
            offset = base + int(maneuver["begin_shape_index"])
            length_m = float(maneuver.get("length") or 0) * 1000.0
            duration_s = float(maneuver.get("time") or 0)
            if offset < 0:
                continue
            if spans and offset <= spans[-1].offset:
                prev = spans[-1]
                spans[-1] = Span(
                    prev.offset, prev.length_m + length_m, prev.duration_s + duration_s
                )
            else:
                spans.append(Span(offset, length_m, duration_s))
        lat_parts.append(lat[skip:])
        lon_parts.append(lon[skip:])
        vertex_count += lat.size - skip

    if not lat_parts:
        raise NoRouteError("No truck route found")
    lat = np.concatenate(lat_parts)
    lon = np.concatenate(lon_parts)
    if not spans or spans[0].offset != 0:
        spans.insert(0, Span(0, 0.0, 0.0))

    summary = trip.get("summary") or {}
    length_m = float(summary.get("length") or 0) * 1000.0
    duration_s = float(summary.get("time") or 0)
    return TruckRoute(
        id=route_id,
        lat=lat,
        lon=lon,
        spans=spans,
        length_m=length_m,
        duration_s=duration_s,
        departure=departure,
        arrival=departure + timedelta(seconds=duration_s),
        notices=[],
    )


def _error_message(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return f"Valhalla responded with {response.status_code}"
    if not isinstance(body, dict):
        return f"Valhalla responded with {response.status_code}"
    return str(body.get("error") or body.get("status_message") or response.status_code)
