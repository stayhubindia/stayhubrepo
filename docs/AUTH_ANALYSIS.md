# 🔐 Authentication & Login/Signup Analysis

## Overview
**Status**: ✅ Well-implemented with minor improvements needed  
**Auth Methods**: Email OTP + Firebase (Google)  
**Security**: Strong with rate limiting and token refresh

---

## 1. BACKEND AUTHENTICATION

### ✅ Strengths

1. **Dual Authentication Methods**
   - Email OTP (passwordless)
   - Firebase Authentication (Google OAuth)
   - Dev token support for testing

2. **Security Features**
   - HMAC-based OTP hashing
   - OTP expiration (10 minutes default)
   - Max attempts limit (5 attempts)
   - Rate limiting (5 requests/hour on auth endpoints)
   - JWT with refresh tokens
   - Remember me functionality (30-day tokens)

3. **Role Management**
   - Strict role enforcement (TENANT/OWNER)
   - Role mismatch prevention
   - Cannot change role after registration

4. **User Model**
   - Email OR phone required (flexible)
   - Firebase UID linking
   - Email verification tracking
   - Location support

5. **Service Layer Pattern**
   - All business logic in `UserService`
   - Transaction safety with `@transaction.atomic`
   - Proper error handling

### ⚠️ Issues Found

1. **Email OTP Security Gap**
   - **Issue**: OTP sent via Brevo but no retry limit per email
   - **Risk**: User can request unlimited OTPs (only rate limited by IP)
   - **Fix**: Add daily limit per email address

2. **Firebase UID Linking Logic**
   - **Issue**: Automatically links Firebase UID to existing email accounts
   - **Risk**: If someone signs up with email OTP first, then uses Google with same email, accounts merge without confirmation
   - **Recommendation**: Add user confirmation step

3. **Password Field Unused**
   - **Issue**: User model has password field but never used
   - **Impact**: Confusing, adds unnecessary complexity
   - **Fix**: Either implement password auth or remove field

4. **No Account Lockout**
   - **Issue**: After 5 failed OTP attempts, user can request new OTP immediately
   - **Risk**: Brute force still possible
   - **Fix**: Add temporary lockout (15 minutes) after max attempts

5. **Email Normalization**
   - **Issue**: Email normalized to lowercase but not validated for disposable domains
   - **Risk**: Spam accounts
   - **Fix**: Add disposable email detection

---

## 2. FRONTEND AUTHENTICATION

### ✅ Strengths

1. **Clean UI/UX**
   - Two-phase flow (request → verify)
   - Role selection (Tenant/Owner)
   - Remember me option
   - Loading states
   - Error handling

2. **Firebase Integration**
   - Google Sign-In working
   - Token extraction correct
   - Error handling present

3. **State Management**
   - Zustand store for auth state
   - Session persistence
   - Token refresh logic in HTTP interceptor

4. **Form Validation**
   - Zod schemas
   - React Hook Form
   - Client-side validation

### ⚠️ Issues Found

1. **Duplicate Auth Pages**
   - `/auth/page.tsx` - Generic auth with role toggle
   - `/signup/page.tsx` - Tenant-only signup
   - **Issue**: Confusing, redundant code
   - **Fix**: Consolidate into single auth page

2. **No Loading State on Redirect**
   - After successful auth, immediate redirect
   - **Issue**: User sees flash of auth page
   - **Fix**: Add loading overlay during redirect

3. **Firebase Config Exposed**
   - Firebase config in `src/config/firebase.js`
   - **Issue**: API keys visible in client code (this is normal but should be documented)
   - **Note**: Firebase API keys are safe in client code, but add rate limiting in Firebase Console

4. **No Session Timeout Warning**
   - Tokens expire silently
   - **Issue**: User suddenly logged out
   - **Fix**: Add warning 5 minutes before expiry

5. **Google Login Error Handling**
   - Complex error extraction logic
   - **Issue**: Hard to maintain
   - **Fix**: Standardize error response format

---

## 3. AUTHENTICATION FLOW ANALYSIS

### Email OTP Flow

```
1. User enters email → POST /auth/email-otp/request/
2. Backend generates OTP, hashes it, sends via Brevo
3. User enters OTP → POST /auth/email-otp/verify/
4. Backend validates OTP, creates/updates user
5. Returns JWT tokens + user data
6. Frontend stores in Zustand + localStorage
```

**Status**: ✅ Working correctly

### Firebase (Google) Flow

```
1. User clicks "Continue with Google"
2. Firebase popup opens
3. User authenticates with Google
4. Firebase returns ID token
5. Frontend sends token → POST /auth/firebase/login/
6. Backend verifies token with Firebase Admin SDK
7. Creates/updates user with Firebase UID
8. Returns JWT tokens + user data
9. Frontend stores in Zustand + localStorage
```

**Status**: ✅ Working correctly

### Token Refresh Flow

```
1. Access token expires (30 minutes)
2. API returns 401
3. HTTP interceptor catches error
4. Sends refresh token → POST /auth/token/refresh/
5. Gets new access token
6. Retries original request
7. Queues other pending requests
```

**Status**: ✅ Working correctly with queue management

---

## 4. SECURITY ASSESSMENT

| Feature | Status | Notes |
|---------|--------|-------|
| Password Hashing | N/A | Passwordless auth |
| OTP Hashing | ✅ | HMAC-SHA256 |
| Rate Limiting | ✅ | 5/hour on auth endpoints |
| Token Expiry | ✅ | 30min access, 7day refresh |
| HTTPS Only | ⚠️ | Production only |
| CSRF Protection | ⚠️ | JWT-based, no CSRF tokens |
| Session Fixation | ✅ | New tokens on each login |
| Brute Force | ⚠️ | OTP attempts limited, but can retry |
| Account Enumeration | ⚠️ | Email existence revealed |
| XSS Protection | ✅ | React escapes by default |

