/**
 * GitHub OAuth (Authorization Code flow) for a static SPA. The client
 * secret never reaches the browser - the only server-side piece is
 * netlify/functions/github-oauth-exchange.js, which trades the `code` for
 * a token and rejects the exchange outright unless the user already has
 * write access to the content repo.
 *
 * The resulting token is held in sessionStorage: it survives a page
 * refresh (so a mid-edit reload doesn't force a re-login) but clears when
 * the tab closes, unlike localStorage.
 */

const SESSION_KEY = 'racademy-editor::session::v1';
const STATE_KEY = 'racademy-editor::oauth-state::v1';

const CLIENT_ID = import.meta.env.VITE_GITHUB_OAUTH_CLIENT_ID;

function randomState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function startLogin() {
  const state = randomState();
  sessionStorage.setItem(STATE_KEY, state);
  const redirectUri = `${window.location.origin}/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo');
  url.searchParams.set('state', state);
  window.location.assign(url.toString());
}

/** Called on the /callback route. Exchanges `code` for a token via the Netlify Function. */
export async function completeLogin(code, state) {
  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!state || state !== expectedState) {
    throw new Error('Login failed: state mismatch. Please try signing in again.');
  }

  const res = await fetch('/.netlify/functions/github-oauth-exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Your GitHub account does not have write access to this repository.');
  }
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}). Please try again.`);
  }

  const session = await res.json();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
