# ADR-008: Event Schema Versioning via Upcasting

**Status**: Accepted

## Context

Event schemas will evolve over time without rewriting history.

## Decision

Events are immutable. Schema changes are handled by upcasters applied at read/dispatch time.

## Consequences

* No destructive migrations
* Backward compatibility
* Slight dispatch overhead
