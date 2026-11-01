// The Repertoire data (public/repertoire.json, built by `pnpm repertoire`).
// Fetched under a per-build URL so a browser still running an older service
// worker – or any cache – can never answer with the previous deploy's data.
/* global __BUILD__ */
const BUILD = typeof __BUILD__ === 'string' ? __BUILD__ : 'dev';
let pending = null;

/** The Repertoire data for this build (one fetch, shared). */
export function loadRepertoire() {
  pending ??= fetch(`/repertoire.json?b=${BUILD}`, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`repertoire ${r.status}`);
    return r.json();
  });
  pending.catch(() => (pending = null)); // let a later call try again
  return pending;
}
