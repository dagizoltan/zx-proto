# ADR-005: Process Managers for Long-Running Workflows

**Status**: Accepted

## Context

Logistics workflows (fulfillment, shipment planning, notifications) span multiple steps and side effects.

## Decision

Process managers react to events and coordinate workflows without mutating domain state or emitting domain events.

## Consequences

* Clear separation of concerns
* Safer retries and failures
* No business logic leakage into handlers
