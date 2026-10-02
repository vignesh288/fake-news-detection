# Fake News Detection Performance Optimization Report

## 1. Current Performance

| Experiment | Accuracy | Precision | Recall | F1 |
| --- | ---: | ---: | ---: | ---: |
| Baseline TF-IDF + Logistic Regression | 0.6667 | 1.0000 | 0.5000 | 0.6667 |
| Optimized TF-IDF + Logistic Regression | 0.6667 | 1.0000 | 0.5000 | 0.6667 |
| TF-IDF + Linear SVM | 0.6667 | 1.0000 | 0.5000 | 0.6667 |
| TF-IDF + Multinomial Naive Bayes | 0.6667 | 1.0000 | 0.5000 | 0.6667 |

## 2. Literature Benchmark

The project data is a small placeholder dataset created for local development and does not match the scale or label quality of real ISOT/LIAR research corpora. Because of that, the comparison is indirect rather than direct.

| Comparison type | Dataset conditions | Typical reported accuracy | Typical reported F1 |
| --- | --- | ---: | ---: |
| Direct | Large real-world corpus, standard train/test split, comparable preprocessing | 0.90-0.99 | 0.88-0.99 |
| Indirect (this project) | Placeholder dataset with 20 labeled samples | 0.67 | 0.67 |

## 3. Performance Gap and Root Cause Analysis

- The project dataset currently contains only 20 labeled examples after preprocessing, which is far below the scale used in literature benchmarks.
- The dataset is synthetic and was created as a fallback when real CSV files were not present; this makes the comparison indirect and not academically equivalent.
- The label distribution is balanced but the sample size is too small to support a reliable estimate of generalization performance.
- The current model selection is not the main bottleneck; the dominant issue is the data quality and dataset size, not the classifier itself.

## 4. Experiments Performed

A small but systematic benchmark was run across multiple TF-IDF text pipelines and classifiers to establish a reproducible baseline before drawing conclusions.

## 5. Best Validated Configuration

- Best experiment: Baseline TF-IDF + Logistic Regression
- Accuracy: 0.6667
- Precision (fake): 1.0000
- Recall (fake): 0.5000
- F1 (fake): 0.6667

## 6. Final Decision

The final configuration is the best model among the tested baseline and tuned TF-IDF variants, but it should be treated as a development baseline rather than a publication-grade fake-news detector. The real need for a research-quality model is a larger and higher-quality dataset plus a held-out validation strategy that mirrors the literature conditions.

## 7. Remaining Limitations

- Placeholder dataset and no real ISOT/LIAR corpus is present in the workspace.
- No large-scale real-world evaluation was possible with the current project files.
- Results are valid only for this local development dataset and should not be presented as literature-equivalent performance.

## 8. Next Possible Improvements

- Replace the placeholder data with the real ISOT or LIAR datasets.
- Add stratified cross-validation and a proper validation split.
- Test character n-grams and transformer-based models only after the dataset is large enough and correctly labeled.
- Perform error analysis on misclassified articles to identify domain-specific weaknesses.

