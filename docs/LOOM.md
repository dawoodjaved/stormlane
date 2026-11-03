# Weighcast — Loom demo pitch

**Goal:** A tight, memorable walkthrough that sells *load-aware gate decisions*, not another “weather-aware routing” clone.  
**Length:** 3:00–3:30. Cap at 4:00.  
**Record at:** 1440×900 or larger (desk + map both visible). Dark theme. Quiet room.  
**URL:** Landing `https://weighcast.vercel.app` → desk `/app` (or local `http://localhost:5173`).

---

## One-line pitch (say this once, early)

> Weighcast doesn’t just paint weather on a map — it **weighs your load against the corridor**, ranks the truck runs, and tells you **when to hold the gate**.

Avoid saying “weather-aware truck routing” as the hero line (StormLane / Haulcast already own that phrase).

---

## Shot list & script

### 0. Title card (5s) — optional

On-screen text:

**Weighcast**  
*Weigh the weather before you roll.*

Start speaking as soon as the landing loads if you skip the card.

---

### 1. Cold open — landing (20s)

**Show:** Full-bleed hero. Brand is huge. CTA: Open the desk.

**Say:**

> Most routing tools pick the fastest road. Dispatch needs something else: which corridor is safest for *this* load, and whether leaving later is smarter. That’s Weighcast — a dispatch desk, not a stormy brochure.

**Do:** Hover “Watch demo” briefly (don’t open it unless you want a meta beat). Click **Open the desk**.

---

### 2. One-click corridor (25s)

**Show:** Sample trips.

**Say:**

> Instead of typing a city hunt, I’ll load a real lane.

**Do:** Click **Dallas → Atlanta**. Point at Yard / Destination filling, load jumping to 42,000 lb. Tap **Now** on gate chips. Leave gusts on. Hit **Score the runs**.

**Say over skeleton:**

> We’re pulling Valhalla truck routes, sampling Open-Meteo at each ETA, and scoring wind, gusts, rain, and snow against the weight on the trailer.

---

### 3. Best run + why not the others (35s)

**Show:** Best run banner, route cards with `via …` names, “Not chosen” lines.

**Say:**

> Here’s the ranking — safest first. Named corridors, not anonymous Route A/B/C noise. The pick gets a reason. Alternates get a blunt “why not chosen” so you can defend the call on the radio.

**Do:** Click the second-best card. Watch map emphasis change. Click back to Pick.

---

### 4. Driver Brief — the differentiator (30s)

**Show:** Driver Brief panel (action chip + yard / arrival conditions).

**Say:**

> This is the surface that matters for the driver: an action line — clear roads, caution, slow down, or hold — plus wind and precip at the yard and at arrival. One glance before wheels turn.

**Do:** If **Hold the gate** appears, click **See … on the map** and scrub to that hour.

> If waiting cuts peak risk, Weighcast tells you how long to hold the gate — leave-later is a first-class decision, not a footnote.

---

### 5. Map + worst stretch (25s)

**Show:** Risk lines, legend, **Worst stretch**.

**Say:**

> Jump straight to the worst stretch. Click a checkpoint — ETA, dominant factor, wind. You’re not guessing where the problem is.

**Do:** Click **Worst stretch**. Open a checkpoint popup. Optionally zoom.

---

### 6. Heatmap layers + playback (30s)

**Show:** Risk / Wind / Rain / Snow toggle. Time slider. Play.

**Say:**

> Corridor heatmap isn’t only composite risk. Toggle Wind, Rain, or Snow when you’re hunting a specific hazard. Play the next 48 hours — the truck walks the ETAs while the band lights up.

**Do:** Switch **Risk → Wind → Risk**. Hit play for ~5–8 seconds. Pause on a vivid hour. Mention **Demo storm** only if live weather is boring:

> For demos on a calm day, Demo storm overlays a western hazard band so the ranking still teaches the story.

---

### 7. Share + honesty (20s)

**Show:** Copy link. Optionally paste in a new tab (`/app?p=…`).

**Say:**

> Share the plan — teammates reopen the same ranking with city names restored, not raw coordinates. Limits: public Valhalla is fair-use, geocoding is strongest for cities, and this is a planning aid — not a dispatch or safety system of record.

---

### 8. Close (10s)

**Show:** Landing hero again, or README + `/api/docs` in a tab.

**Say:**

> Weighcast: load-aware corridor scoring, Hold the gate, driver brief, shareable plans. Weigh the weather before you roll.

End on the brand. Stop recording.

---

## Delivery notes

| Do | Don’t |
|----|--------|
| Speak like a dispatcher briefing a lead | Read the UI labels word-for-word |
| Keep mouse slow; pause 1s on each “aha” | Rush past Driver Brief / Hold the gate |
| Use one sample trip end-to-end | Restart the form mid-demo |
| Dark theme, brand visible in first 3s | Open with a blank map and silence |
| Caption key phrases if Loom captions are on | Compete with StormLane on 3D / sound gimmicks |

**Music:** none, or very low ambient — voice first.

**If something fails live:** switch Weather source to **Demo storm**, re-score, continue. Narrate it as a deliberate demo mode.

---

## On-screen chapter markers (Loom)

1. `0:00` Pitch  
2. `0:20` Sample lane  
3. `0:45` Ranked runs  
4. `1:20` Driver brief / Hold the gate  
5. `1:50` Worst stretch  
6. `2:15` Heatmap layers  
7. `2:45` Share + limits  
8. `3:05` Close  

---

## Rubric angle (Documentation & walkthrough)

This Loom should prove you can explain the **system**, not just click UI:

- Pipeline: form → Valhalla → ETA weather → load/gust risk → rank → map/heatmap  
- What is unique: **weight + gusts**, **Hold the gate**, **Driver Brief**, **named corridors**, **layer toggles**, **shareable plans**  
- Honest limits in under 20 seconds  

That is the 5% walkthrough: clear story, distinctive product, no clone energy.
