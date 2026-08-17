# Looker CORS API & OAuth 2.0 PKCE Architecture

This guide explains the architecture of direct browser-to-Looker API communication via CORS and OAuth 2.0 with Proof Key for Code Exchange (PKCE).

---

## 1. Why Direct Browser CORS + OAuth?

Traditional embedded BI architectures require a backend server (BFF) to securely store Looker API client secrets (`client_id` / `client_secret`) and proxy data queries between the browser and Looker.

### The Direct Browser CORS Architecture:
* **Zero Backend**: Single-Page Applications (React, Vue, Svelte, vanilla TS) interact directly with Looker's API 4.0 endpoints (`/api/4.0/queries/run/json`, `/api/4.0/user`, etc.).
* **Public Client Security**: Browser applications cannot securely hold a `client_secret`. OAuth 2.0 with PKCE (RFC 7636) eliminates the secret requirement using dynamic cryptographic verification (`code_verifier` and `code_challenge`).
* **True Governance & Row-Level Security (RLS)**: The application acts directly on behalf of the authenticated user. Looker applies user permissions, access filters, user attributes, and caching policies automatically.

---

## 2. End-to-End Authentication Sequence

```
┌─────────┐                ┌────────────────┐                ┌─────────────┐
│ Browser │                │  Looker Auth   │                │ Looker API  │
│ React   │                │ (/auth, /token)│                │   (CORS)    │
└────┬────┘                └───────┬────────┘                └──────┬──────┘
     │                             │                                │
     │ 1. Gen verifier & challenge │                                │
     │ 2. Save verifier in storage │                                │
     │ 3. Redirect to /auth ──────>│                                │
     │                             │ 4. User logs in & grants       │
     │                             │    consent to Client ID        │
     │ 5. Redirect to redirect_uri │                                │
     │    with authorization_code <│                                │
     │                             │                                │
     │ 6. POST /api/token ────────>│                                │
     │    (code + code_verifier)   │                                │
     │ 7. Return access_token <────│                                │
     │ 8. Save token in storage    │                                │
     │                             │                                │
     │ 9. GET /api/4.0/user (Bearer token) ────────────────────────>│
     │    (Returns logged-in user profile & verifies session) <─────│
     │                             │                                │
     │ 10. POST /api/4.0/queries/run/json (Bearer token) ──────────>│
     │     (Executes governed LookML query with RLS) <──────────────│
```

---

## 3. Looker Instance Requirements

To enable direct browser CORS API access:

1. **Enable Looker API CORS** (Admin > Labs > Looker API CORS):
   Ensure CORS API access is enabled on the instance.
2. **Register OAuth Client Application** (Admin > Platform > API Explorer or Admin API):
   * `client_guid`: Unique identifier for the app (e.g., `looker-oauth-app`).
   * `redirect_uri`: The exact callback URL (e.g., `https://localhost:3000/callback` or `https://app.company.com/callback`).
   * `display_name`: Human-readable name shown on the user consent prompt.
   * `enabled`: `true`.
3. **Embedded Domain Allowlist** (Admin > Embed):
   * Add the frontend origin (e.g., `https://localhost:3000` or `https://app.company.com`) to the Embedded Domain Allowlist.
   * Looker inspects incoming requests and adds `Access-Control-Allow-Origin: <origin>` and `Access-Control-Allow-Credentials: true` headers.
4. **HTTPS Protocol**:
   * The browser application **must** be served over HTTPS. Browser Web Crypto APIs (`window.crypto.subtle`) and Looker OAuth endpoints reject insecure HTTP origins.
