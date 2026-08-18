/**
 * The only place the GitHub OAuth client secret is used. Exchanges the
 * Authorization Code flow's `code` for an access token, then immediately
 * checks the user's permission on the content repo - the token is only
 * ever returned to the browser if they already have write access, so a
 * logged-in-but-unauthorized visitor never holds a usable token at all.
 */

const GITHUB_ALLOWED_REPO = process.env.GITHUB_ALLOWED_REPO || 'akaban01/racademy-web';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { code } = body;
  if (!code) {
    return { statusCode: 400, body: 'Missing code' };
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const tokenBody = await tokenRes.json();

  if (!tokenRes.ok || !tokenBody.access_token) {
    return { statusCode: 400, body: JSON.stringify({ error: tokenBody.error_description || 'GitHub token exchange failed' }) };
  }

  const accessToken = tokenBody.access_token;

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' },
  });
  if (!userRes.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not read GitHub user profile' }) };
  }
  const user = await userRes.json();

  const permRes = await fetch(
    `https://api.github.com/repos/${GITHUB_ALLOWED_REPO}/collaborators/${user.login}/permission`,
    { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' } }
  );

  if (!permRes.ok) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: `You don't have access to ${GITHUB_ALLOWED_REPO}.` }),
    };
  }
  const permBody = await permRes.json();
  const permission = permBody.permission;

  if (permission !== 'admin' && permission !== 'write') {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: `Your GitHub account (${user.login}) does not have write access to ${GITHUB_ALLOWED_REPO}.` }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      login: user.login,
      permission,
    }),
  };
};
