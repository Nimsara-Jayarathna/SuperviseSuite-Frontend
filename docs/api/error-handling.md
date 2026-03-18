# Frontend API Response + Error Handling

This document describes how the frontend consumes the backend's standardized response envelope.

Related:
- Backend contract: `SuperviseSuite-Backend/docs/api-response-contract.md`
- Frontend implementation: `src/services/apiClient.ts`

## 1) Backend Envelope

### Success

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "...",
    "path": "/api/...",
    "traceId": null
  }
}
```

### Error

```json
{
  "success": false,
  "message": "...",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "status": 400,
    "details": []
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/...",
    "traceId": null
  }
}
```

## 2) Frontend Normalization Strategy

`apiClient` is the central normalization layer:

- **Success path**: unwraps envelope and returns plain `data` (`Promise<T>`), so feature code keeps using DTOs/arrays directly.
- **Error path**: converts wrapped backend errors into a normalized `ApiError` object and throws `ApiException`.

Feature hooks/components should consume:
- `isApiException(error)`
- `error.apiError`

They should not parse raw backend envelopes directly.

## 3) Types

Defined in `src/types/index.ts`:

- `ApiMeta`
- `ApiErrorDetail`
- `ApiErrorBody` (nested backend `error` block)
- `ApiResponse<T>` (full envelope)
- `ApiError` (normalized frontend error shape used by UI)

## 4) 401 Refresh + Retry Rules

Implemented in `src/services/apiClient.ts`:

- For **protected endpoints** (`/api/...` excluding `/api/auth/*`):
  - first `401` -> attempt `POST /api/auth/refresh`
  - if refresh succeeds -> retry original request once
  - if refresh fails -> clear auth state and redirect to `/login`

- For **auth endpoints** (`/api/auth/*`):
  - `401` does **not** trigger refresh retry
  - examples: invalid login credentials, refresh endpoint failures

This prevents incorrect refresh attempts on login failures.

## 5) Validation Error Mapping

Validation remains driven by `ApiError.details[]` and continues to support:
- `field`
- `issue` (primary backend field)
- `message` (optional compatibility alias)

Used by:
- `src/features/auth/utils/loginValidation.ts`
- `src/features/auth/utils/registerValidation.ts`

## 6) Network Failure Fallback

If `fetch` fails before an HTTP response (offline/DNS/etc.), `apiClient` synthesizes:
- `code: SERVICE_UNAVAILABLE`
- `status: 503`
- user-safe fallback message

So callers still receive a typed `ApiException` with consistent structure.

## 7) Test Coverage (Recent)

Updated tests in:
- `src/services/apiClient.test.ts`

Covered scenarios:
- wrapped success parsing
- wrapped error parsing
- login failure (`/api/auth/login`) does not refresh
- validation error details mapping preservation
- protected endpoint 401 refresh + retry
- refresh failure path (clear auth + redirect flow)
- no recursive refresh for `/api/auth/refresh`
