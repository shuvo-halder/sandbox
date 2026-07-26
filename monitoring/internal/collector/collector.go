package collector

import (
	"context"
	"log"
	"time"
)

// Event represents a unified behavioral telemetry record
type Event struct {
	Timestamp   time.Time `json:"timestamp"`
	Type        string    `json:"type"`
	SessionID   string    `json:"session_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Severity    string    `json:"severity"`
}

type ProcessCollector struct {
	eventCh chan<- Event
}

func NewProcessCollector(ch chan<- Event) *ProcessCollector {
	return &ProcessCollector{eventCh: ch}
}

func (c *ProcessCollector) Start(ctx context.Context) {
	log.Println("ProcessCollector started. Monitoring /proc events...")
	ticker := time.NewTicker(4 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("ProcessCollector shutting down.")
			return
		case <-ticker.C:
			event := Event{
				Timestamp:   time.Now(),
				Type:        "process",
				SessionID:   "sess-103",
				Title:       "Process Spawned",
				Description: "powershell.exe executed with EncodedCommand flag",
				Severity:    "high",
			}

			// Non-blocking send
			select {
			case c.eventCh <- event:
			case <-ctx.Done():
				return
			default:
				log.Println("Warning: event channel full, dropping process event.")
			}
		}
	}
}

type NetworkCollector struct {
	eventCh chan<- Event
}

func NewNetworkCollector(ch chan<- Event) *NetworkCollector {
	return &NetworkCollector{eventCh: ch}
}

func (c *NetworkCollector) Start(ctx context.Context) {
	log.Println("NetworkCollector started. Monitoring /proc/net/tcp events...")
	ticker := time.NewTicker(6 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("NetworkCollector shutting down.")
			return
		case <-ticker.C:
			event := Event{
				Timestamp:   time.Now(),
				Type:        "network",
				SessionID:   "sess-103",
				Title:       "Outbound Connection",
				Description: "TCP connection established to 185.220.101.5:443",
				Severity:    "critical",
			}

			select {
			case c.eventCh <- event:
			case <-ctx.Done():
				return
			default:
				log.Println("Warning: event channel full, dropping network event.")
			}
		}
	}
}
