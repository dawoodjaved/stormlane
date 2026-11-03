import asyncio
import logging
from collections.abc import Mapping
from typing import Any

import httpx

logger = logging.getLogger(__name__)

RETRY_STATUSES = frozenset({429, 500, 502, 503, 504})
DEFAULT_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


class UpstreamError(Exception):
    def __init__(self, service: str, message: str) -> None:
        super().__init__(f"{service}: {message}")
        self.service = service


def new_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, headers={"User-Agent": "stormlane/1.0"})


async def get_with_retry(
    client: httpx.AsyncClient,
    url: str,
    params: Mapping[str, Any],
    *,
    service: str,
    attempts: int = 3,
    backoff_s: float = 0.25,
) -> httpx.Response:
    for attempt in range(attempts):
        last_try = attempt == attempts - 1
        try:
            response = await client.get(url, params=params)
        except httpx.TransportError as exc:
            if last_try:
                raise UpstreamError(service, "could not be reached") from exc
            logger.warning("%s request failed (%s), retrying", service, exc)
        else:
            if response.status_code not in RETRY_STATUSES:
                return response
            if last_try:
                raise UpstreamError(service, f"responded with {response.status_code}")
            logger.warning("%s responded with %s, retrying", service, response.status_code)
        await asyncio.sleep(backoff_s * 2**attempt)
    raise AssertionError("unreachable")
