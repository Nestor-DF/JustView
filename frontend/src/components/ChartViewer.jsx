import React, { useEffect, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponentPkg from 'react-plotly.js/factory';
const createPlotlyComponent = createPlotlyComponentPkg.default || createPlotlyComponentPkg;
const Plot = createPlotlyComponent(Plotly);

export default function ChartViewer({ config }) {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!config) return;

        let isMounted = true;

        // Slight debounce for fast configuration changes
        const timeoutId = setTimeout(() => {
            fetchChart();
        }, 300);

        const fetchChart = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('http://localhost:8000/api/chart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 422) {
                        throw new Error('Please select the required configuration (dimension, metric) to generate the chart.');
                    }
                    const errorMsg = typeof data.detail === 'string' ? data.detail : 'Failed to generate chart data.';
                    throw new Error(errorMsg);
                }

                if (isMounted) {
                    setChartData(data);
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
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>📊</div>
                    <div style={{ fontSize: '0.95rem' }}>{error}</div>
                </div>
            </div>
        );
    }

    if (loading && !chartData) {
        return (
            <div className="chart-container-wrapper">
                <div style={{ color: '#888' }}>Loading chart...</div>
            </div>
        );
    }

    return (
        <div className="chart-container-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
            {chartData && (
                <Plot
                    data={chartData.data}
                    layout={{
                        ...chartData.layout,
                        autosize: true,
                        margin: { t: 60, l: 60, r: 40, b: 60 },
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { family: 'Inter, sans-serif', color: '#111' }
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ responsive: true, displayModeBar: false }}
                />
            )}
        </div>
    );
}
