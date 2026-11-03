import logging
from collections.abc import Awaitable, Callable
from typing import Any

from asgiref.sync import async_to_sync
from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_GET
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from stormlane.api import serializers as s
from stormlane.api.planning import PlanNotFoundError, TripRequest, corridor_heatmap, plan_trip
from stormlane.http import UpstreamError, new_client
from stormlane.routing.types import NoRouteError
from stormlane.routing.valhalla import ValhallaClient
from stormlane.weather.openmeteo import OpenMeteoClient

logger = logging.getLogger(__name__)


class UnprocessableTrip(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "No route could be planned for this trip."
    default_code = "no_route"


class BadGateway(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "An upstream service failed."
    default_code = "upstream_error"


@require_GET
async def health(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"status": "ok"})


class PlanView(APIView):
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "plan"

    @extend_schema(request=s.PlanRequestSerializer, responses=s.PlanResponseSerializer)
    def post(self, request: Request) -> Response:
        serializer = s.PlanRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        trip = TripRequest(
            origin=(data["origin"]["lat"], data["origin"]["lon"]),
            destination=(data["destination"]["lat"], data["destination"]["lon"]),
            departure=data["departure"],
            load_lb=data["load_lb"],
            interval_miles=int(data["interval_miles"]),
            gust_aware=data["gust_aware"],
        )

        async def run() -> dict[str, Any]:
            async with new_client() as http:
                weather = OpenMeteoClient(http, settings.OPEN_METEO_BASE_URL)
                router = ValhallaClient(http, settings.VALHALLA_URL)
                return await plan_trip(trip, router, weather)

        return Response(_call(run))


class HeatmapView(APIView):
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "heatmap"

    @extend_schema(
        parameters=[OpenApiParameter("plan_id", str, required=True)],
        responses=s.HeatmapResponseSerializer,
    )
    def get(self, request: Request) -> Response:
        query = s.HeatmapQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        plan_id = query.validated_data["plan_id"]

        async def run() -> dict[str, Any]:
            async with new_client() as http:
                weather = OpenMeteoClient(http, settings.OPEN_METEO_BASE_URL)
                return await corridor_heatmap(plan_id, weather, settings.HEATMAP_MAX_CELLS)

        return Response(_call(run))


class GeocodeView(APIView):
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "geocode"

    @extend_schema(
        parameters=[OpenApiParameter("q", str, required=True)],
        responses=s.GeocodeResponseSerializer,
    )
    def get(self, request: Request) -> Response:
        query = s.GeocodeQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        text = query.validated_data["q"]

        async def run() -> dict[str, Any]:
            async with new_client() as http:
                return _place_results(
                    await OpenMeteoClient(http, settings.OPEN_METEO_BASE_URL).geocode(text)
                )

        return Response(_call(run))


def _place_results(places: list[tuple[str, float, float]]) -> dict[str, Any]:
    return {"results": [{"name": name, "lat": lat, "lon": lon} for name, lat, lon in places]}


def _call[T](run: Callable[[], Awaitable[T]]) -> T:
    try:
        return async_to_sync(run)()
    except NoRouteError as exc:
        raise UnprocessableTrip(str(exc)) from exc
    except PlanNotFoundError as exc:
        raise NotFound("This plan has expired. Plan the trip again.") from exc
    except UpstreamError as exc:
        logger.warning("Upstream failure: %s", exc)
        raise BadGateway(str(exc)) from exc
