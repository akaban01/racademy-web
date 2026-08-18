import { useEffect, useState } from 'react';
import { Puck } from '@puckeditor/core';
import { supplyListsConfig } from '../../../content-schema/puck.config.jsx';
import { toPuckData, fromPuckData, supplyListsJsonToProps, supplyListsPropsToJson } from '../../../content-schema/adapters.js';
import { getContentFile, putContentFile, checkWriteAccess, ConflictError } from '../github/contentsApi.js';

const PATH = 'content/supply-lists.json';

export function SupplyListsEditor({ session, onBack }) {
  const [state, setState] = useState({ status: 'loading', puckData: null, sha: null, error: null });
  const [publishState, setPublishState] = useState({ status: 'idle' });

  useEffect(() => {
    let cancelled = false;
    getContentFile(session.access_token, PATH)
      .then(({ json, sha }) => {
        if (cancelled) return;
        setState({ status: 'ready', puckData: toPuckData(supplyListsJsonToProps(json)), sha, error: null });
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
      const json = supplyListsPropsToJson(fromPuckData(puckData));
      const { sha } = await putContentFile(
        session.access_token,
        PATH,
        json,
        state.sha,
        `Update supply lists via editor (${session.login})`
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
    setState({ status: 'ready', puckData: toPuckData(supplyListsJsonToProps(json)), sha, error: null });
    setPublishState({ status: 'idle' });
  }

  if (state.status === 'loading') return <p style={{ padding: 24 }}>Loading supply lists…</p>;
  if (state.status === 'error') return <p style={{ padding: 24, color: 'crimson' }}>{state.error}</p>;

  return (
    <div>
      <div style={{ padding: '8px 16px', background: '#f5f5f7', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onBack}>← Back</button>
        <strong>Supply Lists</strong>
        {publishState.status === 'publishing' && <span>Publishing…</span>}
        {publishState.status === 'done' && <span style={{ color: 'green' }}>Published — live in about a minute.</span>}
        {publishState.status === 'error' && <span style={{ color: 'crimson' }}>{publishState.message}</span>}
        {publishState.status === 'conflict' && (
          <span style={{ color: 'crimson' }}>
            {publishState.message} <button onClick={reloadLatest}>Reload latest</button>
          </span>
        )}
      </div>
      <Puck config={supplyListsConfig} data={state.puckData} onPublish={handlePublish} />
    </div>
  );
}
