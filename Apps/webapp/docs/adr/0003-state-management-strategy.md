# ADR 0003: State Management Strategy

- Status: Accepted
- Date: 2026-02-24

## Context
The app needs both global client state (session) and server state (API resources). Mixing them leads to duplicated truth and hard-to-debug regressions.

## Decision
- Use Zustand only for lightweight client state:
  - auth session
  - local UI flags when not API-backed
- Use React Query for all backend resource state:
  - lists/details
  - unread counts
  - leads/favorites/notifications
- Keep domain types in `src/types` and avoid implicit `any`.
- Avoid placing API payloads in global stores unless strictly needed.

## Consequences
- Clear boundary between client-state and server-state responsibilities.
- Lower coupling across modules and easier testing.
- Requires discipline to prevent bypassing React Query with ad-hoc local caches.
