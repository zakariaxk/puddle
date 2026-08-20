#!/usr/bin/env python3
"""Build a small, auditable Central Florida archive from NOAA public data.

Requires the temporary/offline collector environment:
  pip install herbie-data cfgrib
"""

import csv
import json
import sys
from datetime import datetime, timedelta, timezone
from io import StringIO
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from herbie import Herbie

STATION_ID = "72204012838"  # KMLB, Melbourne International Airport
LATITUDE = 28.0836
LONGITUDE = -80.6081


def fetch_observations(year: int):
    url = f"https://www.ncei.noaa.gov/data/global-hourly/access/{year}/{STATION_ID}.csv"
    with urlopen(url, timeout=60) as response:
        rows = csv.DictReader(StringIO(response.read().decode("utf-8")))
        observations = {}
        for row in rows:
            aa1 = row.get("AA1") or ""
            parts = aa1.split(",")
            if len(parts) < 2 or parts[0] != "01" or parts[1] == "9999":
                continue
            reported_at = datetime.fromisoformat(row["DATE"]).replace(tzinfo=timezone.utc)
            rounded = reported_at.replace(minute=0, second=0, microsecond=0)
            if reported_at.minute >= 30:
                rounded += timedelta(hours=1)
            observations[rounded] = {
                "precipitationMm": int(parts[1]) / 10,
                "reportedAt": reported_at,
                "sourceId": f"NCEI-GHCNh-{STATION_ID}-{reported_at.isoformat().replace('+00:00', 'Z')}",
            }
    return observations, url


def hrrr_precipitation(cycle: datetime, point_index):
    # Herbie interprets a naive timestamp as UTC; preserve the explicit UTC
    # contract at this library boundary rather than mixing timestamp types.
    model = Herbie(cycle.replace(tzinfo=None), model="hrrr", product="sfc", fxx=1, priority=["aws"])
    dataset = model.xarray(":APCP:surface:", remove_grib=True)
    if point_index is None:
        distance = (dataset.latitude.values - LATITUDE) ** 2 + (dataset.longitude.values - LONGITUDE) ** 2
        point_index = np.unravel_index(np.nanargmin(distance), distance.shape)
    value = float(dataset.tp.isel(y=int(point_index[0]), x=int(point_index[1])).values)
    return value, point_index, model.grib


def main():
    if len(sys.argv) != 5:
        raise SystemExit("Usage: gather-hrrr-historical-data.py <start-iso> <end-iso> <step-hours> <output.json>")
    start = datetime.fromisoformat(sys.argv[1].replace("Z", "+00:00")).astimezone(timezone.utc)
    end = datetime.fromisoformat(sys.argv[2].replace("Z", "+00:00")).astimezone(timezone.utc)
    step_hours = int(sys.argv[3])
    output_path = Path(sys.argv[4])
    if start.year != end.year or step_hours < 1 or start >= end:
        raise SystemExit("Use one calendar year, a positive step, and an increasing time range.")

    observations, observation_url = fetch_observations(start.year)
    snapshots = []
    output_observations = []
    point_index = None
    cycle = start
    while cycle < end:
        valid_time = cycle + timedelta(hours=1)
        outcome = observations.get(valid_time)
        if outcome:
            try:
                precipitation_mm, point_index, hrrr_url = hrrr_precipitation(cycle, point_index)
            except Exception as error:
                print(f"Skipping {cycle.isoformat()}: {error}", file=sys.stderr)
            else:
                cycle_iso = cycle.isoformat().replace("+00:00", "Z")
                valid_iso = valid_time.isoformat().replace("+00:00", "Z")
                prediction_id = f"hrrr-kmlb-{cycle.strftime('%Y%m%dT%H%MZ')}"
                snapshots.append({
                    "id": prediction_id,
                    "issuedAt": cycle_iso,
                    "availableAt": cycle_iso,
                    "location": {"latitude": LATITUDE, "longitude": LONGITUDE},
                    "nwsProbabilityPercent": None,
                    "hrrrPrecipitationMm": precipitation_mm,
                    "targetStart": cycle_iso,
                    "targetEnd": valid_iso,
                    "sourceIds": [hrrr_url],
                })
                output_observations.append({
                    "id": f"{prediction_id}-outcome",
                    "observedAt": valid_iso,
                    "availableAt": outcome["reportedAt"].isoformat().replace("+00:00", "Z"),
                    "location": {"latitude": LATITUDE, "longitude": LONGITUDE},
                    "precipitationMm": outcome["precipitationMm"],
                    "sourceId": outcome["sourceId"],
                })
                print(f"Collected {cycle_iso}", file=sys.stderr)
        cycle += timedelta(hours=step_hours)
    payload = {"snapshots": snapshots, "observations": output_observations, "provenance": {"hrrr": "NOAA HRRR AWS Open Data; 0-1 hour accumulated precipitation at nearest 3 km grid point.", "observations": f"NCEI Global Hourly station {STATION_ID}; one-hour AA1 precipitation, normalized to its reported-hour bin.", "nceiUrl": observation_url}}
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(snapshots)} paired records to {output_path}")


if __name__ == "__main__":
    main()
