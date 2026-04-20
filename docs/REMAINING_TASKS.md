# 📋 REMAINING TASKS - GharBazar

## ✅ COMPLETED
- Security headers (HSTS, SSL, XSS protection)
- Password validation (all 4 validators)
- Rate limiting (auth: 5/hour, contact: 10/hour)
- Firebase credentials protection (.gitignore, env vars)
- API documentation (Swagger at /api/v1/docs/)
- Database indexes (performance optimization)
- Owner onboarding API integration (was broken, now fixed)

---

## 🔴 CRITICAL (Must Do Before Production)

### 1. Auth Backend Fixes (2-3 days)
**File**: `Server/apps/users/services.py`

- [ ] Add per-email OTP request limit (10/day)
- [ ] Add account lockout after failed attempts (15 min)
- [ ] Move OTP email sending to Celery async task

**Impact**: Prevents abuse, improves performance

### 2. Auth Frontend Consolidation (3.5 hours)
**Files**: `Apps/webapp/app/auth/`, `middleware.ts`

- [ ] Delete `/signup/page.tsx`
- [ ] Delete `/owner-login/page.tsx`
- [ ] Delete `/owner-signup/page.tsx`
- [ ] Add redirects to `/auth`
- [ ] Update all links in app

**Impact**: Reduces code by 75%, easier maintenance

### 3. Run Database Migrations (5 minutes)
```bash
cd Server
python3 manage.py makemigrations
python3 manage.py migrate
```

**Impact**: Applies new indexes for performance

### 4. Environment Configuration (30 minutes)
- [ ] Set `DEBUG=False` for production
- [ ] Set `ALLOWED_HOSTS=yourdomain.com`
- [ ] Set `CORS_ALLOWED_ORIGINS=https://yourdomain.com`
- [ ] Verify Firebase env vars configured

**Impact**: Production security

---

## 🟡 HIGH PRIORITY (Should Do Soon)

### 5. Error Monitoring (1 hour)
- [ ] Add Sentry for error tracking
- [ ] Configure alerts for critical errors

**Impact**: Catch bugs in production

### 6. Mobile Responsiveness Audit (1 week)
**Files**: All pages except `/page.tsx` (home)

- [ ] `/properties/page.tsx` - Test on mobile
- [ ] `/properties/[id]/page.tsx` - Test on mobile
- [ ] `/dashboard/page.tsx` - Test on mobile
- [ ] `/profile/page.tsx` - Test on mobile
- [ ] `/notifications/page.tsx` - Test on mobile
- [ ] `/messages/page.tsx` - Test on mobile

**Impact**: Better UX for mobile users (60%+ traffic)

### 7. Add Session Timeout Warning (2 hours)
**File**: `Apps/webapp/src/store/auth-store.ts`

```typescript
// Warn user 5 minutes before token expires
useEffect(() => {
  const checkExpiry = setInterval(() => {
    const expiresAt = getTokenExpiry(tokens.access);
    const timeLeft = expiresAt - Date.now();
    if (timeLeft < 5 * 60 * 1000 && timeLeft > 0) {
      showWarning("Session expiring soon");
    }
  }, 60000);
  return () => clearInterval(checkExpiry);
}, [tokens]);
```

**Impact**: Better UX, no surprise logouts

### 8. Add Profile Completion Check (1 hour)
**File**: `Apps/webapp/app/properties/create/page.tsx`

```typescript
if (!user.phone || !user.location) {
  return (
    <div className="text-center p-8">
      <p>Please complete your profile first</p>
      <Link href="/owner-onboarding">Complete Profile</Link>
    </div>
  );
}
```

**Impact**: Ensures owners have contact info

---

## 🟢 MEDIUM PRIORITY (Nice to Have)

### 9. Testing (2 weeks)
- [ ] Backend unit tests (70% coverage target)
- [ ] Frontend component tests
- [ ] E2E tests for critical flows (auth, property creation)

**Impact**: Catch bugs before production

### 10. CI/CD Pipeline (1 week)
- [ ] GitHub Actions workflow
- [ ] Automated testing on PR
- [ ] Automated deployment to staging
- [ ] Manual approval for production

**Impact**: Faster, safer deployments

### 11. Performance Optimization (1 week)
- [ ] Move OTP email to Celery
- [ ] Cache property listings (5 min TTL)
- [ ] Add code splitting (dynamic imports)
- [ ] Optimize images (Next.js Image component)

**Impact**: Faster page loads

### 12. Add Disposable Email Detection (2 hours)
**File**: `Server/apps/users/services.py`

```python
DISPOSABLE_DOMAINS = ["tempmail.com", "guerrillamail.com", ...]

def is_disposable_email(email: str) -> bool:
    domain = email.split("@")[1].lower()
    return domain in DISPOSABLE_DOMAINS
```

**Impact**: Reduce spam accounts

### 13. Add Login History (1 day)
**File**: `Server/apps/users/models.py`

```python
class LoginHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_method = models.CharField(max_length=20)
    success = models.BooleanField()
```

**Impact**: Security audit trail

---

## 🔵 LOW PRIORITY (Future Enhancements)

### 14. Real-time Messaging (3 weeks)
**Status**: Models exist, WebSocket incomplete

- [ ] Complete WebSocket consumer
- [ ] Add message UI
- [ ] Add typing indicators
- [ ] Add read receipts

**Impact**: Better communication

### 15. Email/SMS Notifications (1 week)
- [ ] Integrate SendGrid/AWS SES for email
- [ ] Integrate Twilio for SMS
- [ ] Add notification templates

**Impact**: Better engagement

