import math

import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from weighcast.core.geometry import (
    EARTH_RADIUS_M,
    METERS_PER_MILE,
    FloatArray,
    Span,
    build_profile,
    sample_checkpoints,
    segment_lengths,
)

from .strategies import RouteInput, routes


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = phi2 - phi1
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def equator(*lons: float) -> tuple[FloatArray, FloatArray]:
    return np.zeros(len(lons)), np.array(lons, dtype=np.float64)


class TestSegmentLengths:
    def test_one_degree_of_latitude(self) -> None:
        lengths = segment_lengths(np.array([0.0, 1.0]), np.array([0.0, 0.0]))

        assert lengths[0] == pytest.approx(EARTH_RADIUS_M * math.pi / 180)

    @given(
        lat=st.floats(min_value=-70, max_value=70),
        lon=st.floats(min_value=-179, max_value=179),
        dlat=st.floats(min_value=-0.05, max_value=0.05),
        dlon=st.floats(min_value=-0.05, max_value=0.05),
    )
    def test_matches_haversine_for_short_segments(
        self, lat: float, lon: float, dlat: float, dlon: float
    ) -> None:
        expected = haversine_m(lat, lon, lat + dlat, lon + dlon)
        actual = segment_lengths(np.array([lat, lat + dlat]), np.array([lon, lon + dlon]))[0]

        assert actual == pytest.approx(expected, rel=1e-4, abs=1e-6)


class TestBuildProfile:
    def test_spreads_span_by_segment_length(self) -> None:
        profile = build_profile(*equator(0, 1, 3), [Span(0, length_m=300, duration_s=30)])

        np.testing.assert_allclose(profile.cum_dist_m, [0, 100, 300])
        np.testing.assert_allclose(profile.cum_time_s, [0, 10, 30])

    def test_each_span_keeps_its_own_speed(self) -> None:
        spans = [Span(0, length_m=200, duration_s=10), Span(2, length_m=100, duration_s=50)]
        profile = build_profile(*equator(0, 1, 2, 3), spans)

        np.testing.assert_allclose(profile.cum_time_s, [0, 5, 10, 60])

    def test_span_at_last_vertex_is_added_to_final_segment(self) -> None:
        spans = [Span(0, length_m=200, duration_s=20), Span(2, length_m=5, duration_s=7)]
        profile = build_profile(*equator(0, 1, 2), spans)

        assert profile.total_distance_m == pytest.approx(205)
        assert profile.total_duration_s == pytest.approx(27)

    def test_span_over_repeated_points_is_spread_evenly(self) -> None:
        profile = build_profile(*equator(0, 0, 0), [Span(0, length_m=10, duration_s=4)])

        np.testing.assert_allclose(profile.cum_dist_m, [0, 5, 10])
        np.testing.assert_allclose(profile.cum_time_s, [0, 2, 4])

    @pytest.mark.parametrize(
        ("spans", "message"),
        [
            ([], "At least one span"),
            ([Span(1, 10, 1)], "start at offset 0"),
            ([Span(0, 10, 1), Span(0, 10, 1)], "out of order"),
            ([Span(0, 10, 1), Span(3, 10, 1)], "out of range"),
            ([Span(0, -1, 1)], "non-negative"),
            ([Span(0, 1, -1)], "non-negative"),
        ],
    )
    def test_rejects_invalid_spans(self, spans: list[Span], message: str) -> None:
        with pytest.raises(ValueError, match=message):
            build_profile(*equator(0, 1, 2), spans)

    def test_rejects_single_point(self) -> None:
        with pytest.raises(ValueError, match="at least two points"):
            build_profile(*equator(0), [Span(0, 1, 1)])

    def test_rejects_mismatched_arrays(self) -> None:
        with pytest.raises(ValueError, match="same length"):
            build_profile(np.zeros(3), np.zeros(2), [Span(0, 1, 1)])

    @given(route=routes())
    def test_prefix_sums_are_monotonic_and_match_span_totals(self, route: RouteInput) -> None:
        lat, lon, spans = route
        profile = build_profile(lat, lon, spans)

        assert profile.cum_dist_m[0] == 0
        assert profile.cum_time_s[0] == 0
        assert np.all(np.diff(profile.cum_dist_m) >= 0)
        assert np.all(np.diff(profile.cum_time_s) >= 0)
        assert profile.total_distance_m == pytest.approx(sum(s.length_m for s in spans))
        assert profile.total_duration_s == pytest.approx(sum(s.duration_s for s in spans))


