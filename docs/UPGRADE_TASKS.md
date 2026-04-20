# GharBazar — Upgrade & Fix Task List

> Generated after full project code review (Backend: Django | Frontend: Next.js/TypeScript)
> Priority: 🔴 Critical → 🟠 High → 🟡 Medium → 🔵 Low
> Status: ✅ Done | ⏳ Pending

---

## 🔴 CRITICAL

### TASK-01 · Hardcoded Credentials in `settings.py` ✅ DONE
> ✅ All credentials via `get_env()` / `get_secret()` from `.env`.
> ✅ `ImproperlyConfigured` used instead of bare `Exception`.

### TASK-02 · Hardcoded Credentials in `use-session-sync.ts` ✅ DONE
> ✅ Confirmed — `CHANNEL_NAME` / `STORAGE_KEY` are non-sensitive constants.

### TASK-03 · Firebase Keys in `src/config/.env` ✅ DONE
> ✅ `src/config/.env` cleared — warning comment only. Values live in `.env.local`.

### TASK-04 · Firebase Config Bypassing `env.ts` ✅ DONE
> ✅ `firebase.js` imports `FIREBASE_CONFIG` from `env.ts`. All 7 vars in Zod schema.

### TASK-05 · Code Injection in `idempotent-actions.ts` ✅ DONE
> ✅ `new Error(String(error))` → `new Error("Action failed. Please try again.")`.

---

## 🟠 HIGH

### TASK-06 · SSRF in `http.ts` ✅ DONE
> ✅ `ALLOWED_HOSTS` set built from `API_BASE_URL`. Every request hostname validated before signing.

### TASK-07 · Log Injection in `logger.ts` ✅ DONE
> ✅ `sanitize()` strips `\r\n` from all log messages across every log level.

### TASK-08 · Log Injection in `http.ts` ✅ DONE
> ✅ All log calls go through `logger.*` which sanitizes via `logger.ts`.

### TASK-09 · Log Injection in `websocket.ts` ✅ DONE
> ✅ All `console.error` replaced with `logger.error` / `logger.warn`.

### TASK-10 · Untrusted Deserialization in `websocket.ts` ✅ DONE
> ✅ `MessageDataSchema` (Zod) validates every incoming message. Malformed messages dropped.

### TASK-11 · Path Traversal in `settings.py` ✅ DONE
> ✅ `get_secret()` now uses `Path.resolve()` — symlink-safe absolute path resolution.
> ✅ `os.path.isfile` + `open()` replaced with `resolved.is_file()` + `read_text()`.

### TASK-12 · Silent Exception in `properties/services.py` ✅ DONE
> ✅ `except Exception: pass` → `except Exception as exc: logger.warning(...)`.

### TASK-13 · Generic Exception in `settings.py` ✅ DONE
> ✅ Both `raise Exception(...)` → `raise ImproperlyConfigured(...)`.
> ✅ Firebase `except Exception` → `(ValueError, ImportError, KeyError)`.

---

## 🟡 MEDIUM

### TASK-14 · High Cyclomatic Complexity in `users/services.py` ✅ DONE
> ✅ `login_with_firebase()` refactored — extracted 4 helpers:
> - `_assert_role_match()` — role conflict check
> - `_link_existing_email_user()` — auto-link Firebase UID to existing account
> - `_create_firebase_user()` — new user creation
> - `_resolve_new_firebase_user()` — orchestrates new-user path
> - `_sync_existing_firebase_user()` — updates returning user's profile fields

### TASK-15 · Large Function in `users/services.py` ✅ DONE
> ✅ `update_profile()` refactored — extracted 3 helpers:
> - `_normalize_contact_fields()` — email/phone normalization
> - `_apply_location_update()` — location_id or inline location handling
> - `_apply_scalar_fields()` — field assignment loop

### TASK-16 · PEP8 Violation in `users/views.py` ✅ DONE
> ✅ `len(e.detail) > 0` → `e.detail`.

### TASK-17 · Duplicate `@staticmethod` in `properties/services.py` ✅ DONE
> ✅ Duplicate decorator removed from `feature_property()`.

### TASK-18 · WebSocket Token in URL Query Param ✅ DONE
> ✅ Token removed from `buildWebSocketUrl()`.
> ✅ Token sent as first message: `{ action: "authenticate", token }` on `ws.onopen`.

