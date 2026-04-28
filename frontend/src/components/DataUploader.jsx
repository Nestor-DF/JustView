import React, { useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

export default function DataUploader({ file, setFile }) {
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFile(e.dataTransfer.files[0]);
        }
    }, [setFile]);

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '16px', marginBottom: '15px' }}>Upload data source</h2>
            <div
                className={`dropzone ${file ? 'active' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
            >
                <UploadCloud size={32} style={{ marginBottom: '10px' }} />
                {file ? (
                    <p style={{ margin: 0, fontWeight: 500, color: '#111' }}>{file.name}</p>
                ) : (
                    <p style={{ margin: 0 }}>Click or drag file to upload (.csv, .xlsx)</p>
                )}
                <input
                    id="file-upload"
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    style={{ display: 'none' }}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
}
