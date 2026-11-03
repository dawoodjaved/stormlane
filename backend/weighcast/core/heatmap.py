import math
from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from weighcast.core.geometry import EARTH_RADIUS_M, METERS_PER_MILE, FloatArray, segment_lengths

METERS_PER_DEGREE = EARTH_RADIUS_M * math.pi / 180
CORRIDOR_RADIUS_M = 25 * METERS_PER_MILE
MIN_CELL_M = 2_000.0

Path = tuple[FloatArray, FloatArray]


@dataclass(frozen=True, slots=True, eq=False)
class Grid:
    lat: FloatArray
    lon: FloatArray
    cell_m: float

    def __len__(self) -> int:
        return int(self.lat.size)


def corridor_grid(
    paths: Sequence[Path], *, radius_m: float = CORRIDOR_RADIUS_M, max_cells: int = 600
) -> Grid:
    """Square cells whose centers lie within `radius_m` of any path.

    Path points must be spaced well below MIN_CELL_M so no cell along the route is skipped.
    The cell size grows until the grid fits in `max_cells`.
    """
    if not paths or max_cells < 1:
        raise ValueError("At least one path and a positive cell budget are required")
    lat = np.concatenate([p[0] for p in paths])
    lon = np.concatenate([p[1] for p in paths])
    if lat.size == 0:
        raise ValueError("Paths must contain points")

    length = sum(float(segment_lengths(p[0], p[1]).sum()) for p in paths if p[0].size > 1)
    cell_m = max(MIN_CELL_M, math.sqrt(max(length, radius_m) * 2 * radius_m / max_cells))
    while True:
        grid = _cells(lat, lon, cell_m, radius_m)
        if len(grid) <= max_cells:
            return grid
        cell_m *= max(1.1, math.sqrt(len(grid) / max_cells))


def _cells(lat: FloatArray, lon: FloatArray, cell_m: float, radius_m: float) -> Grid:
    mid_lat = math.radians((lat.min() + lat.max()) / 2)
    dlat = cell_m / METERS_PER_DEGREE
    dlon = cell_m / (METERS_PER_DEGREE * max(math.cos(mid_lat), 0.01))
    lat0, lon0 = lat.min(), lon.min()

    touched = np.unique(
        np.column_stack((np.floor((lat - lat0) / dlat), np.floor((lon - lon0) / dlon))).astype(
            np.int64
        ),
        axis=0,
    )

    reach = math.ceil(radius_m / cell_m)
    steps = np.arange(-reach, reach + 1)
    di, dj = (a.ravel() for a in np.meshgrid(steps, steps, indexing="ij"))
    inside = (di**2 + dj**2) * cell_m**2 <= (radius_m + cell_m / 2) ** 2
    offsets = np.column_stack((di[inside], dj[inside]))

    cells = np.unique((touched[:, None, :] + offsets[None, :, :]).reshape(-1, 2), axis=0)
    return Grid(
        lat=lat0 + (cells[:, 0] + 0.5) * dlat,
        lon=lon0 + (cells[:, 1] + 0.5) * dlon,
        cell_m=cell_m,
    )
