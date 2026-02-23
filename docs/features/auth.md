# Auth Feature

Handles user authentication — login, registration, session persistence, and route protection.

## Routes

| Path | Component | Guard | Role |
|------|-----------|-------|------|
| `/login` | `LoginPage` | None | Public |
| `/register` | `RegisterPage` | None | Public |
| `/student/projects` | _(other dev)_ | `RequireRole("STUDENT")` | STUDENT |
| `/supervisor/dashboard` | _(other dev)_ | `RequireRole("SUPERVISOR")` | SUPERVISOR |

---

## Component Tree

```
LoginPage
└── LoginForm          — email + password fields, client-side validation, error display

RegisterPage
└── RegisterForm       — first/last name, email, password, confirm password fields
```

---

## Pages

### `LoginPage` (`src/features/auth/pages/LoginPage.tsx`)

Full-page centered layout with gradient background orbs.

- Logo links back to `/`
- Renders `LoginForm`
- Link to `/register`

### `RegisterPage` (`src/features/auth/pages/RegisterPage.tsx`)

Identical layout to `LoginPage`.

- Logo links back to `/`
- Renders `RegisterForm`
- Link to `/login`
- Footer: terms & privacy policy notice

---

## Forms

### `LoginForm` (`src/features/auth/components/LoginForm.tsx`)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSuccess` | `() => void` | No | Called after a successful login |

**Validation (client-side):**

| Field | Rules |
|-------|-------|
| `email` | Required, valid email format |
| `password` | Required, min 8 characters |

**Error handling:**

- `VALIDATION_ERROR` → field-level errors rendered below each input
- `CONFLICT` / other → general error banner above the form
- Network/unexpected errors → general banner with "Something went wrong"

### `RegisterForm` (`src/features/auth/components/RegisterForm.tsx`)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSuccess` | `() => void` | No | Called after a successful registration |

**Validation (client-side):**

| Field | Rules |
|-------|-------|
| `firstName` | Required, non-empty |
| `lastName` | Required, non-empty |
| `email` | Required, valid email format |
| `password` | Required, min 8 characters |
| `confirmPassword` | Required, must match `password` |

**Note:** Role is hardcoded to `STUDENT`. Supervisor accounts are created by admins only.

---

## Hook — `useAuth` (`src/features/auth/hooks/useAuth.ts`)

Central auth state hook. Must be used inside a component tree that has `BrowserRouter` (provided by `AppProviders`).

```typescript
const { user, isLoading, error, login, register, logout, clearError } = useAuth();
```

### Return values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `AuthUser \| null` | Currently authenticated user; rehydrated from localStorage on mount |
| `isLoading` | `boolean` | True while a login/register request is in flight |
| `error` | `ApiError \| null` | Last error from login/register; cleared by `clearError()` or a new submission |
| `login(body)` | `Promise<void>` | Submits credentials; stores tokens + user; navigates to role home on success |
| `register(body)` | `Promise<void>` | Submits registration; stores tokens + user; navigates to role home on success |
| `logout()` | `void` | Clears all stored auth data; navigates to `/` |
| `clearError()` | `void` | Resets `error` to `null` |

### Post-auth navigation

| Role | Redirects to |
|------|-------------|
| `STUDENT` | `/student/projects` |
| `SUPERVISOR` | `/supervisor/dashboard` |
| Unknown | `/` |

---

## API — `authApi` (`src/features/auth/api/authApi.ts`)

Thin wrapper around `apiClient`. Toggle `USE_MOCK` to switch between mock and real backend.

```typescript
// Login
const res: AuthResponse = await authApi.login({ email, password });

// Register
const res: AuthResponse = await authApi.register({ firstName, lastName, email, password, role });
```

### Mock mode

`USE_MOCK = true` (default during development). Returns a fixture `AuthResponse` after a 600 ms simulated delay.

**Switch to `false` before connecting to the backend.** Mock credentials must never reach a production build.

---

## Service — `tokenStorage` (`src/services/tokenStorage.ts`)

Persists auth data across page reloads using `localStorage`.

```typescript
import { tokenStorage } from '@/services/tokenStorage';

tokenStorage.getAccessToken();        // string | null
tokenStorage.setAccessToken(token);
tokenStorage.getRefreshToken();       // string | null
tokenStorage.setRefreshToken(token);
tokenStorage.getUser();               // StoredUser | null
tokenStorage.setUser(user);
tokenStorage.clearAll();              // call on logout — clears all three keys
```

### `StoredUser` type

```typescript
type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};
```

**Security note:** `localStorage` is readable by any JavaScript on the page. If XSS is a concern, prefer `httpOnly` cookies — this requires a backend change. Route guards are UI-only; the backend must enforce role-based access on every protected API endpoint.

---

## Route Guards (`src/app/routes/route-guards.tsx`)

| Guard | Behaviour |
|-------|-----------|
| `RequireAuth` | Redirects to `/login` if no access token in storage |
| `RequireRole({ role })` | Redirects to `/login` if unauthenticated; to `/` if wrong role |
| `RequireGuest` | Redirects authenticated users to their role home (use on `/login`, `/register` if needed) |

All guards read directly from `tokenStorage` — no React Context required.

```tsx
// Usage in routes.tsx
<Route element={<RequireRole role="STUDENT" />}>
  <Route path="/student/projects" element={<StudentProjectsPage />} />
</Route>
```

---

## Types (`src/features/auth/types.ts`)

| Type | Description |
|------|-------------|
| `UserRole` | `'SUPERVISOR' \| 'STUDENT'` |
| `AuthUser` | Authenticated user profile returned by the backend |
| `LoginRequest` | POST `/api/auth/login` body |
| `RegisterRequest` | POST `/api/auth/register` body |
| `AuthResponse` | Successful auth response — `accessToken`, `refreshToken`, `user` |

---

## Switching to the Real Backend

1. Set `USE_MOCK = false` in `src/features/auth/api/authApi.ts`
2. Ensure `VITE_API_BASE_URL` in `.env` points to the running backend
3. Verify `apiClient` interceptors handle token refresh (see `src/services/apiClient.ts`)
