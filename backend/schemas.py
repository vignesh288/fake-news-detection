from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=20000, description='News article text or headline')
    url: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, max_length=2000, description='Optional image URL or local path for image evidence extraction. This is a research-only evidence layer, not a visual classifier.')
    audio_url: str | None = Field(default=None, max_length=2000, description='Optional audio URL or local path for audio evidence extraction. This is a research-only evidence layer, not a spoken-content truth classifier.')


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict[str, float]
    explanation: str
    model_name: str
    model_comparison: dict | None = None
    uncertainty_level: str = Field(default='low', description='Confidence risk level for the current text-only assessment')
    needs_review: bool = Field(default=False, description='True when the model is uncertain or the evidence is weak')
    top_evidence: list[str] = Field(default_factory=list, description='Key phrases driving the prediction')
    modality: str = Field(default='text', description='Input modality used in the current assessment')
    evidence_summary: str | None = Field(default=None, description='Human-readable summary of the evidence behind the text-only result')
    image_evidence: dict | None = Field(default=None, description='Optional image evidence metadata extracted from an image input')
    audio_evidence: dict | None = Field(default=None, description='Optional audio evidence metadata extracted from an audio input')
