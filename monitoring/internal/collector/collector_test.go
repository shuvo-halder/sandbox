package collector

import (
	"context"
	"testing"
	"time"
)

func TestProcessCollector_StartAndCancel(t *testing.T) {
	ch := make(chan Event, 5)
	c := NewProcessCollector(ch)
	ctx, cancel := context.WithCancel(context.Background())

	go c.Start(ctx)

	// Let it run briefly
	time.Sleep(10 * time.Millisecond)
	cancel() // Stop the collector

	// Wait to ensure no panics or deadlocks
	time.Sleep(10 * time.Millisecond)

	select {
	case ev := <-ch:
		if ev.Type != "process" {
			t.Errorf("Expected process event type, got %s", ev.Type)
		}
	default:
		// It's okay if no event is generated within 10ms
	}
}

func TestNetworkCollector_StartAndCancel(t *testing.T) {
	ch := make(chan Event, 5)
	c := NewNetworkCollector(ch)
	ctx, cancel := context.WithCancel(context.Background())

	go c.Start(ctx)

	time.Sleep(10 * time.Millisecond)
	cancel()

	time.Sleep(10 * time.Millisecond)
}
