import numpy as np
from hypothesis import strategies as st

from weighcast.core.geometry import FloatArray, Span

RouteInput = tuple[FloatArray, FloatArray, list[Span]]


@st.composite
def routes(draw: st.DrawFn, max_points: int = 40) -> RouteInput:
    count = draw(st.integers(min_value=2, max_value=max_points))
    start_lat = draw(st.floats(min_value=25, max_value=49))
    start_lon = draw(st.floats(min_value=-124, max_value=-67))
    step = st.floats(min_value=-0.05, max_value=0.05)
    lat_steps = draw(st.lists(step, min_size=count - 1, max_size=count - 1))
    lon_steps = draw(st.lists(step, min_size=count - 1, max_size=count - 1))

    lat = start_lat + np.concatenate(([0.0], np.cumsum(lat_steps)))
    lon = start_lon + np.concatenate(([0.0], np.cumsum(lon_steps)))

    extra_offsets = draw(st.sets(st.integers(min_value=1, max_value=count - 1), max_size=6))
    spans = [
        Span(
            offset=offset,
            length_m=draw(st.floats(min_value=0, max_value=50_000)),
            duration_s=draw(st.floats(min_value=0, max_value=3_600)),
        )
        for offset in [0, *sorted(extra_offsets)]
    ]
    return lat, lon, spans
