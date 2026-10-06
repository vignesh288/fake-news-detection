import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')}/api`;

const theme = {
  pageBg: '#06131f',
  panelBg: '#0f1c2a',
  panelAlt: '#132737',
  panelSoft: '#122432',
  border: 'rgba(148, 163, 184, 0.18)',
  borderStrong: 'rgba(148, 163, 184, 0.32)',
  text: '#e5eef8',
  textMuted: '#9bb0c5',
  brand: '#76e3ff',
  brandSoft: 'rgba(118, 227, 255, 0.12)',
  fake: '#ff6b6b',
  fakeSoft: 'rgba(255, 107, 107, 0.12)',
  real: '#4ade80',
  realSoft: 'rgba(74, 222, 128, 0.12)',
  warning: '#fbbf24',
  warningSoft: 'rgba(251, 191, 36, 0.12)',
  input: '#0a1d2b',
  white: '#ffffff',
};

const formatConfidence = (value) => `${Number(value || 0).toFixed(1)}%`;

function StatCard({ label, value, accent = 'brand' }) {
  const colors = {
    brand: { bg: theme.brandSoft, text: theme.brand },
    fake: { bg: theme.fakeSoft, text: theme.fake },
    real: { bg: theme.realSoft, text: theme.real },
    warning: { bg: theme.warningSoft, text: theme.warning },
  };

  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statBadge, background: colors[accent].bg, color: colors[accent].text }}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  const safeValue = Math.min(Math.max(Number(value || 0), 0), 100);
  return (
    <div style={styles.progressRow}>
      <div style={styles.progressLabel}>{label}</div>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${safeValue}%`,
            background: color,
          }}
        />
      </div>
      <div style={styles.progressValue}>{safeValue.toFixed(1)}%</div>
    </div>
  );
}

function HomePage() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history?limit=5`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    if (!file) {
      setImagePreview('');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
  };

  const handleAudioChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAudioFile(file);
    if (!file) {
      setAudioPreview('');
      return;
    }

    setAudioPreview(URL.createObjectURL(file));
  };

  const analyzeImageEvidence = async (value, file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    if (value.trim()) {
      formData.append('text', value.trim());
    }

    const response = await fetch(`${API_BASE}/analyze-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Image analysis failed');
    }

    return data;
  };

  const analyzeAudioEvidence = async (value, file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    if (value.trim()) {
      formData.append('text', value.trim());
    }

    const response = await fetch(`${API_BASE}/analyze-audio`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Audio analysis failed');
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const [imageEvidence, audioEvidence] = await Promise.all([
        analyzeImageEvidence(text, imageFile),
        analyzeAudioEvidence(text, audioFile),
      ]);

      const response = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          url,
          image_url: imageFile ? imageFile.name : undefined,
          audio_url: audioFile ? audioFile.name : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Prediction failed');
      }

      setResult({
        ...data,
        image_evidence: imageEvidence || data.image_evidence || null,
        audio_evidence: audioEvidence || data.audio_evidence || null,
      });
      await loadHistory();
    } catch (err) {
      setError(err.message || 'Something went wrong while predicting.');
    } finally {
      setLoading(false);
    }
  };

  const sampleText = 'Government officials announced a major policy change today, prompting debate across social media and local newsrooms.';

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.topbar}>
          <div style={styles.brandWrap}>
            <div style={styles.brandMark}>FN</div>
            <div>
              <div style={styles.brandName}>Factual Lens</div>
              <div style={styles.brandSub}>Misinformation analysis platform</div>
            </div>
          </div>

          <nav style={styles.navLinks}>
            <Link to="/" style={styles.navLink}>Home</Link>
            <Link to="/about" style={styles.navLink}>About</Link>
          </nav>
        </header>

        <section style={styles.hero}>
          <div style={styles.heroText}>
            <div style={styles.kicker}>AI analysis workspace</div>
            <h1 style={styles.heroTitle}>Analyze. Compare. Understand the evidence.</h1>
            <p style={styles.heroBody}>
              Evaluate suspicious content with a text-first model, compare interpretation across models, and review evidence in a transparent, research-oriented workflow.
            </p>
            <div style={styles.heroActions}>
              <button type="button" style={styles.primaryButton} onClick={() => document.getElementById('analysis-area')?.scrollIntoView({ behavior: 'smooth' })}>Analyze News</button>
              <button type="button" style={styles.secondaryButton} onClick={() => document.getElementById('insight-panel')?.scrollIntoView({ behavior: 'smooth' })}>Explore How It Works</button>
            </div>
          </div>

          <div style={styles.heroStats}>
            <StatCard label="Total analyses" value="1,248" accent="brand" />
            <StatCard label="Likely false" value="64%" accent="fake" />
            <StatCard label="Likely real" value="26%" accent="real" />
            <StatCard label="Inconclusive" value="10%" accent="warning" />
          </div>
        </section>

        <section id="analysis-area" style={styles.analysisLayout}>
          <form onSubmit={handleSubmit} style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <div style={styles.panelEyebrow}>Input</div>
                <h2 style={styles.panelTitle}>Analyze a news item</h2>
              </div>
              <button type="button" style={styles.smallSecondary} onClick={() => setText(sampleText)}>Load sample</button>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>News text or headline</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste an article, headline, or claim here..."
                rows={8}
                style={styles.textarea}
              />
              <div style={styles.helperRow}>
                <span>{text.length} characters</span>
                <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Optional URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                style={styles.input}
              />
            </div>

            <div style={styles.modalityGrid}>
              <div style={styles.modalityCard}>
                <div style={styles.modalityHeader}>
                  <span style={styles.modalityTitle}>Text</span>
                  <span style={styles.modalityPill}>Active</span>
                </div>
                <div style={styles.modalityBody}>Primary input and model decision path</div>
              </div>

              <div style={styles.modalityCard}>
                <div style={styles.modalityHeader}>
                  <span style={styles.modalityTitle}>URL</span>
                  <span style={styles.modalityPill}>Optional</span>
                </div>
                <div style={styles.modalityBody}>Source context and article reference</div>
              </div>

              <div style={styles.modalityCard}>
                <div style={styles.modalityHeader}>
                  <span style={styles.modalityTitle}>Image</span>
                  <span style={styles.modalityPillMuted}>Experimental</span>
                </div>
                <div style={styles.modalityBody}>Limited evidence extraction layer</div>
              </div>

              <div style={styles.modalityCard}>
                <div style={styles.modalityHeader}>
                  <span style={styles.modalityTitle}>Audio</span>
                  <span style={styles.modalityPillMuted}>Experimental</span>
                </div>
                <div style={styles.modalityBody}>Metadata and contextual signal only</div>
              </div>

              <div style={styles.modalityCardDisabled}>
                <div style={styles.modalityHeader}>
                  <span style={styles.modalityTitle}>Video</span>
                  <span style={styles.modalityPillMuted}>Future scope</span>
                </div>
                <div style={styles.modalityBody}>Not yet implemented for analysis</div>
              </div>
            </div>

            <div style={styles.uploadRow}>
              <div style={styles.uploadBox}>
                <label style={styles.uploadLabel}>Optional image evidence</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={styles.fileInput} />
              </div>

              <div style={styles.uploadBox}>
                <label style={styles.uploadLabel}>Optional audio evidence</label>
                <input type="file" accept="audio/*" onChange={handleAudioChange} style={styles.fileInput} />
              </div>
            </div>

            {imagePreview && (
              <div style={styles.previewWrap}>
                <img src={imagePreview} alt="Preview" style={styles.previewImage} />
              </div>
            )}

            {audioPreview && (
              <div style={styles.audioWrap}>
                <audio controls src={audioPreview} style={{ width: '100%' }} />
              </div>
            )}

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.actionRow}>
              <button type="submit" disabled={loading || !text.trim()} style={loading ? styles.primaryButtonDisabled : styles.primaryButton}>
                {loading ? 'Analyzing...' : 'Detect Fake News'}
              </button>
              <button
                type="button"
                style={styles.secondaryButton}
                onClick={() => {
                  setText('');
                  setUrl('');
                  setImageFile(null);
                  setAudioFile(null);
                  setImagePreview('');
                  setAudioPreview('');
                  setError('');
                  setResult(null);
                }}
              >
                Reset
              </button>
            </div>
          </form>

          <aside id="insight-panel" style={styles.sidePanel}>
            <div style={styles.sideHeader}>
              <div style={styles.panelEyebrow}>Overview</div>
              <h3 style={styles.sideTitle}>Model insight</h3>
            </div>

            <div style={styles.insightCard}>
              <div style={styles.insightLabel}>Primary model</div>
              <div style={styles.insightValue}>TF-IDF + Logistic Regression</div>
            </div>

            <div style={styles.insightCard}>
              <div style={styles.insightLabel}>Decision mode</div>
              <div style={styles.insightValue}>Text-first assessment</div>
            </div>

            <div style={styles.insightCard}>
              <div style={styles.insightLabel}>Evidence handling</div>
              <div style={styles.insightValue}>Interpretation + uncertainty</div>
            </div>

            <div style={styles.miniChart}>
              <ProgressBar label="Real" value={26} color={theme.real} />
              <ProgressBar label="Fake" value={64} color={theme.fake} />
              <ProgressBar label="Unclear" value={10} color={theme.warning} />
            </div>

            <div style={styles.historyPanel}>
              <div style={styles.sideHeaderSmall}>
                <div style={styles.panelEyebrow}>Recent</div>
                <h4 style={styles.sideTitleSmall}>Predictions</h4>
              </div>

              {history.length === 0 ? (
                <div style={styles.emptyHistory}>No predictions yet.</div>
              ) : (
                history.map((item) => (
                  <div key={item.id} style={styles.historyItem}>
                    <div>
                      <div style={styles.historyPrediction}>{item.prediction}</div>
                      <div style={styles.historyDate}>{new Date(item.created_at).toLocaleString()}</div>
                    </div>
                    <div style={styles.historyConfidence}>{Number(item.confidence).toFixed(1)}%</div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        {result && (
          <section style={styles.resultSection}>
            <div style={styles.panel}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.panelEyebrow}>Classification</div>
                  <h2 style={styles.panelTitle}>Assessment report</h2>
                </div>
                <div
                  style={{
                    ...styles.badge,
                    background: result.prediction === 'fake' ? theme.fakeSoft : theme.realSoft,
                    color: result.prediction === 'fake' ? theme.fake : theme.real,
                    borderColor: result.prediction === 'fake' ? 'rgba(255, 107, 107, 0.4)' : 'rgba(74, 222, 128, 0.35)',
                  }}
                >
                  {result.prediction === 'fake' ? 'Likely false' : 'Likely real'}
                </div>
              </div>

              <div style={styles.signalRow}>
                <div style={styles.signalCard}>
                  <div style={styles.signalLabel}>Prediction signal</div>
                  <div style={styles.signalValue}>
                    {result.prediction === 'fake' ? 'Strong false-content signal' : 'Strong real-content signal'}
                  </div>
                  <div style={styles.signalMeta}>
                    Uncertainty: {result.uncertainty_level || 'low'} · Model: {result.model_name || 'Baseline model'}
                  </div>
                </div>

                <div style={styles.signalCard}>
                  <div style={styles.signalLabel}>Model agreement</div>
                  <div style={styles.signalValue}>{result.model_comparison?.agreement ?? 100}%</div>
                  <div style={styles.signalMeta}>{result.model_comparison?.warning || 'Models agree on the classification.'}</div>
                </div>
              </div>

              <div style={styles.resultGrid}>
                <div style={styles.resultMainCard}>
                  <div style={styles.resultLead}>Confidence</div>
                  <div style={styles.resultConfidence}>{formatConfidence(result.confidence)}</div>
                  <div style={styles.resultMeta}>Estimated probability from the active model.</div>
                </div>

                <div style={styles.resultMainCard}>
                  <div style={styles.resultLead}>Evidence basis</div>
                  <div style={styles.resultConfidence}>
                    {Array.isArray(result.top_evidence) && result.top_evidence.length > 0 ? result.top_evidence.length : 0}
                  </div>
                  <div style={styles.resultMeta}>Influential text features currently driving the scoring.</div>
                </div>
              </div>

              <div style={styles.metricSection}>
                <div style={styles.metricHeader}>Probability distribution</div>
                {Object.entries(result.probabilities || {}).map(([label, value]) => (
                  <ProgressBar
                    key={label}
                    label={label}
                    value={Number(value) * 100}
                    color={label === 'fake' ? theme.fake : theme.real}
                  />
                ))}
              </div>

              <div style={styles.metricSection}>
                <div style={styles.metricHeader}>Why this classification?</div>
                <p style={styles.helpText}>{result.explanation}</p>
              </div>

              {Array.isArray(result.top_evidence) && result.top_evidence.length > 0 && (
                <div style={styles.metricSection}>
                  <div style={styles.metricHeader}>Influential terms</div>
                  <div style={styles.chipRow}>
                    {result.top_evidence.map((term) => (
                      <span key={term} style={styles.chip}>{term}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.evidence_summary && (
                <div style={styles.metricSection}>
                  <div style={styles.metricHeader}>Evidence summary</div>
                  <p style={styles.helpText}>{result.evidence_summary}</p>
                </div>
              )}

              {result.model_comparison?.model_results && (
                <div style={styles.metricSection}>
                  <div style={styles.metricHeader}>Model comparison</div>
                  <div style={styles.tableWrap}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Model</th>
                          <th style={styles.th}>Prediction</th>
                          <th style={styles.th}>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.model_comparison.model_results.map((model) => (
                          <tr key={model.model}>
                            <td style={styles.td}>{model.model}</td>
                            <td style={styles.td}>{model.prediction}</td>
                            <td style={styles.td}>{Number(model.confidence).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.panel}>
          <div style={styles.panelEyebrow}>About</div>
          <h1 style={styles.panelTitle}>Responsible misinformation analysis</h1>
          <p style={styles.helpText}>
            This project applies a text-first, interpretable machine learning workflow to estimate whether a given article or claim is likely credible or misleading. The model is designed for decision support, not absolute truth verification.
          </p>
          <p style={styles.helpText}>
            Optional image and audio evidence are treated as supplemental metadata layers. They can provide context, but they are not a substitute for a trained visual or spoken-content classifier.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 35%), #06131f',
    color: theme.text,
    fontFamily: 'Segoe UI, Arial, sans-serif',
    padding: '24px 16px 48px',
  },
  shell: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '18px',
    padding: '16px 18px',
    border: `1px solid ${theme.border}`,
    borderRadius: '18px',
    background: 'rgba(15, 28, 42, 0.85)',
    backdropFilter: 'blur(8px)',
    marginBottom: '24px',
  },
  brandWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandMark: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0ea5e9, #34d399)',
    color: '#03161d',
    fontWeight: 800,
  },
  brandName: {
    fontWeight: 700,
    fontSize: '1.03rem',
  },
  brandSub: {
    color: theme.textMuted,
    fontSize: '0.76rem',
  },
  navLinks: {
    display: 'flex',
    gap: '18px',
    alignItems: 'center',
  },
  navLink: {
    color: theme.text,
    textDecoration: 'none',
    opacity: 0.86,
    fontWeight: 600,
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 1fr',
    gap: '24px',
    marginBottom: '28px',
  },
  heroText: {
    padding: '30px 22px',
    borderRadius: '22px',
    border: `1px solid ${theme.border}`,
    background: 'linear-gradient(135deg, rgba(19, 39, 55, 0.95), rgba(8, 19, 31, 0.9))',
  },
  kicker: {
    margin: 0,
    color: theme.brand,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontSize: '0.74rem',
    fontWeight: 700,
  },
  heroTitle: {
    margin: '14px 0 12px',
    fontSize: 'clamp(2.2rem, 4vw, 4rem)',
    lineHeight: 1.08,
    letterSpacing: '-0.05em',
  },
  heroBody: {
    margin: '0 0 24px',
    color: theme.textMuted,
    lineHeight: 1.7,
    maxWidth: '640px',
    fontSize: '1.04rem',
  },
  heroActions: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #38bdf8, #2dd4bf)',
    color: '#062330',
    fontWeight: 800,
    padding: '14px 22px',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 12px 30px rgba(45, 212, 191, 0.22)',
  },
  primaryButtonDisabled: {
    border: 'none',
    background: 'rgba(148, 163, 184, 0.25)',
    color: theme.textMuted,
    fontWeight: 700,
    padding: '14px 22px',
    borderRadius: '12px',
    cursor: 'not-allowed',
  },
  secondaryButton: {
    border: `1px solid ${theme.borderStrong}`,
    background: 'rgba(15, 28, 42, 0.7)',
    color: theme.text,
    fontWeight: 700,
    padding: '14px 22px',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  smallSecondary: {
    border: `1px solid ${theme.borderStrong}`,
    background: 'rgba(15, 28, 42, 0.7)',
    color: theme.text,
    fontWeight: 600,
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '18px',
  },
  statCard: {
    padding: '18px 16px',
    borderRadius: '18px',
    border: `1px solid ${theme.border}`,
    background: 'rgba(15, 28, 42, 0.7)',
  },
  statBadge: {
    display: 'inline-flex',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '0.68rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  statValue: {
    marginTop: '16px',
    fontWeight: 800,
    fontSize: '2rem',
    letterSpacing: '-0.04em',
  },
  analysisLayout: {
    display: 'grid',
    gridTemplateColumns: '1.7fr 0.9fr',
    gap: '24px',
    marginBottom: '28px',
  },
  panel: {
    borderRadius: '22px',
    border: `1px solid ${theme.border}`,
    background: 'rgba(15, 28, 42, 0.85)',
    padding: '22px',
    boxShadow: '0 22px 40px rgba(2, 6, 23, 0.3)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  panelEyebrow: {
    color: theme.brand,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: '0.68rem',
    fontWeight: 700,
  },
  panelTitle: {
    margin: '8px 0 0',
    fontSize: '1.7rem',
    letterSpacing: '-0.04em',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 700,
    color: '#dfeaf7',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '14px',
    border: `1px solid ${theme.borderStrong}`,
    background: theme.input,
    color: theme.text,
    padding: '16px 14px',
    resize: 'vertical',
    minHeight: '150px',
    fontSize: '0.98rem',
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '14px',
    border: `1px solid ${theme.borderStrong}`,
    background: theme.input,
    color: theme.text,
    padding: '13px 14px',
    fontSize: '0.98rem',
  },
  helperRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: theme.textMuted,
    fontSize: '0.8rem',
    marginTop: '8px',
  },
  modalityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
    marginBottom: '18px',
  },
  modalityCard: {
    padding: '14px 12px',
    borderRadius: '14px',
    border: `1px solid ${theme.borderStrong}`,
    background: theme.panelSoft,
  },
  modalityCardDisabled: {
    padding: '14px 12px',
    borderRadius: '14px',
    border: `1px dashed ${theme.borderStrong}`,
    background: 'rgba(148, 163, 184, 0.04)',
    opacity: 0.7,
  },
  modalityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  modalityTitle: {
    fontWeight: 700,
  },
  modalityPill: {
    fontSize: '0.68rem',
    padding: '5px 8px',
    borderRadius: '999px',
    background: theme.brandSoft,
    color: theme.brand,
    fontWeight: 700,
  },
  modalityPillMuted: {
    fontSize: '0.68rem',
    padding: '5px 8px',
    borderRadius: '999px',
    background: 'rgba(148, 163, 184, 0.08)',
    color: theme.textMuted,
    fontWeight: 700,
  },
  modalityBody: {
    color: theme.textMuted,
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
  uploadRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '14px',
  },
  uploadBox: {
    padding: '12px',
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: '12px',
    background: theme.panelSoft,
  },
  uploadLabel: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: 700,
    color: '#dfeaf7',
  },
  fileInput: {
    width: '100%',
    boxSizing: 'border-box',
    color: theme.text,
  },
  previewWrap: {
    marginBottom: '12px',
  },
  previewImage: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    borderRadius: '14px',
    border: `1px solid ${theme.borderStrong}`,
  },
  audioWrap: {
    marginBottom: '12px',
  },
  actionRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  errorBox: {
    background: 'rgba(255, 107, 107, 0.08)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    color: '#ffb2b2',
    padding: '12px 14px',
    borderRadius: '12px',
    marginTop: '12px',
  },
  sidePanel: {
    borderRadius: '22px',
    border: `1px solid ${theme.border}`,
    background: 'rgba(15, 28, 42, 0.85)',
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sideHeader: {
    marginBottom: '4px',
  },
  sideTitle: {
    margin: '8px 0 0',
    fontSize: '1.3rem',
  },
  sideTitleSmall: {
    margin: '8px 0 0',
    fontSize: '1.06rem',
  },
  sideHeaderSmall: {
    marginBottom: '10px',
  },
  insightCard: {
    borderRadius: '14px',
    padding: '12px 14px',
    background: theme.panelSoft,
    border: `1px solid ${theme.border}`,
  },
  insightLabel: {
    color: theme.textMuted,
    fontSize: '0.76rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  },
  insightValue: {
    fontWeight: 700,
  },
  miniChart: {
    marginTop: '2px',
    background: theme.panelSoft,
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    padding: '14px',
  },
  progressRow: {
    display: 'grid',
    gridTemplateColumns: '52px 1fr 48px',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  progressLabel: {
    color: theme.textMuted,
    fontWeight: 700,
  },
  progressTrack: {
    height: '10px',
    background: 'rgba(148, 163, 184, 0.12)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
  },
  progressValue: {
    fontSize: '0.8rem',
    color: theme.textMuted,
    textAlign: 'right',
  },
  historyPanel: {
    marginTop: '4px',
    borderRadius: '16px',
    border: `1px solid ${theme.border}`,
    background: theme.panelSoft,
    padding: '12px 14px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 0',
    borderBottom: `1px solid ${theme.border}`,
  },
  historyPrediction: {
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  historyDate: {
    color: theme.textMuted,
    fontSize: '0.74rem',
    marginTop: '4px',
  },
  historyConfidence: {
    color: theme.brand,
    fontWeight: 800,
    fontSize: '0.82rem',
  },
  emptyHistory: {
    color: theme.textMuted,
    fontSize: '0.9rem',
  },
  resultSection: {
    marginTop: '10px',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '14px',
  },
  badge: {
    border: '1px solid transparent',
    borderRadius: '999px',
    padding: '8px 12px',
    fontWeight: 800,
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  signalRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '18px',
  },
  signalCard: {
    borderRadius: '16px',
    padding: '18px',
    border: `1px solid ${theme.border}`,
    background: 'linear-gradient(135deg, rgba(19, 39, 55, 0.96), rgba(11, 18, 28, 0.85))',
  },
  signalLabel: {
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '0.7rem',
    fontWeight: 700,
  },
  signalValue: {
    marginTop: '10px',
    fontSize: '1.2rem',
    fontWeight: 800,
    lineHeight: 1.3,
  },
  signalMeta: {
    marginTop: '8px',
    color: theme.textMuted,
    lineHeight: 1.5,
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    marginBottom: '18px',
  },
  resultMainCard: {
    borderRadius: '16px',
    padding: '18px',
    border: `1px solid ${theme.border}`,
    background: theme.panelSoft,
  },
  resultLead: {
    color: theme.textMuted,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  resultConfidence: {
    marginTop: '12px',
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.05em',
  },
  resultMeta: {
    marginTop: '10px',
    color: theme.textMuted,
    lineHeight: 1.6,
  },
  metricSection: {
    marginTop: '18px',
    paddingTop: '18px',
    borderTop: `1px solid ${theme.border}`,
  },
  metricHeader: {
    fontWeight: 800,
    marginBottom: '12px',
    fontSize: '1.02rem',
  },
  helpText: {
    color: '#dfeaf7',
    lineHeight: 1.7,
    margin: 0,
  },
  chipRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  chip: {
    padding: '8px 10px',
    borderRadius: '999px',
    background: theme.brandSoft,
    color: theme.brand,
    border: `1px solid ${theme.borderStrong}`,
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: theme.textMuted,
    fontWeight: 700,
    borderBottom: `1px solid ${theme.border}`,
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${theme.border}`,
  },
};
