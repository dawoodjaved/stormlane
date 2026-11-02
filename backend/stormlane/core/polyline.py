from collections.abc import Iterable

import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]
IntArray = npt.NDArray[np.int64]

FORMAT_VERSION = 1

_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
_LOOKUP = np.full(256, -1, dtype=np.int64)
_LOOKUP[np.frombuffer(_ALPHABET.encode("ascii"), dtype=np.uint8)] = np.arange(64)
_MAX_CHUNKS_PER_VALUE = 12


def decode(encoded: str) -> tuple[FloatArray, FloatArray]:
    """Decode a HERE flexible polyline. A third dimension, if present, is dropped."""
    values = _decode_varints(encoded)
    if values.size < 2:
        raise ValueError("Polyline is missing its header")
    if values[0] != FORMAT_VERSION:
        raise ValueError(f"Unsupported polyline version {values[0]}")

    header = int(values[1])
    precision = header & 0x0F
    dims = 3 if (header >> 4) & 0x07 else 2

    deltas = values[2:]
    if deltas.size % dims:
        raise ValueError("Polyline ends in the middle of a coordinate")

    signed = (deltas >> 1) ^ -(deltas & 1)
    coords = np.cumsum(signed.reshape(-1, dims), axis=0) / 10.0**precision
    return np.ascontiguousarray(coords[:, 0]), np.ascontiguousarray(coords[:, 1])


def encode(points: Iterable[tuple[float, float]], precision: int = 5) -> str:
    if not 0 <= precision <= 15:
        raise ValueError("Precision must be between 0 and 15")

    scale = 10**precision
    parts = [_encode_unsigned(FORMAT_VERSION), _encode_unsigned(precision)]
    prev_lat = prev_lon = 0
    for lat, lon in points:
        lat_i, lon_i = round(lat * scale), round(lon * scale)
        parts.append(_encode_signed(lat_i - prev_lat))
        parts.append(_encode_signed(lon_i - prev_lon))
        prev_lat, prev_lon = lat_i, lon_i
    return "".join(parts)


def _decode_varints(encoded: str) -> IntArray:
    try:
        raw = np.frombuffer(encoded.encode("ascii"), dtype=np.uint8)
    except UnicodeEncodeError as exc:
        raise ValueError("Polyline contains non-ASCII characters") from exc
    if raw.size == 0:
        return np.empty(0, dtype=np.int64)

    chunks = _LOOKUP[raw]
    if (chunks < 0).any():
        raise ValueError("Polyline contains invalid characters")

    ends = np.flatnonzero((chunks & 0x20) == 0)
    if ends.size == 0 or ends[-1] != chunks.size - 1:
        raise ValueError("Polyline is truncated")

    starts = np.concatenate(([0], ends[:-1] + 1))
    lengths = ends - starts + 1
    if lengths.max() > _MAX_CHUNKS_PER_VALUE:
        raise ValueError("Polyline value is out of range")

    position = np.arange(chunks.size) - np.repeat(starts, lengths)
    values: IntArray = np.add.reduceat((chunks & 0x1F) << (5 * position), starts)
    return values


def _encode_signed(value: int) -> str:
    return _encode_unsigned(~(value << 1) if value < 0 else value << 1)


def _encode_unsigned(value: int) -> str:
    chars = []
    while value > 0x1F:
        chars.append(_ALPHABET[(value & 0x1F) | 0x20])
        value >>= 5
    chars.append(_ALPHABET[value])
    return "".join(chars)
