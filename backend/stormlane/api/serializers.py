import math
from datetime import timedelta
from typing import Any

from django.utils import timezone
from rest_framework import serializers

from stormlane.core.geometry import EARTH_RADIUS_M, METERS_PER_MILE

INTERVAL_CHOICES = (10, 25, 50)
MAX_LOAD_LB = 200_000
MAX_TRIP_MILES = 3_000
MIN_TRIP_M = 500
MAX_DEPARTURE_AHEAD = timedelta(hours=48)
DEPARTURE_GRACE = timedelta(minutes=15)


class PointSerializer(serializers.Serializer[dict[str, Any]]):
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class PlanRequestSerializer(serializers.Serializer[dict[str, Any]]):
    origin = PointSerializer()
    destination = PointSerializer()
    departure = serializers.DateTimeField(required=False)
    load_lb = serializers.FloatField(min_value=0, max_value=MAX_LOAD_LB)
    interval_miles = serializers.ChoiceField(choices=INTERVAL_CHOICES, default=25)
    gust_aware = serializers.BooleanField(default=True)

    def validate_departure(self, value: Any) -> Any:
        now = timezone.now()
        if value < now - DEPARTURE_GRACE:
            raise serializers.ValidationError("Departure can't be in the past.")
        if value > now + MAX_DEPARTURE_AHEAD:
            raise serializers.ValidationError("Departure must be within the next 48 hours.")
        return max(value, now)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        attrs.setdefault("departure", timezone.now())
        distance = _great_circle_m(attrs["origin"], attrs["destination"])
        if distance < MIN_TRIP_M:
            raise serializers.ValidationError("Origin and destination are the same place.")
        if distance > MAX_TRIP_MILES * METERS_PER_MILE:
            raise serializers.ValidationError(
                f"Trips are limited to {MAX_TRIP_MILES:,} miles in a straight line."
            )
        return attrs


class GeocodeQuerySerializer(serializers.Serializer[dict[str, Any]]):
    q = serializers.CharField(min_length=3, max_length=120, trim_whitespace=True)


class HeatmapQuerySerializer(serializers.Serializer[dict[str, Any]]):
    plan_id = serializers.RegexField(r"^[0-9a-f]{32}$")


class PlaceSerializer(serializers.Serializer[dict[str, Any]]):
    name = serializers.CharField()
    lat = serializers.FloatField()
    lon = serializers.FloatField()


class GeocodeResponseSerializer(serializers.Serializer[dict[str, Any]]):
    results = PlaceSerializer(many=True)


class CheckpointSerializer(serializers.Serializer[dict[str, Any]]):
    distance_m = serializers.IntegerField()
    lat = serializers.FloatField()
    lon = serializers.FloatField()
    eta = serializers.DateTimeField()
    vertex_index = serializers.IntegerField()
    level = serializers.IntegerField(min_value=0, max_value=4)
    level_label = serializers.CharField()
    factor = serializers.CharField()
    wind_mph = serializers.FloatField()
    gust_mph = serializers.FloatField()
    rain_in = serializers.FloatField()
    snow_in = serializers.FloatField()


class RouteSummarySerializer(serializers.Serializer[dict[str, Any]]):
    miles_by_level = serializers.ListField(child=serializers.FloatField())
    high_miles = serializers.FloatField()
    severe_miles = serializers.FloatField()
    no_travel_miles = serializers.FloatField()
    avg_risk = serializers.FloatField()
    max_level = serializers.IntegerField()


class RouteSerializer(serializers.Serializer[dict[str, Any]]):
    id = serializers.CharField()
    name = serializers.CharField()
    polyline = serializers.CharField(help_text="Encoded polyline, precision 6")
    distance_m = serializers.IntegerField()
    duration_s = serializers.IntegerField()
    departure = serializers.DateTimeField()
    arrival = serializers.DateTimeField()
    notices = serializers.ListField(child=serializers.CharField())
    summary = RouteSummarySerializer()
    checkpoints = CheckpointSerializer(many=True)


class RecommendationSerializer(serializers.Serializer[dict[str, Any]]):
    route_id = serializers.CharField()
    order = serializers.ListField(child=serializers.CharField())
    no_safe_route = serializers.BooleanField()
    reason = serializers.CharField()


class PlanResponseSerializer(serializers.Serializer[dict[str, Any]]):
    plan_id = serializers.CharField()
    departure = serializers.DateTimeField()
    load_lb = serializers.FloatField()
    interval_miles = serializers.IntegerField()
    gust_aware = serializers.BooleanField()
    recommendation = RecommendationSerializer()
    routes = RouteSerializer(many=True)


class HeatmapCellSerializer(serializers.Serializer[dict[str, Any]]):
    lat = serializers.FloatField()
    lon = serializers.FloatField()
    risk = serializers.ListField(child=serializers.IntegerField(), help_text="Level per hour")


class HeatmapResponseSerializer(serializers.Serializer[dict[str, Any]]):
    plan_id = serializers.CharField()
    start = serializers.DateTimeField()
    hours = serializers.IntegerField()
    cell_size_m = serializers.IntegerField()
    cells = HeatmapCellSerializer(many=True)


def _great_circle_m(a: dict[str, float], b: dict[str, float]) -> float:
    phi1, phi2 = math.radians(a["lat"]), math.radians(b["lat"])
    dphi = phi2 - phi1
    dlam = math.radians(b["lon"] - a["lon"])
    h = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(h))
