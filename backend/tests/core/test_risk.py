import numpy as np
import pytest
from hypothesis import given
from hypothesis import strategies as st

from stormlane.core.geometry import METERS_PER_MILE
from stormlane.core.risk import (
    RiskLevel,
    RouteRisk,
    Weather,
    classify,
    rank,
    summarize,
)

LOW, MODERATE, HIGH, SEVERE, NO_TRAVEL = RiskLevel


def weather(wind: float = 0, gust: float = 0, rain: float = 0, snow: float = 0) -> Weather:
    return Weather(
        wind_mph=np.array([wind]),
        gust_mph=np.array([gust]),
        rain_in=np.array([rain]),
        snow_in=np.array([snow]),
    )


def level_of(w: Weather, load_lb: float = 0, gust_aware: bool = True) -> RiskLevel:
    return RiskLevel(int(classify(w, load_lb, gust_aware=gust_aware).level[0]))


def route(
    no_travel: float = 0,
    severe: float = 0,
    high: float = 0,
    avg: float = 0,
    duration_s: float = 3_600,
) -> RouteRisk:
    return RouteRisk(
        miles_by_level=(0.0, 0.0, high, severe, no_travel),
        avg_risk=avg,
        duration_s=duration_s,
    )


class TestClassify:
    @pytest.mark.parametrize(
        ("wind", "expected"),
        [
            (0, LOW),
            (24.9, LOW),
            (25, MODERATE),
            (34.9, MODERATE),
            (35, HIGH),
            (44.9, HIGH),
            (45, SEVERE),
            (54.9, SEVERE),
            (55, NO_TRAVEL),
            (80, NO_TRAVEL),
        ],
    )
    def test_wind_thresholds(self, wind: float, expected: RiskLevel) -> None:
        assert level_of(weather(wind=wind)) == expected

    @pytest.mark.parametrize(
        ("rain", "expected"),
        [
            (0, LOW),
            (0.09, LOW),
            (0.10, MODERATE),
            (0.24, MODERATE),
            (0.25, HIGH),
            (0.49, HIGH),
            (0.50, SEVERE),
            (0.99, SEVERE),
            (1.00, NO_TRAVEL),
        ],
    )
    def test_rain_thresholds(self, rain: float, expected: RiskLevel) -> None:
        assert level_of(weather(rain=rain)) == expected

    @pytest.mark.parametrize(
        ("snow", "expected"),
        [
            (0, LOW),
            (0.49, LOW),
            (0.5, MODERATE),
            (0.99, MODERATE),
            (1.0, HIGH),
            (1.99, HIGH),
            (2.0, SEVERE),
            (2.99, SEVERE),
            (3.0, NO_TRAVEL),
        ],
    )
    def test_snow_thresholds(self, snow: float, expected: RiskLevel) -> None:
        assert level_of(weather(snow=snow)) == expected

    @pytest.mark.parametrize(
        ("wind", "load_lb", "expected"),
        [
            (45, 30_000, SEVERE),
            (45, 30_001, NO_TRAVEL),
            (54.9, 30_001, NO_TRAVEL),
            (44.9, 30_001, HIGH),
            (55, 0, NO_TRAVEL),
            (35, 40_000, HIGH),
            (35, 40_001, SEVERE),
            (44.9, 40_001, SEVERE),
            (45, 40_001, NO_TRAVEL),
            (34.9, 80_000, MODERATE),
        ],
    )
    def test_load_rules(self, wind: float, load_lb: float, expected: RiskLevel) -> None:
        assert level_of(weather(wind=wind), load_lb) == expected

    def test_uses_gusts_by_default(self) -> None:
        w = weather(wind=20, gust=40)

        assert level_of(w) == HIGH
        assert level_of(w, gust_aware=False) == LOW

    def test_takes_worst_factor(self) -> None:
        assert level_of(weather(wind=30, rain=0.3, snow=2.5)) == SEVERE

    def test_classifies_arrays(self) -> None:
        w = Weather(
            wind_mph=np.array([10.0, 30.0, 50.0]),
            gust_mph=np.array([0.0, 0.0, 0.0]),
            rain_in=np.array([0.0, 0.0, 0.0]),
            snow_in=np.array([0.0, 0.0, 0.0]),
        )

        np.testing.assert_array_equal(classify(w, 0).level, [LOW, MODERATE, SEVERE])

    @pytest.mark.parametrize(
        ("w", "load_lb", "factor"),
        [
            (weather(wind=10), 0, "No significant weather"),
            (weather(wind=30), 0, "Wind 30 mph"),
            (weather(wind=30, gust=48), 0, "Wind gusts 48 mph"),
            (weather(wind=48), 36_000, "Wind 48 mph with 36,000 lb load"),
            (weather(snow=1.2), 0, "Snow 1.2 in/h"),
            (weather(rain=0.3, wind=36), 0, "Wind 36 mph, Rain 0.30 in/h"),
        ],
    )
    def test_factor_text(self, w: Weather, load_lb: float, factor: str) -> None:
        assert classify(w, load_lb).factor == [factor]

    def test_rejects_negative_load(self) -> None:
        with pytest.raises(ValueError, match="non-negative"):
            classify(weather(), -1)

    def test_rejects_mismatched_arrays(self) -> None:
        w = Weather(
            wind_mph=np.zeros(2), gust_mph=np.zeros(2), rain_in=np.zeros(1), snow_in=np.zeros(2)
        )

        with pytest.raises(ValueError, match="same shape"):
            classify(w, 0)


