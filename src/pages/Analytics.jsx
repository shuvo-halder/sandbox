import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Activity, ShieldAlert } from 'lucide-react';

export default function Analytics() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [riskData, setRiskData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/analytics/sessions').then(r => { setSessions(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSession) {
      Promise.all([
        client.get(`/analytics/risk/${selectedSession}`),
        client.get(`/analytics/summary/${selectedSession}`),
      ]).then(([r, s]) => { setRiskData(r.data); setSummary(s.data); }).catch(() => { setRiskData(null); setSummary(null); });
    } else {
      setRiskData(null);
      setSummary(null);
    }
  }, [selectedSession]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const getRiskClass = (score) => score >= 66 ? 'risk-high' : score >= 33 ? 'risk-medium' : 'risk-low';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} /> Behavioral Analytics
        </h2>
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
          style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', outline: 'none' }}>
          <option value="">Select a session...</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.sample_name || s.id.slice(0, 8)} ({s.status})</option>)}
        </select>
      </div>

      {selectedSession && riskData && (
        <>
          <div className="stats-grid">
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="label">Risk Score</div>
              <div className={`risk-score ${getRiskClass(riskData.score)}`} style={{ margin: '12px auto', width: 72, height: 72, fontSize: 20 }}>
                {riskData.score}
              </div>
              <div className="badge badge-danger" style={{ textTransform: 'uppercase' }}>{riskData.classification}</div>
            </div>
            {summary && (
              <>
                <div className="stat-card">
                  <div className="label">File Events</div>
                  <div className="value info">{summary.total_file_events}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{summary.suspicious_files} suspicious</div>
                </div>
                <div className="stat-card">
                  <div className="label">Process Events</div>
                  <div className="value info">{summary.total_process_events}</div>
                </div>
                <div className="stat-card">
                  <div className="label">Network Events</div>
                  <div className="value info">{summary.total_network_events}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-danger)' }}>{summary.suspicious_network} suspicious</div>
                </div>
              </>
            )}
          </div>

          <div className="dashboard-grid">
            {summary && summary.findings && summary.findings.length > 0 && (
              <div className="card dashboard-grid-main">
                <div className="card-header"><div className="card-title">Detection Findings</div></div>
                {summary.findings.map((f, i) => (
                  <div key={i} style={{ padding: '16px 0', borderBottom: i === summary.findings.length - 1 ? 'none' : '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge badge-${f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}`}>{f.severity}</span>
                      <span className="badge badge-neutral">{f.category}</span>
                      <strong>{f.title}</strong>
                    </div>
                    <p style={{ marginTop: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>{f.description}</p>
                  </div>
                ))}
              </div>
            )}
            
            {summary && summary.summary && (
              <div className="card dashboard-grid-side">
                <div className="card-header"><div className="card-title">Analyst Summary</div></div>
                <p style={{ color: 'var(--color-text-primary)', fontSize: 14, lineHeight: 1.6 }}>{summary.summary}</p>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedSession && (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ShieldAlert size={48} style={{ opacity: 0.5 }} />
          <div>Select an analysis session to view risk analysis and findings.</div>
        </div>
      )}
    </div>
  );
}