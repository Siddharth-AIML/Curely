# Kidney Disease Model Training

This module trains Curely's kidney disease screening pipeline from the supplied
`data/Chronic_Kidney_Disease/` ARFF dataset. It does not modify the older
`models/kidney_disease_model.pkl` or `models/kidney_scaler.pkl` files.

## Dataset and schema

The two supplied ARFF files contain the same declared schema and the same
normalized usable rows. The primary file is
`data/Chronic_Kidney_Disease/chronic_kidney_disease.arff`; source notes are in
`chronic_kidney_disease.info.txt`. It has 24 predictors and a `class` target:

- Numeric: `age`, `bp`, `bgr`, `bu`, `sc`, `sod`, `pot`, `hemo`, `pcv`, `wbcc`,
  `rbcc`.
- Nominal: `sg`, `al`, `su`, `rbc`, `pc`, `pcc`, `ba`, `htn`, `dm`, `cad`,
  `appet`, `pe`, `ane`.
- Target values: `ckd` and `notckd`; metadata maps `ckd` to encoded class `1`
  and `notckd` to encoded class `0`.

Missing ARFF values (`?` and empty cells) are imputed inside the fitted
scikit-learn pipeline. Numeric features are median-imputed and standardized.
Nominal features are most-frequent-imputed and one-hot encoded. The candidate
models and all preprocessing are cross-validated within stratified folds; no
preprocessing is fitted before the split. The selected model is then evaluated
on a stratified holdout and finally refitted on all usable rows for serving.
Class weights are used instead of resampling.

Two rows with an extra trailing empty cell are repaired by dropping only that
empty cell. One row has an ambiguous extra category value; it is excluded
rather than assigning an unverified feature value. The training metadata
records the affected source lines and counts.

## Train and evaluate

From `ai-service`:

```powershell
python -m training.kidney.train
python -m training.kidney.evaluate
python -m unittest discover -s tests -v
```

Optional paths:

```powershell
python -m training.kidney.train --data data/Chronic_Kidney_Disease/chronic_kidney_disease.arff --output-dir models/kidney
```

Training writes:

- `models/kidney/kidney_pipeline.joblib`
- `models/kidney/metadata.json`

The metadata includes feature order and UI schema, category values, label
mapping, source hash/provenance, training configuration, cross-validation
results, held-out metrics, and library versions. The training command reloads
the written artifact and verifies prediction consistency before reporting
success.

## Limitations

The dataset contains 400 historical records from a single source. The
stratified holdout and cross-validation scores are internal estimates only;
they do not establish performance on other populations or clinical settings.
The model is not a diagnostic device, and its probability output is a model
estimate rather than clinical certainty.
