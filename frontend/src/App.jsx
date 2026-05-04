import React, { useState } from 'react';
import DataUploader from './components/DataUploader';
import ProcessConfigurator from './components/ProcessConfigurator';
import ChartConfigurator from './components/ChartConfigurator';
import ChartViewer from './components/ChartViewer';
import MLConfigurator from './components/MLConfigurator';
import MLViewer from './components/MLViewer';
import { Eye, Plus, Trash2, Maximize2, Minimize2, Info, FileSpreadsheet, BrainCircuit } from 'lucide-react';

function App() {
    const [file, setFile] = useState(null);
    const [processOptions, setProcessOptions] = useState([]);

    // Multiple Data Sources State
    const [datasets, setDatasets] = useState([]);
    const [activeDatasetId, setActiveDatasetId] = useState(null);
    const [expandedDatasetId, setExpandedDatasetId] = useState(null);

    // Charts State
    const [charts, setCharts] = useState([]);

    // ML Analyses State
    const [mlAnalyses, setMlAnalyses] = useState([]);

    // Unified active panel (chart or ml)
    const [activePanelId, setActivePanelId] = useState(null);
    const [maximizedPanelId, setMaximizedPanelId] = useState(null);

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

    const createDefaultMLConfig = (data) => {
        const defaultTarget = data.columns.length > 0 ? data.columns[data.columns.length - 1] : '';
        return {
            dataset_id: data.dataset_id,
            ml_method: 'linear_regression',
            specific: {
                features: [],
                target: defaultTarget,
                test_size: 0.2,
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
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
            const newChartId = 'chart-' + Date.now().toString();
            setCharts(prev => [
                ...prev,
                {
                    id: newChartId,
                    config: createDefaultChartConfig(data)
                }
            ]);
            setActivePanelId(newChartId);

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

        const newChartId = 'chart-' + Date.now().toString();
        setCharts(prev => [
            ...prev,
            {
                id: newChartId,
                config: createDefaultChartConfig(datasetToUse)
            }
        ]);
        setActivePanelId(newChartId);
    };

    const handleAddML = () => {
        const datasetToUse = datasets.find(d => d.dataset_id === activeDatasetId);
        if (!datasetToUse) return;

        const newMLId = 'ml-' + Date.now().toString();
        setMlAnalyses(prev => [
            ...prev,
            {
                id: newMLId,
                config: createDefaultMLConfig(datasetToUse)
            }
        ]);
        setActivePanelId(newMLId);
    };

    const handleRemoveChart = (id, e) => {
        e.stopPropagation();
        setCharts(prev => {
            const newCharts = prev.filter(c => c.id !== id);
            if (activePanelId === id) {
                const allPanels = [...newCharts, ...mlAnalyses];
                setActivePanelId(allPanels.length > 0 ? allPanels[allPanels.length - 1].id : null);
            }
            if (maximizedPanelId === id) {
                setMaximizedPanelId(null);
            }
            return newCharts;
        });
    };

    const handleRemoveML = (id, e) => {
        e.stopPropagation();
        setMlAnalyses(prev => {
            const newML = prev.filter(m => m.id !== id);
            if (activePanelId === id) {
                const allPanels = [...charts, ...newML];
                setActivePanelId(allPanels.length > 0 ? allPanels[allPanels.length - 1].id : null);
            }
            if (maximizedPanelId === id) {
                setMaximizedPanelId(null);
            }
            return newML;
        });
    };

    const updateChartConfig = (newConfigFn) => {
        setCharts(prev => prev.map(chart => {
            if (chart.id === activePanelId) {
                const newConfig = typeof newConfigFn === 'function' ? newConfigFn(chart.config) : newConfigFn;
                return { ...chart, config: newConfig };
            }
            return chart;
        }));
    };

    const updateMLConfig = (newConfigFn) => {
        setMlAnalyses(prev => prev.map(ml => {
            if (ml.id === activePanelId) {
                const newConfig = typeof newConfigFn === 'function' ? newConfigFn(ml.config) : newConfigFn;
                return { ...ml, config: newConfig };
            }
            return ml;
        }));
    };

    const handleRemoveDataset = (id, e) => {
        e.stopPropagation();
        
        setDatasets(prev => {
            const newDatasets = prev.filter(d => d.dataset_id !== id);
            if (activeDatasetId === id) {
                setActiveDatasetId(newDatasets.length > 0 ? newDatasets[newDatasets.length - 1].dataset_id : null);
            }
            if (expandedDatasetId === id) {
                setExpandedDatasetId(null);
            }
            return newDatasets;
        });

        setCharts(prev => {
            const newCharts = prev.filter(c => c.config.dataset_id !== id);
            return newCharts;
        });

        setMlAnalyses(prev => {
            const newML = prev.filter(m => m.config.dataset_id !== id);
            return newML;
        });

        // Fix active panel if removed
        setCharts(prevCharts => {
            setMlAnalyses(prevML => {
                const remainingCharts = prevCharts.filter(c => c.config.dataset_id !== id);
                const remainingML = prevML.filter(m => m.config.dataset_id !== id);
                const allRemaining = [...remainingCharts, ...remainingML];
                if (activePanelId && !allRemaining.find(p => p.id === activePanelId)) {
                    setActivePanelId(allRemaining.length > 0 ? allRemaining[allRemaining.length - 1].id : null);
                }
                if (maximizedPanelId && !allRemaining.find(p => p.id === maximizedPanelId)) {
                    setMaximizedPanelId(null);
                }
                return remainingML;
            });
            return prevCharts.filter(c => c.config.dataset_id !== id);
        });
    };

    // Determine what's active
    const activeChart = charts.find(c => c.id === activePanelId);
    const activeML = mlAnalyses.find(m => m.id === activePanelId);
    const activePanelDataset = activeChart
        ? datasets.find(d => d.dataset_id === activeChart.config.dataset_id)
        : activeML
            ? datasets.find(d => d.dataset_id === activeML.config.dataset_id)
            : null;

    // All panels for the grid
    const allPanels = [
        ...charts.map(c => ({ ...c, type: 'chart' })),
        ...mlAnalyses.map(m => ({ ...m, type: 'ml' })),
    ];

    const totalCharts = charts.length;
    const totalML = mlAnalyses.length;

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
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <Info
                                                    size={15}
                                                    className="action-icon"
                                                    onClick={(e) => { e.stopPropagation(); setExpandedDatasetId(prev => prev === dataset.dataset_id ? null : dataset.dataset_id); }}
                                                    title="View Columns"
                                                />
                                                <Trash2
                                                    size={15}
                                                    className="delete-icon"
                                                    onClick={(e) => handleRemoveDataset(dataset.dataset_id, e)}
                                                    title="Remove Data Source"
                                                />
                                            </div>
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

                        {/* Charts Section */}
                        <div className="card" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px' }}>Charts ({totalCharts})</h3>
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
                                    {charts.map((chart) => {
                                        const ds = datasets.find(d => d.dataset_id === chart.config.dataset_id);
                                        return (
                                            <li
                                                key={chart.id}
                                                className={chart.id === activePanelId ? 'active' : ''}
                                                onClick={() => setActivePanelId(chart.id)}
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

                        {/* ML Analyses Section */}
                        <div className="card" style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ML Analyses ({totalML})
                                </h3>
                                <button className="icon-button" onClick={handleAddML} title="Add ML Analysis using active Data Source" style={{ padding: '4px', display: 'flex' }}>
                                    <Plus size={16} />
                                </button>
                            </div>

                            {mlAnalyses.length === 0 ? (
                                <div style={{ fontSize: '12px', color: '#888', textAlign: 'center', padding: '10px 0' }}>
                                    No ML analyses. Select a data source and add one!
                                </div>
                            ) : (
                                <ul className="chart-list">
                                    {mlAnalyses.map((ml) => {
                                        const ds = datasets.find(d => d.dataset_id === ml.config.dataset_id);
                                        const methodLabel = ml.config.ml_method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                        return (
                                            <li
                                                key={ml.id}
                                                className={ml.id === activePanelId ? 'active' : ''}
                                                onClick={() => setActivePanelId(ml.id)}
                                            >
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }} title={ds ? ds.filename : 'Unknown'}>
                                                    <BrainCircuit size={13} style={{ opacity: 0.7, flexShrink: 0 }} />
                                                    {methodLabel} - {ds ? ds.filename : '?'}
                                                </span>
                                                <Trash2
                                                    size={14}
                                                    className="delete-icon"
                                                    onClick={(e) => handleRemoveML(ml.id, e)}
                                                />
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Configurator: Chart or ML depending on active panel */}
                        {activeChart && activePanelDataset && (
                            <ChartConfigurator
                                columns={activePanelDataset.columns}
                                config={activeChart.config}
                                setConfig={updateChartConfig}
                            />
                        )}

                        {activeML && activePanelDataset && (
                            <MLConfigurator
                                columns={activePanelDataset.columns}
                                config={activeML.config}
                                setConfig={updateMLConfig}
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
                ) : allPanels.length === 0 ? (
                    <div className="chart-container-wrapper" style={{ background: 'transparent', border: 'none', boxShadow: 'none', flex: 1 }}>
                        <div style={{ textAlign: 'center', color: '#888' }}>
                            <p>No charts or analyses to display. Select a data source and add one from the sidebar.</p>
                        </div>
                    </div>
                ) : (
                    <div className="charts-grid">
                        {allPanels.map((panel) => {
                            const isMaximized = panel.id === maximizedPanelId;
                            return (
                                <div
                                    key={panel.id}
                                    className={`chart-wrapper ${panel.id === activePanelId ? 'active-chart' : ''} ${isMaximized ? 'maximized' : ''}`}
                                    onClick={() => setActivePanelId(panel.id)}
                                    onDoubleClick={() => setMaximizedPanelId(isMaximized ? null : panel.id)}
                                >
                                    <div className="maximize-btn" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                                        <button
                                            className="icon-button"
                                            onClick={(e) => { e.stopPropagation(); setMaximizedPanelId(isMaximized ? null : panel.id); }}
                                            title={isMaximized ? "Minimize" : "Maximize"}
                                        >
                                            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        </button>
                                    </div>
                                    {panel.type === 'chart' ? (
                                        <ChartViewer config={panel.config} />
                                    ) : (
                                        <MLViewer config={panel.config} />
                                    )}
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
