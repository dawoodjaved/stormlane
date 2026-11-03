from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from string import ascii_uppercase
from typing import Any
from uuid import uuid4

import numpy as np
from django.core.cache import cache

from stormlane.core.geometry import (
    METERS_PER_MILE,
    Checkpoints,
    FloatArray,
    build_profile,
    sample_checkpoints,
)
from stormlane.core.heatmap import corridor_grid
from stormlane.core.polyline import encode_arrays
from stormlane.core.risk import (
    Classification,
    RiskLevel,
    RouteRisk,
    Weather,
    classify,
    rank,
    risk_levels,
    summarize,
)
from stormlane.routing.types import LatLon, TruckRoute
from stormlane.routing.valhalla import ValhallaClient
from stormlane.weather.openmeteo import OpenMeteoClient, grid_key, sample_weather

HORIZON_HOURS = 48
PLAN_TTL_S = 30 * 60
CORRIDOR_SAMPLE_M = 1_000.0


class PlanNotFoundError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class TripRequest:
    origin: LatLon
    destination: LatLon
    departure: datetime
    load_lb: float
    interval_miles: int
    gust_aware: bool


async def plan_trip(
    trip: TripRequest, router: ValhallaClient, weather: OpenMeteoClient
) -> dict[str, Any]:
    routes = await router.truck_routes(trip.origin, trip.destination, trip.departure, trip.load_lb)
    profiles = [build_profile(r.lat, r.lon, r.spans) for r in routes]
    checkpoints = [sample_checkpoints(p, trip.interval_miles * METERS_PER_MILE) for p in profiles]

    max_duration_s = max(p.total_duration_s for p in profiles)
    start, end = _forecast_window(trip.departure, max_duration_s)
    keys = [
        grid_key(lat, lon) for cp in checkpoints for lat, lon in zip(cp.lat, cp.lon, strict=True)
    ]
    series = await weather.hourly(keys, start, end)

    departure_ts = trip.departure.timestamp()
    ids = list(ascii_uppercase[: len(routes)])
    risks: dict[str, RouteRisk] = {}
    payloads = []
    for route_id, route, profile, cp in zip(ids, routes, profiles, checkpoints, strict=True):
        eta = departure_ts + cp.eta_offset_s
        sampled = sample_weather(series, cp.lat, cp.lon, eta)
        result = classify(sampled, trip.load_lb, gust_aware=trip.gust_aware)
        risk = summarize(cp.distance_m, result.level, profile.total_duration_s)
        risks[_route_name(route_id)] = risk
        payloads.append(_route_payload(route_id, route, cp, eta, sampled, result, risk))

    recommendation = rank(risks)
    plan_id = uuid4().hex
    await cache.aset(
        _plan_key(plan_id),
        {
            "departure": trip.departure.isoformat(),
            "load_lb": trip.load_lb,
            "gust_aware": trip.gust_aware,
            "max_duration_s": max_duration_s,
            "corridors": [
                {"lat": c.lat.round(4).tolist(), "lon": c.lon.round(4).tolist()}
                for c in (sample_checkpoints(p, CORRIDOR_SAMPLE_M) for p in profiles)
            ],
        },
        PLAN_TTL_S,
    )

    return {
        "plan_id": plan_id,
        "departure": trip.departure.isoformat(),
        "load_lb": trip.load_lb,
        "interval_miles": trip.interval_miles,
        "gust_aware": trip.gust_aware,
        "recommendation": {
            "route_id": _route_id(recommendation.recommended),
            "order": [_route_id(name) for name in recommendation.order],
            "no_safe_route": recommendation.no_safe_route,
            "reason": recommendation.reason,
        },
        "routes": payloads,
    }


async def corridor_heatmap(
    plan_id: str, weather: OpenMeteoClient, max_cells: int
) -> dict[str, Any]:
    plan = await cache.aget(_plan_key(plan_id))
    if plan is None:
        raise PlanNotFoundError(plan_id)

    departure = datetime.fromisoformat(plan["departure"])
    grid = corridor_grid(
        [(np.asarray(c["lat"]), np.asarray(c["lon"])) for c in plan["corridors"]],
        max_cells=max_cells,
    )
    start, end = _forecast_window(departure, plan["max_duration_s"])
    keys = [grid_key(lat, lon) for lat, lon in zip(grid.lat, grid.lon, strict=True)]
    series = await weather.hourly(keys, start, end)

    hours = departure.timestamp() + 3600.0 * np.arange(HORIZON_HOURS + 1, dtype=np.float64)
    samples = [series[key].at(hours) for key in keys]
    stacked = Weather(
        wind_mph=np.array([s.wind_mph for s in samples]),
        gust_mph=np.array([s.gust_mph for s in samples]),
        rain_in=np.array([s.rain_in for s in samples]),
        snow_in=np.array([s.snow_in for s in samples]),
    )
    levels = risk_levels(stacked, plan["load_lb"], gust_aware=plan["gust_aware"])

    return {
        "plan_id": plan_id,
        "start": departure.isoformat(),
        "hours": HORIZON_HOURS + 1,
        "cell_size_m": round(grid.cell_m),
        "cells": [
            {"lat": round(float(lat), 4), "lon": round(float(lon), 4), "risk": row.tolist()}
            for lat, lon, row in zip(grid.lat, grid.lon, levels, strict=True)
        ],
    }


def _route_payload(
    route_id: str,
    route: TruckRoute,
    cp: Checkpoints,
    eta: FloatArray,
    sampled: Weather,
    result: Classification,
    risk: RouteRisk,
) -> dict[str, Any]:
    return {
        "id": route_id,
        "name": _route_name(route_id),
        "polyline": encode_arrays(route.lat, route.lon),
        "distance_m": round(route.length_m),
        "duration_s": round(route.duration_s),
        "departure": route.departure.isoformat(),
        "arrival": route.arrival.isoformat(),
        "notices": route.notices,
        "summary": {
            "miles_by_level": [round(m, 2) for m in risk.miles_by_level],
            "high_miles": round(risk.high_miles, 2),
            "severe_miles": round(risk.severe_miles, 2),
            "no_travel_miles": round(risk.no_travel_miles, 2),
            "avg_risk": round(risk.avg_risk, 3),
            "max_level": int(result.level.max()),
        },
        "checkpoints": [
            {
                "distance_m": round(float(cp.distance_m[i])),
                "lat": round(float(cp.lat[i]), 5),
                "lon": round(float(cp.lon[i]), 5),
                "eta": datetime.fromtimestamp(float(eta[i]), UTC).isoformat(timespec="seconds"),
                "vertex_index": int(cp.vertex_index[i]),
                "level": int(result.level[i]),
                "level_label": RiskLevel(int(result.level[i])).label,
                "factor": result.factor[i],
                "wind_mph": round(float(sampled.wind_mph[i]), 1),
                "gust_mph": round(float(sampled.gust_mph[i]), 1),
                "rain_in": round(float(sampled.rain_in[i]), 2),
                "snow_in": round(float(sampled.snow_in[i]), 2),
            }
            for i in range(len(cp))
        ],
    }


def _forecast_window(departure: datetime, duration_s: float) -> tuple[datetime, datetime]:
    span = max(timedelta(hours=HORIZON_HOURS), timedelta(seconds=duration_s))
    return departure, departure + span


def _route_name(route_id: str) -> str:
    return f"Route {route_id}"


def _route_id(name: str) -> str:
    return name.removeprefix("Route ")


def _plan_key(plan_id: str) -> str:
    return f"plan:{plan_id}"
