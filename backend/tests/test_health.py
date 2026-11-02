from django.test import AsyncClient


async def test_health_returns_ok(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_rejects_post(async_client: AsyncClient) -> None:
    response = await async_client.post("/api/health")

    assert response.status_code == 405
