from collections.abc import Callable, Sequence
from datetime import UTC, datetime
from typing import Any

import httpx

from stormlane.core.polyline import encode

Point = tuple[float, float]


def valhalla_trip(
    points: Sequence[Point],
    *,
    length_km: float = 10.0,
    time_s: float = 600.0,
) -> dict[str, Any]:
    return {
        "status": 0,
        "status_message": "Found route between points",
        "legs": [
            {
                "shape": encode(points),
                "summary": {"length": length_km, "time": time_s},
                "maneuvers": [
                    {
                        "begin_shape_index": 0,
                        "length": length_km,
                        "time": time_s,
                        "instruction": "Drive",
                    }
                ],
            }
        ],
        "summary": {"length": length_km, "time": time_s},
    }


def valhalla_payload(*trips: dict[str, Any]) -> dict[str, Any]:
    first, *rest = trips
    return {"trip": first, "alternates": [{"trip": trip} for trip in rest]}


def straight_line(start: Point, end: Point, count: int) -> list[Point]:
    return [
        (
            start[0] + (end[0] - start[0]) * i / (count - 1),
            start[1] + (end[1] - start[1]) * i / (count - 1),
        )
        for i in range(count)
    ]


WeatherFn = Callable[[float, float], dict[str, float]]


def calm(_: float, __: float) -> dict[str, float]:
    return {"wind": 5.0, "gust": 8.0, "rain": 0.0, "showers": 0.0, "snow": 0.0}


def open_meteo_responder(weather: WeatherFn = calm) -> Callable[[httpx.Request], httpx.Response]:
    """Builds an hourly forecast for every requested location from `weather(lat, lon)`."""

    def respond(request: httpx.Request) -> httpx.Response:
        params = request.url.params
        lats = [float(v) for v in params["latitude"].split(",")]
        lons = [float(v) for v in params["longitude"].split(",")]
        start = _parse_hour(params["start_hour"])
        end = _parse_hour(params["end_hour"])
        times = list(range(start, end + 1, 3600))

        locations = []
        for lat, lon in zip(lats, lons, strict=True):
            w = weather(lat, lon)
            locations.append(
                {
                    "latitude": lat,
                    "longitude": lon,
                    "hourly": {
                        "time": times,
                        "wind_speed_10m": [w["wind"]] * len(times),
                        "wind_gusts_10m": [w["gust"]] * len(times),
                        "rain": [w["rain"]] * len(times),
                        "showers": [w["showers"]] * len(times),
                        "snowfall": [w["snow"]] * len(times),
                    },
                }
            )
        return httpx.Response(200, json=locations if len(locations) > 1 else locations[0])

    return respond


def _parse_hour(value: str) -> int:
    return int(datetime.strptime(value, "%Y-%m-%dT%H:%M").replace(tzinfo=UTC).timestamp())
