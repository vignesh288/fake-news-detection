from __future__ import annotations

import io
import re
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:  # pragma: no cover - exercised via fallback behavior
    Image = None

try:
    import pytesseract
except ImportError:  # pragma: no cover - exercised via fallback behavior
    pytesseract = None


def _tokenise_keywords(text: str | None) -> list[str]:
    if not text:
        return []

    words = re.findall(r"[A-Za-z0-9]+", text.lower())
    keyword_counts: dict[str, int] = {}
    for word in words:
        if len(word) < 4:
            continue
        keyword_counts[word] = keyword_counts.get(word, 0) + 1

    ranked = sorted(keyword_counts.items(), key=lambda item: (-item[1], item[0]))
    return [keyword for keyword, _ in ranked[:10]]


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for value in values:
        cleaned = value.strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        unique.append(cleaned)
    return unique


def _build_image_summary(top_evidence: list[str], ocr_available: bool, status: str) -> str:
    if status == 'not_provided':
        return 'No image evidence was supplied, so the system remains text-first and should not claim visual verification.'

    if not top_evidence:
        if ocr_available:
            return 'The image was processed successfully, but no readable text was detected. This is a limited visual evidence signal.'
        return 'The image adapter could not run OCR in this environment, so the result is metadata-only rather than visual classification.'

    evidence_text = ', '.join(top_evidence[:5])
    if ocr_available:
        return (
            f'Image evidence suggests: {evidence_text}. This is an image-only support signal for manual review, '
            'not a full visual truth classifier.'
        )
    return (
        f'Image metadata and fallback text hints suggest: {evidence_text}. OCR is unavailable here, so this remains a '
        'limited evidence layer rather than a finished visual assessment.'
    )


def extract_image_evidence(
    image_path: str | None = None,
    image_bytes: bytes | None = None,
    source_text: str | None = None,
) -> dict[str, Any]:
    if not image_path and not image_bytes:
        return {
            'status': 'not_provided',
            'modality': 'image',
            'ocr_available': False,
            'resolution': None,
            'top_evidence': [],
            'evidence_summary': 'No image evidence was supplied, so the system remains text-first and should not claim visual verification.',
        }

    image_name = Path(image_path).name if image_path else 'uploaded_image'
    size_bytes = 0
    resolution = None
    candidate_text = source_text or ''

    if image_path:
        path = Path(image_path)
        if path.exists():
            size_bytes = path.stat().st_size
            candidate_text = candidate_text or path.stem.replace('-', ' ').replace('_', ' ')

    if image_bytes is not None:
        size_bytes = len(image_bytes)

    ocr_available = Image is not None and pytesseract is not None
    extracted_text = ''
    top_evidence: list[str] = []

    image = None
    if image_bytes is not None and Image is not None:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            resolution = {'width': image.width, 'height': image.height}
        except Exception:
            image = None
    elif image_path and Image is not None:
        try:
            image = Image.open(image_path)
            resolution = {'width': image.width, 'height': image.height}
        except Exception:
            image = None

    if image is not None and ocr_available:
        try:
            extracted_text = pytesseract.image_to_string(image).strip()
        except Exception:
            extracted_text = ''

    if extracted_text:
        top_evidence = _dedupe(_tokenise_keywords(extracted_text) + _tokenise_keywords(source_text))
    elif candidate_text:
        top_evidence = _dedupe(_tokenise_keywords(candidate_text))

    if not top_evidence and image is None and not candidate_text:
        top_evidence = [image_name.replace('.', ' ').split()[0].lower()]

    evidence_summary = _build_image_summary(top_evidence, ocr_available, 'available')
    return {
        'status': 'available' if top_evidence or size_bytes else 'limited',
        'modality': 'image',
        'ocr_available': ocr_available,
        'image_name': image_name,
        'size_bytes': size_bytes,
        'resolution': resolution,
        'top_evidence': top_evidence[:5],
        'evidence_summary': evidence_summary,
        'ocr_text_preview': extracted_text[:400] if extracted_text else '',
    }
