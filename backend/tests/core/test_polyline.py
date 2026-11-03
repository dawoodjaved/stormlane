import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from weighcast.core.polyline import decode, encode

POINTS = [
    (50.10228, 8.69821),
    (50.10201, 8.69567),
    (50.10063, 8.69150),
    (50.09878, 8.68752),
]


def test_round_trip() -> None:
    lat, lon = decode(encode(POINTS, precision=6), precision=6)

    np.testing.assert_allclose(lat, [p[0] for p in POINTS], atol=5e-7)
    np.testing.assert_allclose(lon, [p[1] for p in POINTS], atol=5e-7)


def test_reference_precision_5() -> None:
    lat, lon = decode(r"_p~iF~ps|U_ulLnnqC_mqNvxq`@", precision=5)

    np.testing.assert_allclose(lat, [38.5, 40.7, 43.252], atol=1e-5)
    np.testing.assert_allclose(lon, [-120.2, -120.95, -126.453], atol=1e-5)


def test_empty_polyline() -> None:
    lat, lon = decode(encode([]))

    assert lat.size == 0
    assert lon.size == 0


def test_truncated_polyline() -> None:
    with pytest.raises(ValueError, match="truncated"):
        decode("_p~iF")


coordinate = st.tuples(
    st.floats(min_value=-90, max_value=90, allow_nan=False),
    st.floats(min_value=-180, max_value=180, allow_nan=False),
)


@given(points=st.lists(coordinate, max_size=50), precision=st.integers(min_value=1, max_value=7))
def test_round_trip_within_precision(points: list[tuple[float, float]], precision: int) -> None:
    lat, lon = decode(encode(points, precision=precision), precision=precision)

    tolerance = 0.5 * 10.0**-precision + 1e-9
    assert lat.size == len(points)
    np.testing.assert_allclose(lat, [p[0] for p in points], rtol=0, atol=tolerance)
    np.testing.assert_allclose(lon, [p[1] for p in points], rtol=0, atol=tolerance)
