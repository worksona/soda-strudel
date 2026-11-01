// Settings page: appearance, profile, screen & export, editor, exports, storage.
import { h, toast, formatBytes } from './dom.js';
import { icon } from './icons.js';
import { shapePicker, sizePicker } from './export.js';
import { editorView } from './learn.js';
import { applyEditorSettings } from '../editor/assist.js';
import { APPEARANCES, applyAppearance, getAppearance } from '../theme.js';
import { getSettings, updateSettings } from '../settings.js';
import { clearStore, countAll, deleteRender, listRenders, requestPersist, resetEverything, storageStatus } from '../storage/db.js';
import { download } from '../export/record.js';
import { libraryChanged } from '../media/library.js';

export function createSettings({ root, app }) {
  async function render() {
    const s = getSettings();
    const [renders, counts, store] = await Promise.all([listRenders(), countAll(), storageStatus()]);

    const danger = (label, message, run) =>
      h('button.danger', {
        onclick: async () => {
          if (!confirm(message)) return;
          await run();
          render();
        },
      }, icon('trash'), ` ${label}`);

    root.replaceChildren(
      ...[
      h('h4', {}, 'Appearance'),
      h(
        'div.segmented',
        { role: 'radiogroup', 'aria-label': 'Appearance' },
        APPEARANCES.map((a) =>
          h('button', { role: 'radio', 'aria-checked': String(getAppearance() === a), onclick: () => (applyAppearance(a, { save: true }), render()) }, icon(a, 16), a[0].toUpperCase() + a.slice(1)),
        ),
      ),
      h('p.muted', {}, 'Dark is the default; System follows your device. The stage stays dark in every theme – it is the screen your piece plays on.'),
      h(
        'label.toggle',
        {},
        h('input', { type: 'checkbox', checked: s.navLabels !== false, onchange: (e) => updateSettings({ navLabels: e.target.checked }) }),
        'Small labels under the toolbar icons',
      ),
      h(
        'label.toggle',
        {},
        h('input', {
          type: 'checkbox',
          checked: s.tooltips !== false,
          onchange: (e) => {
            updateSettings({ tooltips: e.target.checked });
            applyEditorSettings(app.mirror, { isTooltipEnabled: e.target.checked });
          },
        }),
        'Tooltips – hints when you point at code, names on buttons',
      ),
      h('h4', {}, 'Profile'),
      h(
        'label.field',
        {},
        'Your name',
        h('input', { value: s.name, placeholder: 'Shown as “by …” on links you share', onchange: (e) => updateSettings({ name: e.target.value.trim() }) }),
      ),

      h('h4', {}, 'Screen and export'),
      h('div.field', {}, h('span', {}, 'Export shape of this sketch'), shapePicker(app.getSketch().aspect, (a) => (app.setAspect(a), render()), app.stage.frame)),
      h('div.field', {}, h('span', {}, 'Export size (short side)'), sizePicker(s.exportSize, (px) => (updateSettings({ exportSize: px }), render()))),

      h('h4', {}, 'Editor'),
      editorView(app, render),

      h('h4', {}, `Exports (${renders.length})`),
      renders.length
        ? h(
            'ul.list',
            {},
            renders.map((r) =>
              h(
                'li.item',
                {},
                icon(r.kind === 'audio' ? 'audio' : 'film'),
                h('span.name', {}, r.filename ?? r.title ?? r.kind),
                h('span.meta', {}, formatBytes(r.bytes ?? r.blob.size)),
                h('button.icon', { 'aria-label': `Download ${r.filename}`, title: 'Download', onclick: () => download(r.blob, r.filename ?? `soda-export-${r.id}`) }, icon('download')),
                h('button.icon', { 'aria-label': `Delete ${r.filename}`, title: 'Delete', onclick: async () => (await deleteRender(r.id), render()) }, icon('trash')),
              ),
            ),
          )
        : h('p.muted', {}, 'Videos and audio you export are kept here.'),
      renders.length ? danger('Delete all exports', 'Delete every exported video and audio file from this browser?', () => clearStore('renders')) : null,

      h('h4', {}, 'Storage'),
      h(
        'p.muted',
        {},
        `${formatBytes(store.usage)} used${store.quota ? ` of ${formatBytes(store.quota)}` : ''} · ${counts.sketches} sketches · ${counts.sounds} sounds · ${counts.media} media · ${counts.renders} exports. `,
        store.persisted ? 'The browser will keep this data.' : 'The browser may clear this data if space runs low.',
      ),
      store.persisted
        ? null
        : h('button', { onclick: async () => (toast((await requestPersist()) ? 'This browser will keep your data.' : 'The browser declined – keep backups with Export › .soda file.'), render()) }, icon('check'), ' Keep my data'),
      h(
        'div.stack',
        {},
        danger('Delete my sounds and media', 'Delete every sound, take and media file you added? Sketches that use them will have gaps.', async () => {
          await clearStore('sounds');
          await clearStore('media');
          libraryChanged();
        }),
        danger('Delete all sketches', 'Delete every saved sketch from this browser?', async () => {
          await clearStore('sketches');
          app.forgetSketchId();
        }),
        danger('Reset everything', 'Erase all sketches, sounds, media, exports and settings in this browser, then reload? This cannot be undone.', async () => {
          await resetEverything();
          try {
            localStorage.clear();
          } catch {
            // nothing stored
          }
          location.replace(location.pathname);
        }),
      ),

      ].filter(Boolean),
    );
  }
  return { render };
}
