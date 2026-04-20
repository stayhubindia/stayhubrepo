# Account Linking & Multi-Auth Support

## Overview

GharBazar supports multiple authentication methods for the same account to prevent duplicate accounts and provide flexible login options:

1. **Email + OTP** (Primary auth method)
2. **Google/Firebase Authentication** (Secondary, linkable method)

## Authentication Flow

### Initial Login Scenarios

#### Scenario 1: Sign up with Email OTP
```
User → Request OTP → Verify OTP → Create Account (email-based)
```

#### Scenario 2: Sign up with Google
```
User → Click "Continue with Google" → Google OAuth popup
  ↓
  └─→ Email already exists in system?
      ├─ YES: Show error message + guide to link
      └─ NO: Create Account (Google-based)
```

#### Scenario 3: Existing Email OTP account → Link Google
```
User (Email/OTP account) → Profile → Connected Accounts → Link Google
  ↓
  OAuth popup → Success → `firebase_uid` added to existing account
```

## Error Messages

### When Trying Google Login with Existing Email (No Google Link)
**Error Message:**
```
"An account with this email already exists. 
 Please sign in with email OTP first, 
 then link your Google account from your profile."
```

**Flow:**
1. User clicks "Sign In with Google"
2. System detects email already exists with `firebase_uid = NULL`
3. User blocked from creating duplicate account
4. User redirected to email OTP sign in
5. After login, user can link Google from profile page

### When Trying Google Login with Existing Different Google Account
**Error Message:**
```
"This email is linked to a different Google account."
```

**Flow:**
1. User previously linked DIFFERENT Google account to this email
2. Now trying to link a DIFFERENT Google account
3. System prevents the link (one Google account per email)

### When Account Already Linked to Google
**Error Message:**
```
"Your account is already linked to a Google account."
```

**Flow:**
1. User already has `firebase_uid` set
2. User tries to link ANOTHER Google account from profile
3. System prevents duplicate linking

## Backend Implementation

### Models (User)
```python
class User(AbstractBaseUser, PermissionsMixin, BaseModel):
    email = EmailField(unique=True, null=True, blank=True)
    firebase_uid = CharField(unique=True, null=True, blank=True)
    # ... other fields
```

### Key Methods

#### `UserService.login_with_firebase(firebase_token, role, remember_me)`
**Purpose:** Firebase/Google login endpoint

**Logic Flow:**
```python
1. Verify Firebase token
2. Extract email + phone from token
3. Check if user with firebase_uid exists
   ├─ YES: Update user info, return user + tokens
   └─ NO: Check if email already exists with different firebase_uid
       ├─ Email exists + no firebase_uid: 
       │  └─ REJECT: "An account with this email already exists..."
       ├─ Email exists + different firebase_uid:
       │  └─ REJECT: "This email is linked to a different Google account."
       └─ Email doesn't exist:
          └─ Create new user with firebase_uid
```

#### `UserService.link_firebase_account(user, firebase_token)`
**Purpose:** Link Google account to authenticated user (must be logged in)

**Logic Flow:**
```python
1. Verify Firebase token (get uid)
2. Check if user already has firebase_uid
   ├─ YES: REJECT "Your account is already linked to a Google account."
   └─ NO: Check if another user has this firebase_uid
       ├─ YES: REJECT "This Google account is already linked to another user."
       └─ NO: Add firebase_uid to user, return updated user
```

#### `UserService.verify_email_otp(email, otp, role, remember_me)`
**Purpose:** Email OTP login endpoint

**Logic Flow:**
```python
1. Validate OTP (hash check, expiration, attempts)
2. Check if user with email exists
   ├─ YES: Check role matches
   │  └─ Mismatch: REJECT (cannot change role)
   └─ NO: Create new user with email
3. Return user + tokens
```

### API Endpoints

```
POST /auth/firebase/login/
├─ Payload: { firebase_token: string, role?: "OWNER" | "TENANT" }
├─ Success: { user, tokens }
└─ Error: DetailException with account linking message

POST /auth/firebase/link/
├─ Auth: Required (JWT)
├─ Payload: { firebase_token: string }
├─ Success: { user, tokens }
└─ Error: DetailException (already linked, conflict, etc.)

POST /auth/email-otp/request/
├─ Payload: { email: string }
├─ Success: { detail: "OTP sent to email" }
└─ Error: ValidationError (disposable email, rate limit, etc.)

POST /auth/email-otp/verify/
├─ Payload: { email: string, otp: string, role?: "OWNER" | "TENANT" }
├─ Success: { user, tokens }
└─ Error: ValidationError (invalid OTP, expired, wrong role, etc.)
```

## Frontend Implementation

### User Type
```typescript
interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string;
  last_name: string;
  role: "OWNER" | "TENANT" | "ADMIN";
  firebase_uid?: string | null;  // NEW: Indicates Google link status
  // ... other fields
}
```

### Auth Hooks

#### `useGoogleLogin()`
Used on auth page for initial Google login attempt
```typescript
const { mutateAsync } = useGoogleLogin();
const data = await mutateAsync({ idToken, role: "OWNER" });
// Returns: { user, tokens } or throws ValidationError with message
```