class TestSummarize:
    def test_midpoint_attribution(self) -> None:
        distance = np.array([0, 10, 20, 25]) * METERS_PER_MILE
        level = np.array([LOW, SEVERE, SEVERE, NO_TRAVEL])

        risk = summarize(distance, level, duration_s=1_800)

        assert risk.miles_by_level == pytest.approx((5, 0, 0, 17.5, 2.5))
        assert risk.severe_miles == pytest.approx(17.5)
        assert risk.no_travel_miles == pytest.approx(2.5)
        assert risk.avg_risk == pytest.approx(2.5)
        assert risk.duration_s == 1_800

    def test_single_checkpoint(self) -> None:
        risk = summarize(np.array([0.0]), np.array([HIGH]), duration_s=0)

        assert sum(risk.miles_by_level) == 0
        assert risk.avg_risk == HIGH

    def test_rejects_mismatched_input(self) -> None:
        with pytest.raises(ValueError, match="same length"):
            summarize(np.array([0.0, 1.0]), np.array([LOW]), duration_s=0)

    @given(
        gaps=st.lists(st.floats(min_value=1, max_value=100_000), min_size=1, max_size=60),
        data=st.data(),
    )
    def test_miles_add_up_to_route_length(self, gaps: list[float], data: st.DataObject) -> None:
        distance = np.concatenate(([0.0], np.cumsum(gaps)))
        level = np.array(
            data.draw(
                st.lists(
                    st.integers(min_value=0, max_value=4),
                    min_size=distance.size,
                    max_size=distance.size,
                )
            )
        )

        risk = summarize(distance, level, duration_s=0)

        assert sum(risk.miles_by_level) == pytest.approx(distance[-1] / METERS_PER_MILE)
        assert level.min() <= risk.avg_risk + 1e-9
        assert risk.avg_risk <= level.max() + 1e-9


class TestRank:
    def test_fewest_severe_miles_wins(self) -> None:
        result = rank(
            {
                "Route A": route(severe=12, high=0, duration_s=3_000),
                "Route B": route(severe=4, high=30, duration_s=5_000),
            }
        )

        assert result.order == ["Route B", "Route A"]
        assert result.recommended == "Route B"
        assert not result.no_safe_route
        assert result.reason == (
            "Route B has 8.0 fewer severe-risk miles than Route A (4.0 vs 12.0)."
        )

    def test_high_miles_break_severe_tie(self) -> None:
        result = rank({"A": route(severe=5, high=20), "B": route(severe=5, high=10)})

        assert result.recommended == "B"
        assert "fewer high-risk miles" in result.reason

    def test_average_risk_breaks_mile_tie(self) -> None:
        result = rank({"A": route(avg=1.2), "B": route(avg=0.8)})

        assert result.recommended == "B"
        assert "lower average risk (0.80 vs 1.20)" in result.reason

    def test_duration_breaks_full_risk_tie(self) -> None:
        result = rank({"A": route(duration_s=4_000), "B": route(duration_s=3_100)})

        assert result.recommended == "B"
        assert result.reason == "B and A have the same risk; B is 15 min faster."

    def test_ignores_floating_point_noise(self) -> None:
        result = rank(
            {
                "A": route(severe=10.000000001, high=1, duration_s=1_000),
                "B": route(severe=10.0, high=5, duration_s=1_000),
            }
        )

        assert result.recommended == "A"

    def test_route_with_no_travel_is_never_recommended(self) -> None:
        result = rank(
            {
                "A": route(no_travel=0.5, duration_s=1_000),
                "B": route(severe=200, high=100, avg=3, duration_s=9_000),
            }
        )

        assert result.recommended == "B"
        assert not result.no_safe_route
        assert result.reason == "B avoids No Travel conditions; A has 0.5 No Travel miles."

    def test_flags_no_safe_route_when_every_route_has_no_travel(self) -> None:
        result = rank(
            {
                "A": route(no_travel=8),
                "B": route(no_travel=3, severe=50),
                "C": route(no_travel=5),
            }
        )

        assert result.order == ["B", "C", "A"]
        assert result.no_safe_route
        assert result.reason.startswith("No safe route at this departure")
        assert "B has the fewest No Travel miles (3.0 vs 5.0 on C)" in result.reason

    def test_single_route(self) -> None:
        result = rank({"Only": route()})

        assert result.recommended == "Only"
        assert result.reason == "Only is the only route."

    def test_identical_routes_keep_input_order(self) -> None:
        result = rank({"A": route(), "B": route()})

        assert result.order == ["A", "B"]
        assert result.reason == "A and B are equivalent in risk and duration."

    def test_rejects_empty_input(self) -> None:
        with pytest.raises(ValueError, match="At least one route"):
            rank({})
