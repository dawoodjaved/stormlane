from collections.abc import Mapping
from dataclasses import dataclass
from enum import IntEnum

import numpy as np
import numpy.typing as npt

from stormlane.core.geometry import METERS_PER_MILE, FloatArray

LevelArray = npt.NDArray[np.int64]

WIND_MPH_THRESHOLDS = (25.0, 35.0, 45.0, 55.0)
RAIN_IN_THRESHOLDS = (0.10, 0.25, 0.50, 1.00)
SNOW_IN_THRESHOLDS = (0.5, 1.0, 2.0, 3.0)

HEAVY_LOAD_LB = 30_000
VERY_HEAVY_LOAD_LB = 40_000


class RiskLevel(IntEnum):
    LOW = 0
    MODERATE = 1
    HIGH = 2
    SEVERE = 3
    NO_TRAVEL = 4

    @property
    def label(self) -> str:
        return self.name.replace("_", " ").title()


@dataclass(frozen=True, slots=True, eq=False)
class Weather:
    wind_mph: FloatArray
    gust_mph: FloatArray
    rain_in: FloatArray
    snow_in: FloatArray


@dataclass(frozen=True, slots=True, eq=False)
class Classification:
    level: LevelArray
    factor: list[str]


@dataclass(frozen=True, slots=True)
class RouteRisk:
    miles_by_level: tuple[float, ...]
    avg_risk: float
    duration_s: float

    @property
    def high_miles(self) -> float:
        return self.miles_by_level[RiskLevel.HIGH]

    @property
    def severe_miles(self) -> float:
        return self.miles_by_level[RiskLevel.SEVERE]

    @property
    def no_travel_miles(self) -> float:
        return self.miles_by_level[RiskLevel.NO_TRAVEL]


@dataclass(frozen=True, slots=True)
class Recommendation:
    order: list[str]
    no_safe_route: bool
    reason: str

    @property
    def recommended(self) -> str:
        return self.order[0]


@dataclass(frozen=True, slots=True, eq=False)
class _Levels:
    overall: LevelArray
    wind: LevelArray
    load: LevelArray
    rain: LevelArray
    snow: LevelArray


def risk_levels(weather: Weather, load_lb: float, *, gust_aware: bool = True) -> LevelArray:
    """Risk level for weather arrays of any shape."""
    return _levels(weather, load_lb, gust_aware).overall


def classify(weather: Weather, load_lb: float, *, gust_aware: bool = True) -> Classification:
    levels = _levels(weather, load_lb, gust_aware)
    factor = [
        _describe(
            int(levels.overall[i]),
            wind_level=int(levels.wind[i]),
            load_level=int(levels.load[i]),
            rain_level=int(levels.rain[i]),
            snow_level=int(levels.snow[i]),
            wind_text=_wind_text(weather.wind_mph[i], weather.gust_mph[i], gust_aware),
            rain=float(weather.rain_in[i]),
            snow=float(weather.snow_in[i]),
            load_lb=load_lb,
        )
        for i in range(levels.overall.size)
    ]
    return Classification(level=levels.overall, factor=factor)


def _levels(weather: Weather, load_lb: float, gust_aware: bool) -> _Levels:
    if load_lb < 0:
        raise ValueError("load_lb must be non-negative")
    sustained = np.asarray(weather.wind_mph, dtype=np.float64)
    gust = np.asarray(weather.gust_mph, dtype=np.float64)
    rain = np.asarray(weather.rain_in, dtype=np.float64)
    snow = np.asarray(weather.snow_in, dtype=np.float64)
    if not sustained.shape == gust.shape == rain.shape == snow.shape:
        raise ValueError("Weather arrays must have the same shape")

    wind = np.maximum(sustained, gust) if gust_aware else sustained
    wind_level = _bucket(wind, WIND_MPH_THRESHOLDS)
    load_level = _load_level(wind, load_lb)
    rain_level = _bucket(rain, RAIN_IN_THRESHOLDS)
    snow_level = _bucket(snow, SNOW_IN_THRESHOLDS)
    return _Levels(
        overall=np.maximum.reduce([wind_level, load_level, rain_level, snow_level]),
        wind=wind_level,
        load=load_level,
        rain=rain_level,
        snow=snow_level,
    )


def summarize(distance_m: FloatArray, level: LevelArray, duration_s: float) -> RouteRisk:
    """Each checkpoint owns the road halfway to its neighbours."""
    distance_m = np.asarray(distance_m, dtype=np.float64)
    level = np.asarray(level, dtype=np.int64)
    if distance_m.shape != level.shape or distance_m.size == 0:
        raise ValueError("distance_m and level must be non-empty and the same length")

    edges = np.concatenate(
        ([distance_m[0]], (distance_m[:-1] + distance_m[1:]) / 2, [distance_m[-1]])
    )
    owned = np.diff(edges)
    miles = np.bincount(level, weights=owned, minlength=len(RiskLevel)) / METERS_PER_MILE

    total = owned.sum()
    avg = float(np.dot(owned, level) / total) if total > 0 else float(level.mean())
    return RouteRisk(
        miles_by_level=tuple(float(m) for m in miles),
        avg_risk=avg,
        duration_s=duration_s,
    )