---

## 5. RECOMMENDED FIXES

### High Priority

1. **Add OTP Request Limit Per Email**
```python
# In UserService.request_email_otp()
recent_requests = EmailOTP.objects.filter(
    email=normalized_email,
    created_at__gte=now - timedelta(hours=24)
).count()

if recent_requests >= 10:
    raise ValidationError("Too many OTP requests. Try again tomorrow.")
```

2. **Add Account Lockout After Failed Attempts**
```python
# In UserService.verify_email_otp()
if otp_record.attempts >= otp_record.max_attempts:
    # Add lockout record
    cache.set(f"otp_lockout:{normalized_email}", True, timeout=900)  # 15 min
    raise ValidationError("Too many failed attempts. Try again in 15 minutes.")
```

3. **Consolidate Auth Pages**
```typescript
// Keep only /auth/page.tsx with role selection
// Remove /signup/page.tsx
// Update all links to point to /auth
```

4. **Add Session Timeout Warning**
```typescript
// In auth store
useEffect(() => {
  const checkExpiry = setInterval(() => {
    const expiresAt = getTokenExpiry(tokens.access);
    const timeLeft = expiresAt - Date.now();
    if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
      showWarning("Session expiring soon. Save your work.");
    }
  }, 60000);
  return () => clearInterval(checkExpiry);
}, [tokens]);
```

### Medium Priority

5. **Add Disposable Email Detection**
```python
DISPOSABLE_DOMAINS = ["tempmail.com", "guerrillamail.com", ...]

def is_disposable_email(email: str) -> bool:
    domain = email.split("@")[1].lower()
    return domain in DISPOSABLE_DOMAINS
```

6. **Add Firebase UID Linking Confirmation**
```python
# When linking existing account, send confirmation email
if existing_user:
    send_account_link_confirmation(existing_user.email, uid)
    # Require user to confirm before linking
```

7. **Remove Unused Password Field**
```python
# In User model - if not using password auth
# Remove: password field and set_password/check_password methods
# Or: Implement password authentication properly
```

### Low Priority

8. **Add Login History**
```python
class LoginHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_method = models.CharField(max_length=20)  # OTP, FIREBASE
    success = models.BooleanField()
```

9. **Add 2FA Option**
```python
# For high-value accounts (owners with many properties)
class TwoFactorAuth(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    secret = models.CharField(max_length=32)
    is_enabled = models.BooleanField(default=False)
```

---

## 6. TESTING CHECKLIST

### Backend Tests Needed

- [ ] Email OTP request with valid email
- [ ] Email OTP request with invalid email
- [ ] Email OTP request rate limiting
- [ ] Email OTP verify with correct OTP
- [ ] Email OTP verify with wrong OTP
- [ ] Email OTP verify with expired OTP
- [ ] Email OTP verify after max attempts
- [ ] Firebase login with valid token
- [ ] Firebase login with invalid token
- [ ] Firebase login with dev token
- [ ] Role mismatch prevention
- [ ] Firebase UID linking to existing account
- [ ] Token refresh flow
- [ ] Remember me token expiry

### Frontend Tests Needed

- [ ] Email OTP request form validation
- [ ] Email OTP verify form validation
- [ ] Google Sign-In flow
- [ ] Role selection toggle
- [ ] Remember me checkbox
- [ ] Error message display
- [ ] Loading states
- [ ] Redirect after login
- [ ] Token refresh on 401
- [ ] Session persistence

---

## 7. PERFORMANCE CONSIDERATIONS

1. **OTP Email Sending**
   - Currently synchronous (blocks request)
   - **Recommendation**: Move to Celery task
   ```python
   @shared_task
   def send_otp_email_async(email: str, otp: str, ttl: int):
       UserService._send_email_via_brevo(email, otp, ttl)
   ```

2. **Firebase Token Verification**
   - Calls Firebase Admin SDK on every login
   - **Recommendation**: Cache verified tokens (5 min TTL)

3. **Database Queries**
   - Multiple queries in login flow
   - **Recommendation**: Use select_related for location

---

## 8. CONCLUSION

### Overall Assessment: 🟢 GOOD

**Strengths:**
- Passwordless authentication (modern, secure)
- Dual auth methods (flexibility)
- Strong OTP security (HMAC, expiry, attempts)
- Rate limiting implemented
- Token refresh working
- Role enforcement solid

**Weaknesses:**
- No per-email OTP request limit
- No account lockout after failed attempts
- Duplicate auth pages (frontend)
- No session timeout warning
- Account enumeration possible

### Production Readiness: 🟡 READY WITH FIXES

**Must Fix Before Production:**
1. Add per-email OTP request limit (10/day)
2. Add account lockout after failed attempts (15 min)
3. Consolidate auth pages
4. Move OTP email sending to async task

**Recommended Before Production:**
5. Add disposable email detection
6. Add session timeout warning
7. Add login history tracking

**Timeline:**
- Must Fix: 2-3 days
- Recommended: 1 week
- Total: 1.5 weeks to production-ready auth

---

## 9. CODE QUALITY SCORE

| Category | Score | Notes |
|----------|-------|-------|
| Security | 8/10 | Strong, minor gaps |
| Architecture | 9/10 | Clean service layer |
| Error Handling | 8/10 | Good, could be more consistent |
| Testing | 5/10 | Tests exist but incomplete |
| Documentation | 6/10 | Code is clear but no API docs |
| Performance | 7/10 | Sync email sending is bottleneck |

**Overall**: 7.5/10 - Production ready with minor fixes
