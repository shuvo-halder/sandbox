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

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	eventCh := make(chan collector.Event, 1000)

	apiURL := os.Getenv("MBS_API_URL")
	if apiURL == "" {
		apiURL = "http://backend:8000/api/v1/events"
	}

	rep := reporter.NewHTTPReporter(apiURL)

	var wg sync.WaitGroup

	wg.Add(1)
	go func() {
		defer wg.Done()
		procCollector := collector.NewProcessCollector(eventCh)
		procCollector.Start(ctx)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		netCollector := collector.NewNetworkCollector(eventCh)
		netCollector.Start(ctx)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		rep.Start(ctx, eventCh)
	}()

	<-sigCh
	log.Println("Shutdown signal received, gracefully terminating pipelines...")
	cancel()

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
