import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { FileText, Download, FileJson, FileIcon } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/reports').then(r => setReports(r.data.items || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const generateReport = async (sessionId, format) => {
    await client.post('/reports/generate', { session_id: sessionId, format });
    const r = await client.get('/reports');
    setReports(r.data.items || []);
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} /> Intelligence Reports
        </h2>
      </div>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Report ID</th><th>Session</th><th>Format</th><th>Size</th><th>Generated At</th><th>Actions</th></tr></thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-primary-light)' }}>{r.id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{r.session_id}</td>
                  <td>
                    <span className={`badge badge-${r.format === 'json' ? 'info' : r.format === 'pdf' ? 'danger' : 'success'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                       {r.format === 'json' ? <FileJson size={12} /> : <FileIcon size={12} />}
                       {r.format.toUpperCase()}
                    </span>
                  </td>
                  <td>{(r.file_size / 1024).toFixed(1)} KB</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <a 
                      href={`/api/v1/reports/${r.id}/download`} 
                      className="btn btn-secondary btn-icon-text" 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      <Download size={14} /> Download
                    </a>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>No intelligence reports generated yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}