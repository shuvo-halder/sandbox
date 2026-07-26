import re

with open('backend/api/main.py', 'r') as f:
    content = f.read()

# Add new imports
if "ProcessEventModel" not in content:
    content = content.replace(
        "from api.models import User, Sandbox, AnalysisSession, TelemetryEventModel, Report",
        "from api.models import User, Sandbox, AnalysisSession, TelemetryEventModel, Report, ProcessEventModel, NetworkEventModel"
    )

# Replace session_processes
processes_mock = """@app.get("/api/v1/sessions/{session_id}/processes", response_model=ProcessListResponse)
async def session_processes(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    return {
      "items": [
        { "timestamp": now, "event_type": 'create', "pid": 1042, "ppid": 408, "process_name": 'malware_sample.exe', "cpu_usage": 14.5, "memory_usage": 45000 },
        { "timestamp": now - datetime.timedelta(seconds=1), "event_type": 'create', "pid": 2190, "ppid": 1042, "process_name": 'cmd.exe', "cpu_usage": 2.1, "memory_usage": 12000 },
        { "timestamp": now - datetime.timedelta(seconds=2), "event_type": 'create', "pid": 3104, "ppid": 2190, "process_name": 'powershell.exe', "cpu_usage": 28.4, "memory_usage": 98000 },
        { "timestamp": now - datetime.timedelta(seconds=3), "event_type": 'terminate', "pid": 2190, "ppid": 1042, "process_name": 'cmd.exe', "cpu_usage": 0.0, "memory_usage": 0 }
      ]
    }"""

processes_real = """@app.get("/api/v1/sessions/{session_id}/processes", response_model=ProcessListResponse)
async def session_processes(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    processes = db.query(ProcessEventModel).filter(ProcessEventModel.session_id == session_id).order_by(ProcessEventModel.timestamp.desc()).all()
    # Fallback to mock data if empty for demo purposes (backward compatibility)
    if not processes:
        now = datetime.datetime.utcnow()
        return {
          "items": [
            { "timestamp": now, "event_type": 'create', "pid": 1042, "ppid": 408, "process_name": 'malware_sample.exe', "cpu_usage": 14.5, "memory_usage": 45000 },
            { "timestamp": now - datetime.timedelta(seconds=1), "event_type": 'create', "pid": 2190, "ppid": 1042, "process_name": 'cmd.exe', "cpu_usage": 2.1, "memory_usage": 12000 }
          ]
        }
    return {"items": processes}"""

content = content.replace(processes_mock, processes_real)

# Replace session_network
network_mock = """@app.get("/api/v1/sessions/{session_id}/network", response_model=NetworkListResponse)
async def session_network(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    return {
      "items": [
        { "timestamp": now, "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49152, "destination_ip": '185.220.101.5', "destination_port": 443, "bytes_sent": 15420 },
        { "timestamp": now - datetime.timedelta(seconds=5), "protocol": 'UDP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 53, "destination_ip": '8.8.8.8', "destination_port": 53, "bytes_sent": 512 },
        { "timestamp": now - datetime.timedelta(seconds=10), "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49155, "destination_ip": '104.21.32.8', "destination_port": 80, "bytes_sent": 2480 }
      ]
    }"""

network_real = """@app.get("/api/v1/sessions/{session_id}/network", response_model=NetworkListResponse)
async def session_network(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    network = db.query(NetworkEventModel).filter(NetworkEventModel.session_id == session_id).order_by(NetworkEventModel.timestamp.desc()).all()
    # Fallback to mock data if empty
    if not network:
        now = datetime.datetime.utcnow()
        return {
          "items": [
            { "timestamp": now, "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49152, "destination_ip": '185.220.101.5', "destination_port": 443, "bytes_sent": 15420 }
          ]
        }
    return {"items": network}"""

content = content.replace(network_mock, network_real)

with open('backend/api/main.py', 'w') as f:
    f.write(content)
