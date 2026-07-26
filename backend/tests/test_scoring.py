import unittest
from backend.analysis.scoring import calculate_risk_score

class TestScoring(unittest.TestCase):
    def test_benign_score(self):
        events = [{"severity": "low", "type": "process"}, {"severity": "low", "type": "file"}]
        score = calculate_risk_score(events)
        self.assertEqual(score, 4)

    def test_malicious_score(self):
        events = [{"severity": "critical", "type": "network"}, {"severity": "high", "type": "process"}]
        score = calculate_risk_score(events)
        self.assertEqual(score, 55)

    def test_score_cap(self):
        events = [{"severity": "critical", "type": f"type_{i}"} for i in range(10)]
        score = calculate_risk_score(events)
        self.assertEqual(score, 100)

if __name__ == "__main__":
    unittest.main()
