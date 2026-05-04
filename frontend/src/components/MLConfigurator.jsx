import React from 'react';

// --- Shared Atomic Components ---

function FeatureSelector({ columns, specific, setConfig }) {
    const selected = specific?.features || [];

    const toggleFeature = (col) => {
        setConfig(prev => {
            const current = prev.specific?.features || [];
            const updated = current.includes(col)
                ? current.filter(c => c !== col)
                : [...current, col];
            return { ...prev, specific: { ...prev.specific, features: updated } };
        });
    };

    // Filter out the target column from feature selection
    const availableCols = columns.filter(c => c !== specific?.target);

    return (
        <div className="form-group">
            <label>Features (Independent Variables)</label>
            <div style={{ maxHeight: '180px', overflowY: 'auto', borderRadius: '6px', padding: '10px', border: '1px solid #eee', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {availableCols.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#999' }}>Select a target first or upload data with more columns.</div>
                ) : (
                    availableCols.map(col => (
                        <label
                            key={col}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '18px 1fr',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(col)}
                                onChange={() => toggleFeature(col)}
                                style={{ margin: 0 }}
                            />
                            {col}
                        </label>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
                    {selected.length} feature{selected.length !== 1 ? 's' : ''} selected
                </div>
            )}
        </div>
    );
}

function TargetSelector({ columns, specific, setConfig }) {
    const handleChange = (e) => {
        const newTarget = e.target.value;
        setConfig(prev => {
            // Remove new target from features if it was selected
            const currentFeatures = prev.specific?.features || [];
            const updatedFeatures = currentFeatures.filter(f => f !== newTarget);
            return {
                ...prev,
                specific: {
                    ...prev.specific,
                    target: newTarget,
                    features: updatedFeatures,
                }
            };
        });
    };

    return (
        <div className="form-group">
            <label>Target (Dependent Variable)</label>
            <select value={specific?.target || ''} onChange={handleChange}>
                <option value="">Select target column...</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
        </div>
    );
}

function TestSizeInput({ specific, setConfig }) {
    const handleChange = (e) => {
        const value = parseFloat(e.target.value);
        setConfig(prev => ({
            ...prev,
            specific: { ...prev.specific, test_size: value }
        }));
    };

    const testSize = specific?.test_size ?? 0.2;

    return (
        <div className="form-group">
            <label>Test Size ({Math.round(testSize * 100)}%)</label>
            <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={testSize}
                onChange={handleChange}
                style={{ padding: '4px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999' }}>
                <span>10%</span>
                <span>50%</span>
            </div>
        </div>
    );
}

// --- Specific ML Configurators ---

function LinearRegressionConfigurator({ columns, config, setConfig }) {
    return (
        <>
            <TargetSelector columns={columns} specific={config.specific} setConfig={setConfig} />
            <FeatureSelector columns={columns} specific={config.specific} setConfig={setConfig} />
            <TestSizeInput specific={config.specific} setConfig={setConfig} />
        </>
    );
}

function LogisticRegressionConfigurator({ columns, config, setConfig }) {
    return (
        <>
            <TargetSelector columns={columns} specific={config.specific} setConfig={setConfig} />
            <FeatureSelector columns={columns} specific={config.specific} setConfig={setConfig} />
            <TestSizeInput specific={config.specific} setConfig={setConfig} />
        </>
    );
}

// --- Dynamic Registry ---
const ML_REGISTRY = {
    linear_regression: { name: 'Linear Regression', component: LinearRegressionConfigurator },
    logistic_regression: { name: 'Logistic Regression', component: LogisticRegressionConfigurator },
};

export { ML_REGISTRY };

export default function MLConfigurator({ columns, config, setConfig }) {
    const handleMethodChange = (e) => {
        const newMethod = e.target.value;

        const defaultCol = columns.length > 0 ? columns[columns.length - 1] : '';

        const newSpecific = {
            features: [],
            target: defaultCol,
            test_size: 0.2,
        };

        setConfig(prev => ({
            ...prev,
            ml_method: newMethod,
            specific: newSpecific,
        }));
    };

    const ActiveConfigurator = ML_REGISTRY[config.ml_method]?.component;

    return (
        <div className="card">
            <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    ML Configuration
                </span>
            </h2>

            <div className="form-group">
                <label>ML Method</label>
                <select name="ml_method" value={config.ml_method} onChange={handleMethodChange}>
                    {Object.entries(ML_REGISTRY).map(([key, value]) => (
                        <option key={key} value={key}>{value.name}</option>
                    ))}
                </select>
            </div>

            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>Model Parameters</h3>
            {ActiveConfigurator ? (
                <ActiveConfigurator columns={columns} config={config} setConfig={setConfig} />
            ) : (
                <div style={{ color: '#888', fontSize: '12px' }}>Select a valid ML method.</div>
            )}
        </div>
    );
}
