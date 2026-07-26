package reporter

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/shuvo-halder/malware-behavior-sandbox/monitoring/internal/collector"
)

type HTTPReporter struct {
	apiURL string
	client *http.Client
}

func NewHTTPReporter(url string) *HTTPReporter {
	return &HTTPReporter{
		apiURL: url,
		client: &http.Client{
			Timeout: 5 * time.Second, // Prevent hanging connections
		},
	}
}

func (r *HTTPReporter) Start(ctx context.Context, eventCh <-chan collector.Event) {
	log.Printf("HTTPReporter started. Pushing telemetry to %s\n", r.apiURL)

	for {
		select {
		case <-ctx.Done():
			log.Println("HTTPReporter shutting down.")
			return
		case ev := <-eventCh:
			r.sendEvent(ev)
		}
	}
}

func (r *HTTPReporter) sendEvent(ev collector.Event) {
	data, err := json.Marshal(ev)
	if err != nil {
		log.Printf("Error marshaling event: %v\n", err)
		return
	}

	req, err := http.NewRequest("POST", r.apiURL, bytes.NewBuffer(data))
	if err != nil {
		log.Printf("Error creating request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	// Example static token for intra-container auth
	req.Header.Set("Authorization", "Bearer mbs-internal-sandbox-token")

	resp, err := r.client.Do(req)
	if err != nil {
		log.Printf("Failed to push telemetry event: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("Backend rejected event with status: %d\n", resp.StatusCode)
	}
}