#### `useLinkFirebase()`
Used on profile page to link Google account to existing user
```typescript
const { mutateAsync, isPending } = useLinkFirebase();
const data = await mutateAsync(idToken);
// Updates user in auth store with new firebase_uid
// Returns: { user, tokens } or throws ValidationError
```

### Profile Page "Connected Accounts" Section

**Shows:**
- Google account link status
- Link button (enabled if `firebase_uid` is null)
- Helpful messages guiding users on the flow

**Actions:**
- Click "Link" button → Google OAuth popup → Link to account
- If already linked → Shows "Linked" badge
- Error messages displayed with red background

### Auth Page Error Handling

**Error Message Display:**
```typescript
const handleGoogleLogin = async (role) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const data = await googleLoginMutation.mutateAsync({ idToken, role });
    // Success: login and redirect
  } catch (error) {
    // Extract error message from response
    const message = error?.response?.data?.detail || "Login failed";
    setFormError(message);
    // Shows: "An account with this email already exists..."
  }
};
```

## User Journeys

### Journey 1: Email OTP User Adds Google Sign-In
```
1. User signs up with Email + OTP
2. User navigates to Profile page
3. User sees "Connected Accounts" section
4. User clicks "Link" button for Google
5. Google OAuth popup appears
6. User authenticates with Google
7. Google UID is added to user account
8. User can now sign in with either Email OTP OR Google
```

### Journey 2: New User Attempts Duplicate Google Registration
```
1. User A signs up with Email: john@example.com + Google account G1
2. User A's account has:
   - email: john@example.com
   - firebase_uid: G1_UID
3. Later, User B tries to sign in with Google account G1
4. System detects: email john@example.com already linked
5. Error shown: "This email is linked to a different Google account."
6. User B cannot create account (prevents hijacking)
```

### Journey 3: Role Protection
```
1. User signs up as TENANT with email
2. User tries to sign in as OWNER with same email (different role)
3. System detects role mismatch
4. Error shown: "This account is already registered as Tenant..."
5. User cannot change role once account is created
```

## Security Considerations

✅ **Prevents Account Hijacking:**
- Multiple auth methods cannot auto-link without user consent
- Users must sign in first, then explicitly link new auth method

✅ **Email Uniqueness:**
- One email = one account across all auth methods
- Duplicate emails prevented at database level (unique constraint)

✅ **Role Immutability:**
- Users cannot change their role after signup
- Prevents OWNER/TENANT role mixing

✅ **One Google per Account:**
- User can add one Google account to their existing account
- Cannot link multiple Google accounts (one-to-one relationship)

✅ **OTP Rate Limiting:**
- Per-email daily limit (default: 10 OTP requests/day)
- Per-email attempt limit (default: 5 attempts/OTP)
- Lockout period after exceeded attempts (default: 15 minutes)

## Database Schema

```sql
-- User table constraints
UNIQUE(email)                          -- One email across all auth methods
UNIQUE(firebase_uid)                   -- One Google account per user
CHECK(rent__gt=0)                      -- Firebase UID is nullable (optional linking)

-- Indexes for fast lookups
INDEX(firebase_uid)                    -- Fast Firebase login lookup
INDEX(email, purpose, is_used)         -- Fast OTP lookups
```

## Testing Scenarios

### Test Case 1: Email → Google Linking
1. Sign up with Email OTP as john@test.com
2. Go to Profile
3. Link Google account
4. Verify: `firebase_uid` is set
5. Sign out
6. Log in with Google using same email
7. Assert: Same user is logged in

### Test Case 2: Google → Email Conflict
1. Sign up with Google account G1 using john@test.com
2. In another browser, try to sign in with Email OTP for john@test.com
3. System should allow (create account or login - depends on implementation)
4. Try to link Google G1 again
5. Assert: Error "This Google account is already linked to another user."

### Test Case 3: Role Protection
1. Sign up as TENANT
2. Try to sign in as OWNER with same email
3. Assert: Error "This account is already registered as Tenant..."
4. Sign in as TENANT (role stays unchanged)

## Configuration

### Environment Variables
```env
# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Backend settings
EMAIL_OTP_TTL_MINUTES=10              # OTP expiration time
EMAIL_OTP_MAX_ATTEMPTS=5              # Failed attempts before lockout
EMAIL_OTP_LOCKOUT_MINUTES=15          # Lockout duration
EMAIL_OTP_DAILY_LIMIT=10              # Daily OTP requests per email
```

## Migration Guide

If you have existing users without `firebase_uid`:
- They continue working with Email OTP
- They can link Google account anytime from profile
- No data changes required in existing accounts

## Troubleshooting

### User Can't Link Google - Getting Error
**Problem:** "Your account is already linked to a Google account."
**Solution:** User can only link ONE Google account. To change it, they need to contact support (would require unlinking, not currently exposed in UI).

### User Forgot Which Email They Used
**Solution:** 
1. Try signing in with Google
2. If email matches, they'll get the "account already exists" error
3. Sign in with Email OTP to the email shown in error

### User Created Account with Wrong Email
**Solution:** 
1. Sign in with that wrong email
2. Go to Profile → Edit → Change email
3. Verify by requesting OTP (old email won't be valid anymore)

---

**Last Updated:** April 5, 2026  
**Status:** Implemented and validated in production build
