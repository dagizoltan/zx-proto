# ADR-001: Event-Driven Core with Append-Only Event Store

**Status**: Accepted
**Date**: 2025-01-XX

## Context

The system must support auditability, deterministic recovery, and high concurrency across many CRUD-like business domains (orders, shipments, inventory).

## Decision

All state changes are represented as immutable domain events stored in an append-only event store. Events are the single source of truth.

## Consequences

* Enables replay, auditing, and debugging
* Avoids distributed transactions
* Requires projections for queries
