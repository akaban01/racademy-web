import { useEffect, useState } from 'react';
import { Puck } from '@puckeditor/core';
import { academicCalendarConfig } from '../../../content-schema/puck.config.jsx';
import { toPuckData, fromPuckData } from '../../../content-schema/adapters.js';
import { getContentFile, putContentFile, checkWriteAccess, ConflictError } from '../github/contentsApi.js';

const PATH = 'content/academic-calendar.json';

export function AcademicCalendarEditor({ session, onBack }) {
  const [state, setState] = useState({ status: 'loading', puckData: null, sha: null, error: null });
  const [publishState, setPublishState] = useState({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    getContentFile(session.access_token, PATH)
      .then(({ json, sha }) => {
        if (cancelled) return;
        setState({ status: 'ready', puckData: toPuckData(json), sha, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: 'error', puckData: null, sha: null, error: err.message });
      });
    return () => { cancelled = true; };
  }, [session.access_token]);

  async function handlePublish(puckData) {
    setPublishState({ status: 'publishing' });
    try {
      const permission = await checkWriteAccess(session.access_token, session.login);
      if (permission !== 'admin' && permission !== 'write') {
        throw new Error('Your GitHub access to this repository was revoked or changed. Ask an admin for write access.');
      }
      const json = fromPuckData(puckData);
      const { sha } = await putContentFile(
        session.access_token,
        PATH,
        json,
        state.sha,
        `Update academic calendar via editor (${session.login})`
      );
      setState((s) => ({ ...s, sha }));
      setPublishState({ status: 'done' });
      setTimeout(() => setPublishState({ status: 'idle' }), 4000);
    } catch (err) {
      if (err instanceof ConflictError) {
        setPublishState({ status: 'conflict', message: err.message });
      } else {
        setPublishState({ status: 'error', message: err.message });
      }
    }
  }

  async function reloadLatest() {
    setState((s) => ({ ...s, status: 'loading' }));
    const { json, sha } = await getContentFile(session.access_token, PATH);
    setState({ status: 'ready', puckData: toPuckData(json), sha, error: null });
    setPublishState({ status: 'idle' });
  }

  if (state.status === 'loading') return <p style={{ padding: 24 }}>Loading academic calendar…</p>;
  if (state.status === 'error') return <p style={{ padding: 24, color: 'crimson' }}>{state.error}</p>;

  return (
    <div>
      <div style={{ padding: '8px 16px', background: '#f5f5f7', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onBack}>← Back</button>
        <strong>Academic Calendar</strong>
        {publishState.status === 'publishing' && <span>Publishing…</span>}
        {publishState.status === 'done' && <span style={{ color: 'green' }}>Published — live in about a minute.</span>}
        {publishState.status === 'error' && <span style={{ color: 'crimson' }}>{publishState.message}</span>}
        {publishState.status === 'conflict' && (
          <span style={{ color: 'crimson' }}>
            {publishState.message} <button onClick={reloadLatest}>Reload latest</button>
          </span>
        )}
      </div>
      <Puck config={academicCalendarConfig} data={state.puckData} onPublish={handlePublish} />
    </div>
  );
}
