from collections.abc import Iterable

import numpy as np
import numpy.typing as npt

FloatArray = npt.NDArray[np.float64]


def decode(encoded: str, precision: int = 6) -> tuple[FloatArray, FloatArray]:
    factor = 10.0**precision
    lat = lon = 0
    pos = 0
    lats: list[float] = []
    lons: list[float] = []
    length = len(encoded)
    while pos < length:
        lat_delta, pos = _value(encoded, pos)
        lon_delta, pos = _value(encoded, pos)
        lat += lat_delta
        lon += lon_delta
        lats.append(lat / factor)
        lons.append(lon / factor)
    return np.asarray(lats, dtype=np.float64), np.asarray(lons, dtype=np.float64)


def encode(points: Iterable[tuple[float, float]], precision: int = 6) -> str:
    factor = 10.0**precision
    prev_lat = prev_lon = 0
    chars: list[str] = []
    for lat, lon in points:
        ilat = round(lat * factor)
        ilon = round(lon * factor)
        chars.append(_chunk(ilat - prev_lat))
        chars.append(_chunk(ilon - prev_lon))
        prev_lat, prev_lon = ilat, ilon
    return "".join(chars)


def encode_arrays(lat: FloatArray, lon: FloatArray, precision: int = 6) -> str:
    return encode(zip(lat.tolist(), lon.tolist(), strict=True), precision)


def _value(encoded: str, pos: int) -> tuple[int, int]:
    shift = result = 0
    while True:
        if pos >= len(encoded):
            raise ValueError("Polyline is truncated")
        chunk = ord(encoded[pos]) - 63
        pos += 1
        result |= (chunk & 0x1F) << shift
        shift += 5
        if chunk < 0x20:
            break
    value = ~(result >> 1) if result & 1 else result >> 1
    return value, pos


def _chunk(value: int) -> str:
    unsigned = ~(value << 1) if value < 0 else value << 1
    chars: list[str] = []
    while unsigned >= 0x20:
        chars.append(chr((0x20 | (unsigned & 0x1F)) + 63))
        unsigned >>= 5
    chars.append(chr(unsigned + 63))
    return "".join(chars)
