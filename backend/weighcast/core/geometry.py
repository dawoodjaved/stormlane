from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]
IndexArray = npt.NDArray[np.intp]

EARTH_RADIUS_M = 6_371_008.8
METERS_PER_MILE = 1609.344


@dataclass(frozen=True, slots=True)
class Span:
    """Covers polyline vertices from `offset` up to the next span's offset."""

    offset: int
    length_m: float
    duration_s: float


@dataclass(frozen=True, slots=True, eq=False)
class RouteProfile:
    lat: FloatArray
    lon: FloatArray
    cum_dist_m: FloatArray
    cum_time_s: FloatArray

    @property
    def total_distance_m(self) -> float:
        return float(self.cum_dist_m[-1])

    @property
    def total_duration_s(self) -> float:
        return float(self.cum_time_s[-1])


@dataclass(frozen=True, slots=True, eq=False)
class Checkpoints:
    distance_m: FloatArray
    lat: FloatArray
    lon: FloatArray
    eta_offset_s: FloatArray
    vertex_index: IndexArray

    def __len__(self) -> int:
        return int(self.distance_m.size)


def segment_lengths(lat: FloatArray, lon: FloatArray) -> FloatArray:
    """Equirectangular approximation, only accurate for short segments."""
    lat_r = np.radians(lat)
    lon_r = np.radians(lon)
    mean_lat = (lat_r[:-1] + lat_r[1:]) / 2
    x = np.diff(lon_r) * np.cos(mean_lat)
    y = np.diff(lat_r)
    lengths: FloatArray = EARTH_RADIUS_M * np.hypot(x, y)
    return lengths


def build_profile(lat: FloatArray, lon: FloatArray, spans: Sequence[Span]) -> RouteProfile:
    """Spread each span's length and duration over its segments by geometric length."""
    lat = np.asarray(lat, dtype=np.float64)
    lon = np.asarray(lon, dtype=np.float64)
    if lat.ndim != 1 or lat.shape != lon.shape:
        raise ValueError("lat and lon must be 1-D arrays of the same length")
    if lat.size < 2:
        raise ValueError("A route needs at least two points")
    _validate_spans(spans, lat.size)

    weights = segment_lengths(lat, lon)
    starts = [span.offset for span in spans]
    ends = [*starts[1:], lat.size - 1]
    seg_dist = _spread(weights, starts, ends, [span.length_m for span in spans])
    seg_time = _spread(weights, starts, ends, [span.duration_s for span in spans])

    return RouteProfile(
        lat=lat,
        lon=lon,
        cum_dist_m=_prefix_sum(seg_dist),
        cum_time_s=_prefix_sum(seg_time),
    )


def sample_checkpoints(profile: RouteProfile, interval_m: float) -> Checkpoints:
    if interval_m <= 0:
        raise ValueError("interval_m must be positive")

    targets = _targets(profile.total_distance_m, interval_m)
    cum = profile.cum_dist_m

    seg = np.searchsorted(cum, targets, side="left") - 1
    seg = np.clip(seg, 0, cum.size - 2)
    seg_len = cum[seg + 1] - cum[seg]
    frac = np.divide(targets - cum[seg], seg_len, out=np.zeros_like(targets), where=seg_len > 0)
    frac = np.clip(frac, 0.0, 1.0)

    lat = _lerp(profile.lat, seg, frac)
    lon = _lerp(profile.lon, seg, frac)
    eta = _lerp(profile.cum_time_s, seg, frac)
    if targets.size > 1:
        lat[-1], lon[-1], eta[-1] = profile.lat[-1], profile.lon[-1], profile.total_duration_s
        seg[-1] = cum.size - 2

    return Checkpoints(
        distance_m=targets,
        lat=lat,
        lon=lon,
        eta_offset_s=eta,
        vertex_index=seg.astype(np.intp),
    )


def _lerp(values: FloatArray, seg: IndexArray, frac: FloatArray) -> FloatArray:
    result: FloatArray = values[seg] + frac * (values[seg + 1] - values[seg])
    return result


def _targets(total: float, interval: float) -> FloatArray:
    count = int(np.floor(total / interval + 1e-9))
    targets = np.arange(count + 1, dtype=np.float64) * interval
    if count > 0 and total - targets[-1] <= interval * 1e-9:
        targets[-1] = total
    elif total > targets[-1]:
        targets = np.append(targets, total)
    return targets


def _spread(
    weights: FloatArray, starts: Sequence[int], ends: Sequence[int], totals: Sequence[float]
) -> FloatArray:
    out = np.zeros_like(weights)
    for start, end, total in zip(starts, ends, totals, strict=True):
        if end == start:
            out[max(start - 1, 0)] += total
            continue
        span_weights = weights[start:end]
        weight_sum = span_weights.sum()
        if weight_sum > 0:
            out[start:end] += total * span_weights / weight_sum
        else:
            out[start:end] += total / (end - start)
    return out


def _prefix_sum(values: FloatArray) -> FloatArray:
    out = np.empty(values.size + 1, dtype=np.float64)
    out[0] = 0.0
    np.cumsum(values, out=out[1:])
    return out


def _validate_spans(spans: Sequence[Span], point_count: int) -> None:
    if not spans:
        raise ValueError("At least one span is required")
    if spans[0].offset != 0:
        raise ValueError("The first span must start at offset 0")
    previous = -1
    for span in spans:
        if not previous < span.offset < point_count:
            raise ValueError(f"Span offset {span.offset} is out of order or out of range")
        if span.length_m < 0 or span.duration_s < 0:
            raise ValueError("Span length and duration must be non-negative")
        previous = span.offset
