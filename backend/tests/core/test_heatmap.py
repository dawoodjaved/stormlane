import numpy as np
import pytest

from stormlane.core.geometry import FloatArray, Span, build_profile, sample_checkpoints
from stormlane.core.heatmap import CORRIDOR_RADIUS_M, MIN_CELL_M, corridor_grid

from .test_geometry import haversine_m


def dense_path(
    start: tuple[float, float], end: tuple[float, float]
) -> tuple[FloatArray, FloatArray]:
    lat = np.array([start[0], end[0]])
    lon = np.array([start[1], end[1]])
    profile = build_profile(lat, lon, [Span(0, haversine_m(*start, *end), 3_600)])
    points = sample_checkpoints(profile, 1_000)
    return points.lat, points.lon


def nearest_m(lat: float, lon: float, path_lat: FloatArray, path_lon: FloatArray) -> float:
    return min(haversine_m(lat, lon, a, b) for a, b in zip(path_lat, path_lon, strict=True))


def test_stays_within_cell_budget() -> None:
    path = dense_path((41.88, -87.63), (39.10, -84.51))

    grid = corridor_grid([path], max_cells=600)

    assert 0 < len(grid) <= 600
    assert grid.cell_m >= MIN_CELL_M


def test_cells_hug_the_corridor() -> None:
    path = dense_path((35.0, -100.0), (35.0, -97.0))

    grid = corridor_grid([path], max_cells=400)

    slack = grid.cell_m
    for lat, lon in zip(grid.lat, grid.lon, strict=True):
        assert nearest_m(lat, lon, *path) <= CORRIDOR_RADIUS_M + slack


def test_every_route_point_is_covered() -> None:
    path = dense_path((35.0, -100.0), (36.0, -98.0))

    grid = corridor_grid([path], max_cells=300)

    half_diagonal = grid.cell_m * np.sqrt(2) / 2 * 1.01
    for lat, lon in zip(path[0][::25], path[1][::25], strict=True):
        assert nearest_m(lat, lon, grid.lat, grid.lon) <= half_diagonal


def test_smaller_budget_uses_bigger_cells() -> None:
    path = dense_path((35.0, -100.0), (35.0, -96.0))

    fine = corridor_grid([path], max_cells=800)
    coarse = corridor_grid([path], max_cells=100)

    assert coarse.cell_m > fine.cell_m
    assert len(coarse) <= 100


def test_combines_multiple_routes() -> None:
    north = dense_path((36.0, -100.0), (36.0, -98.0))
    south = dense_path((34.0, -100.0), (34.0, -98.0))

    grid = corridor_grid([north, south], max_cells=600)

    assert grid.lat.min() < 34.0 < 36.0 < grid.lat.max()


def test_single_point() -> None:
    grid = corridor_grid([(np.array([35.0]), np.array([-100.0]))], max_cells=50)

    assert 0 < len(grid) <= 50


def test_rejects_empty_input() -> None:
    with pytest.raises(ValueError, match="At least one path"):
        corridor_grid([])
    with pytest.raises(ValueError, match="contain points"):
        corridor_grid([(np.array([]), np.array([]))])
