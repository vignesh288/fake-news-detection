from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.database import get_history, init_db, save_prediction
from backend.schemas import PredictionRequest, PredictionResponse
from backend.services.audio_evidence import extract_audio_evidence
from backend.services.image_evidence import extract_image_evidence
from backend.services.prediction_service import predict_text

router = APIRouter()


@router.on_event('startup')
def startup_event():
    init_db()


@router.get('/health')
def health_check():
    return {'status': 'ok'}


@router.post('/predict', response_model=PredictionResponse)
def predict_article(payload: PredictionRequest):
    try:
        result = predict_text(payload.text)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    image_evidence = None
    if payload.image_url:
        image_evidence = extract_image_evidence(image_path=payload.image_url, source_text=payload.text)

    audio_evidence = None
    if payload.audio_url:
        audio_evidence = extract_audio_evidence(audio_path=payload.audio_url, source_text=payload.text)

    save_prediction(payload.text, result['prediction'], result['confidence'])
    return {
        'prediction': result['prediction'],
        'confidence': result['confidence'],
        'probabilities': result['probabilities'],
        'explanation': result['explanation'],
        'model_name': result['model_name'],
        'model_comparison': result.get('model_comparison'),
        'uncertainty_level': result.get('uncertainty_level', 'low'),
        'needs_review': result.get('needs_review', False),
        'top_evidence': result.get('top_evidence', []),
        'modality': result.get('modality', 'text'),
        'evidence_summary': result.get('evidence_summary'),
        'image_evidence': image_evidence,
        'audio_evidence': audio_evidence,
    }


@router.post('/analyze-image')
async def analyze_image(
    file: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
):
    if file is None and (text is None or not text.strip()):
        raise HTTPException(status_code=400, detail='Provide either an uploaded image or a short text string for image-evidence context.')

    image_bytes = await file.read() if file is not None else None
    evidence = extract_image_evidence(image_bytes=image_bytes, source_text=text)
    return evidence


@router.post('/analyze-audio')
async def analyze_audio(
    file: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
):
    if file is None and (text is None or not text.strip()):
        raise HTTPException(status_code=400, detail='Provide either an uploaded audio file or a short text string for audio-evidence context.')

    audio_bytes = await file.read() if file is not None else None
    evidence = extract_audio_evidence(audio_bytes=audio_bytes, source_text=text)
    return evidence


@router.get('/history')
def prediction_history(limit: int = 10):
    return {'history': get_history(limit)}
