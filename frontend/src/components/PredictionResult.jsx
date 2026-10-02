export default function PredictionResult({ result }) {
  const confidence = Number(result?.confidence ?? 0);
  const uncertainty = result?.uncertainty_level || 'low';
  const needsReview = Boolean(result?.needs_review);
  const evidence = Array.isArray(result?.top_evidence) ? result.top_evidence : [];
  const imageEvidence = result?.image_evidence;
  const audioEvidence = result?.audio_evidence;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '7px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    background: result?.prediction === 'fake' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(34, 197, 94, 0.18)',
    color: result?.prediction === 'fake' ? '#fca5a5' : '#86efac',
    border: `1px solid ${result?.prediction === 'fake' ? '#ef4444' : '#22c55e'}`,
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.8)',
      border: '1px solid #334155',
      borderRadius: '18px',
      padding: '20px',
      marginBottom: '18px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={badgeStyle}>{String(result?.prediction || 'unknown').toUpperCase()}</span>
        <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Confidence: {confidence.toFixed(1)}%</span>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '5px 10px',
          borderRadius: '999px',
          background: needsReview ? 'rgba(245, 158, 11, 0.18)' : 'rgba(34, 197, 94, 0.18)',
          color: needsReview ? '#fcd34d' : '#a7f3d0',
          border: `1px solid ${needsReview ? '#f59e0b' : '#22c55e'}`,
          fontWeight: 700,
        }}>
          {needsReview ? 'Needs review' : 'Stable'}
        </span>
        <span style={{
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#bfdbfe',
          border: '1px solid rgba(96, 165, 250, 0.6)',
          fontWeight: 700,
        }}>
          {String(result?.modality || 'text').toUpperCase()} assessment
        </span>
        <span style={{
          padding: '5px 10px',
          borderRadius: '999px',
          background: 'rgba(148, 163, 184, 0.12)',
          color: '#cbd5e1',
          border: '1px solid rgba(148, 163, 184, 0.4)',
        }}>
          Uncertainty: {uncertainty}
        </span>
      </div>

      <h3 style={{ marginTop: '18px', marginBottom: '10px', color: '#f8fafc' }}>Probability distribution</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        {Object.entries(result?.probabilities || {}).map(([label, value]) => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 55px', gap: '12px', alignItems: 'center' }}>
            <span style={{ color: '#cbd5e1' }}>{label}</span>
            <div style={{ height: '10px', background: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.max(Number(value) * 100, 4)}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: label === 'fake' ? '#ef4444' : '#22c55e',
                }}
              />
            </div>
            <strong style={{ color: '#e2e8f0' }}>{(Number(value) * 100).toFixed(1)}%</strong>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '18px', color: '#e2e8f0', lineHeight: 1.6 }}>{result?.explanation}</p>

      {evidence.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4 style={{ marginBottom: '8px', color: '#f8fafc' }}>Top evidence</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {evidence.map((term) => (
              <span key={term} style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'rgba(15, 118, 110, 0.18)',
                color: '#a7f3d0',
                border: '1px solid rgba(45, 212, 191, 0.35)',
              }}>
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {result?.evidence_summary && (
        <p style={{ marginTop: '16px', color: '#cbd5e1', fontStyle: 'italic' }}>{result.evidence_summary}</p>
      )}

      {imageEvidence && (
        <div style={{ marginTop: '18px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.12)', border: '1px solid rgba(45, 212, 191, 0.35)' }}>
          <h4 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Image evidence</h4>
          <p style={{ margin: '0 0 10px', color: '#d1fae5' }}>{imageEvidence.evidence_summary || 'No image evidence was extracted.'}</p>
          {Array.isArray(imageEvidence.top_evidence) && imageEvidence.top_evidence.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {imageEvidence.top_evidence.map((term) => (
                <span key={term} style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(20, 184, 166, 0.15)',
                  color: '#a7f3d0',
                  border: '1px solid rgba(45, 212, 191, 0.35)',
                }}>
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {audioEvidence && (
        <div style={{ marginTop: '18px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.10)', border: '1px solid rgba(96, 165, 250, 0.35)' }}>
          <h4 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Audio evidence</h4>
          <p style={{ margin: '0 0 10px', color: '#dbeafe' }}>{audioEvidence.evidence_summary || 'No audio evidence was extracted.'}</p>
          {Array.isArray(audioEvidence.top_evidence) && audioEvidence.top_evidence.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {audioEvidence.top_evidence.map((term) => (
                <span key={term} style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: 'rgba(37, 99, 235, 0.15)',
                  color: '#bfdbfe',
                  border: '1px solid rgba(96, 165, 250, 0.35)',
                }}>
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p style={{ marginTop: '18px', marginBottom: 0, color: '#94a3b8' }}>Model: {result?.model_name || 'Unknown model'}</p>
    </div>
  );
}