def rank(routes: Mapping[str, RouteRisk]) -> Recommendation:
    if not routes:
        raise ValueError("At least one route is required")

    keys = {name: _rank_key(risk) for name, risk in routes.items()}
    order = sorted(routes, key=keys.__getitem__)
    no_safe_route = all(risk.no_travel_miles > 0 for risk in routes.values())
    return Recommendation(
        order=order,
        no_safe_route=no_safe_route,
        reason=_reason(order, routes, keys, no_safe_route),
    )


def _bucket(values: FloatArray, thresholds: tuple[float, ...]) -> LevelArray:
    return np.searchsorted(np.asarray(thresholds), values, side="right").astype(np.int64)


def _load_level(wind: FloatArray, load_lb: float) -> LevelArray:
    level = np.zeros(wind.shape, dtype=np.int64)
    if load_lb > HEAVY_LOAD_LB:
        level[(wind >= 45) & (wind < 55)] = RiskLevel.NO_TRAVEL
    if load_lb > VERY_HEAVY_LOAD_LB:
        level[(wind >= 35) & (wind < 45)] = RiskLevel.SEVERE
    return level


def _wind_text(sustained: float, gust: float, gust_aware: bool) -> str:
    if gust_aware and gust > sustained:
        return f"Wind gusts {gust:.0f} mph"
    return f"Wind {sustained:.0f} mph"


def _describe(
    level: int,
    *,
    wind_level: int,
    load_level: int,
    rain_level: int,
    snow_level: int,
    wind_text: str,
    rain: float,
    snow: float,
    load_lb: float,
) -> str:
    if level == RiskLevel.LOW:
        return "No significant weather"

    parts = []
    if load_level == level and load_level > wind_level:
        parts.append(f"{wind_text} with {load_lb:,.0f} lb load")
    elif wind_level == level:
        parts.append(wind_text)
    if snow_level == level:
        parts.append(f"Snow {snow:.1f} in/h")
    if rain_level == level:
        parts.append(f"Rain {rain:.2f} in/h")
    return ", ".join(parts)


RankKey = tuple[bool, float, float, float, float, float]


def _rank_key(risk: RouteRisk) -> RankKey:
    return (
        risk.no_travel_miles > 0,
        round(risk.no_travel_miles, 2),
        round(risk.severe_miles, 2),
        round(risk.high_miles, 2),
        round(risk.avg_risk, 3),
        risk.duration_s,
    )


def _reason(
    order: list[str],
    routes: Mapping[str, RouteRisk],
    keys: Mapping[str, RankKey],
    no_safe_route: bool,
) -> str:
    best = order[0]
    if len(order) == 1:
        prefix = "No safe route at this departure. " if no_safe_route else ""
        return f"{prefix}{best} is the only route."

    other = order[1]
    a, b = routes[best], routes[other]

    if no_safe_route:
        detail = (
            f"{best} has the fewest No Travel miles ({a.no_travel_miles:.1f} vs "
            f"{b.no_travel_miles:.1f} on {other})."
            if keys[best][1] != keys[other][1]
            else f"{best} has the lowest risk among them."
        )
        return (
            f"No safe route at this departure: every route crosses No Travel conditions. {detail}"
        )

    if keys[best][0] != keys[other][0]:
        return (
            f"{best} avoids No Travel conditions; "
            f"{other} has {b.no_travel_miles:.1f} No Travel miles."
        )

    if keys[best][2] != keys[other][2]:
        return _fewer_miles(best, other, a.severe_miles, b.severe_miles, "severe-risk")

    if keys[best][3] != keys[other][3]:
        return _fewer_miles(best, other, a.high_miles, b.high_miles, "high-risk")

    if keys[best][4] != keys[other][4]:
        return (
            f"{best} and {other} have the same severe and high-risk miles; {best} has lower "
            f"average risk ({a.avg_risk:.2f} vs {b.avg_risk:.2f})."
        )

    if keys[best][5] != keys[other][5]:
        minutes = round((b.duration_s - a.duration_s) / 60)
        faster = f"{minutes} min faster" if minutes >= 1 else "slightly faster"
        return f"{best} and {other} have the same risk; {best} is {faster}."

    return f"{best} and {other} are equivalent in risk and duration."


def _fewer_miles(best: str, other: str, a: float, b: float, kind: str) -> str:
    return f"{best} has {b - a:.1f} fewer {kind} miles than {other} ({a:.1f} vs {b:.1f})."
