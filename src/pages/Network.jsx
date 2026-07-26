import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Network as NetworkIcon } from 'lucide-react';

export default function Network() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/analytics/sessions').then(r => { setSessions(r.data.items || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSession) {
      client.get(`/sessions/${selectedSession}/network`).then(r => setEvents(r.data.items || [])).catch(console.error);
    }
  }, [selectedSession]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NetworkIcon size={24} /> Network Traffic Analysis
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
            <thead><tr><th>Time</th><th>Protocol</th><th>Direction</th><th>Source</th><th>Destination</th><th>Bytes Sent</th></tr></thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td><span className={`badge badge-${e.protocol === 'TCP' ? 'info' : e.protocol === 'UDP' ? 'warning' : 'neutral'}`}>{e.protocol}</span></td>
                  <td><span className={`badge badge-${e.direction === 'outbound' ? 'warning' : 'success'}`}>{e.direction}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{e.source_ip}:{e.source_port}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-danger)' }}>{e.destination_ip}:{e.destination_port}</td>
                  <td>{e.bytes_sent > 0 ? `${(e.bytes_sent / 1024).toFixed(1)} KB` : '-'}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>
                {selectedSession ? 'No network events found for this session.' : 'Please select an analysis session to view network activity.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}