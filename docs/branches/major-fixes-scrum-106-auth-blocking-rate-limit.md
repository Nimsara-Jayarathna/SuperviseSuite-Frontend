# Major Fixes: SCRUM-106 Auth Blocking + Rate-Limit UX

## Summary

This branch moved authentication and severe network error handling to a blocking modal model and aligned registration with a hard precondition on backend configuration.

## Frontend Behavior Contract

### Blocking severity

Errors are treated as blocking when either of these is true:
- `error.code` is `TOO_MANY_REQUESTS` or `SERVICE_UNAVAILABLE`
- `error.status` is `429` or `503`

Implemented in:
- `src/utils/errorSeverity.ts`
- `src/features/auth/utils/authErrorModel.ts`

### Global blocking modal

Student and supervisor app-shell pages now route blocking errors to a global `RequestStateModal` instead of inline banners.

Behavior:
- Blocking error opens modal with severity title.
- Retry triggers the page reload callback.
- During retry, modal switches to `loading` state (`Retrying request`).
- No close action for global blocking modal (prevents empty-page close outcomes).

Implemented in:
- `src/app/layout/AppShell.tsx`
- `src/app/layout/BlockingErrorContext.tsx`
- `src/components/ui/RequestStateModal.tsx`

### Registration config hard-fail guard

Registration flow now requires a successful `/api/auth/register/config` fetch.

Behavior:
- Success -> registration panel opens.
- Failure -> panel stays closed and blocking modal appears.
- Retry -> reattempts config fetch.

Implemented in:
- `src/features/auth/api/authApi.ts`
- `src/features/landing/pages/LandingPage.tsx`
- `src/features/auth/components/AuthModal.tsx`

## API Expectations Used By Frontend

- `429 TOO_MANY_REQUESTS` for rate-limited requests.
- `503 SERVICE_UNAVAILABLE` for backend unavailability/offline fallback.
- Registration config endpoint: `GET /api/auth/register/config` is required before opening registration flow.

## Test Coverage Added In This Branch

- `src/app/layout/AppShell.test.tsx`
- `src/components/ui/RequestStateModal.test.tsx`
- `src/features/auth/api/authApi.test.ts`
- `src/features/landing/pages/LandingPage.test.tsx`
- `src/features/auth/utils/authErrorModel.test.ts`
- `src/utils/errorSeverity.test.ts`
- `src/features/auth/components/registration/Step1EmailInput.test.tsx`
- `src/features/auth/components/registration/Step4ProfileDetails.test.tsx`

## Suggested FE Verification Commands

```bash
npm run typecheck
npx vitest run --config vitest.config.ts
```
