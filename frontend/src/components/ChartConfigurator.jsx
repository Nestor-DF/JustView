import React from 'react';

// --- Shared Atomic Components ---
function DimensionField({ label = "Dimension", columns, specific, setConfig }) {
    const handleChange = (e) => {
        const { value } = e.target;
        setConfig(prev => ({ ...prev, specific: { ...prev.specific, dimension: value } }));
    };

    return (
        <div className="form-group">
            <label>{label}</label>
            <select name="dimension" value={specific.dimension || ''} onChange={handleChange}>
                <option value="">Select an option...</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
        </div>
    );
}

function MetricField({ label = "Metric", columns, specific, setConfig }) {
    const metric = specific.metric || { aggregation: 'sum', column: '' };

    const handleAggChange = (e) => {
        const value = e.target.value;
        setConfig(prev => {
            const currentMetric = prev.specific.metric || { column: '' };
            return {
                ...prev,
                specific: {
                    ...prev.specific,
                    metric: { ...currentMetric, aggregation: value }
                }
            };
        });
    };

    const handleColChange = (e) => {
        const value = e.target.value;
        setConfig(prev => {
            const currentMetric = prev.specific.metric || { aggregation: 'sum' };
            return {
                ...prev,
                specific: {
                    ...prev.specific,
                    metric: { ...currentMetric, column: value }
                }
            };
        });
    };

    return (
        <div className="form-group">
            <label>{label}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{ flex: '1' }} value={metric.aggregation || 'sum'} onChange={handleAggChange}>
                    <option value="sum">SUM</option>
                    <option value="mean">AVG</option>
                    <option value="count">COUNT</option>
                    <option value="min">MIN</option>
                    <option value="max">MAX</option>
                </select>
                <select style={{ flex: '2' }} value={metric.column || ''} onChange={handleColChange}>
                    {metric.aggregation === 'count' && <option value="*">* (All Rows)</option>}
                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
            </div>
        </div>
    );
}

function CommonConfigurator({ config, setConfig }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, common: { ...prev.common, [name]: value } }));
    };

    return (
        <div className="form-group">
            <label>Row Limit</label>
            <input
                type="number"
                name="limit"
                value={config.common?.limit || 100}
                onChange={handleChange}
                min="1"
            />
        </div>
    );
}

// --- Specific Chart Configurators ---

function BarConfigurator({ columns, config, setConfig }) {
    return (
        <>
            <DimensionField label="X-Axis (Dimension)" columns={columns} specific={config.specific} setConfig={setConfig} />
            <MetricField label="Y-Axis (Metric)" columns={columns} specific={config.specific} setConfig={setConfig} />
        </>
    );
}

function LineConfigurator({ columns, config, setConfig }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, specific: { ...prev.specific, [name]: value } }));
    };

    return (
        <>
            <DimensionField label="X-Axis (Dimension)" columns={columns} specific={config.specific} setConfig={setConfig} />
            <MetricField label="Y-Axis (Metric)" columns={columns} specific={config.specific} setConfig={setConfig} />
            <div className="form-group">
                <label>Time Granularity</label>
                <select name="time_granularity" value={config.specific?.time_granularity || 'none'} onChange={handleChange}>
                    <option value="none">None (Raw/Default)</option>
                    <option value="day">Daily</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                </select>
            </div>
        </>
    );
}

function PieConfigurator({ columns, config, setConfig }) {
    return (
        <>
            <DimensionField label="Category (Dimension)" columns={columns} specific={config.specific} setConfig={setConfig} />
            <MetricField label="Value (Metric)" columns={columns} specific={config.specific} setConfig={setConfig} />
        </>
    );
}

// --- Dynamic Registry ---
const CHART_REGISTRY = {
    bar: { name: 'Bar Chart', component: BarConfigurator },
    line: { name: 'Line Chart', component: LineConfigurator },
    pie: { name: 'Pie Chart', component: PieConfigurator },
};

export default function ChartConfigurator({ columns, config, setConfig }) {
    const handleTypeChange = (e) => {
        const newType = e.target.value;

        // Generate default specific config based on type
        const defaultCol1 = columns.length > 0 ? columns[0] : '';
        const defaultCol2 = columns.length > 0 ? columns[columns.length - 1] : '';

        let newSpecific = {
            dimension: defaultCol1,
            metric: { aggregation: 'sum', column: defaultCol2 }
        };
        
        if (newType === 'line') {
            newSpecific.time_granularity = 'none';
        }

        setConfig(prev => ({
            ...prev,
            chart_type: newType,
            specific: newSpecific
        }));
    };

    const ActiveConfigurator = CHART_REGISTRY[config.chart_type]?.component;

    return (
        <div className="card">
            <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>Chart Configuration</h2>

            <div className="form-group">
                <label>Visualization Type</label>
                <select name="chart_type" value={config.chart_type} onChange={handleTypeChange}>
                    {Object.entries(CHART_REGISTRY).map(([key, value]) => (
                        <option key={key} value={key}>{value.name}</option>
                    ))}
                </select>
            </div>

            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>Specific Configuration</h3>
            {ActiveConfigurator ? (
                <ActiveConfigurator columns={columns} config={config} setConfig={setConfig} />
            ) : (
                <div style={{ color: '#888', fontSize: '12px' }}>Select a valid chart type.</div>
            )}

            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

            <h3 style={{ fontSize: '13px', marginBottom: '10px', color: '#666' }}>Common Configuration</h3>
            <CommonConfigurator config={config} setConfig={setConfig} />
        </div>
    );
}
