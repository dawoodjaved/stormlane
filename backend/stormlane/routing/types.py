from dataclasses import dataclass
from datetime import datetime

from stormlane.core.geometry import FloatArray, Span

LatLon = tuple[float, float]

KG_PER_LB = 0.45359237
ROUTES_CACHE_TTL_S = 10 * 60


class NoRouteError(Exception):
    pass


@dataclass(frozen=True, slots=True, eq=False)
class TruckRoute:
    id: str
    lat: FloatArray
    lon: FloatArray
    spans: list[Span]
    length_m: float
    duration_s: float
    departure: datetime
    arrival: datetime
    notices: list[str]
