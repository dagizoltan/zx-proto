# ADR-003: Aggregate-Scoped Command Serialization

**Status**: Accepted

## Context

Concurrent commands against the same aggregate (e.g. order) must not cause race conditions.

## Decision

Commands are serialized per aggregate ID using an in-memory or KV-backed queue. Parallelism is allowed across aggregates, not within them.

## Consequences

* Deterministic outcomes
* High throughput
* Simplifies reasoning about consistency
