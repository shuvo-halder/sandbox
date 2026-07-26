package collector

import (
	"context"
	"log"
	"time"
)

type NetworkCollector struct {
	eventCh chan<- Event
}

func NewNetworkCollector(ch chan<- Event) *NetworkCollector {
	return &NetworkCollector{eventCh: ch}
}

func (c *NetworkCollector) Start(ctx context.Context) {
	log.Println("NetworkCollector started. Monitoring /proc/net/tcp events...")

	// Simulating network connection polling
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
			default:
				log.Println("Warning: event channel full, dropping network event.")
			}
		}
	}
}
