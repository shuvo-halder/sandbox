package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/shuvo-halder/malware-behavior-sandbox/monitoring/internal/collector"
	"github.com/shuvo-halder/malware-behavior-sandbox/monitoring/internal/reporter"
)

func main() {
	log.Println("Starting MBS Go Monitoring Agent...")

	// Create root context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Setup OS signal handling for graceful shutdown (SIGINT, SIGTERM)
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	// Event pipeline channel (buffered to prevent blocking)
	eventCh := make(chan collector.Event, 500)

	// Initialize Reporter
	apiURL := os.Getenv("MBS_API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000/api/v1/events"
	}
	rep := reporter.NewHTTPReporter(apiURL)

	var wg sync.WaitGroup

	// 1. Start Process Collector
	wg.Add(1)
	go func() {
		defer wg.Done()
		procCollector := collector.NewProcessCollector(eventCh)
		procCollector.Start(ctx)
	}()

	// 2. Start Network Collector
	wg.Add(1)
	go func() {
		defer wg.Done()
		netCollector := collector.NewNetworkCollector(eventCh)
		netCollector.Start(ctx)
	}()

	// 3. Start Reporter Worker
	wg.Add(1)
	go func() {
		defer wg.Done()
		rep.Start(ctx, eventCh)
	}()

	// Block until a signal is received
	<-sigCh
	log.Println("Shutdown signal received, gracefully terminating pipelines...")
	cancel()

	// Wait with timeout to ensure goroutines exit
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		log.Println("Graceful shutdown complete. Exiting.")
	case <-time.After(5 * time.Second):
		log.Println("Shutdown timed out, forcing exit.")
	}
}
