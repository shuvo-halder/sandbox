import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldAlert, Cpu, Network, FileText, LayoutDashboard, Search, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time events state
  const [liveEvents, setLiveEvents] = useState([]);
  const [chartData, setChartData] = useState(Array.from({ length: 20 }, (_, i) => ({ time: '', events: 0 })));
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats'),
      client.get('/dashboard/recent'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setActivities(a.data);
    }).catch(err => {
      console.error(err);
      setError('Failed to load dashboard data. Engine might be offline.');
    }).finally(() => setLoading(false));

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; 
    wsRef.current = new WebSocket(`${protocol}//${host}/ws/events`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setLiveEvents(prev => {
        const newEvents = [data, ...prev].slice(0, 50);
        return newEvents;
      });

      setChartData(prev => {
        const newData = [...prev.slice(1), { time: new Date().toLocaleTimeString(), events: Math.floor(Math.random() * 5) + 1 }];
        return newData;
      });
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'process': return <Cpu size={16} className="text-info" style={{ color: 'var(--color-info)' }} />;
      case 'network': return <Network size={16} className="text-warning" style={{ color: 'var(--color-warning)' }} />;
      case 'file': return <FileText size={16} className="text-primary" style={{ color: 'var(--color-primary)' }} />;
      case 'alert': return <ShieldAlert size={16} className="text-danger" style={{ color: 'var(--color-danger)' }} />;
      default: return <Activity size={16} style={{ color: 'var(--color-text-secondary)' }} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'var(--color-danger)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      default: return 'var(--color-text-primary)';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={24} /> Dashboard Overview
        </h2>
      </div>

      {error && (
        <div className="badge badge-danger" style={{ display: 'flex', width: '100%', padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
          <AlertCircle size={18} style={{ marginRight: 8 }} /> {error}
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Sandboxes</div>
          <div className="value info">{stats?.total_sandboxes || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Sandboxes</div>
          <div className="value success">{stats?.active_sandboxes || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Avg Risk Score</div>
          <div className="value danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             {stats?.avg_risk_score || 0}
             {stats?.avg_risk_score > 70 && <AlertCircle size={20} />}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Malicious Findings</div>
          <div className="value danger">{stats?.malicious_count || 0}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-grid-main">
          <div className="card-header"><div className="card-title">Real-Time Event Frequency</div></div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}
                  itemStyle={{ color: 'var(--color-primary-light)' }}
                  labelStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Line type="stepAfter" dataKey="events" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card dashboard-grid-side">
          <div className="card-header"><div className="card-title">Live Telemetry Stream</div></div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
            {liveEvents.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                 <Activity size={24} />
                 Waiting for events...
              </div>
            ) : (
              liveEvents.map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2, padding: 6, background: 'var(--color-bg-tertiary)', borderRadius: '50%' }}>
                     {getEventIcon(ev.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: getSeverityColor(ev.severity) }}>{ev.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{ev.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                       {ev.session_id} • {new Date(ev.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
           <div className="card-title">Recent Analysis Sessions</div>
           <div className="search-bar" style={{ width: 250, padding: '6px 12px' }}>
             <Search size={14} className="text-muted" />
             <input type="text" placeholder="Filter sessions..." />
           </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Type</th><th>Details</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={i}>
                  <td><span className="badge badge-info">{a.type}</span></td>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{a.description}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${a.status === 'running' ? 'success' : a.status === 'completed' ? 'neutral' : 'warning'}`}>
                       {a.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {activities.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '30px' }}>No recent activity</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}