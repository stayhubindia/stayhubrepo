# ADR 0002: Data Fetching and Caching

- Status: Accepted
- Date: 2026-02-24

## Context
The frontend consumes many API endpoints with mixed volatility (listings, notifications, leads). We need predictable cache behavior and mutation consistency.

## Decision
- Use React Query for server-state management.
- Keep API request logic in module-local `api.ts` files and query wiring in `hooks.ts`.
- Use query keys by domain (`properties`, `notifications`, `favorites`, `contacts`).
- Invalidate relevant query keys after mutations instead of manual store mutation.
- Default query policy:
  - `staleTime`: 30 seconds
  - `retry`: 1 for queries, `0` for mutations
  - `refetchOnWindowFocus`: disabled

## Consequences
- Reduces stale data risk with low operational complexity.
- Invalidation strategy remains easy to reason about.
- Some endpoints may need endpoint-specific tuning as traffic grows.
