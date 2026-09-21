/**
 * One-shot loopback HTTP listener and cross-platform browser launcher used by
 * the interactive OAuth flow.
 *
 * The listener binds to 127.0.0.1 only (never 0.0.0.0) and validates the OAuth
 * `state` parameter before accepting an authorization code, which prevents a
 * malicious local page from injecting a code into our callback.
 */

import http from 'http';
import { spawn } from 'child_process';

export const DEFAULT_TIMEOUT_MS = 300_000;

/**
 * True when this process has no way to render a browser window: a headless
 * Linux host (no X/Wayland display) or a session reached over SSH.
 *
 * On such hosts `spawn('xdg-open')` still resolves successfully while opening
 * nothing, so we cannot rely on the spawn result alone to decide whether the
 * user needs the authorization URL printed for manual paste.
 */
export const isHeadless = (): boolean => {
  if (process.env.SSH_CONNECTION || process.env.SSH_TTY) return true;
  if (process.platform === 'darwin' || process.platform === 'win32') return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

const successPage = (instance: string): string => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Looker CLI authenticated</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
         background:#0f172a; color:#f8fafc; display:flex; align-items:center;
         justify-content:center; height:100vh; margin:0; }
  .card { text-align:center; border:1px solid #334155; border-radius:16px;
          padding:40px 56px; background:#1e293b; }
  h1 { font-size:18px; margin:0 0 8px; }
  p  { font-size:13px; color:#94a3b8; margin:0; }
</style></head>
<body><div class="card">
  <h1>Authentication successful</h1>
  <p>Signed in to ${instance}. You can close this tab and return to your terminal.</p>
</div></body></html>`;

const failurePage = (message: string): string => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Looker CLI authentication failed</title></head>
<body style="font-family:sans-serif;padding:40px">
  <h1>Authentication failed</h1><p>${message}</p>
</body></html>`;

/**
 * Opens the system browser. Never throws: if no handler is available the caller
 * falls back to printing the URL for manual paste.
 */
export const openBrowser = (url: string): boolean => {
  const platform = process.platform;
  const [cmd, args] =
    platform === 'darwin'
      ? ['open', [url]]
      : platform === 'win32'
        ? ['cmd', ['/c', 'start', '""', url]]
        : ['xdg-open', [url]];

  try {
    const child = spawn(cmd, args, { stdio: 'ignore', detached: true });
    child.on('error', () => {
      /* handled by caller printing the URL */
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
};

export interface LoopbackResult {
  code: string;
}

/**
 * Starts a single-use listener on 127.0.0.1:<port> and resolves with the
 * authorization code once Looker redirects back.
 */
export const awaitAuthorizationCode = (
  port: number,
  expectedState: string,
  instanceLabel: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<LoopbackResult> => {
  return new Promise<LoopbackResult>((resolve, reject) => {
    let settled = false;

    const server = http.createServer((req, res) => {
      const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);

      if (requestUrl.pathname !== '/callback') {
        // Reaching this branch means the listener (and any SSH tunnel in front
        // of it) is healthy, so say so rather than implying a failure.
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(
          'Looker CLI callback listener is running and waiting.\n\n' +
            'This URL is not the sign-in page. Paste the authorization URL printed\n' +
            'in your terminal into this browser instead; Looker will redirect back\n' +
            `to http://localhost:${port}/callback when you approve.\n`
        );
        return;
      }

      const code = requestUrl.searchParams.get('code');
      const state = requestUrl.searchParams.get('state');
      const error = requestUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(failurePage(`Looker returned an error: ${error}`));
        finish(new Error(`Looker denied the authorization request: ${error}`));
        return;
      }

      // CSRF defense: reject and keep listening rather than accepting the code.
      if (!state || state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(failurePage('State parameter mismatch. Request rejected.'));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(failurePage('No authorization code present in the callback.'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(successPage(instanceLabel));
      finish(null, { code });
    });

    const timer = setTimeout(() => {
      finish(
        new Error(
          `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for the browser callback.`
        )
      );
    }, timeoutMs);

    function finish(err: Error | null, result?: LoopbackResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Allow the response body to flush before tearing the socket down.
      setTimeout(() => server.close(), 150);
      if (err) reject(err);
      else resolve(result as LoopbackResult);
    }

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        finish(
          new Error(
            `Port ${port} is already in use. Free the port, or set LOOKER_OAUTH_PORT ` +
              `to another port that your Looker admin has registered as a redirect URI.`
          )
        );
        return;
      }
      finish(err);
    });

    server.listen(port, '127.0.0.1');
  });
};