### 16. Payment Integration (2 weeks)
- [ ] Integrate Razorpay/Stripe
- [ ] Add featured listing packages
- [ ] Add subscription plans

**Impact**: Monetization

### 17. WebRTC Audio Calling (2 weeks)
- [ ] Implement signaling server
- [ ] Add call UI
- [ ] Add call history

**Impact**: Direct owner-tenant calls

### 18. Analytics Dashboard (1 week)
- [ ] Add charts for property views
- [ ] Add engagement metrics
- [ ] Add conversion tracking

**Impact**: Better insights for owners

---

## 📊 PRIORITY MATRIX

| Task | Priority | Time | Impact | Blocking |
|------|----------|------|--------|----------|
| Auth backend fixes | 🔴 Critical | 2-3 days | High | Yes |
| Auth frontend consolidation | 🔴 Critical | 3.5 hours | High | No |
| Database migrations | 🔴 Critical | 5 min | High | Yes |
| Environment config | 🔴 Critical | 30 min | High | Yes |
| Error monitoring | 🟡 High | 1 hour | High | No |
| Mobile responsiveness | 🟡 High | 1 week | High | No |
| Session timeout warning | 🟡 High | 2 hours | Medium | No |
| Profile completion check | 🟡 High | 1 hour | Medium | No |
| Testing | 🟢 Medium | 2 weeks | High | No |
| CI/CD | 🟢 Medium | 1 week | Medium | No |
| Performance optimization | 🟢 Medium | 1 week | Medium | No |
| Disposable email detection | 🟢 Medium | 2 hours | Low | No |
| Login history | 🟢 Medium | 1 day | Low | No |
| Real-time messaging | 🔵 Low | 3 weeks | Medium | No |
| Email/SMS notifications | 🔵 Low | 1 week | Medium | No |
| Payment integration | 🔵 Low | 2 weeks | High | No |
| WebRTC calling | 🔵 Low | 2 weeks | Low | No |
| Analytics dashboard | 🔵 Low | 1 week | Low | No |

---

## 🎯 RECOMMENDED ROADMAP

### Week 1: Critical Fixes (Production Blockers)
**Days 1-2**: Auth backend fixes (OTP limits, lockout, async)  
**Day 3**: Auth frontend consolidation  
**Day 4**: Database migrations + environment config  
**Day 5**: Error monitoring setup

**Deliverable**: Production-ready auth system

### Week 2: High Priority
**Days 1-2**: Mobile responsiveness audit  
**Day 3**: Session timeout warning  
**Day 4**: Profile completion check  
**Day 5**: Testing critical flows

**Deliverable**: Better UX, fewer bugs

### Week 3-4: Medium Priority
**Week 3**: Testing + CI/CD setup  
**Week 4**: Performance optimization

**Deliverable**: Automated testing, faster app

### Month 2+: Low Priority Features
- Real-time messaging
- Email/SMS notifications
- Payment integration
- Advanced analytics

**Deliverable**: Feature-complete platform

---

## 🚀 MINIMUM VIABLE PRODUCT (MVP)

To launch with minimal features:

### Must Have (Week 1)
✅ Auth system (fixed)  
✅ Property listing  
✅ Property search/filter  
✅ Favorites  
✅ Contact owner  
✅ Notifications  
✅ Profile management  

### Should Have (Week 2)
- Mobile responsive
- Error monitoring
- Session management
- Profile completion

### Nice to Have (Later)
- Real-time messaging
- Email notifications
- Payment system
- Analytics

---

## 📈 ESTIMATED TIMELINE

### To Production (Minimum)
- **Week 1**: Critical fixes → 5 days
- **Week 2**: High priority → 5 days
- **Total**: 2 weeks minimum

### To Feature Complete
- **Weeks 1-2**: Critical + High → 10 days
- **Weeks 3-4**: Medium priority → 10 days
- **Month 2+**: Low priority → 4-8 weeks
- **Total**: 2-3 months

---

## 💰 COST ESTIMATE (If Outsourcing)

### Critical (Must Do)
- Auth fixes: $500-800
- Frontend consolidation: $200-300
- Config + migrations: $100
- **Subtotal**: $800-1,200

### High Priority
- Error monitoring: $100
- Mobile audit: $1,500-2,000
- Session warning: $200
- Profile check: $100
- **Subtotal**: $1,900-2,400

### Medium Priority
- Testing: $3,000-5,000
- CI/CD: $1,500-2,000
- Performance: $1,500-2,000
- **Subtotal**: $6,000-9,000

### Low Priority
- Messaging: $5,000-8,000
- Notifications: $2,000-3,000
- Payments: $3,000-5,000
- **Subtotal**: $10,000-16,000

**Total**: $18,700-28,600

---

## 🎓 LEARNING RESOURCES

If doing yourself:

1. **Auth Security**: OWASP Authentication Cheat Sheet
2. **React Testing**: Testing Library docs
3. **CI/CD**: GitHub Actions tutorial
4. **Performance**: Web.dev performance guides
5. **WebSocket**: Django Channels docs

---

## ✅ NEXT IMMEDIATE STEPS

1. Run database migrations (5 min)
2. Fix auth backend (2-3 days)
3. Consolidate auth pages (3.5 hours)
4. Set production environment (30 min)
5. Add error monitoring (1 hour)

**Total**: ~4 days to production-ready

---

## 📞 SUPPORT NEEDED?

If you need help with any task:
1. Auth fixes - Backend developer (Django)
2. Mobile responsive - Frontend developer (React/Next.js)
3. Testing - QA engineer
4. DevOps - CI/CD setup
5. Features - Full-stack developer

**Recommendation**: Focus on Critical tasks first, then High priority. Low priority can wait until after launch.
