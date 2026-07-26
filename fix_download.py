import re

with open('backend/api/main.py', 'r') as f:
    content = f.read()

download_old = """@app.get("/api/v1/reports/{report_id}/download")
async def download_report(report_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {"report_id": report_id, "status": "Generated Analysis Report"}"""

download_new = """from fastapi.responses import PlainTextResponse
import json

@app.get("/api/v1/reports/{report_id}/download", response_class=PlainTextResponse)
async def download_report(report_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    data = json.dumps({"report_id": report_id, "status": "Generated Analysis Report"}, indent=2)
    headers = {"Content-Disposition": f'attachment; filename="report-{report_id}.json"'}
    return PlainTextResponse(content=data, headers=headers)"""

content = content.replace(download_old, download_new)

with open('backend/api/main.py', 'w') as f:
    f.write(content)
