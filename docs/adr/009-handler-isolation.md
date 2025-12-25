# ADR-009: Handler Isolation and Failure Containment

**Status**: Accepted

## Context

A single faulty projection or process must not stop the system.

## Decision

Each handler executes independently. Failures are isolated, logged, and retried without affecting others.

## Consequences

* Improved resilience
* Easier operational debugging
* Requires monitoring and alerting
