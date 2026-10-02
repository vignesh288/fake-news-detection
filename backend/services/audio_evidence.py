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


def _build_audio_summary(top_evidence: list[str], status: str) -> str:
    if status == 'not_provided':
        return 'No audio evidence was supplied, so the system remains text-first and should not claim spoken-content verification.'

    if not top_evidence:
        return 'The audio file was recorded, but no spoken-text evidence could be extracted in this environment. This remains a metadata-only support layer.'

    evidence_text = ', '.join(top_evidence[:5])
    return (
        f'Audio evidence suggests: {evidence_text}. This is a limited spoken-content support signal, '
        'not a fully trained audio-based misinformation classifier.'
    )


def extract_audio_evidence(
    audio_path: str | None = None,
    audio_bytes: bytes | None = None,
    source_text: str | None = None,
) -> dict[str, Any]:
    if not audio_path and not audio_bytes:
        return {
            'status': 'not_provided',
            'modality': 'audio',
            'duration_seconds': None,
            'top_evidence': [],
            'evidence_summary': 'No audio evidence was supplied, so the system remains text-first and should not claim spoken-content verification.',
        }

    file_size = 0
    duration_seconds = None
    candidate_text = source_text or ''
    audio_name = Path(audio_path).name if audio_path else 'uploaded_audio'

    if audio_path:
        path = Path(audio_path)
        if path.exists():
            file_size = path.stat().st_size
            candidate_text = candidate_text or path.stem.replace('-', ' ').replace('_', ' ')

    if audio_bytes is not None:
        file_size = len(audio_bytes)

    top_evidence = _dedupe(_tokenise_keywords(candidate_text))
    if not top_evidence:
        fallback = audio_name.replace('.', ' ').split()[0].lower()
        if fallback:
            top_evidence = [fallback]

    return {
        'status': 'available' if top_evidence or file_size else 'limited',
        'modality': 'audio',
        'duration_seconds': duration_seconds,
        'file_name': audio_name,
        'size_bytes': file_size,
        'top_evidence': top_evidence[:5],
        'evidence_summary': _build_audio_summary(top_evidence, 'available'),
        'transcript_preview': '',
    }
