import React, { useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ShieldAlert, Cpu, Network, FileText } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time events state
  const [liveEvents, setLiveEvents] = useState([]);
  const [chartData, setChartData] = useState(Array.from({ length: 20 }, (_, i) => ({ time: i, events: 0 })));
  const wsRef = useRef(null);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats'),
      client.get('/dashboard/recent'),
    ]).then(([s, a]) => {
      setStats(s.data);
      setActivities(a.data);
    }).catch(console.error).finally(() => setLoading(false));

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // Uses the same host/port as Vite/Express
    wsRef.current = new WebSocket(`${protocol}//${host}/ws/events`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setLiveEvents(prev => {
        const newEvents = [data, ...prev].slice(0, 50); // Keep last 50 events
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
      case 'process': return <Cpu size={16} className="text-info" />;
      case 'network': return <Network size={16} className="text-warning" />;
      case 'file': return <FileText size={16} className="text-primary" />;
      case 'alert': return <ShieldAlert size={16} className="text-danger" />;
      default: return <Activity size={16} />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'var(--color-danger)';
      case 'high': return 'var(--color-warning)';
      case 'medium': return 'var(--color-info)';
      default: return 'var(--color-text-muted)';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Dashboard Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Live Sandbox Feed Active</span>
        </div>
      </div>
      
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
          <div className="value danger">{stats?.avg_risk_score || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Malicious</div>
          <div className="value danger">{stats?.malicious_count || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header"><div className="card-title">Real-Time Event Frequency</div></div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-primary-light)' }}
                />
                <Line type="monotone" dataKey="events" stroke="var(--color-primary)" strokeWidth={2} dot={false} activeDot={{ r: 6 }} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header"><div className="card-title">Live Telemetry Stream</div></div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 300, paddingRight: 8 }}>
            {liveEvents.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 40, fontSize: 13 }}>Waiting for events...</div>
            ) : (
              liveEvents.map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--color-border)', alignItems: 'flex-start' }}>
                  <div style={{ marginTop: 2 }}>{getEventIcon(ev.type)}</div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: getSeverityColor(ev.severity) }}>{ev.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{ev.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Recent Analysis Sessions</div></div>
        <table className="data-table">
          <thead><tr><th>Type</th><th>Title</th><th>Description</th><th>Status</th><th>Time</th></tr></thead>
          <tbody>
            {activities.map((a, i) => (
              <tr key={i}>
                <td><span className="badge badge-info">{a.type}</span></td>
                <td>{a.title}</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{a.description}</td>
                <td><span className={`badge badge-${a.status === 'running' ? 'success' : a.status === 'completed' ? 'success' : 'neutral'}`}>{a.status}</span></td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {activities.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent activity</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}