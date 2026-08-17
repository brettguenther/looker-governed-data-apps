# Looker CORS & OAuth Troubleshooting Guide

This guide covers common issues, root causes, and verified fixes when building Looker CORS OAuth applications.

---

## 1. Session & Token Lost After Redirect / Refresh

### Symptom
User completes Looker OAuth consent, redirects to `/callback`, and then gets redirected back to the login screen instead of seeing the dashboard. Refreshing the browser (F5) also logs the user out.

### Root Cause
`@looker/sdk-rtl`'s standard `OAuthSession` stores `activeToken` in JavaScript heap memory. When the application redirects with `window.location.replace('/')` or when the user refreshes, the JavaScript execution environment resets, clearing the in-memory token.

### Fix
1. Subclass `OAuthSession` into a `PersistentOAuthSession` that syncs `access_token`, `refresh_token`, and `expiresAt` to `sessionStorage`.
2. In the OAuth callback component, avoid hard browser reloads (`window.location.replace`) and use SPA client-side state routing (`window.history.replaceState` or React router state).

---

## 2. Bundler Error: "No matching export in ... for import 'ILooker40SDK'"

### Symptom
When using Vite or esbuild, importing from `@looker/sdk` causes build/dev failure:
```
ERROR: No matching export in "node_modules/@looker/sdk/lib/esm/4.0/methodsInterface.js" for import "ILooker40SDK"
```

### Root Cause
`@looker/sdk`'s root `index.js` exports TypeScript interfaces (`ILooker40SDK`) as runtime values rather than type-only exports (`export type`), which causes esbuild/Vite to fail resolution.

### Fix
Import SDK classes and types directly from subpaths:
```typescript
// Correct
import { Looker40SDK } from '@looker/sdk/lib/4.0/methods';
import type { IUser, IWriteQuery } from '@looker/sdk/lib/4.0/models';

// Avoid root barrel export if using Vite/esbuild
// import { Looker40SDK } from '@looker/sdk';
```

---

## 3. "Invalid Redirect URI" or 400 Bad Request on /auth

### Symptom
Looker displays an error screen: `Invalid redirect_uri` or rejects the authorization request.

### Root Cause
The `redirect_uri` passed in `createAuthCodeRequestUrl()` does not **strictly match** the `redirect_uri` registered in Looker's OAuth client application settings.

### Fix
* Check for trailing slashes (`https://localhost:3000/callback` vs `https://localhost:3000/callback/`).
* Check protocol (`https://` is required).
* Check port (`:3000` vs `:5173`).
* Check exact case and path in Looker OAuth client application registration.

---

## 4. CORS Error: "Blocked by CORS policy: No 'Access-Control-Allow-Origin' header"

### Symptom
Browser blocks `POST /api/token` or `POST /api/4.0/queries/run/json` with a CORS error in DevTools console.

### Root Cause
The frontend origin is not in Looker's Embedded Domain Allowlist, or CORS API is not enabled.

### Fix
1. Go to **Looker Admin > Embed > Embedded Domain Allowlist**.
2. Add your application origin (e.g., `https://localhost:3000` or `https://app.company.com`).
3. Ensure **Admin > Labs > Looker API CORS** is enabled.

---

## 5. Web Crypto / PKCE Error: "crypto.subtle is undefined"

### Symptom
`window.crypto.subtle.digest` fails or throws an undefined error during code challenge generation.

### Root Cause
Browser Web Crypto API requires a **Secure Context** (HTTPS or localhost). If the app is served over plain `http://`, the browser disables `window.crypto.subtle`.

### Fix
* In Vite, use `@vitejs/plugin-basic-ssl` to serve `https://localhost:3000`.
* In production, always serve over TLS (HTTPS).
