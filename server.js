import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Create HTTP server to attach both Express and WebSocket
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/events' });

  app.use(cors());
  app.use(express.json());

  // API v1 routes
  const router = express.Router();


  // In-memory data store for sandbox platform
  const sandboxes = [
    { id: 'sb-1', name: 'Win11-Sandbox-01', status: 'running', os_image: 'windows-11-22h2', cpu_limit: 4, memory_limit: 8192, network_mode: 'isolated' },
    { id: 'sb-2', name: 'Win10-Sandbox-02', status: 'stopped', os_image: 'windows-10-21h2', cpu_limit: 2, memory_limit: 4096, network_mode: 'host-only' },
    { id: 'sb-3', name: 'Ubuntu-Sandbox-01', status: 'running', os_image: 'ubuntu-22.04-lts', cpu_limit: 2, memory_limit: 4096, network_mode: 'isolated' }
  ];

  let reports = [
    { id: 'rep-001', session_id: 'sess-101', format: 'pdf', file_size: 245000, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'rep-002', session_id: 'sess-102', format: 'json', file_size: 89000, created_at: new Date(Date.now() - 7200000).toISOString() }
  ];

  const sessions = [
    { id: 'sess-101', sample_name: 'Trojan.Win32.Agent.exe', status: 'completed' },
    { id: 'sess-102', sample_name: 'Ransomware.WannaCry.sample', status: 'completed' },
    { id: 'sess-103', sample_name: 'Stealer.Info.py', status: 'running' }
  ];

  // Auth endpoints
  router.post('/auth/login', (req, res) => {
    res.json({ access_token: 'mock-jwt-token-access', refresh_token: 'mock-jwt-token-refresh' });
  });

  router.get('/auth/me', (req, res) => {
    res.json({ id: 'usr-1', username: 'sec_analyst', email: 'analyst@mbs.io', role: 'Security Analyst' });
  });

  // Dashboard endpoints
  router.get('/dashboard/stats', (req, res) => {
    res.json({
      total_sandboxes: sandboxes.length,
      active_sandboxes: sandboxes.filter(s => s.status === 'running').length,
      total_sessions: sessions.length,
      avg_risk_score: 78,
      malicious_count: 5,
      suspicious_count: 4,
      benign_count: 3,
      total_reports: reports.length
    });
  });

  router.get('/dashboard/recent', (req, res) => {
    res.json([
      { type: 'Sandbox', title: 'Win11-Sandbox-01 Started', description: 'Execution environment ready for sample Trojan.Win32.Agent.exe', status: 'running', created_at: new Date(Date.now() - 1200000).toISOString() },
      { type: 'Analysis', title: 'Session sess-101 Completed', description: 'Risk score calculated: 85 (Malicious)', status: 'completed', created_at: new Date(Date.now() - 3600000).toISOString() },
      { type: 'Network', title: 'Suspicious Traffic Detected', description: 'Outbound connection to 185.220.101.5:443 flagged', status: 'warning', created_at: new Date(Date.now() - 5400000).toISOString() }
    ]);
  });

  // Sandbox endpoints
  router.get('/sandboxes', (req, res) => {
    res.json({ items: sandboxes });
  });

  router.post('/sandboxes/:id/start', (req, res) => {
    const sb = sandboxes.find(s => s.id === req.params.id);
    if (sb) sb.status = 'running';
    res.json(sb || { success: true });
  });

  router.post('/sandboxes/:id/stop', (req, res) => {
    const sb = sandboxes.find(s => s.id === req.params.id);
    if (sb) sb.status = 'stopped';
    res.json(sb || { success: true });
  });

  // Analytics & Sessions endpoints
  router.get('/analytics/sessions', (req, res) => {
    res.json({ items: sessions });
  });

  router.get('/sessions/:id/processes', (req, res) => {
    res.json({
      items: [
        { timestamp: new Date().toISOString(), event_type: 'create', pid: 1042, ppid: 408, process_name: 'malware_sample.exe', cpu_usage: 14.5, memory_usage: 45000 },
        { timestamp: new Date(Date.now() - 1000).toISOString(), event_type: 'create', pid: 2190, ppid: 1042, process_name: 'cmd.exe', cpu_usage: 2.1, memory_usage: 12000 },
        { timestamp: new Date(Date.now() - 2000).toISOString(), event_type: 'create', pid: 3104, ppid: 2190, process_name: 'powershell.exe', cpu_usage: 28.4, memory_usage: 98000 },
        { timestamp: new Date(Date.now() - 3000).toISOString(), event_type: 'terminate', pid: 2190, ppid: 1042, process_name: 'cmd.exe', cpu_usage: 0.0, memory_usage: 0 }
      ]
    });
  });

  router.get('/sessions/:id/network', (req, res) => {
    res.json({
      items: [
        { timestamp: new Date().toISOString(), protocol: 'TCP', direction: 'outbound', source_ip: '192.168.1.105', source_port: 49152, destination_ip: '185.220.101.5', destination_port: 443, bytes_sent: 15420 },
        { timestamp: new Date(Date.now() - 5000).toISOString(), protocol: 'UDP', direction: 'outbound', source_ip: '192.168.1.105', source_port: 53, destination_ip: '8.8.8.8', destination_port: 53, bytes_sent: 512 },
        { timestamp: new Date(Date.now() - 10000).toISOString(), protocol: 'TCP', direction: 'outbound', source_ip: '192.168.1.105', source_port: 49155, destination_ip: '104.21.32.8', destination_port: 80, bytes_sent: 2480 }
      ]
    });
  });

  router.get('/analytics/risk/:id', (req, res) => {
    res.json({ score: 85, classification: 'malicious' });
  });

  router.get('/analytics/summary/:id', (req, res) => {
    res.json({
      total_file_events: 142,
      suspicious_files: 18,
      total_process_events: 35,
      total_network_events: 89,
      suspicious_network: 12,
      findings: [
        { severity: 'high', category: 'Persistence', title: 'Registry Run Key Modification', description: 'Sample created a persistence entry in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
        { severity: 'high', category: 'Network', title: 'C2 Server Communication', description: 'Attempted TLS handshake with known malicious command & control server 185.220.101.5' },
        { severity: 'medium', category: 'Evasion', title: 'Process Injection Attempt', description: 'Injected shellcode into legitimate svchost.exe process' }
      ],
      summary: 'High-risk malware sample exhibiting Trojan and ransomware behaviors including automated persistence setup and encrypted C2 communication.'
    });
  });

  // Reports endpoints
  router.get('/reports', (req, res) => {
    res.json({ items: reports });
  });

  router.post('/reports/generate', (req, res) => {
    const { session_id, format } = req.body || {};
    const newRep = {
      id: `rep-${Math.floor(100 + Math.random() * 900)}`,
      session_id: session_id || 'sess-101',
      format: format || 'pdf',
      file_size: Math.floor(50000 + Math.random() * 200000),
      created_at: new Date().toISOString()
    };
    reports.unshift(newRep);
    res.json(newRep);
  });

  router.get('/reports/:id/download', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.id}.json"`);
    res.send(JSON.stringify({ report_id: req.params.id, status: 'Generated Analysis Report' }, null, 2));
  });

  app.use('/api/v1', router);

  // Vite integration or Static File serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Real-time Event Simulation
  setInterval(() => {
    const eventTypes = ['process', 'network', 'file', 'alert'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    let eventData = {
      timestamp: new Date().toISOString(),
      type: eventType,
      session_id: 'sess-103',
    };
    
    if (eventType === 'process') {
      eventData.title = 'Process Spawned';
      eventData.description = `cmd.exe started by malware_sample.exe (PID: ${Math.floor(1000 + Math.random() * 4000)})`;
      eventData.severity = 'medium';
    } else if (eventType === 'network') {
      eventData.title = 'Outbound Connection';
      eventData.description = `Suspicious TCP traffic to ${Math.floor(10 + Math.random() * 240)}.x.x.x:443`;
      eventData.severity = 'high';
    } else if (eventType === 'file') {
      eventData.title = 'File Modified';
      eventData.description = 'Modified C:\\Windows\\System32\\drivers\\etc\\hosts';
      eventData.severity = 'high';
    } else {
      eventData.title = 'Security Alert';
      eventData.description = 'Possible Ransomware encryption pattern detected in Documents folder';
      eventData.severity = 'critical';
    }

    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 is WebSocket.OPEN
        client.send(JSON.stringify(eventData));
      }
    });
  }, 3000); // Send a mock event every 3 seconds

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket running on ws://0.0.0.0:${PORT}/ws/events`);
  });
}

startServer();
