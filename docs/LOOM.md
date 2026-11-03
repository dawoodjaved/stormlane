# Loom walkthrough

About 3–4 minutes. Record at 1440×900 or larger so the map and planner are both visible.

1. **Cold open (10s)**  
   Title card or the empty map: “Stormlane — weather-aware truck routing.” Mention Valhalla + Open-Meteo, no API keys.

2. **Plan a trip (40s)**  
   Type Chicago, pick the first result. Type Indianapolis. Leave departure at now, load at 36,000 lb, interval at 25 mi, gusts on. Hit Plan route. Talk over the skeleton.

3. **Read the ranking (40s)**  
   Point at the recommended reason, then the three cards: distance, duration, severe/high miles, average risk, ETA. Click the second-best route and show the map emphasis change.

4. **Map (40s)**  
   Zoom a checkpoint. Hover/click for ETA, dominant factor, and wind. Note the green → purple risk gradient on the line.

5. **Forecast slider (40s)**  
   Play 0–48h. Call out the heatmap blooming and the truck marker walking the selected route. Scrub back to a bad hour and compare routes.

6. **Limits (20s)**  
   Public Valhalla is fair-use and not a production SLA. Geocoding is city-first, not full street addressing. Weather is a forecast, not a dispatch system.

7. **Close (10s)**  
   Point at the README and `/api/docs`.
