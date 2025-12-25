# ADR-002: Immutable Application Context Initialized at Startup

**Status**: Accepted

## Context

Infrastructure wiring (KV, event bus, dispatcher, use cases) must be stable, testable, and deterministic.

## Decision

An application context (`ctx`) is created once at server startup and injected into all handlers and adapters. It is immutable at runtime.

## Consequences

* Predictable behavior
* No hidden globals
* Easy test harnesses