class TestSampleCheckpoints:
    def test_exact_multiple_does_not_duplicate_destination(self) -> None:
        profile = build_profile(*equator(0, 1, 2, 3), [Span(0, 30_000, 3_000)])

        checkpoints = sample_checkpoints(profile, 10_000)

        np.testing.assert_allclose(checkpoints.distance_m, [0, 10_000, 20_000, 30_000])
        np.testing.assert_allclose(checkpoints.lon, [0, 1, 2, 3])
        np.testing.assert_allclose(checkpoints.eta_offset_s, [0, 1_000, 2_000, 3_000])

    def test_destination_is_appended_after_last_interval(self) -> None:
        profile = build_profile(*equator(0, 1, 2, 3), [Span(0, 30_000, 3_000)])

        checkpoints = sample_checkpoints(profile, 12_000)

        np.testing.assert_allclose(checkpoints.distance_m, [0, 12_000, 24_000, 30_000])
        np.testing.assert_allclose(checkpoints.lon, [0, 1.2, 2.4, 3])
        np.testing.assert_array_equal(checkpoints.vertex_index, [0, 1, 2, 2])

    def test_eta_follows_span_speeds(self) -> None:
        spans = [Span(0, length_m=200, duration_s=10), Span(2, length_m=100, duration_s=50)]
        profile = build_profile(*equator(0, 1, 2, 3), spans)

        checkpoints = sample_checkpoints(profile, 50)

        np.testing.assert_allclose(checkpoints.eta_offset_s, [0, 2.5, 5, 7.5, 10, 35, 60])

    def test_zero_length_span_with_duration(self) -> None:
        spans = [Span(0, length_m=0, duration_s=60), Span(1, length_m=100, duration_s=10)]
        profile = build_profile(*equator(0, 1, 2), spans)

        checkpoints = sample_checkpoints(profile, 50)

        np.testing.assert_allclose(checkpoints.eta_offset_s, [0, 65, 70])

    def test_zero_length_route_has_single_checkpoint(self) -> None:
        profile = build_profile(*equator(5, 5), [Span(0, 0, 0)])

        checkpoints = sample_checkpoints(profile, 1_000)

        assert len(checkpoints) == 1
        assert checkpoints.lon[0] == 5

    def test_rejects_non_positive_interval(self) -> None:
        profile = build_profile(*equator(0, 1), [Span(0, 100, 10)])

        with pytest.raises(ValueError, match="positive"):
            sample_checkpoints(profile, 0)

    @given(route=routes(), interval_miles=st.sampled_from([10, 25, 50, 0.5, 3.7]))
    def test_checkpoint_invariants(self, route: RouteInput, interval_miles: float) -> None:
        lat, lon, spans = route
        profile = build_profile(lat, lon, spans)
        interval = interval_miles * METERS_PER_MILE

        checkpoints = sample_checkpoints(profile, interval)
        distance = checkpoints.distance_m
        gaps = np.diff(distance)

        assert distance[0] == 0
        assert distance[-1] == pytest.approx(profile.total_distance_m)
        np.testing.assert_allclose(gaps[:-1], interval)
        if gaps.size:
            assert 0 < gaps[-1] <= interval * (1 + 1e-9)

        eta = checkpoints.eta_offset_s
        assert eta[0] == 0
        if len(checkpoints) > 1:
            assert eta[-1] == pytest.approx(profile.total_duration_s)
        assert np.all(np.diff(eta) >= 0)

        vi = checkpoints.vertex_index
        cum = profile.cum_dist_m
        tol = 1e-6 * max(profile.total_distance_m, 1)
        assert np.all(cum[vi] <= distance + tol)
        assert np.all(distance <= cum[vi + 1] + tol)

        lat_lo = np.minimum(lat[vi], lat[vi + 1]) - 1e-9
        lat_hi = np.maximum(lat[vi], lat[vi + 1]) + 1e-9
        assert np.all((lat_lo <= checkpoints.lat) & (checkpoints.lat <= lat_hi))
