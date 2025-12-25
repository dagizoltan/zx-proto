# ADR-004: CQRS with Disposable Read Models

**Status**: Accepted

## Context

Read performance and query flexibility are required, but consistency must remain simple.

## Decision

Read models (projections) are built from events and treated as disposable. They can be deleted and rebuilt via replay.

## Consequences

* No migration scripts for reads
* Strong write consistency
* Eventual consistency for queries
