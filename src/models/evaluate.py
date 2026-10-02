from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score


MODEL_PATH = Path(__file__).resolve().parents[1] / 'models' / 'fake_news_model.joblib'


def evaluate_model(model, X_test: pd.DataFrame | pd.Series, y_test: pd.Series) -> dict:
    predictions = model.predict(X_test)
    metrics = {
        'accuracy': float(accuracy_score(y_test, predictions)),
        'precision': float(precision_score(y_test, predictions, zero_division=0, pos_label='fake')),
        'recall': float(recall_score(y_test, predictions, zero_division=0, pos_label='fake')),
        'f1': float(f1_score(y_test, predictions, zero_division=0, pos_label='fake')),
        'confusion_matrix': confusion_matrix(y_test, predictions, labels=['real', 'fake']).tolist(),
        'classification_report': classification_report(y_test, predictions, digits=4, zero_division=0),
    }
    return metrics


def load_model(path: str | Path = MODEL_PATH):
    return joblib.load(path)
