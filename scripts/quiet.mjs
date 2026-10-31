// Imported first by soda-cli: Strudel logs while loading; keep stdout pure JSON.
const toStderr = (...a) => process.stderr.write(`${a.map(String).join(' ')}\n`);
console.log = console.info = console.debug = toStderr;
