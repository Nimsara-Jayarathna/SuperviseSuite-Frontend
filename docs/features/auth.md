# Auth Feature

Handles user authentication — login, registration, session persistence, and route protection.

## Routes

| Path | Component | Guard | Role |
|------|-----------|-------|------|
| `/login` | `LoginPage` | `RequireGuest` | Public (redirects authenticated users) |
| `/register` | `RegisterPage` | `RequireGuest` | Public (redirects authenticated users) |
| `/student/*` | `StudentLayout` + pages | `RequireRole("STUDENT")` | STUDENT |
| `/supervisor/*` | `SupervisorLayout` + pages | `RequireRole("SUPERVISOR")` | SUPERVISOR |
| `*` (catch-all) | `LegacyDashboardRedirect` | None | Redirects to role home or `/login` |

---

## Component Tree

```
LoginPage
└── LoginForm          — email + password fields, client-side validation, error display

RegisterPage
└── RegisterForm       — first/last name, registration number, email, password, confirm password fields
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
| `onSubmit` | `(data: RegisterRequest) => Promise<void>` | Yes | Called with the validated payload; caller (page or modal) handles the API call |
| `isLoading` | `boolean` | Yes | Disables the form and shows a spinner while the request is in flight |
| `error` | `ApiError \| null` | Yes | Backend error; field-level errors shown inline, general errors in a banner |
| `onClearError` | `() => void` | Yes | Called at the start of each submission to clear the previous error |
| `onSuccess` | `() => void` | No | Called after `onSubmit` resolves successfully |

**Validation (client-side):**

| Field | Rules |
|-------|-------|
| `firstName` | Required, non-empty |
| `lastName` | Required, non-empty |
| `registrationNumber` | Required, non-empty |
| `email` | Required, valid email format |
| `password` | Required, min 8 characters |
| `confirmPassword` | Required, must match `password` |

**Note:** Registration currently creates student accounts only. Supervisor accounts are still assumed to come from an admin-managed flow.

---

## Hook — `useAuth` (`src/features/auth/hooks/useAuth.ts`)

Central auth state hook. Must be used inside a component tree that has `BrowserRouter` (provided by `AppProviders`).

```typescript
const { user, isLoading, error, login, register, logout, clearError } = useAuth();
```

### Return values

| Property | Type | Description |
|----------|------|-------------|
| `user` | `AuthUser \| null` | Currently authenticated user; rehydrated from `localStorage` on mount |
| `isLoading` | `boolean` | True while a login/register request is in flight |
| `error` | `ApiError \| null` | Last error from login/register; cleared by `clearError()` or a new submission |
| `login(body)` | `Promise<void>` | Submits credentials; stores user profile in `localStorage`; navigates to role home on success. Tokens are set as httpOnly cookies by the backend — never touched by JS. |
| `register(body)` | `Promise<void>` | Submits registration; navigates to `/login` on success — no session created on registration |
| `logout()` | `Promise<void>` | Calls `POST /api/auth/logout` to revoke the refresh token server-side; clears `localStorage`; navigates to `/` |
| `clearError()` | `void` | Resets `error` to `null` |

### Post-auth navigation

| Role | Redirects to |
|------|-------------|
| `STUDENT` | `/student/projects` |
| `SUPERVISOR` | `/supervisor` |
| Unknown | `/` |

> **Note:** This table applies to `login()` only. `register()` always navigates to `/login` regardless of role — no session is created on registration.

---

## Hook — `useRegister` (`src/features/auth/hooks/useRegister.ts`)

Narrow hook that owns only the student registration concern (Interface Segregation).
Consumers of this hook are not burdened with login, logout, or user-session state.

```typescript
const { register, isLoading, error, clearError } = useRegister();
```

### Return values

| Property | Type | Description |
|----------|------|-------------|
| `register(body)` | `Promise<void>` | Posts `RegisterRequest` to the backend; navigates to `/login` on success |
| `isLoading` | `boolean` | True while the request is in flight |
| `error` | `ApiError \| null` | Last error from the registration request; cleared by `clearError()` or the next submission |
| `clearError()` | `void` | Resets `error` to `null` |

> **Composition pattern:** `RegisterPage` and `AuthModal` both wire `useRegister()` into `<RegisterForm>` props. `RegisterForm` itself has no hook dependency — it only receives callbacks and data (Dependency Inversion).

---

## Utilities — `registerValidation` (`src/features/auth/utils/registerValidation.ts`)

Pure, stateless validation utilities extracted from `RegisterForm` (Single Responsibility).

| Function | Signature | Description |
|----------|-----------|-------------|
| `validateRegisterForm(fields)` | `(fields) => RegisterFieldErrors` | Client-side validation mirroring backend `@NotBlank`, `@Email`, `@StrongPassword` constraints |
| `mapBackendFieldErrors(error)` | `(ApiError \| null) => RegisterFieldErrors` | Maps `error.details[].issue` onto a field-keyed error map |
| `getGeneralError(error)` | `(ApiError \| null) => string \| null` | Returns the banner message for non-`VALIDATION_ERROR` codes; `null` otherwise |

**Password rules enforced (mirrors `StrongPasswordValidator`):**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

---

## API — `authApi` (`src/features/auth/api/authApi.ts`)

Thin wrapper around `apiClient`. Toggle `USE_MOCK` to switch between mock and real backend.

```typescript
// Login — tokens delivered as httpOnly cookies; only user profile in body
const res: LoginResponse = await authApi.login({ email, password });

// Register — role is NOT sent; backend always assigns STUDENT
const res: RegisterResponse = await authApi.register({ firstName, lastName, registrationNumber, email, password });

// Refresh — exchanges ss_refresh_token cookie for a new pair; called by apiClient 401 interceptor
const res: LoginResponse = await authApi.refresh();

