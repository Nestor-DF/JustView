import React from 'react';

export default function ProcessConfigurator({ options, setOptions }) {
    const processors = [
        { id: 'nulls', label: 'Drop Null Values', desc: 'Remove rows with missing data' },
        { id: 'duplicates', label: 'Remove Duplicates', desc: 'Drop exact duplicate rows' },
        { id: 'outliers', label: 'Remove Outliers', desc: 'Filter extreme values (IQR)' }
    ];

    const toggleOption = (id) => {
        if (options.includes(id)) {
            setOptions(options.filter(o => o !== id));
        } else {
            setOptions([...options, id]);
        }
    };

    return (
        <div className="card" style={{ marginTop: '15px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '10px' }}>Data Cleaning</h2>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                Select strategies to clean your data before visualization.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {processors.map(p => (
                    <div key={p.id} className="checkbox-group">
                        <input
                            type="checkbox"
                            id={p.id}
                            checked={options.includes(p.id)}
                            onChange={() => toggleOption(p.id)}
                        />
                        <label htmlFor={p.id} style={{ margin: 0, fontSize: '14px', cursor: 'pointer' }}>
                            {p.label}
                            <span style={{ display: 'block', fontSize: '11px', color: '#888', fontWeight: 400 }}>{p.desc}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
