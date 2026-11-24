package github

import (
	"context"
	"os"
	"time"

	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"

	"github.com/kandev/kandev/internal/common/logger"
	"github.com/kandev/kandev/internal/events/bus"
)

// rateLimitSeedTimeout caps the startup `gh api rate_limit` probe so a slow
// CLI cannot delay backend boot.
const rateLimitSeedTimeout = 5 * time.Second

// attachRateTracker wires the rate tracker into whichever client
// implementation we ended up with, then seeds initial snapshots. The seed is
// best-effort — a missing CLI or network blip should not block startup.
func attachRateTracker(client Client, tracker *RateTracker, log *logger.Logger, seed bool) {
	wireRateTracker(client, tracker)
	c, ok := client.(*GHClient)
	if !ok || !seed {
		return
	}
	seedCtx, cancel := context.WithTimeout(context.Background(), rateLimitSeedTimeout)
	defer cancel()
	if err := c.FetchRateLimit(seedCtx); err != nil {
		log.Debug("seed gh rate limit failed", zap.Error(err))
	}
}

func wireRateTracker(client Client, tracker *RateTracker) {
	switch c := client.(type) {
	case *PATClient:
		c.WithRateTracker(tracker)
	case *GHClient:
		c.WithRateTracker(tracker)
	}
}

func wireRateAdmission(client Client, admission *RateAdmission) {
	switch c := client.(type) {
	case *PATClient:
		c.withRateAdmission(admission)
	case *GHClient:
		c.withRateAdmission(admission)
	}
}

// Provide creates the full GitHub integration stack: store, client, and service.
// Returns the service, a cleanup function, and any error.
func Provide(
	writer, reader *sqlx.DB,
	secrets SecretProvider,
	eventBus bus.EventBus,
	log *logger.Logger,
	backgroundLookups bool,
) (*Service, func() error, error) {
	store, err := NewStore(writer, reader)
	if err != nil {
		return nil, nil, err
	}

	ctx := context.Background()
	var client Client
	authMethod := AuthMethodNone
	// Discover ambient gh credentials only for installations that use them.
	// Workspace-specific credentials are resolved by the broker on demand.
	configured, err := store.hasActiveHostCredential(ctx)
	if err != nil {
		log.Debug("cannot check saved GitHub connections", zap.Error(err))
	}
	if configured || backgroundLookups || os.Getenv("KANDEV_MOCK_GITHUB") == "true" {
		client, authMethod, err = NewClient(ctx, secrets, log)
		if err != nil {
			log.Warn("GitHub client unavailable", zap.Error(err))
		}
	}

	svc := NewService(client, authMethod, secrets, store, eventBus, log)
	attachRateTracker(client, svc.RateTracker(), log, backgroundLookups)
	svc.subscribeTaskEvents()

	cleanup := func() error {
		// Stop background goroutines (currently the per-workspace
		// stale-PR refreshes) before tearing down event subs so an
		// in-flight refresh's DB writes don't race with shutdown.
		svc.Stop()
		svc.unsubscribeTaskEvents()
		return nil
	}
	return svc, cleanup, nil
}

func clientRateTracker(client Client) *RateTracker {
	switch c := client.(type) {
	case *PATClient:
		if c != nil {
			return c.rateTracker
		}
	case *GHClient:
		if c != nil {
			return c.rateTracker
		}
	}
	return nil
}