// Logout — revokes refresh token server-side + clears both cookies via Max-Age=0
await authApi.logout();
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate; returns user profile; sets `ss_access_token` + `ss_refresh_token` httpOnly cookies |
| POST | `/api/auth/register` | Create student account; returns user profile; no session created |
| POST | `/api/auth/refresh` | Exchange refresh cookie for new token pair; returns updated user profile |
| POST | `/api/auth/logout` | Revoke refresh token; clear both cookies (`Max-Age=0`) |

### Mock mode

`USE_MOCK = false` (backend connected). Calls the real backend at `VITE_API_BASE_URL`.

Set to `true` only for offline development. Mock credentials must never reach a production build.

---

## Service — `tokenStorage` (`src/services/tokenStorage.ts`)

Persists the user profile across page reloads using `localStorage`. Tokens are **not** stored here — they live exclusively in `HttpOnly` cookies managed by the browser and are invisible to JavaScript.

```typescript
import { tokenStorage } from '@/services/tokenStorage';

tokenStorage.getUser();    // StoredUser | null
tokenStorage.setUser(user);
tokenStorage.clearUser();
tokenStorage.clearAll();   // call on logout — removes ss_user key
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

### What lives where

| Data | Storage | Readable by JS? |
|------|---------|----------------|
| `ss_access_token` JWT | `HttpOnly` cookie (`Path=/api`) | No |
| `ss_refresh_token` | `HttpOnly` cookie (`Path=/api/auth`) | No |
| User profile (`ss_user`) | `localStorage` | Yes |

The user profile in `localStorage` contains only non-sensitive display data (name, email, role). It is used solely to rehydrate UI state on page reload — never for authorization decisions. All real authorization is enforced by the backend.

---

## Route Guards (`src/app/routes/route-guards.tsx`)

| Guard | Behaviour |
|-------|----------|
| `RequireAuth` | Redirects to `/login` if no user profile in `localStorage` |
| `RequireRole({ role })` | Redirects to `/login` if unauthenticated; redirects to role home if authenticated but wrong role |
| `RequireGuest` | Redirects authenticated users to their role home; used on `/login` and `/register` |

All guards read directly from `tokenStorage.getUser()` — no React Context required.

### Cross-role preview

`RequireRole` includes a dev-only bypass controlled by `import.meta.env.DEV`:

- **During `vite dev`** (`DEV = true`): authenticated users can inspect either role's shell. Useful while pages are mock-data-backed.
- **After `vite build`** (`DEV = false`): bypass is disabled. A student visiting `/supervisor/*` is redirected to `/student/projects`.

This is a **UI-only** boundary. The backend enforces role-based access on every protected API endpoint independently.

```tsx
// Usage in routes.tsx
<Route element={<RequireRole role="STUDENT" />}>
  <Route path="/student" element={<StudentLayout />}>
    <Route path="projects" element={<StudentProjectsPage />} />
  </Route>
</Route>
```

---

## Types (`src/features/auth/types.ts`)

| Type | Description |
|------|-------------|
| `UserRole` | `'SUPERVISOR' \| 'STUDENT'` |
| `AuthUser` | Authenticated user profile — `id`, `email`, `role`, `firstName`, `lastName` |
| `LoginRequest` | POST `/api/auth/login` body |
| `RegisterRequest` | POST `/api/auth/register` body — `role` intentionally excluded (server always assigns `STUDENT`) |
| `RegisterResponse` | POST `/api/auth/register` success — newly created student's public profile (no session created) |
| `LoginResponse` | POST `/api/auth/login` and POST `/api/auth/refresh` success — `{ user: AuthUser }`. Tokens are not included; they are delivered as `HttpOnly` cookies. |

---

## Backend Connection Status

All auth endpoints are live (`USE_MOCK = false`).

- `VITE_API_BASE_URL` in `.env` must point to the running backend (default: `http://localhost:8081`)
- `POST /api/auth/register` → creates student account, returns user profile; no session created
- `POST /api/auth/login` → authenticates user, returns user profile; sets `ss_access_token` and `ss_refresh_token` as `HttpOnly; Secure; SameSite=Strict` cookies
- `POST /api/auth/refresh` → silently rotates token pair; called automatically by the `apiClient` 401 interceptor
- `POST /api/auth/logout` → revokes refresh token in the database; clears both cookies via `Max-Age=0`

### Session flow

```
login         → backend sets ss_access_token (15 min) + ss_refresh_token (7 days) as httpOnly cookies
                frontend stores user profile in localStorage only

API request   → browser automatically sends ss_access_token cookie (Path=/api)
401 received  → apiClient calls POST /api/auth/refresh automatically (once)
                on success: retries original request transparently
                on failure: clears localStorage, redirects to /login

auth endpoint 401 (e.g. /api/auth/login, /api/auth/refresh)
              → apiClient does NOT attempt refresh retry
                login failures surface backend message directly (e.g. "Invalid email or password.")

logout        → POST /api/auth/logout revokes refresh token + sets Max-Age=0 on both cookies
                frontend clears localStorage, navigates to /
```

To restore mock mode for offline development, set `USE_MOCK = true` in `authApi.ts`. Mock credentials must never reach a production build.

### Cookie attributes

| Cookie | Path | Max-Age | HttpOnly | Secure | SameSite |
|--------|------|---------|----------|--------|----------|
| `ss_access_token` | `/api` | 900 s (15 min) | Yes | Yes\* | Strict |
| `ss_refresh_token` | `/api/auth` | 604800 s (7 days) | Yes | Yes\* | Strict |

\* `Secure` is `false` in the dev Spring profile so cookies work over plain HTTP locally (see `application-dev.yaml`). Must be `true` in production.
