# ADR-010: Thin HTTP Adapters (Hono) as Replaceable Delivery

**Status**: Accepted

## Context

The core system must not depend on HTTP, frameworks, or transport protocols.

## Decision

HTTP routes (Hono) act as thin adapters translating requests into commands. Business logic never depends on HTTP.

## Consequences

* Easy migration to queues, gRPC, cron
* Simplified testing
* Clear architectural boundaries
