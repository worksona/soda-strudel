// Outlined icons (Lucide, ISC licence) with square caps/joins to match the
// square-cornered UI. icon('play') returns an <svg>; [data-icon] elements in
// index.html are filled in by hydrateIcons().
import {
  createElement,
  Radio,
  CircleDot,
  AudioLines,
  Crop,
  ExternalLink,
  WandSparkles,
  Minimize,
  RefreshCw,
  Image,
  Info,
  LayoutGrid,
  Moon,
  Music,
  Sun,
  SunMoon,
  BookOpen,
  FolderGit2,
  LifeBuoy,
  ListMusic,
  Menu,
  Search,
  Terminal,
  Type,
  Volume2,
  Camera,
  Check,
  Code,
  Copy,
  Download,
  Film,
  FolderOpen,
  Library,
  Link,
  Maximize,
  Mic,
  Monitor,
  Package,
  Pencil,
  Play,
  Plus,
  Save,
  Settings,
  Share2,
  Sparkles,
  Square,
  SwitchCamera,
  Trash2,
  Upload,
  X,
} from 'lucide';

const ICONS = {
  audio: AudioLines,
  external: ExternalLink,
  vibe: WandSparkles,
  exitfull: Minimize,
  update: RefreshCw,
  media: Image,
  about: Info,
  more: LayoutGrid,
  dark: Moon,
  sounds: Music,
  light: Sun,
  system: SunMoon,
  reference: BookOpen,
  github: FolderGit2,
  help: LifeBuoy,
  examples: ListMusic,
  menu: Menu,
  search: Search,
  console: Terminal,
  editor: Type,
  listen: Volume2,
  camera: Camera,
  check: Check,
  code: Code,
  copy: Copy,
  download: Download,
  film: Film,
  crop: Crop,
  sketches: FolderOpen,
  library: Library,
  link: Link,
  full: Maximize,
  mic: Mic,
  input: Radio,
  rec: CircleDot,
  stage: Monitor,
  package: Package,
  rename: Pencil,
  play: Play,
  plus: Plus,
  save: Save,
  settings: Settings,
  share: Share2,
  claude: Sparkles,
  stop: Square,
  flip: SwitchCamera,
  trash: Trash2,
  upload: Upload,
  close: X,
};

export function icon(name, size = 18) {
  const el = createElement(ICONS[name]);
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('stroke-width', '1.75');
  el.setAttribute('stroke-linecap', 'square');
  el.setAttribute('stroke-linejoin', 'miter');
  el.setAttribute('aria-hidden', 'true');
  el.classList.add('i');
  return el;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.querySelector('svg.i')?.remove();
    el.prepend(icon(el.dataset.icon));
  });
  // tiny captions under toolbar icons (shown when body.nav-labels is on)
  root.querySelectorAll('[data-cap]').forEach((el) => {
    if (el.querySelector('.cap')) return;
    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.setAttribute('aria-hidden', 'true');
    cap.textContent = el.dataset.cap;
    el.append(cap);
  });
}

/** Swap the icon on a button that already has one. */
export function setIcon(el, name) {
  el.dataset.icon = name;
  el.querySelector('svg.i')?.replaceWith(icon(name));
}
