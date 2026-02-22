# Frontend Error Handling

This document describes how the frontend implements the backend API error contract.

## Related

- Backend contract: `SuperviseSuite-Backend/docs/api/error-handling.md`

---

## A) Types (`src/types/index.ts`)

Four types mirror the backend contract exactly:

| Type | Purpose |
|---|---|
| `ApiErrorCode` | Union of all 8 stable error code strings |
| `ApiErrorDetail` | Field-level validation detail `{ field, issue }` |
| `ApiError` | Full backend error response payload |
| `ApiResponse<T>` | Generic success response wrapper |

### ApiErrorCode Values

| Code | HTTP | UI Action |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Show field errors from `details[]` |
| `BAD_REQUEST` | 400 | Show generic input error, allow retry |
| `UNAUTHORIZED` | 401 | Redirect to login / refresh session |
| `FORBIDDEN` | 403 | Show permission denied message |
| `NOT_FOUND` | 404 | Show not found / empty state |
| `CONFLICT` | 409 | Show conflict message, refresh data |
| `SERVICE_UNAVAILABLE` | 503 | Show retry option |
| `INTERNAL_ERROR` | 500 | Show generic error, allow retry |

---

## B) API Client (`src/services/apiClient.ts`)

### `ApiException`

A typed error class that extends `Error` and carries the full `ApiError` payload.
Thrown by `apiClient` on all non-2xx responses and network failures.

```typescript
import { apiClient, isApiException } from '@/services/apiClient';

try {
  const result = await apiClient.post('/api/auth/login', body);
} catch (err) {
  if (isApiException(err)) {
    // err.apiError is the full typed ApiError
    console.log(err.apiError.code);    // e.g. 'UNAUTHORIZED'
    console.log(err.apiError.message); // safe to show to user
    console.log(err.apiError.details); // field errors for VALIDATION_ERROR
  }
}
```

### `isApiException(error)`

Type guard to safely narrow an unknown caught error to `ApiException`.
Always use this before accessing `err.apiError`.

### `apiClient` methods

| Method | Usage |
|---|---|
| `apiClient.get<T>(path)` | GET request |
| `apiClient.post<T>(path, body)` | POST request with JSON body |
| `apiClient.put<T>(path, body)` | PUT request with JSON body |
| `apiClient.patch<T>(path, body)` | PATCH request with JSON body |
| `apiClient.del<T>(path)` | DELETE request |

All methods:
- Automatically attach `Authorization: Bearer <token>` when a token is present in `tokenStorage`
- Return `Promise<T>` on success
- Throw `ApiException` on all errors (non-2xx responses and network failures)
- Build a synthetic `SERVICE_UNAVAILABLE` `ApiError` when the network is unreachable

---

## C) ErrorState Component (`src/components/feedback/ErrorState.tsx`)

Renders a contextual error message driven by `error.code`.

```typescript
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types';

// Basic usage
<ErrorState error={apiError} />

// With retry button
<ErrorState error={apiError} onRetry={() => refetch()} />
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `error` | `ApiError` | Yes | The ApiError payload from `ApiException.apiError` |
| `onRetry` | `() => void` | No | When provided, renders a "Try Again" button |

### Behaviour by Code

| `code` | Rendered title |
|---|---|
| `VALIDATION_ERROR` | Invalid Input + `details[]` field list |
| `BAD_REQUEST` | Bad Request |
| `UNAUTHORIZED` | Session Expired |
| `FORBIDDEN` | Access Denied |
| `NOT_FOUND` | Not Found |
| `CONFLICT` | Conflict |
| `SERVICE_UNAVAILABLE` | Service Unavailable + retry button if `onRetry` given |
| `INTERNAL_ERROR` | Something Went Wrong + retry button if `onRetry` given |

---

## D) Usage Pattern in Features

The standard pattern for any feature hook or API call:

```typescript
import { apiClient, isApiException } from '@/services/apiClient';
import type { ApiError } from '@/types';

// In a hook or handler:
async function fetchData() {
  try {
    const result = await apiClient.get<MyType>('/api/resource');
    // handle success
  } catch (err) {
    if (isApiException(err)) {
      const { code, message, details } = err.apiError;
      // Drive UI from code:
      if (code === 'UNAUTHORIZED') { /* redirect to login */ }
      if (code === 'VALIDATION_ERROR') { /* show details[] in form */ }
      // Or pass err.apiError directly to <ErrorState error={err.apiError} />
    }
  }
}
```

---

## E) Network Error Handling

When `fetch` itself throws (network down, timeout, DNS failure), `apiClient` catches it
and synthesises an `ApiError` with `code: SERVICE_UNAVAILABLE`. This means callers always
receive an `ApiException` with a consistent `ApiError` shape — no special network-error
branch needed.
