import pandas as pd

from src.data.preprocess import prepare_dataframe
from src.models.train import benchmark_models, compute_dataset_quality


def test_prepare_dataframe_removes_empty_and_unknown_labels():
    df = pd.DataFrame(
        {
            'title': ['A valid title', '', 'Another valid title'],
            'text': ['Government officials confirmed a policy change.', '', 'A hidden tunnel rumor spread online.'],
            'label': ['real', 'unknown', 'fake'],
        }
    )

    cleaned = prepare_dataframe(df)

    assert set(cleaned['label'].unique()) == {'real', 'fake'}
    assert len(cleaned) == 2


def test_compute_dataset_quality_reports_basic_metrics():
    df = pd.DataFrame(
        {
            'text': [
                'Government officials confirmed the policy after a formal meeting.',
                'Government officials confirmed the policy after a formal meeting.',
                'A secret satellite was said to be watching the city.',
                'A secret satellite was said to be watching the city.',
                'Local officials said the road work was scheduled for next month.',
                'A viral rumor claimed the moon landing was staged.',
            ],
            'label': ['real', 'real', 'fake', 'fake', 'real', 'fake'],
        }
    )

    quality = compute_dataset_quality(df)

    assert 'sample_size' in quality
    assert 'class_distribution' in quality
    assert 'duplicate_ratio' in quality
    assert quality['sample_size'] == 6
    assert len(quality['class_distribution']) == 2


def test_benchmark_models_returns_experiment_results():
    df = pd.DataFrame(
        {
            'text': [
                'Government officials confirmed the new trial will begin next month.',
                'The city council approved a new budget plan after the public hearing.',
                'A leaked memo claims a hidden lab created a miracle cure overnight.',
                'Anonymous sources say a celebrity was arrested and the footage was hidden.',
                'Scientists reported the data showed warming in the region over the decade.',
                'Conspiracy posts say the moon landing was staged by government staff.',
                'Authoritative reporters confirmed the policy change after a formal notice.',
                'The weather station warned residents after reviewing updated radar records.',
            ],
            'label': ['real', 'real', 'fake', 'fake', 'real', 'fake', 'real', 'real'],
        }
    )

    results = benchmark_models(df)

    assert isinstance(results, list)
    assert len(results) >= 1
    assert all('experiment' in item for item in results)
    assert all('f1_fake' in item for item in results)


def test_compare_model_predictions_returns_agreement_and_explanations():
    from backend.services.prediction_service import compare_model_predictions

    text = 'Government officials confirmed a new policy after reviewing the formal evidence and public records.'
    result = compare_model_predictions(text)

    assert 'model_results' in result
    assert 'agreement' in result
    assert 'top_indicators' in result
    assert len(result['model_results']) >= 2
    assert result['agreement'] >= 0
    assert isinstance(result['top_indicators'], list)


def test_predict_text_exposes_uncertainty_and_evidence_metadata():
    from backend.services.prediction_service import predict_text

    text = 'Government officials confirmed a new policy after reviewing the formal evidence and public records.'
    result = predict_text(text)

    assert 'uncertainty_level' in result
    assert 'needs_review' in result
    assert 'top_evidence' in result
    assert 'modality' in result
    assert result['modality'] == 'text'
    assert isinstance(result['top_evidence'], list)
    assert isinstance(result['needs_review'], bool)


def test_extract_image_evidence_returns_honest_metadata_without_ocr():
    from backend.services.image_evidence import extract_image_evidence

    result = extract_image_evidence(
        image_path='example_story.png',
        source_text='official statement about the local election and public records',
    )

    assert result['modality'] == 'image'
    assert 'evidence_summary' in result
    assert isinstance(result['top_evidence'], list)
    assert result['top_evidence'] == [] or any('official' in term for term in result['top_evidence'])


def test_extract_audio_evidence_returns_honest_metadata():
    from backend.services.audio_evidence import extract_audio_evidence

    result = extract_audio_evidence(
        audio_path='example_audio.wav',
        source_text='official statement from spokesperson and public records',
    )

    assert result['modality'] == 'audio'
    assert 'evidence_summary' in result
    assert isinstance(result['top_evidence'], list)
    assert result['top_evidence'] == [] or any('official' in term for term in result['top_evidence'])


def test_extract_video_evidence_returns_honest_metadata():
    from backend.services.video_evidence import extract_video_evidence

    result = extract_video_evidence(
        video_path='example_video.mp4',
        source_text='official statement from spokesperson and public records',
    )

    assert result['modality'] == 'video'
    assert 'evidence_summary' in result
    assert isinstance(result['top_evidence'], list)
    assert result['top_evidence'] == [] or any('official' in term for term in result['top_evidence'])
