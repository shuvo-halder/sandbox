import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Play, Square, Box, RefreshCw } from 'lucide-react';

export default function SandboxPage() {
  const [sandboxes, setSandboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchSandboxes = () => {
    setLoading(true);
    setError(null);
    client.get('/sandboxes')
      .then(r => setSandboxes(r.data.items || []))
      .catch(err => {
        console.error(err);
        setError('Failed to load sandboxes.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSandboxes();
  }, []);

  const toggleSandbox = async (id, currentStatus) => {
    setActionLoading(id);
    const action = currentStatus === 'running' ? 'stop' : 'start';
    try {
      await client.post(`/sandboxes/${id}/${action}`);
      const r = await client.get('/sandboxes');
      setSandboxes(r.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && sandboxes.length === 0 && !error) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2><Box size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }}/> Sandbox Environments</h2>
        <button className="btn btn-secondary" onClick={fetchSandboxes} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', width: '100%', padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
           {error}
        </div>
      )}
      
      <div className="card">
        <table className="data-table">
          <thead><tr><th>Environment Name</th><th>Status</th><th>OS Image</th><th>CPU</th><th>Memory</th><th>Network</th><th>Actions</th></tr></thead>
          <tbody>
            {sandboxes.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{s.name}</td>
                <td>
                  <span className={`badge badge-${s.status === 'running' ? 'success' : s.status === 'stopped' ? 'neutral' : 'warning'}`}>
                    <span style={{ 
                       display: 'inline-block', 
                       width: 6, height: 6, borderRadius: '50%', 
                       backgroundColor: 'currentColor', 
                       marginRight: 6 
                    }}/>
                    {s.status}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{s.os_image}</td>
                <td>{s.cpu_limit} vCPUs</td>
                <td>{s.memory_limit} MB</td>
                <td><span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>{s.network_mode}</span></td>
                <td>
                  <button 
                    className={`btn ${s.status === 'running' ? 'btn-danger' : 'btn-primary'}`} 
                    onClick={() => toggleSandbox(s.id, s.status)}
                    disabled={actionLoading === s.id}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    {actionLoading === s.id ? (
                       <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : s.status === 'running' ? (
                       <><Square size={14} fill="currentColor" /> Stop</>
                    ) : (
                       <><Play size={14} fill="currentColor" /> Start</>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {sandboxes.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px' }}>No sandboxes provisioned.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}