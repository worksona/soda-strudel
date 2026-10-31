# Strudel essentials

Strudel is a JavaScript port of TidalCycles. Code is evaluated in the browser;
patterns are functions of time measured in **cycles**.

## Structure

```js
setcps(.5)                       // cycles per second
$: s("bd*4")                     // each $: line is one layer, all play together
$: note("c2 eb2").s("sawtooth")
_$: s("hh*8")                    // _$: mutes a layer
```

### Tempo

`setcpm(bpm / 4)` gives `bpm` when one cycle = one 4/4 bar. Examples: 85 bpm →
`setcpm(85/4)`; 120 bpm house → `setcpm(30)`; 174 dnb → `setcpm(43.5)`.
`setcps(.5)` = 120 bpm at 4 beats per cycle.

## Mini-notation (inside double quotes)

| Syntax | Meaning | Example |
|---|---|---|
| `a b c` | sequence squeezed into one cycle | `"bd sd hh"` |
| `[a b]` | subdivide one step | `"bd [sd sd]"` |
| `<a b>` | one per cycle (alternate) | `"<c2 eb2 g1>"` |
| `a*4` / `a/2` | faster / slower | `"hh*8"`, `"<a b>/2"` |
| `~` | rest | `"bd ~ sd ~"` |
| `a, b` | play together (inside `[]`) | `"[c3, e3, g3]"` |
| `a!3` | repeat | `"bd!3 sd"` |
| `a@3` | stretch (weight) | `"c@3 e"` |
| `a?` | drop randomly (50%) | `"hh*8?"` |
| `a\|b` | random choice | `"[bd\|cp]"` |
| `a(3,8)` | Euclidean rhythm | `"bd(3,8)"` |
| `a:2` | sample variation | `"bd:2"` |

Double-quoted strings are always mini-notation. Use **single quotes** for plain
text (e.g. captions).

## Making sound

```js
s("bd sd [~ bd] sd").bank("RolandTR909")   // samples; bank prefix: RolandTR909_bd
s("kick snare hat").bank("soda")           // soda's own pack
note("c3 e3 g3").s("piano")                // pitched sample / synth
n("0 2 4 7").scale("C4:minor").s("triangle")
chord("<Cm7 Fm7 Bb7 Ebmaj7>").voicing().s("gm_epiano1")
note("c2").s("supersaw")                   // synths: sine triangle square sawtooth supersaw pulse
s("white").decay(.05).sustain(0)           // noise: white pink brown crackle
```

## Shaping

- Level / space: `.gain(.6)` `.velocity(.8)` `.pan(sine)` `.room(.5)` `.size(.8)`
  `.delay(.4)` `.delaytime(.25)` `.delayfeedback(.5)` `.orbit(2)`
- Filter: `.lpf(800)` `.lpq(8)` `.hpf(300)` `.vowel("<a e i>")`
- Envelope: `.attack(.01)` `.decay(.2)` `.sustain(0)` `.release(.3)` `.clip(.5)`
- Dirt: `.distort(2)` `.shape(.4)` `.crush(6)` `.coarse(4)`
- Samples: `.speed("<1 -1 2>")` `.begin(.25)` `.end(.5)` `.loopAt(2)` `.chop(8)`
- On a picture (`img`/`vid`/`cam`) the same controls shape the image: `lpf`
  blur, `hpf` outlines, `room` glow, `delay` echo, `crush` posterize, `coarse`
  pixelate, `distort` contrast, `pan` crop position, `gain` brightness – so one
  chain can be applied to a sound and its picture (multimedia.md).
  `.slice(8, "0 3 2 7")` `.splice(8, "<0 4>")` `.striate(16)` `.cut(1)`
- Pitch: `.add(note(12))` `.transpose(7)` `.arp("up")`

## Time and variation

`.fast(2)` `.slow(2)` `.early(.25)` `.late(.125)` `.rev()` `.ply(2)` `.iter(4)`
`.palindrome()` `.off(1/8, x => x.add(note(7)))` `.jux(rev)` `.every(4, fast(2))`
`.firstOf(4, x => x.rev())` `.sometimesBy(.3, x => x.speed(2))` `.degradeBy(.2)`
`.struct("x ~ x x")` `.mask("<1 [1 0]>")` `.euclid(5, 8)` `.segment(16)`

Signals (continuous 0..1): `sine` `cosine` `saw` `tri` `square` `perlin` `rand`
— scale with `.range(lo, hi)`, slow with `.slow(8)`:
`.lpf(sine.range(400, 2000).slow(8))`, `.gain(perlin.range(.2, .5))`.
Random picks: `irand(8)`, `"<a b c>".pick(...)`, `choose("a","b")`.

## Strudel's own visuals

Use them as soda visuals – full stage, every audible layer, with hue / amount /
opacity: `visual("punchcard")`, `visual("pianoroll")`, `visual("wordfall")`,
`visual("spiral")`, `visual("pitchwheel")`, `visual("scope")`,
`visual("spectrum")` (multimedia.md). Chaining Strudel's own `.punchcard()`,
`.spiral()`, `.pitchwheel()` on one pattern still paints that layer alone on the
stage; prefix `_` (`._pianoroll()`) to draw inline in the editor instead.

Hydra (video synth) runs under the stage:

```js
await initHydra()
osc(10, .1, 1.2).kaleid(4).modulate(noise(3)).out()
// drive Hydra from a pattern
osc(H("<10 30 60>"), .1).out()
// the camera (when on) feeds s0: src(s0).modulate(osc(8)).out()
```

## Extra sounds

`samples('github:user/repo')` loads any repo with a `strudel.json` (branch
`main` unless given: `github:user/repo/branch`). Verified libraries:
`tidalcycles/dirt-samples`, `yaxu/clean-breaks`, `eddyflux/crate`,
`mot4i/garden`, `bubobubobubobubo/dough-fox`, `yaxu/spicule`, `yaxu/mrid`,
`tidalcycles/uzu-drumkit`, `tidalcycles/uzu-wavetables`, `switchangel/pad`.
`samples('soda:<pack>')` loads a soda-hosted pack. Use only when needed; the
default banks and soda packs load automatically.

## Gotchas

- Unknown sample names are silent – check with `node scripts/soda.mjs sounds`.
- `note()` takes names (`c3`, `eb2`, `f#4`) or MIDI numbers; `n()` is a scale degree or sample index.
- A layer of just `img()/visual()/captions()` makes no sound – that's intended.
- Don't call `hush()`; don't use `setInterval`/DOM APIs; keep it pure patterns.
- Keep total layers modest; `.room()` on many layers is CPU-heavy on phones.
