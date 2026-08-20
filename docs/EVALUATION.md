# Forecast evaluation

Phase 10 evaluates Puddle's selected Phase 9 model only on verified dataset rows issued after the model's recorded training window. This keeps training results out of the reported scientific comparison.

Run:

```sh
npm run forecast:evaluate -- data/derived/evaluation.json data/models/puddle-logistic-v1.json data/evaluations/2026-08-20.json 2026-08-20T00:00:00.000Z
```

The versioned JSON report contains Brier score, log loss, ROC-AUC, expected calibration error, ten-bin reliability data, and comparisons with NWS, HRRR, and the equal-weight ensemble. It also reports horizon, meteorological-season, and convective-event slices. Slices without eligible data remain explicitly unavailable instead of being inferred.

Arrival MAE is included only when the input rows have `arrivalObservedMinutes` and the matching `<system>ArrivalMinutes` feature. Convective-event slices require `convectiveEvent` as `0` or `1`. The report lists those missing inputs as limitations.

Do not treat a report with zero independent rows or zero common eligible rows as evidence of improved forecasts.
