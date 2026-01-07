# ADR-007: Idempotent, Exactly-Once Event Dispatching

**Status**: Accepted

## Context

Handlers may fail, restart, or be redeployed. Events must not be processed multiple times.

## Decision

Handlers are required to be idempotent. Dispatcher tracks progress via cursors or offsets to ensure exactly-once semantics.

## Consequences

* Operational complexity
* Strong delivery guarantees
* Safe restarts
