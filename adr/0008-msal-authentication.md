# ADR-0008: MSAL.js Authentication with Feature Flag

## Status

Accepted

## Context

Meridian backend v0.13.0 introduced an `AUTH_ENABLED` feature flag for Azure AD/Entra ID authentication. When off (the default), every request receives a synthetic `_LOCAL_USER` with `roles=["operator"]` — no Bearer token required. When on, the backend validates JWT tokens issued by Azure AD. Studio needs the ability to acquire and attach tokens so it works seamlessly when auth is activated.

The integration must be additive: zero behavioral change when the flag is off, full MSAL flow when on. This mirrors the backend's approach — deploy first, activate later.

## Decision

Integrate **MSAL.js** (`@azure/msal-browser` + `@azure/msal-react`) behind a `VITE_AUTH_ENABLED` environment variable. When the flag is `false` (default), no MSAL code initializes, no tokens are acquired, and the app behaves identically to v0.10.0.

### Feature flag

A single boolean in `src/config/index.ts` gates the entire auth system:

```typescript
authEnabled: import.meta.env.VITE_AUTH_ENABLED === 'true',
```

All auth code checks this flag first. When false:
- No `PublicClientApplication` is created
- No `MsalProvider` renders
- No `Authorization` header is sent
- No login/logout UI appears

### Token acquisition flow

1. **Silent-first**: `acquireTokenSilent()` checks the MSAL token cache (localStorage). If a valid token exists, it's returned immediately.
2. **Refresh**: If the access token is expired but the refresh token is valid, MSAL refreshes silently in a hidden iframe.
3. **Interactive fallback**: If silent acquisition fails (e.g., refresh token expired), `acquireTokenRedirect()` redirects to Azure AD login.

A shared `getAuthHeaders()` utility encapsulates this flow. Both the centralized fetch wrapper (`client.ts`) and the raw fetch in `meridianApi.query()` call this function before every request.

### Provider pattern

Follows the established `DiagnosticsProvider` pattern:

- `AuthContext.ts` — context type definition
- `AuthProvider.tsx` — conditional provider (wraps in `MsalProvider` only when auth enabled; provides "open" context when disabled)
- `useAuth.ts` — consuming hook with error boundary

The provider sits between `QueryClientProvider` and `DiagnosticsProvider` in the component tree.

### Route protection

`AuthGuard` wraps the `<Layout />` route. When auth is enabled and the user is not authenticated, it triggers the MSAL login redirect. The `/welcome` landing page remains public.

### Sidebar user profile

When auth is enabled and the user is authenticated, the sidebar footer shows the user's initials, display name, and a logout button. Collapse-aware — icon-only when the sidebar is collapsed.

### 401 handling

If the backend returns HTTP 401 (token expired between acquisition and request), the fetch wrapper triggers `acquireTokenRedirect()` to force re-authentication.

### Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_AUTH_ENABLED` | `false` | Master switch |
| `VITE_AZURE_CLIENT_ID` | `''` | Azure AD app registration client ID |
| `VITE_AZURE_TENANT_ID` | `''` | Azure AD tenant ID |
| `VITE_AZURE_REDIRECT_URI` | `window.location.origin` | Post-login redirect |
| `VITE_AZURE_API_SCOPE` | `''` | API scope (e.g., `api://meridian-api/.default`) |

### File structure

```
src/auth/
  msalConfig.ts          — MSAL configuration, scopes, singleton instance
  AuthContext.ts          — React context type definition
  AuthProvider.tsx        — Conditional MsalProvider + auth state
  useAuth.ts             — useAuth() hook
  getAuthHeaders.ts      — Async token → header utility
  AuthGuard.tsx          — Route protection component
  UserProfile.tsx        — Sidebar user display + logout
  __tests__/             — Unit + integration tests
```

## Consequences

- Studio gains full Azure AD authentication when `VITE_AUTH_ENABLED=true`
- Zero behavioral change when the flag is off — existing deployments unaffected
- An Azure AD app registration is required before enabling (client ID, tenant ID, redirect URI, API scope)
- Future enhancements: role-based route gating, per-role UI visibility, token claim inspection in diagnostics panel
- MSAL token cache uses localStorage (consistent with existing sidebar, theme, and feedback persistence)
- The `getAuthHeaders()` pattern is reusable for any future API client that needs auth
