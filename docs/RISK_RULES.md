# Risk rules

Scores use the worse of wind, rain, and snow at the time the truck reaches a point. Gust-aware
mode substitutes `max(wind, gust)` for wind.

## Thresholds

| Level | Wind (mph) | Rain (in / hr) | Snow (in / hr) | Color   |
| ----- | ---------: | -------------: | -------------: | ------- |
| Low   |        <25 |          <0.10 |           <0.5 | `#22c55e` |
| Moderate |    25–34 |        0.10–0.24 |         0.5–0.9 | `#eab308` |
| High  |      35–44 |        0.25–0.49 |           1–1.9 | `#f97316` |
| Severe |     45–54 |        0.50–0.99 |           2–2.9 | `#dc2626` |
| No Travel |    ≥55 |           ≥1.00 |            ≥3.0 | `#7e22ce` |

## Load

Load only raises the score when wind is already high:

- Over 30,000 lb and wind 45–54 mph → No Travel
- Over 40,000 lb and wind 35–44 mph → Severe

The overall level is the max of wind, load, rain, and snow.

## Ranking

Routes are ordered by this tuple, first difference wins:

1. Any No Travel miles (unsafe first, then discarded from the recommendation if every route has some)
2. Severe miles
3. High miles
4. Average risk
5. Duration

The recommended route is the first in that order. The UI still shows all alternatives.

## Heatmap

Corridor cells sit within 25 miles of any planned path. Cell size grows until the grid fits in
`HEATMAP_MAX_CELLS` (default 600). Each cell carries 49 hourly levels (departure through +48h).
