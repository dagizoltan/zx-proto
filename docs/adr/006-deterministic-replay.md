# ADR-006: Deterministic Replay for Recovery and Rebuilds

**Status**: Accepted

## Context

The system must recover from crashes and allow rebuilding projections and workflows.

## Decision

A replay mechanism re-emits all stored events through current handlers. Replay is explicit and deterministic.

## Consequences

* Fast disaster recovery
* Enables debugging and audits
* Requires idempotent handlers
