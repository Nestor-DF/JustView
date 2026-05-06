import React, { useEffect, useState } from 'react';

// --- Sub-renderers for each ML method ---

function MetricBadge({ label, value, accent }) {
    return (
        <div className="ml-metric-badge" style={accent ? { borderColor: '#111', background: '#f5f5f5' } : {}}>
            <span className="ml-metric-label">{label}</span>
            <span className="ml-metric-value">{value}</span>
        </div>
    );
}

function LinearRegressionResults({ data }) {
    return (
        <div className="ml-results-panel">
            <div className="ml-results-header">
                <h3>Linear Regression</h3>
                <span className="ml-results-subtitle">Target: <strong>{data.target}</strong></span>
            </div>

            {/* Metrics */}
            <div className="ml-section">
                <h4>Performance Metrics</h4>
                <div className="ml-metrics-grid">
                    <MetricBadge label="R² (Train)" value={data.metrics.r2_train} accent />
                    <MetricBadge label="R² (Test)" value={data.metrics.r2_test} accent />
                    <MetricBadge label="RMSE" value={data.metrics.rmse} />
                    <MetricBadge label="MAE" value={data.metrics.mae} />
                </div>
                <div className="ml-sample-info">
                    {data.num_train_samples} train / {data.num_test_samples} test samples
                </div>
            </div>

            {/* Coefficients */}
            <div className="ml-section">
                <h4>Coefficients</h4>
                <div className="ml-table-wrapper">
                    <table className="ml-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Coefficient</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="ml-intercept-row">
                                <td><em>Intercept</em></td>
                                <td>{data.intercept}</td>
                            </tr>
                            {data.coefficients.map((c, i) => (
                                <tr key={i}>
                                    <td>{c.feature}</td>
                                    <td>
                                        <span className={`ml-coef-value ${c.coefficient >= 0 ? 'positive' : 'negative'}`}>
                                            {c.coefficient >= 0 ? '+' : ''}{c.coefficient}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sample Predictions */}
            {data.sample_predictions && data.sample_predictions.length > 0 && (
                <div className="ml-section">
                    <h4>Sample Predictions (Test Set)</h4>
                    <div className="ml-table-wrapper">
                        <table className="ml-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Actual</th>
                                    <th>Predicted</th>
                                    <th>Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.sample_predictions.map((p, i) => {
                                    const error = Math.abs(p.actual - p.predicted).toFixed(4);
                                    return (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{p.actual}</td>
                                            <td>{p.predicted}</td>
                                            <td style={{ color: '#999' }}>{error}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function LogisticRegressionResults({ data }) {
    const cm = data.confusion_matrix;

    return (
        <div className="ml-results-panel">
            <div className="ml-results-header">
                <h3>Logistic Regression</h3>
                <span className="ml-results-subtitle">Target: <strong>{data.target}</strong> &middot; Classes: {data.classes.join(', ')}</span>
            </div>

            {/* Accuracy */}
            <div className="ml-section">
                <h4>Accuracy</h4>
                <div className="ml-metrics-grid">
                    <MetricBadge label="Train" value={`${(data.metrics.accuracy_train * 100).toFixed(2)}%`} accent />
                    <MetricBadge label="Test" value={`${(data.metrics.accuracy_test * 100).toFixed(2)}%`} accent />
                </div>
                <div className="ml-sample-info">
                    {data.num_train_samples} train / {data.num_test_samples} test samples
                </div>
            </div>

            {/* Classification Report */}
            <div className="ml-section">
                <h4>Classification Report</h4>
                <div className="ml-table-wrapper">
                    <table className="ml-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Precision</th>
                                <th>Recall</th>
                                <th>F1-Score</th>
                                <th>Support</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.classification_report.map((row, i) => (
                                <tr key={i}>
                                    <td><strong>{row.class}</strong></td>
                                    <td>{row.precision}</td>
                                    <td>{row.recall}</td>
                                    <td>{row.f1_score}</td>
                                    <td>{row.support}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confusion Matrix */}
            {cm && (
                <div className="ml-section">
                    <h4>Confusion Matrix</h4>
                    <div className="ml-table-wrapper">
                        <table className="ml-table ml-confusion-matrix">
                            <thead>
                                <tr>
                                    <th></th>
                                    {cm.labels.map((label, i) => (
                                        <th key={i} className="ml-cm-header">Pred: {label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cm.matrix.map((row, i) => {
                                    const rowMax = Math.max(...row);
                                    return (
                                        <tr key={i}>
                                            <td className="ml-cm-row-header"><strong>Act: {cm.labels[i]}</strong></td>
                                            {row.map((val, j) => {
                                                const intensity = rowMax > 0 ? val / rowMax : 0;
                                                const isDiagonal = i === j;
                                                return (
                                                    <td
                                                        key={j}
                                                        className="ml-cm-cell"
                                                        style={{
                                                            background: isDiagonal
                                                                ? `rgba(17, 17, 17, ${0.05 + intensity * 0.2})`
                                                                : val > 0 ? `rgba(255, 77, 79, ${0.05 + intensity * 0.15})` : 'transparent',
                                                            fontWeight: isDiagonal ? '700' : '400',
                                                        }}
                                                    >
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Coefficients */}
            <div className="ml-section">
                <h4>Coefficients</h4>
                <div className="ml-table-wrapper">
                    <table className="ml-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                {data.classes.map((cls, i) => (
                                    <th key={i}>{cls}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.coefficients.map((row, i) => (
                                <tr key={i}>
                                    <td>{row.feature}</td>
                                    {data.classes.map((cls, j) => (
                                        <td key={j}>
                                            {row[cls] !== undefined ? (
                                                <span className={`ml-coef-value ${row[cls] >= 0 ? 'positive' : 'negative'}`}>
                                                    {row[cls] >= 0 ? '+' : ''}{row[cls]}
                                                </span>
                                            ) : '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Prediction Playground Component ---

function PredictionPlayground({ modelId, features, mlMethod }) {
    const [values, setValues] = useState(() => {
        const init = {};
        features.forEach(f => { init[f] = ''; });
        return init;
    });
    const [prediction, setPrediction] = useState(null);
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError] = useState('');

    const handleValueChange = (feature, val) => {
        setValues(prev => ({ ...prev, [feature]: val }));
    };

    const allFilled = features.every(f => values[f] !== '' && !isNaN(parseFloat(values[f])));

    const handlePredict = async () => {
        if (!allFilled) return;
        setPredLoading(true);
        setPredError('');
        setPrediction(null);

        try {
            const numericValues = {};
            features.forEach(f => { numericValues[f] = parseFloat(values[f]); });

            const response = await fetch(`${import.meta.env.VITE_API_URL}/ml/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model_id: modelId, values: numericValues }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(typeof data.detail === 'string' ? data.detail : 'Prediction failed.');
            }

            setPrediction(data);
        } catch (err) {
            setPredError(err.message);
        } finally {
            setPredLoading(false);
        }
    };

    const handleDownload = () => {
        const url = `${import.meta.env.VITE_API_URL}/ml/download/${modelId}`;
        window.open(url, '_blank');
    };

    return (
        <div className="ml-playground">
            <div className="ml-playground-header">
                <h4>Prediction Playground</h4>
                <span className="ml-playground-hint">Enter values for each feature and click Predict</span>
            </div>

            <div className="ml-playground-inputs">
                {features.map(f => (
                    <div key={f} className="ml-playground-field">
                        <label>{f}</label>
                        <input
                            type="number"
                            step="any"
                            placeholder="0.0"
                            value={values[f]}
                            onChange={(e) => handleValueChange(f, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <div className="ml-playground-actions">
                <button
                    onClick={handlePredict}
                    disabled={!allFilled || predLoading}
                    className="ml-predict-btn"
                >
                    {predLoading ? 'Predicting…' : '⚡ Predict'}
                </button>
                <button
                    onClick={handleDownload}
                    className="ml-download-btn secondary"
                    title="Download trained model as .joblib file"
                >
                    📥 Download Model
                </button>
            </div>

            {predError && (
                <div className="ml-playground-error">{predError}</div>
            )}

            {prediction && (
                <div className="ml-playground-result">
                    <span className="ml-playground-result-label">
                        {prediction.prediction_type === 'class' ? 'Predicted Class' : 'Predicted Value'}
                    </span>
                    <span className="ml-playground-result-value">
                        {prediction.prediction}
                    </span>
                </div>
            )}
        </div>
    );
}

// --- Result renderers by method ---
const ML_RENDERERS = {
    linear_regression: LinearRegressionResults,
    logistic_regression: LogisticRegressionResults,
};

// --- Main ML Viewer Component ---

export default function MLViewer({ config }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!config) return;

        // Validate minimum config before fetching
        const features = config.specific?.features;
        const target = config.specific?.target;
        if (!features || features.length === 0 || !target) {
            setResults(null);
            setError('');
            return;
        }

        let isMounted = true;

        const timeoutId = setTimeout(() => {
            fetchML();
        }, 500);

        const fetchML = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/ml`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config),
                });
                const data = await response.json();

                if (!response.ok) {
                    const errorMsg = typeof data.detail === 'string' ? data.detail : 'Failed to run ML analysis.';
                    throw new Error(errorMsg);
                }

                if (isMounted) {
                    setResults(data);
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [config]);

    if (error) {
        return (
            <div className="chart-container-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>🤖</div>
                    <div style={{ fontSize: '0.95rem' }}>{error}</div>
                </div>
            </div>
        );
    }

    if (!results && !loading) {
        return (
            <div className="chart-container-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.3 }}>🤖</div>
                    <div style={{ fontSize: '0.9rem' }}>Select a target and at least one feature to run the model.</div>
                </div>
            </div>
        );
    }

    if (loading && !results) {
        return (
            <div className="chart-container-wrapper">
                <div style={{ color: '#888' }}>Running ML model...</div>
            </div>
        );
    }

    const Renderer = results ? ML_RENDERERS[results.ml_method] : null;

    return (
        <div className="chart-container-wrapper" style={{ padding: 0, overflow: 'auto', width: '100%', height: '100%', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
            <div style={{ width: '100%' }}>
                {Renderer ? (
                    <Renderer data={results} />
                ) : (
                    <div style={{ padding: '20px', color: '#888' }}>Unknown ML method result.</div>
                )}

                {/* Prediction Playground — shown after model is trained */}
                {results && results.model_id && results.features && (
                    <div style={{ padding: '0 24px 24px 24px' }}>
                        <PredictionPlayground
                            modelId={results.model_id}
                            features={results.features}
                            mlMethod={results.ml_method}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
