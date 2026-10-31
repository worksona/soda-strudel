// Publishes the claude/ folder (the strudel-vibe plugin + skill) to its own repo,
// github.com/worksona/strudel-vibe, with git subtree – soda-strudel stays the
// one place to edit it.
//   pnpm skill:publish        (after committing your changes)
import { execSync } from 'node:child_process';

const REMOTE = 'skill';
const URL = 'https://github.com/worksona/strudel-vibe.git';
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

// 1. regenerate the bundled script, catalogues and references
run('node scripts/build-manifests.mjs');
run('node scripts/extract-strudel-docs.mjs');
run('node scripts/build-skill.mjs');

// 2. subtree pushes commits, so the folder must be committed as it is now
if (out('git status --porcelain -- claude')) {
  console.error('\nclaude/ has uncommitted changes (maybe just regenerated). Commit them, then run this again.');
  process.exit(1);
}

// 3. push
if (!out('git remote').split('\n').includes(REMOTE)) run(`git remote add ${REMOTE} ${URL}`);
run(`git subtree push --prefix=claude ${REMOTE} main`);
console.log(`\npublished claude/ to ${URL}`);
