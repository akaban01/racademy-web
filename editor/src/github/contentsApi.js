/**
 * Thin wrapper around the GitHub REST API, called directly from the
 * browser with the logged-in author's own OAuth token (no server proxy
 * needed for these endpoints - commits are authored as the real user,
 * same as Pages CMS today).
 */

const OWNER_REPO = import.meta.env.VITE_GITHUB_ALLOWED_REPO || 'akaban01/racademy-web';
const BRANCH = import.meta.env.VITE_GITHUB_DEPLOY_BRANCH || 'master';

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function githubFetch(token, path, init = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      ...(init.headers || {}),
    },
  });
  return res;
}

export class ConflictError extends Error {}

/** Checks the logged-in user's permission level on the content repo (defense-in-depth, re-checked before every publish). */
export async function checkWriteAccess(token, login) {
  const res = await githubFetch(token, `/repos/${OWNER_REPO}/collaborators/${login}/permission`);
  if (!res.ok) return null;
  const body = await res.json();
  return body.permission; // 'admin' | 'write' | 'read' | 'none'
}

/** Loads a JSON content file. Returns { json, sha }. */
export async function getContentFile(token, path) {
  const res = await githubFetch(token, `/repos/${OWNER_REPO}/contents/${path}?ref=${BRANCH}`);
  if (!res.ok) {
    throw new Error(`Could not load ${path} (${res.status})`);
  }
  const body = await res.json();
  const json = JSON.parse(base64ToUtf8(body.content));
  return { json, sha: body.sha };
}

/**
 * Commits an updated JSON content file straight to the deploy branch,
 * matching today's Pages CMS UX. Throws ConflictError if `sha` is stale
 * (someone else committed to this file in the meantime) so the caller can
 * offer a reload-and-reapply instead of silently overwriting.
 */
export async function putContentFile(token, path, json, sha, message) {
  const res = await githubFetch(token, `/repos/${OWNER_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(JSON.stringify(json, null, 2) + '\n'),
      sha,
      branch: BRANCH,
    }),
  });

  if (res.status === 409 || res.status === 422) {
    throw new ConflictError('This file changed on GitHub since you loaded it. Reload the latest version before publishing again.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Publish failed (${res.status})`);
  }
  const body = await res.json();
  return { sha: body.content.sha };
}
