# GharBazar Testing Standards

## Overview

This document outlines the testing standards and best practices for the GharBazar project. All code changes must follow these guidelines to maintain code quality and prevent regressions.

## Test Framework Setup

### Frontend Testing Stack
- **Test Runner**: Vitest v4.1.2
- **Testing Library**: React Testing Library v16
- **Mocking**: Vitest's built-in mocking via `vi.mock()`
- **DOM Testing**: JSDOM environment

### Backend Testing Stack
- **Framework**: Django TestCase / DRF APITestCase
- **Coverage**: python-coverage
- **Mocking**: unittest.mock

## Frontend Testing Guidelines

### 1. Test File Organization

Test files should be placed in the `test/` directory mirroring the source structure:
```
test/
├── modules/
│   ├── auth/
│   │   └── api.test.ts
│   ├── properties/
│   │   └── api.test.ts
│   ├── communication/
│   │   └── api.test.ts
│   └── favorites-leads/
│       └── api.test.ts
├── store/
│   └── auth-store.test.ts
├── lib/
│   └── idempotent-actions.test.ts
├── app/
│   ├── create-property-guard.test.tsx
│   └── dashboard-add-property-guard.test.tsx
└── setup.ts
```

### 2. API Testing Patterns

For API modules (auth, properties, chat, etc.), follow this pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import http from "@/services/http";

// Mock the HTTP client
vi.mock("@/services/http");

describe("Feature API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("methodName", () => {
    it("should handle success case", async () => {
      const mockResponse = { data: { /* response data */ } };
      (http.get as any).mockResolvedValue(mockResponse);

      const result = await http.get("/endpoint/");

      expect(http.get).toHaveBeenCalledWith("/endpoint/");
      expect(result.data).toEqual(mockResponse.data);
    });

    it("should handle error case", async () => {
      const mockError = new Error("API Error");
      (http.get as any).mockRejectedValue(mockError);

      await expect(http.get("/endpoint/")).rejects.toThrow("API Error");
    });
  });
});
```

### 3. Store Testing Patterns

For Zustand store tests, use `getState()` and `setState()` directly:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/store/auth-store";

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset state before each test
    useAuthStore.setState({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
    });
  });

  it("should set user and tokens", () => {
    useAuthStore.setState({ user: mockUser, tokens: mockTokens });
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
  });
});
```

### 4. Component Testing Patterns

For React components, use React Testing Library:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### 5. Test Coverage Expectations

**Target Coverage**:
- `auth` module: 90%+ (critical for security)
- `properties` module: 85%+ (core feature)
- `communication` (chat) module: 85%+
- Store (state management): 90%+
- Common utilities: 80%+

**Minimum Coverage**:
- All happy paths for critical APIs
- All common error cases
- Edge cases for business logic

## Backend Testing Guidelines

### 1. Service Layer Tests

Test services independently with mocked dependencies:

```python
from django.test import TestCase
from unittest.mock import Mock, patch
from apps.users.services import UserService

class UserServiceTests(TestCase):
    def test_email_otp_creation(self):
        service = UserService()
        email = "user@example.com"
        
        otp = service.create_email_otp(email)
        
        self.assertIsNotNone(otp)
        self.assertEqual(len(otp), 6)
```

### 2. API Endpoint Tests

Test endpoints with realistic request/response flows:

```python
from rest_framework.test import APITestCase
from rest_framework import status

class AuthAPITests(APITestCase):
    def test_email_otp_verification(self):
        response = self.client.post('/auth/email/verify/', {
            'email': 'test@example.com',
            'otp': '123456'
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
```

### 3. Permission Tests

Always test permission checks on endpoints:

```python
def test_unauthorized_access_denied(self):
    # Test without authentication
    response = self.client.get('/conversations/')
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

def test_forbidden_access_denied(self):
    # Test user accessing another user's resource
    self.client.force_authenticate(user=self.user1)
    response = self.client.get(f'/conversations/{self.user2_conversation.id}/')
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

## Important Test Cases by Feature

### Authentication
- [x] Email OTP request
- [x] Email OTP verification
- [x] Google OAuth token verification
- [x] Token refresh
- [x] Logout
- [x] Current user fetch
- [x] Email conflict detection (same email, different auth method)

### Properties
- [x] List properties with filters
- [x] Create property (draft state)
- [x] Update property
- [x] Publish property
- [x] Delete property
- [x] Empty list handling

### Chat/Messaging
- [x] Get conversations
- [x] Get messages from conversation
- [x] Send message
- [x] Mark as read
- [x] Create conversation
- [x] Rate limiting enforcement
- [x] Typing indicator events
- [x] Message status (queued/sending/delivered/read)

### Favorites & Leads
- [x] Add to favorites
- [x] Remove from favorites
- [x] Check if favorited
- [x] Get user's leads
- [x] Create lead from inquiry
- [x] Update lead status
- [x] Lead status transitions

## Running Tests

### Frontend Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- test/modules/auth/api.test.ts
```

### Backend Tests
```bash
# Run all backend tests
python manage.py test

# Run tests for specific app
python manage.py test apps.users

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Test Quality Checklist

Before submitting code review:
- [ ] All new features have corresponding tests
- [ ] Tests follow the patterns documented here
- [ ] Test names clearly describe what is being tested
- [ ] No skipped tests (`it.skip()` or `fit()`)
- [ ] Mock data is realistic and representative
- [ ] Both success and error paths are tested
- [ ] Edge cases are covered (empty lists, null values, network errors)
- [ ] Tests pass locally and on CI/CD
- [ ] No hard-coded timeouts or race conditions

## Common Testing Patterns and Antipatterns

### ✅ Good Patterns
```typescript
// Good: Clear test name, specific assertions
it("should return 401 when email OTP is invalid", async () => {
  const mockError = { response: { data: { detail: "Invalid OTP" } } };
  (http.post as any).mockRejectedValue(mockError);
  
  await expect(http.post("/auth/email/verify/", { ... })).rejects.toThrow();
});

// Good: Test happy path AND error paths
beforeEach(() => vi.clearAllMocks());

// Good: Use realistic mock data
const mockProperty = {
  id: "prop-1",
  title: "Cozy Apartment",
  price: 2000,
  // ... realistic complete object
};
```

### ❌ Antipatterns
```typescript
// Bad: Generic test name, unclear what is being tested
it("should work", () => { ... });

// Bad: Testing implementation details instead of behavior
it("should call setLoading with true", () => { ... });

// Bad: Not clearing mocks between tests
describe("Something", () => {
  // Missing beforeEach(() => vi.clearAllMocks());
});

// Bad: Hard-coded delays
it("should show message after delay", async () => {
  await new Promise(r => setTimeout(r, 1000));
  expect(message).toBeVisible();
});
```

## Current Test Status (26 Jan 2025)

**Test Coverage Summary**:
- **Total Tests**: 73 passing
- **Test Files**: 8
- **Coverage**: 60%+ for critical paths

**Tested Modules**:
- ✅ Auth API (10 tests)
- ✅ Auth Store (9 tests)
- ✅ Properties API (10 tests)
- ✅ Communication/Chat API (14 tests)
- ✅ Favorites/Leads/Contacts API (18 tests)
- ✅ Idempotent Actions (8 tests)
- ✅ Property Creation Guards (4 tests)

**Next Priority**:
1. Add backend permission tests
2. Add backend integration tests for chat
3. Add E2E test for complete auth -> property -> chat flow
4. Increase backend test coverage to 75%

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [DRF Testing Guide](https://www.django-rest-framework.org/api-guide/testing/)
