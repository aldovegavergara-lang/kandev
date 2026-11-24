// Package tracing provides shared OTel tracer initialization for agentctl
// communication layers (both agent protocol and backend<>agentctl transport).
//
// Real tracing requires OTEL_EXPORTER_OTLP_ENDPOINT to be set.
// Without it a no-op tracer is used (zero overhead).
package tracing

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/trace/noop"
)

const serviceName = "kandev-agentctl"

var (
	initOnce           sync.Once
	tracerProvider     trace.TracerProvider = noop.NewTracerProvider()
	sdkProvider        *sdktrace.TracerProvider
	endpointMu         sync.RWMutex
	configuredEndpoint string
	configuredSet      bool
)

// ConfigureEndpoint sets the resolved startup endpoint before the first
// tracer is requested. Managed backend and agentctl processes use this to
// avoid depending on inherited environment values.
func ConfigureEndpoint(endpoint string) {
	endpointMu.Lock()
	configuredEndpoint = endpoint
	configuredSet = true
	endpointMu.Unlock()
}

func resolvedEndpoint() string {
	endpointMu.RLock()
	defer endpointMu.RUnlock()
	if configuredSet {
		return configuredEndpoint
	}
	return os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
}

func initTracing() {
	// Always register the W3C propagator so Inject/Extract work
	// even if this process doesn't export spans.
	otel.SetTextMapPropagator(propagation.TraceContext{})

	endpoint := resolvedEndpoint()
	if endpoint == "" || strings.EqualFold(os.Getenv("OTEL_SDK_DISABLED"), "true") {
		return
	}

	ctx := context.Background()

	target, err := traceEndpoint(endpoint)
	if err != nil {
		fmt.Fprintln(os.Stderr, "kandev: invalid tracing endpoint; use HTTPS or loopback HTTP")
		return
	}
	client, err := collectorClient()
	if err != nil {
		fmt.Fprintln(os.Stderr, "kandev: invalid OTLP TLS or timeout configuration")
		return
	}
	exporter, err := otlptracehttp.New(ctx, otlptracehttp.WithEndpointURL(target), otlptracehttp.WithHTTPClient(client))
	if err != nil {
		fmt.Fprintf(os.Stderr, "kandev-agentctl: failed to initialize OTel exporter: %v\n", err)
		return
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(semconv.ServiceName(serviceName)),
	)
	if err != nil {
		res = resource.Default()
	}

	sdkProvider = sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
	)
	tracerProvider = sdkProvider
	otel.SetTracerProvider(tracerProvider)
}

// Use the configured collector only. A redirect must never forward a POST
// containing trace metadata or credentials, even between sibling domains.
func collectorClient() (*http.Client, error) {
	setting := func(key string) string {
		if value := os.Getenv("OTEL_EXPORTER_OTLP_TRACES_" + key); value != "" {
			return value
		}
		return os.Getenv("OTEL_EXPORTER_OTLP_" + key)
	}
	tlsConfig := &tls.Config{MinVersion: tls.VersionTLS12}
	if ca := setting("CERTIFICATE"); ca != "" {
		pem, err := os.ReadFile(ca)
		if err != nil {
			return nil, err
		}
		roots := x509.NewCertPool()
		if !roots.AppendCertsFromPEM(pem) {
			return nil, errors.New("invalid collector CA")
		}
		tlsConfig.RootCAs = roots
	}
	cert, key := setting("CLIENT_CERTIFICATE"), setting("CLIENT_KEY")
	if cert != "" || key != "" {
		pair, err := tls.LoadX509KeyPair(cert, key)
		if err != nil {
			return nil, err
		}
		tlsConfig.Certificates = []tls.Certificate{pair}
	}
	timeout := 10 * time.Second
	if raw := setting("TIMEOUT"); raw != "" {
		ms, err := strconv.ParseUint(raw, 10, 32)
		if err != nil || ms == 0 {
			return nil, errors.New("invalid collector timeout")
		}
		timeout = time.Duration(ms) * time.Millisecond
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.TLSClientConfig = tlsConfig
	return &http.Client{Transport: transport, Timeout: timeout, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}, nil
}

// Preserve the configured protocol and the OTLP base path. Plain HTTP is local-only.
func traceEndpoint(raw string) (string, error) {
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}
	u, err := url.Parse(raw)
	if err != nil || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.ForceQuery || u.Fragment != "" {
		return "", errors.New("invalid collector URL")
	}
	local := strings.EqualFold(u.Hostname(), "localhost") || net.ParseIP(u.Hostname()).IsLoopback()
	if u.Scheme != "https" && !(u.Scheme == "http" && local) {
		return "", errors.New("collector requires HTTPS")
	}
	u.Path = path.Join("/", u.Path, "v1/traces")
	u.RawPath = ""
	return u.String(), nil
}

// Tracer returns a named tracer. No-op when tracing is disabled.
func Tracer(name string) trace.Tracer {
	initOnce.Do(initTracing)
	return tracerProvider.Tracer(name)
}

// Shutdown flushes pending spans and shuts down the provider.
func Shutdown(ctx context.Context) error {
	if sdkProvider != nil {
		return sdkProvider.Shutdown(ctx)
	}
	return nil
}
