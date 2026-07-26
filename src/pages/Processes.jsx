import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Cpu } from 'lucide-react';

export default function Processes() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/analytics/sessions').then(r => {
      setSessions(r.data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSession) {
      client.get(`/sessions/${selectedSession}/processes`).then(r => setProcesses(r.data.items || [])).catch(() => setProcesses([]));
    } else {
      setProcesses([]);
    }
  }, [selectedSession]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={24} /> Process Execution Tree
        </h2>
        <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)}
          style={{ padding: '8px 16px', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', outline: 'none' }}>
          <option value="">Select a session...</option>
          {sessions.map(s => <option key={s.id} value={s.id}>{s.sample_name || s.id.slice(0, 8)} ({s.status})</option>)}
        </select>
      </div>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Time</th><th>Event</th><th>PID</th><th>PPID</th><th>Image Name</th><th>CPU</th><th>Memory</th></tr></thead>
            <tbody>
              {processes.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{new Date(p.timestamp).toLocaleTimeString()}</td>
                  <td><span className={`badge badge-${p.event_type === 'create' ? 'info' : 'danger'}`} style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>{p.event_type}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{p.pid}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-muted)' }}>{p.ppid}</td>
                  <td style={{ fontWeight: 500 }}>{p.process_name}</td>
                  <td>{p.cpu_usage?.toFixed(1)}%</td>
                  <td>{(p.memory_usage / 1024).toFixed(1)} MB</td>
                </tr>
              ))}
              {processes.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                {selectedSession ? 'No process events found for this session.' : 'Please select an analysis session to view the process tree.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}