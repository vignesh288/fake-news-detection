from __future__ import annotations

import re
from pathlib import Path
from typing import Any


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


def _build_video_summary(top_evidence: list[str], status: str) -> str:
    if status == 'not_provided':
        return 'No video evidence was supplied, so the system remains text-first and should not claim visual verification.'

    if not top_evidence:
        return 'The video file was received, but no readable frame text or transcript evidence could be extracted in this environment. This remains a limited metadata layer.'

    evidence_text = ', '.join(top_evidence[:5])
    return (
        f'Video evidence suggests: {evidence_text}. This is a limited multimodal support signal, '
        'not a fully trained video-based misinformation classifier.'
    )


def extract_video_evidence(
    video_path: str | None = None,
    video_bytes: bytes | None = None,
    source_text: str | None = None,
) -> dict[str, Any]:
    if not video_path and not video_bytes:
        return {
            'status': 'not_provided',
            'modality': 'video',
            'duration_seconds': None,
            'frame_count': 0,
            'top_evidence': [],
            'evidence_summary': 'No video evidence was supplied, so the system remains text-first and should not claim visual verification.',
        }

    file_size = 0
    duration_seconds = None
    frame_count = 0
    candidate_text = source_text or ''
    video_name = Path(video_path).name if video_path else 'uploaded_video'

    if video_path:
        path = Path(video_path)
        if path.exists():
            file_size = path.stat().st_size
            candidate_text = candidate_text or path.stem.replace('-', ' ').replace('_', ' ')

    if video_bytes is not None:
        file_size = len(video_bytes)

    top_evidence = _dedupe(_tokenise_keywords(candidate_text))
    if not top_evidence:
        fallback = video_name.replace('.', ' ').split()[0].lower()
        if fallback:
            top_evidence = [fallback]

    return {
        'status': 'available' if top_evidence or file_size else 'limited',
        'modality': 'video',
        'duration_seconds': duration_seconds,
        'frame_count': frame_count,
        'file_name': video_name,
        'size_bytes': file_size,
        'top_evidence': top_evidence[:5],
        'evidence_summary': _build_video_summary(top_evidence, 'available'),
        'transcript_preview': '',
    }
