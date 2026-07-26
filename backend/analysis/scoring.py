def calculate_risk_score(events: list[dict]) -> int:
    """
    Deterministic rule-based scoring (0-100 scale).
    Benign <25, Suspicious 26-65, Malicious >66
    
    Now includes event aggregation to prevent score inflation
    from identical repeated events.
    """
    score = 0
    seen_categories = set()
    
    for event in events:
        severity = event.get("severity", "low")
        event_type = event.get("type", "unknown")
        
        # Simple deduplication multiplier
        multiplier = 1.0
        if event_type in seen_categories:
            multiplier = 0.5 # Penalty for repeated event types
        else:
            seen_categories.add(event_type)
            
        if severity == "critical":
            score += 35 * multiplier
        elif severity == "high":
            score += 20 * multiplier
        elif severity == "medium":
            score += 10 * multiplier
        elif severity == "low":
            score += 2 * multiplier
            
    return int(min(score, 100))
