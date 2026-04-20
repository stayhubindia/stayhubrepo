# 🔧 WebApp Auth Pages - Consolidation Plan

## Current State Analysis

### Existing Auth Pages (4 Pages - REDUNDANT!)

1. **`/auth/page.tsx`** - Generic auth with role toggle (Tenant/Owner)
2. **`/signup/page.tsx`** - Tenant-only signup
3. **`/owner-login/page.tsx`** - Owner-only login
4. **`/owner-signup/page.tsx`** - Owner-only signup

### Problems Identified

1. **Code Duplication** - Same logic repeated 4 times (~400 lines each)
2. **Maintenance Nightmare** - Bug fixes need 4 updates
3. **Inconsistent UX** - Slightly different flows
4. **Confusing Routes** - Users don't know which page to use
5. **Missing Role in Google Login** - `owner-login` doesn't pass role to Google

---

## What We Need To Do

### ✅ RECOMMENDED SOLUTION: Single Unified Auth Page

**Keep**: `/auth/page.tsx` (already has role toggle)  
**Delete**: `/signup`, `/owner-login`, `/owner-signup`  
**Redirect**: All old routes → `/auth`

### Benefits
- 75% less code
- Single source of truth
- Consistent UX
- Easier maintenance
- Better SEO (one canonical URL)

---

## Implementation Plan

### Step 1: Fix `/auth/page.tsx` (Already Good!)
✅ Has role toggle (Tenant/Owner)  
✅ Email OTP flow  
✅ Google Sign-In  
✅ Remember me  
✅ Error handling  
✅ Loading states  

**No changes needed** - This page is perfect!

### Step 2: Add Redirects for Old Routes

Create middleware to redirect:
- `/signup` → `/auth?role=tenant`
- `/owner-login` → `/auth?role=owner`
- `/owner-signup` → `/auth?role=owner`

### Step 3: Update All Links in App

Search and replace:
- `href="/signup"` → `href="/auth"`
- `href="/owner-login"` → `href="/auth"`
- `href="/owner-signup"` → `href="/auth"`

### Step 4: Delete Redundant Pages

Remove:
- `app/signup/page.tsx`
- `app/owner-login/page.tsx`
- `app/owner-signup/page.tsx`

---

## Detailed Changes Needed

### 1. Fix Google Login Role Bug in `owner-login/page.tsx`

**Current (WRONG):**
```typescript
const data = await googleLoginMutation.mutateAsync({ idToken });
// Missing role parameter!
```

**Should be:**
```typescript
const data = await googleLoginMutation.mutateAsync({ idToken, role: "OWNER" });
```

### 2. Add Query Param Support to `/auth`

```typescript
// In /auth/page.tsx
const searchParams = useSearchParams();
const initialRole = (searchParams.get('role')?.toUpperCase() as "TENANT" | "OWNER") || "TENANT";
const [selectedRole, setSelectedRole] = useState<"TENANT" | "OWNER">(initialRole);
```

### 3. Create Redirect Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/auth?role=tenant', request.url));
  }
  if (pathname === '/owner-login' || pathname === '/owner-signup') {
    return NextResponse.redirect(new URL('/auth?role=owner', request.url));
  }
}

export const config = {
  matcher: ['/signup', '/owner-login', '/owner-signup'],
};
```

### 4. Update Home Page Links

**File**: `app/page.tsx`

```typescript
// Change from:
<Link href="/signup">Find a Home</Link>
<Link href="/owner-signup">List Your Property</Link>

// To:
<Link href="/auth?role=tenant">Find a Home</Link>
<Link href="/auth?role=owner">List Your Property</Link>
```

### 5. Update Navigation Links

Search entire codebase for:
- `"/signup"` → `"/auth"`
- `"/owner-login"` → `"/auth"`
- `"/owner-signup"` → `"/auth"`

---

## File Changes Summary

### Files to Modify (3 files)
1. `app/auth/page.tsx` - Add query param support
2. `app/page.tsx` - Update links
3. `middleware.ts` - Create redirects (new file)

### Files to Delete (3 files)
1. `app/signup/page.tsx`
2. `app/owner-login/page.tsx`
3. `app/owner-signup/page.tsx`

### Files to Search & Replace (All .tsx files)
- Replace all auth route references

---

## Testing Checklist

After changes:

- [ ] `/auth` loads correctly
- [ ] `/auth?role=tenant` pre-selects Tenant
- [ ] `/auth?role=owner` pre-selects Owner
- [ ] `/signup` redirects to `/auth?role=tenant`
- [ ] `/owner-login` redirects to `/auth?role=owner`
- [ ] `/owner-signup` redirects to `/auth?role=owner`
- [ ] Email OTP works for both roles
- [ ] Google Sign-In works for both roles
- [ ] Role toggle switches correctly
- [ ] Remember me checkbox works
- [ ] Error messages display
- [ ] Loading states show
- [ ] Redirects after login work
- [ ] Onboarding flows work

---

## Code Reduction

**Before**: 4 files × ~400 lines = 1,600 lines  
**After**: 1 file × ~400 lines = 400 lines  
**Savings**: 1,200 lines (75% reduction)

---

## Migration Timeline

### Phase 1: Add Redirects (1 hour)
- Create middleware
- Test redirects
- Deploy

### Phase 2: Update Links (2 hours)
- Search & replace all links
- Test navigation
- Deploy

### Phase 3: Delete Old Pages (30 min)
- Remove 3 files
- Test 404s
- Deploy

**Total Time**: 3.5 hours

---

## Alternative Solution (Not Recommended)

Keep all 4 pages but extract shared logic:

```typescript
// components/auth/AuthForm.tsx
export function AuthForm({ role, mode }: { role: "TENANT" | "OWNER", mode: "login" | "signup" }) {
  // Shared logic here
}

// Then use in each page
<AuthForm role="TENANT" mode="signup" />
```

**Why Not Recommended:**
- Still 4 pages to maintain
- Still confusing for users
- More complex than single page
- Doesn't solve routing confusion

---

## Recommendation

✅ **Implement Single Unified Auth Page**

**Pros:**
- Simplest solution
- Best UX (one place to auth)
- Easiest to maintain
- Industry standard (most apps have single auth page)

**Cons:**
- Need to update existing links (one-time effort)
- Need redirects for old URLs (simple middleware)

**Decision**: Single page is the clear winner.

---

## Next Steps

1. Review this plan
2. Approve approach
3. Implement changes (3.5 hours)
4. Test thoroughly
5. Deploy

**Priority**: MEDIUM (not blocking, but reduces tech debt)
