def calculate_risk_score(events: list[dict]) -> int:
    """
    Deterministic rule-based scoring (0-100 scale).
    Benign <25, Suspicious 26-65, Malicious >66
    """
    score = 0
    for event in events:
        severity = event.get("severity", "low")
        if severity == "critical":
            score += 35
        elif severity == "high":
            score += 20
        elif severity == "medium":
            score += 10
        elif severity == "low":
            score += 2
    
    # Cap score at 100
    return min(score, 100)