### TASK-18B · Django Channels Consumer — Auth from First Message ✅ DONE
> ✅ `JWTAuthMiddleware` updated — query-param token removed, header-only auth.
> ✅ `authenticate_from_message()` helper added to `auth.py`.
> ✅ `ConversationConsumer.connect()` accepts unauthenticated connections, starts 10s timeout.
> ✅ `receive_json()` handles `action: "authenticate"` — validates token, sets up conversation, or closes with 4401.

### TASK-19 · Raw `console.error` in `websocket.ts` ✅ DONE
> ✅ All `console.error(...)` → `logger.error(...)` / `logger.warn(...)`.

---

## 🔵 LOW

### TASK-20 · `AUDIT_LOG_ENABLED` Missing from `settings.py` ✅ DONE
> ✅ `AUDIT_LOG_ENABLED = get_env("AUDIT_LOG_ENABLED", "False") == "True"` added to `settings.py`.
> ✅ `AUDIT_LOG_ENABLED=False` added to `.env.example`.

### TASK-21 · Sensitive Data in Retry Queue (`localStorage`) ✅ DONE
> ✅ `noRetryQueue` flag added to `RetryableRequestConfig`.
> ✅ Auth routes already excluded. 24-hour TTL eviction on every queue read.

### TASK-22 · Missing Throttle on `LinkFirebaseAPIView` ✅ DONE
> ✅ `throttle_classes = [AuthRateThrottle]` added to `LinkFirebaseAPIView`.

### TASK-23 · Guard Registry Memory Leak in `idempotent-actions.ts` ✅ DONE
> ✅ `GUARD_REGISTRY_MAX_SIZE = 50` + `evictOldestGuard()` — oldest entry evicted at limit.

---

## 📋 Summary Table

| Task | File | Severity | Type | Status |
|------|------|----------|------|--------|
| TASK-01 | `settings.py` | 🔴 Critical | Security — Hardcoded Credentials | ✅ Done |
| TASK-02 | `use-session-sync.ts` | 🔴 Critical | Security — Hardcoded Credentials | ✅ Done |
| TASK-03 | `src/config/.env` | 🔴 Critical | Security — Keys in src/ | ✅ Done |
| TASK-04 | `firebase.js` | 🔴 Critical | Security — Bypassing env validation | ✅ Done |
| TASK-05 | `idempotent-actions.ts` | 🔴 Critical | Security — Code Injection | ✅ Done |
| TASK-06 | `http.ts` | 🟠 High | Security — SSRF | ✅ Done |
| TASK-07 | `logger.ts` | 🟠 High | Security — Log Injection | ✅ Done |
| TASK-08 | `http.ts` | 🟠 High | Security — Log Injection | ✅ Done |
| TASK-09 | `websocket.ts` | 🟠 High | Security — Log Injection | ✅ Done |
| TASK-10 | `websocket.ts` | 🟠 High | Security — Untrusted Deserialization | ✅ Done |
| TASK-11 | `settings.py` | 🟠 High | Security — Path Traversal | ✅ Done |
| TASK-12 | `properties/services.py` | 🟠 High | Security — Silent Exception | ✅ Done |
| TASK-13 | `settings.py` | 🟠 High | Code Quality — Generic Exception | ✅ Done |
| TASK-14 | `users/services.py` | 🟡 Medium | Code Quality — High Complexity | ✅ Done |
| TASK-15 | `users/services.py` | 🟡 Medium | Code Quality — Large Function | ✅ Done |
| TASK-16 | `users/views.py` | 🟡 Medium | Code Quality — PEP8 | ✅ Done |
| TASK-17 | `properties/services.py` | 🟡 Medium | Bug — Duplicate Decorator | ✅ Done |
| TASK-18 | `websocket.ts` | 🟡 Medium | Security — Token in URL | ✅ Done |
| TASK-18B | `communication/auth.py` + `consumers.py` | 🟡 Medium | Security — Backend Auth from Message | ✅ Done |
| TASK-19 | `websocket.ts` | 🟡 Medium | Code Quality — Raw console.error | ✅ Done |
| TASK-20 | `settings.py` | 🔵 Low | Improvement — Missing Setting | ✅ Done |
| TASK-21 | `http.ts` | 🔵 Low | Security — Sensitive Data in Storage | ✅ Done |
| TASK-22 | `users/views.py` | 🔵 Low | Security — Missing Throttle | ✅ Done |
| TASK-23 | `idempotent-actions.ts` | 🔵 Low | Improvement — Memory Leak | ✅ Done |

---

**Progress: 24 / 24 tasks completed ✅**

*All tasks from the code review have been resolved.*
