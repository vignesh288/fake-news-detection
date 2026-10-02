from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd

from src.data.preprocess import clean_text

MODEL_PATH = Path(__file__).resolve().parents[1] / 'models' / 'fake_news_model.joblib'


def predict_single_text(text: str, model_path: str | Path = MODEL_PATH):
    model_bundle = joblib.load(model_path)
    vectorizer = model_bundle['vectorizer']
    model = model_bundle['model']
    cleaned = clean_text(text)
    features = vectorizer.transform([cleaned])
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0]
    class_index = list(model.classes_).index(prediction)
    confidence = float(probability[class_index]) * 100
    return {
        'prediction': prediction,
        'confidence': round(confidence, 2),
        'probabilities': {
            label: round(float(prob), 4) for label, prob in zip(model.classes_, probability)
        },
    }


def predict_from_dataframe(df: pd.DataFrame, model_path: str | Path = MODEL_PATH):
    model_bundle = joblib.load(model_path)
    vectorizer = model_bundle['vectorizer']
    model = model_bundle['model']
    texts = df['text'].fillna('').apply(clean_text)
    features = vectorizer.transform(texts)
    predictions = model.predict(features)
    probabilities = model.predict_proba(features)
    results = []
    for text, pred, prob in zip(texts, predictions, probabilities):
        idx = list(model.classes_).index(pred)
        results.append({
            'text': text,
            'prediction': pred,
            'confidence': round(float(prob[idx]) * 100, 2),
            'probabilities': {
                label: round(float(p), 4) for label, p in zip(model.classes_, prob)
            },
        })
    return results
