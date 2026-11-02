import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from stormlane.core.polyline import decode, encode

HERE_EXAMPLE_POINTS = [
    (50.10228, 8.69821),
    (50.10201, 8.69567),
    (50.10063, 8.69150),
    (50.09878, 8.68752),
]


def test_decodes_here_reference_example() -> None:
    lat, lon = decode("BFoz5xJ67i1B1B7PzIhaxL7Y")

    np.testing.assert_allclose(lat, [p[0] for p in HERE_EXAMPLE_POINTS])
    np.testing.assert_allclose(lon, [p[1] for p in HERE_EXAMPLE_POINTS])


def test_drops_third_dimension() -> None:
    lat, lon = decode("BlBoz5xJ67i1BU1B7PUzIhaUxL7YU")

    np.testing.assert_allclose(lat, [p[0] for p in HERE_EXAMPLE_POINTS])
    np.testing.assert_allclose(lon, [p[1] for p in HERE_EXAMPLE_POINTS])


def test_encode_matches_here_reference_example() -> None:
    assert encode(HERE_EXAMPLE_POINTS) == "BFoz5xJ67i1B1B7PzIhaxL7Y"


def test_header_only_decodes_to_empty_route() -> None:
    lat, lon = decode(encode([]))

    assert lat.size == 0
    assert lon.size == 0


@pytest.mark.parametrize(
    ("encoded", "message"),
    [
        ("", "missing its header"),
        ("C", "missing its header"),
        ("CF", "Unsupported polyline version"),
        ("BF!!", "invalid characters"),
        ("BFoz5xJ67i1B1B7PzIhaxL7", "truncated"),
        ("BFoz5xJ67i1B1B7PzIhaxL", "middle of a coordinate"),
        ("BFé", "non-ASCII"),
        ("BF" + "z" * 13 + "A", "out of range"),
    ],
)
def test_rejects_malformed_input(encoded: str, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        decode(encoded)


coordinate = st.tuples(
    st.floats(min_value=-90, max_value=90, allow_nan=False),
    st.floats(min_value=-180, max_value=180, allow_nan=False),
)


@given(points=st.lists(coordinate, max_size=50), precision=st.integers(min_value=0, max_value=7))
def test_round_trip_within_precision(points: list[tuple[float, float]], precision: int) -> None:
    lat, lon = decode(encode(points, precision=precision))

    tolerance = 0.5 * 10.0**-precision + 1e-9
    assert lat.size == len(points)
    np.testing.assert_allclose(lat, [p[0] for p in points], rtol=0, atol=tolerance)
    np.testing.assert_allclose(lon, [p[1] for p in points], rtol=0, atol=tolerance)
