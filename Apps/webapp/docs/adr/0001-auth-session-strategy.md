# ADR 0001: Auth Session Strategy

- Status: Accepted
- Date: 2026-02-24

## Context
The app uses backend-issued JWT tokens after OTP verification. We need predictable UX across refreshes while limiting token handling complexity.

## Decision
- Store session (`user`, `access`, `refresh`) in a persisted Zustand store.
- Attach `Authorization: Bearer <access>` in a centralized Axios interceptor.
- On `401`, clear local session and require fresh authentication.
- Do not store any sensitive backend secrets in frontend envs.

## Consequences
- Fast implementation and consistent auth behavior across all API modules.
- Requires future enhancement for refresh-token rotation/renewal workflows.
- Centralized interception simplifies audit and debugging.
