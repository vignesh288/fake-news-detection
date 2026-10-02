from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

from src.data.load_data import load_raw_dataset
from src.data.preprocess import clean_text, prepare_dataframe

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_ROOT / 'src' / 'models' / 'fake_news_model.joblib'
METADATA_PATH = PROJECT_ROOT / 'src' / 'models' / 'model_metadata.json'


def _safe_sigmoid(value: float) -> float:
    return 1.0 / (1.0 + np.exp(-value))


def _extract_top_terms(model, vectorizer, label: str, top_n: int = 5) -> list[str]:
    feature_names = list(vectorizer.get_feature_names_out())
    if not feature_names:
        return []

    if hasattr(model, 'coef_'):
        scores = model.coef_
        if scores.shape[0] == 1:
            scores = scores[0]
            if label == list(model.classes_)[0]:
                scores = -scores
        else:
            class_index = list(model.classes_).index(label)
            scores = scores[class_index]
        ranked = np.argsort(np.abs(scores))[::-1][:top_n]
        terms = [feature_names[idx] for idx in ranked if scores[idx] != 0]
        return [term for term in terms if term][:top_n]

    if hasattr(model, 'feature_log_prob_'):
        scores = model.feature_log_prob_
        if scores.shape[0] == 1:
            scores = scores[0]
        else:
            class_index = list(model.classes_).index(label)
            scores = scores[class_index]
        top_indices = np.argsort(scores)[::-1][:top_n]
        terms = [feature_names[idx] for idx in top_indices]
        return [term for term in terms if term][:top_n]

    return []


def load_model_bundle():
    if not MODEL_PATH.exists():
        raise FileNotFoundError('Model file not found. Train the model before using the API.')
    bundle = joblib.load(MODEL_PATH)
    model = bundle['model']
    vectorizer = bundle['vectorizer']
    model_name = 'TF-IDF + Logistic Regression'
    metadata = {}
    if METADATA_PATH.exists():
        with open(METADATA_PATH, 'r', encoding='utf-8') as file:
            metadata = json.load(file)
        if metadata.get('model_name'):
            model_name = metadata['model_name']
    return model, vectorizer, model_name


def explain_prediction(text: str, prediction: str, probabilities: dict[str, float], top_indicators: list[str] | None = None) -> str:
    cleaned = clean_text(text)
    if not cleaned:
        return 'The text is too short or empty to produce a meaningful explanation.'

    indicators = top_indicators or [
        'official notice',
        'secret claim',
        'public records',
        'viral rumor',
    ]
    indicator_text = ', '.join(indicators[:3])

    if prediction == 'fake':
        return (
            'The model classified this text as fake because the wording and language patterns resemble typical misinformation content. '
            f'Strong indicators included: {indicator_text}. Confidence is based on the model probability, not certainty.'
        )
    return (
        'The model classified this text as real because it found language patterns more similar to reliable reporting. '
        f'Key contextual cues included: {indicator_text}. Confidence is based on the model probability, not factual truth.'
    )


def _determine_uncertainty_level(confidence: float, agreement: float | None = None) -> str:
    if confidence < 55 or (agreement is not None and agreement < 70):
        return 'high'
    if confidence < 70 or (agreement is not None and agreement < 85):
        return 'medium'
    return 'low'


def _build_evidence_summary(top_evidence: list[str] | None) -> str:
    if not top_evidence:
        return 'The model relied on limited evidence, so this text-only assessment should be treated cautiously.'

    evidence_text = ', '.join(top_evidence[:5])
    return (
        f'Top evidence terms: {evidence_text}. This is a text-only assessment, so the result is best interpreted '
        'as model support rather than factual verification.'
    )


def compare_model_predictions(text: str) -> dict:
    cleaned = clean_text(text)
    if not cleaned:
        raise ValueError('Input text is empty or invalid after preprocessing.')

    dataset = load_raw_dataset('ISOT')
    prepared = prepare_dataframe(dataset)
    X = prepared['text']
    y = prepared['label']

    model_specs = [
        ('Logistic Regression', LogisticRegression(max_iter=5000, class_weight='balanced', C=10.0, solver='liblinear', random_state=42), TfidfVectorizer(max_features=8000, ngram_range=(1, 2), min_df=1)),
        ('Linear SVM', LinearSVC(class_weight='balanced', C=1.0, random_state=42), TfidfVectorizer(max_features=8000, ngram_range=(1, 2), sublinear_tf=True)),
        ('Multinomial Naive Bayes', MultinomialNB(alpha=0.5), TfidfVectorizer(max_features=8000, ngram_range=(1, 2))),
    ]

    model_results = []
    all_predictions = []
    all_terms: list[str] = []

    for model_name, model, vectorizer in model_specs:
        vectorizer.fit(X)
        features = vectorizer.transform([cleaned])
        model.fit(vectorizer.transform(X), y)
        prediction = model.predict(features)[0]
        all_predictions.append(prediction)

        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(features)[0]
            class_to_prob = {label: float(prob) for label, prob in zip(model.classes_, probabilities)}
        else:
            decision_score = float(model.decision_function(features)[0])
            positive_prob = _safe_sigmoid(decision_score)
            classes = list(model.classes_)
            class_to_prob = {
                classes[0]: float(1.0 - positive_prob),
                classes[1]: float(positive_prob),
            }

        confidence = float(class_to_prob.get(prediction, 0.0)) * 100
        top_terms = _extract_top_terms(model, vectorizer, prediction, top_n=5)
        all_terms.extend(top_terms)

        model_results.append({
            'model': model_name,
            'prediction': prediction,
            'confidence': round(confidence, 2),
            'probabilities': {label: round(float(value), 4) for label, value in class_to_prob.items()},
            'top_terms': top_terms,
        })

    majority_label = max(set(all_predictions), key=all_predictions.count)
    agreement = round((all_predictions.count(majority_label) / len(all_predictions)) * 100, 2)
    ordered_terms = []
    for term in dict.fromkeys(all_terms):
        if term:
            ordered_terms.append(term)

    return {
        'model_results': model_results,
        'majority_prediction': majority_label,
        'agreement': agreement,
        'top_indicators': ordered_terms[:10],
        'warning': 'Models produced mixed predictions. The result should be interpreted cautiously.' if agreement < 100 else 'Models agree on the classification.',
    }


def predict_text(text: str):
    model, vectorizer, model_name = load_model_bundle()
    cleaned = clean_text(text)
    if not cleaned:
        raise ValueError('Input text is empty or invalid after preprocessing.')
    features = vectorizer.transform([cleaned])
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    class_to_prob = {label: float(prob) for label, prob in zip(model.classes_, probabilities)}
    confidence = float(class_to_prob.get(prediction, 0.0)) * 100

    comparison = compare_model_predictions(cleaned)
    agreement = float(comparison.get('agreement', 100.0))
    uncertainty_level = _determine_uncertainty_level(confidence, agreement)
    top_evidence = comparison.get('top_indicators') or []
    explanation = explain_prediction(cleaned, prediction, class_to_prob, top_evidence)

    return {
        'prediction': prediction,
        'confidence': round(confidence, 2),
        'probabilities': {label: round(val, 4) for label, val in class_to_prob.items()},
        'explanation': explanation,
        'model_name': model_name,
        'model_comparison': comparison,
        'uncertainty_level': uncertainty_level,
        'needs_review': uncertainty_level in {'medium', 'high'},
        'top_evidence': [term for term in top_evidence[:5] if term],
        'modality': 'text',
        'evidence_summary': _build_evidence_summary(top_evidence),
    }
