# Auth Feature

Handles user authentication — login, registration, session persistence, and route protection.

## Routes

| Path | Component | Guard | Role |
|------|-----------|-------|------|
| `/login` | `LoginPage` | `RequireGuest` | Guest only |
| `/register` | `RegisterPage` | `RequireGuest` | Guest only |
| `/student/projects` | _(other dev)_ | `RequireRole("STUDENT")` | STUDENT |
| `/supervisor/dashboard` | _(other dev)_ | `RequireRole("SUPERVISOR")` | SUPERVISOR |

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

**Note:** `role` is **not** sent from the frontend — the backend always assigns `STUDENT` for public registration. Supervisor accounts are created by admins only.

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
| `register(body)` | `Promise<void>` | Submits registration; navigates to `/login` on success — no tokens stored (student must sign in separately) |
| `logout()` | `void` | Clears all stored auth data; navigates to `/` |
| `clearError()` | `void` | Resets `error` to `null` |

### Post-auth navigation

| Role | Redirects to |
|------|-------------|
| `STUDENT` | `/student/projects` |
| `SUPERVISOR` | `/supervisor/dashboard` |
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
// Login
const res: AuthResponse = await authApi.login({ email, password });

// Register — role is NOT sent; backend always assigns STUDENT
const res: RegisterResponse = await authApi.register({ firstName, lastName, registrationNumber, email, password });
```

### Mock mode

`USE_MOCK = false` (backend connected). Calls the real backend at `VITE_API_BASE_URL`.

Set to `true` only for offline development. Mock credentials must never reach a production build.

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
| `RequireGuest` | Redirects authenticated users to their role home — applied to `/login` and `/register` |

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
| `RegisterRequest` | POST `/api/auth/register` body — `role` intentionally excluded (server assigns `STUDENT`) |
| `RegisterResponse` | POST `/api/auth/register` success — newly created student's public profile (no tokens issued) |
| `AuthResponse` | POST `/api/auth/login` success — `accessToken`, `refreshToken`, `user` |

---

## Backend Connection Status

The registration and login endpoints are both connected to the real backend (`USE_MOCK = false`).

- `VITE_API_BASE_URL` in `.env` must point to the running backend (default: `http://localhost:8081`)
- `POST /api/auth/register` → creates student account, returns user profile (no tokens issued)
- `POST /api/auth/login` → authenticates user, returns tokens + user profile

To restore mock mode for offline development, set `USE_MOCK = true` in `authApi.ts`. Mock credentials must never reach a production build.
