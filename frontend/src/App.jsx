import React, { useState } from 'react';
import DataUploader from './components/DataUploader';
import ProcessConfigurator from './components/ProcessConfigurator';
import ChartConfigurator from './components/ChartConfigurator';
import ChartViewer from './components/ChartViewer';
import { Eye, Plus, Trash2, Maximize2, Minimize2, Info, FileSpreadsheet } from 'lucide-react';

function App() {
    const [file, setFile] = useState(null);
    const [processOptions, setProcessOptions] = useState([]);

    // Multiple Data Sources State
    const [datasets, setDatasets] = useState([]);
    const [activeDatasetId, setActiveDatasetId] = useState(null);
    const [expandedDatasetId, setExpandedDatasetId] = useState(null);

    // Charts State
    const [charts, setCharts] = useState([]);
    const [activeChartId, setActiveChartId] = useState(null);
    const [maximizedChartId, setMaximizedChartId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const createDefaultChartConfig = (data) => {
        const defaultCol1 = data.columns.length > 0 ? data.columns[0] : '';
        const defaultCol2 = data.columns.length > 0 ? data.columns[data.columns.length - 1] : '';
        return {
            dataset_id: data.dataset_id,
            chart_type: 'bar',
            common: { limit: 100 },
            specific: {
                dimension: defaultCol1,
                metric: { aggregation: 'sum', column: defaultCol2 }
            }
        };
    };

    const handleUploadAndProcess = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('process_options', JSON.stringify(processOptions));

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed');
            }

            // Store new dataset
            setDatasets(prev => [...prev, data]);
            setActiveDatasetId(data.dataset_id);

            // Add a default chart for the newly uploaded dataset
            const newChartId = Date.now().toString();
            setCharts(prev => [
                ...prev,
                {
                    id: newChartId,
                    config: createDefaultChartConfig(data)
                }
            ]);
            setActiveChartId(newChartId);

            // Reset upload form
            setFile(null);
            setProcessOptions([]);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddChart = () => {
        const datasetToUse = datasets.find(d => d.dataset_id === activeDatasetId);
        if (!datasetToUse) return;

        const newChartId = Date.now().toString();
        setCharts(prev => [
            ...prev,
            {
                id: newChartId,
                config: createDefaultChartConfig(datasetToUse)
            }
        ]);
        setActiveChartId(newChartId);
    };

    const handleRemoveChart = (id, e) => {
        e.stopPropagation();
        setCharts(prev => {
            const newCharts = prev.filter(c => c.id !== id);
            if (activeChartId === id) {
                setActiveChartId(newCharts.length > 0 ? newCharts[newCharts.length - 1].id : null);
            }
            if (maximizedChartId === id) {
                setMaximizedChartId(null);
            }
            return newCharts;
        });
    };

    const updateChartConfig = (newConfigFn) => {
        setCharts(prev => prev.map(chart => {
            if (chart.id === activeChartId) {
                const newConfig = typeof newConfigFn === 'function' ? newConfigFn(chart.config) : newConfigFn;
                return { ...chart, config: newConfig };
            }
            return chart;
        }));
    };

    const handleReset = () => {
        setFile(null);
        setProcessOptions([]);
        setDatasets([]);
        setActiveDatasetId(null);
        setExpandedDatasetId(null);
        setCharts([]);
        setActiveChartId(null);
        setMaximizedChartId(null);
        setError('');
    };

    const activeChart = charts.find(c => c.id === activeChartId);
    const activeChartDataset = activeChart ? datasets.find(d => d.dataset_id === activeChart.config.dataset_id) : null;

    return (
        <div className="app-container">
            <div className="sidebar">
                <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Eye size={28} />
                    <h1>JustView</h1>
                </div>

                {error && <div style={{ color: 'red', fontSize: '13px', marginBottom: '15px' }}>{error}</div>}

                {/* Always show uploader */}
                <DataUploader file={file} setFile={setFile} />
                {file && (
                    <>
                        <ProcessConfigurator options={processOptions} setOptions={setProcessOptions} />
                        <button
                            onClick={handleUploadAndProcess}
                            disabled={loading}
                            style={{ width: '100%', marginTop: '20px' }}>
                            {loading ? 'Processing...' : 'Load & Process Data'}
                        </button>
                    </>
                )}


                {datasets.length > 0 && (
                    <>
                        <div className="card" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px' }}>Data Sources ({datasets.length})</h3>
                                <button className="secondary" onClick={handleReset} style={{ fontSize: '11px', padding: '4px 8px' }}>
                                    Clear All
                                </button>
                            </div>

                            <ul className="chart-list">
                                {datasets.map(dataset => (
                                    <li
                                        key={dataset.dataset_id}
                                        className={dataset.dataset_id === activeDatasetId ? 'active' : ''}
                                        style={{ flexDirection: 'column', alignItems: 'stretch' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <span
                                                onClick={() => setActiveDatasetId(dataset.dataset_id)}
                                                style={{ flex: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                title={dataset.filename}
                                            >
                                                <FileSpreadsheet size={14} style={{ marginRight: '6px', verticalAlign: 'middle', opacity: 0.8 }} />
                                                {dataset.filename}
                                            </span>
                                            <Info
                                                size={15}
                                                className="action-icon"
                                                onClick={(e) => { e.stopPropagation(); setExpandedDatasetId(prev => prev === dataset.dataset_id ? null : dataset.dataset_id); }}
                                                title="View Columns"
                                            />
                                        </div>
                                        {expandedDatasetId === dataset.dataset_id && (
                                            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(128,128,128,0.2)', width: '100%', fontSize: '11px', color: dataset.dataset_id === activeDatasetId ? '#ddd' : '#666', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                                                <div style={{ marginBottom: '4px' }}><strong>Rows:</strong> {dataset.num_rows}</div>
                                                <div><strong>Columns ({dataset.columns.length}):</strong></div>
                                                <div style={{ maxHeight: '100px', overflowY: 'auto', background: dataset.dataset_id === activeDatasetId ? 'rgba(0,0,0,0.2)' : '#eee', padding: '4px', borderRadius: '4px', marginTop: '4px' }}>
                                                    {dataset.columns.join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px' }}>Charts ({charts.length})</h3>
                                <button className="icon-button" onClick={handleAddChart} title="Add Chart using active Data Source" style={{ padding: '4px', display: 'flex' }}>
                                    <Plus size={16} />
                                </button>
                            </div>

                            {charts.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '10px 0' }}>
                                    No charts. Select a data source and add one!
                                </div>
                            ) : (
                                <ul className="chart-list">
                                    {charts.map((chart, index) => {
                                        const ds = datasets.find(d => d.dataset_id === chart.config.dataset_id);
                                        return (
                                            <li
                                                key={chart.id}
                                                className={chart.id === activeChartId ? 'active' : ''}
                                                onClick={() => setActiveChartId(chart.id)}
                                            >
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ds ? ds.filename : 'Unknown'}>
                                                    {chart.config.chart_type.toUpperCase()} - {ds ? ds.filename : '?'}
                                                </span>
                                                <Trash2
                                                    size={14}
                                                    className="delete-icon"
                                                    onClick={(e) => handleRemoveChart(chart.id, e)}
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {activeChart && activeChartDataset && (
                            <ChartConfigurator
                                columns={activeChartDataset.columns}
                                config={activeChart.config}
                                setConfig={updateChartConfig}
                            />
                        )}
                    </>
                )}
            </div>

            <div className="main-content">
                {datasets.length === 0 ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <Eye size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h2>Welcome to JustView</h2>
                            <p>Upload a CSV or Excel file to get started.</p>
                        </div>
                    </div>
                ) : charts.length === 0 ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <p>No charts to display. Select a data source and add a chart from the sidebar.</p>
                        </div>
                    </div>
                ) : (
                    <div className="charts-grid">
                        {charts.map((chart) => {
                            const isMaximized = chart.id === maximizedChartId;
                            return (
                                <div
                                    key={chart.id}
                                    className={`chart-wrapper ${chart.id === activeChartId ? 'active-chart' : ''} ${isMaximized ? 'maximized' : ''}`}
                                    onClick={() => setActiveChartId(chart.id)}
                                    onDoubleClick={() => setMaximizedChartId(isMaximized ? null : chart.id)}
                                >
                                    <div className="maximize-btn" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                        <button
                                            className="icon-button"
                                            onClick={(e) => { e.stopPropagation(); setMaximizedChartId(isMaximized ? null : chart.id); }}
                                            title={isMaximized ? "Minimize" : "Maximize"}
                                        >
                                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        </button>
                                    </div>
                                    <ChartViewer config={chart.config} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
