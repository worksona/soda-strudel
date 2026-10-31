# Recipes

Complete, validated starting points. The app's Examples page has more (src/examples.js): The last bus home, Four seasons, Acid sunrise, Breakbeat chase, Raga at dusk, Machine choir, polyrhythm and generative studies, Hydra dream, and a Dancefloor set (Dub techno fog, Melodic techno, Trance lift, Psy roll, Hard techno kaleid). Change sounds, keys and pictures to fit
the brief – don't paste them unchanged.

## Postcard from the coast (story in chapters, 9:16)

```js
setcpm(84/4)
const sea = note("c3").s("gm_seashore").attack(1).release(2).gain(.5)
const guitar = n("<[0 2 4 2] [-1 1 3 1] [-2 0 2 0] [-3 -1 1 -1]>*2").scale("A3:major")
  .s("gm_acoustic_guitar_nylon").gain(.45).room(.4)
const steps = s("kick:1 ~ ~ ~, ~ rim ~ rim, shaker*8").bank("soda").gain(.4)
const flute = n("4 [5 4] 2 ~ 0 ~ [2 4] ~").slow(2).scale("A4:major").s("gm_flute").gain(.35).room(.6)
$: arrange(
  [4, stack(sea, img("sea").fade(.5), captions(['dear you,', '', 'the sea is louder here', '']))],
  [4, stack(sea, guitar, img("sea").fx("hue").hue(-20), captions(['I walked the long beach', '', 'shoes in one hand', '']))],
  [8, stack(sea.gain(.25), guitar, steps, flute, img("<sun sun dusk dusk>"), visual("particles").hue(40).amount(.4),
    captions(['a kite', 'a dog', 'a boy chasing both', '', 'someone selling', 'too-sweet peaches', '', '']))],
  [4, stack(sea, flute.slow(2), img("night").fade(.5), visual("ribbon").hue(220).opacity(.4), captions(['wish you were here', '', '– x', '']))],
)
```

## Late-night drive (lo-fi, 85 bpm, 9:16)

```js
setcpm(85/4)
$: s("kick ~ [~ kick] ~, ~ snare").bank("soda").gain(.8)
$: s("hat*8").bank("soda").gain(perlin.range(.1, .35)).hpf(6000)
$: chord("<Fm9 Ebmaj7 Dbmaj7 C7>").voicing().s("gm_epiano1").room(.6).gain(.45)
$: n("<0 [~ 2] 4 [3 ~]>").scale("F2:minor").s("triangle").lpf(600).gain(.7)
$: s("rain").bank("soda").slow(2).gain(.25)
$: img("<rain fog>").slow(4).fade(.3)
$: visual("ribbon").hue(210).opacity(.6)
$: captions(['2:14 am', '', 'exit 9', '', 'still raining', '']).slow(2)
```

## Dub picture (one effect chain for sound and image, 70 bpm, 9:16)

```js
setcpm(70/4)
// dub() goes on the bass, the chords AND the image: the filter that opens the
// bass sharpens the picture, the room that holds the chords makes it glow.
const dub = x => x.lpf(sine.range(300, 6000).slow(8)).room(.7).roomsize(4).delay(.4).delayfeedback(.6)
$: s("kick:1 ~ ~ kick:1, ~ ~ snare:1 ~, hat*4").bank("soda").gain(.5).lpf(4000).room(.2)
$: dub(note("<c2 c2 eb2 g1>").s("bass").bank("soda").gain(.5))
$: dub(chord("<Cm7 Cm7 Eb^7 Gm7>").voicing().s("gm_epiano1").gain(.28)).delaytime(.375)
$: dub(img("<night neon rain dusk>").slow(4).fade(.2)).pan(sine.range(.3, .7).slow(16))
$: visual("pulse").hue(200).amount(.3).opacity(.5)
$: captions(['the same chain', '', 'shapes the sound', '', 'and the picture', '', '', '']).slow(2)
```

## Neon club (house, 124 bpm, 9:16)

```js
setcpm(31)
$: s("bd*4").bank("RolandTR909").gain(.9)
$: s("~ cp ~ cp").bank("RolandTR909").room(.3)
$: s("[~ hh]*4").bank("RolandTR909").gain(.5)
$: note("<c2 c2 eb2 f2>*8").s("sawtooth").lpf(sine.range(400, 3000).slow(8)).lpq(10).decay(.15).sustain(0).gain(.55)
$: chord("<Cm9 Fm9>").voicing().s("supersaw").lpf(1800).gain(.25).room(.5)
$: img("neon").fx("<none none contrast hue>").hue(sine.range(0, 90).slow(4))
$: visual("pulse").hue(320).amount(.35)
$: visual("bars").hue(280).opacity(.7)
```

## Dancefloor genres (after Breath of Strudel, CC BY 4.0)

Genre is mostly tempo + kick + bass + how much reverb. Start from the minimal
techno base and change those; every one below is validated. Pair each with the
visual named – they fill the stage and show every layer.

| genre | bpm | kick | bass | space | visual |
|---|---|---|---|---|---|
| minimal techno | 128 | `note("c1!4").s("sine").penv(24).pdecay(.06).decay(.4).sustain(0).distort("1.5:.6")` | saw + ladder `lpf(400).lpq(12).lpenv(4)` | small | `punchcard` |
| deep house | 120 | `s("bd*4").bank("RolandTR909")`, shuffle `.swingBy(1/6, 4)` | `note("<c2 f1 g1 bb1>").s("sawtooth").lpf(500)` | `.room(.4)` on chords | `bars` |
| dub techno | 118 | soft `penv(16).decay(.5)` | sine drone `lpf(150)` | huge: `.room(.85).roomsize(6).delay(.5).delayfeedback(.65)` | `spectrum` |
| melodic techno | 124 | `penv(20).decay(.45)` | `lpf(sine.range(300,900).slow(16))` | pad on `.orbit(2)` ducked by a silent `s("bd*4").duckorbit(2).gain(0)` | `pianoroll` |
| trance | 138 | 909 `bd*4` | `note("c2!8")` ladder `lpf(600).lpq(8)` | detuned saw pad (`.superimpose(x => x.add(note(.12)))`), gate `.struct("[x x ~ x x ~ x ~]*2")` | `spiral` |
| psytrance | 142 | tight `penv(36).pdecay(.04).decay(.2)` | offbeat `"[~ c2 ~ c2 ~ c2 ~ c2]*2"` | lead in `C4:phrygian` + `.phaser(.5)` | `punchcard` |
| drum & bass | 174 | break `"bd ~ [~ bd] ~, ~ sd ~ [sd ~]"` | reese saw `distort("2:.5")` + sine sub | `.compressor("-15:12:10:.002:.02")` | `pulse` / `rings` |
| industrial | 145 | `distort("4:.5")` | `lpf(sine.range(200,1500).fast(2)).lpq(10)` | `s("white(3,8)").bpf(…)` hits, `.crush(6)` hats | Hydra kaleid |

### Melodic techno (124 bpm, sidechained pad, pianoroll)

```js
setcpm(124/4)
$: note("c1!4").s("sine").penv(20).pdecay(.07).decay(.45).sustain(0).gain(.82)
$: s("hh*16").bank("RolandTR909").gain(".4 .2 .5 .2").hpf(7000)
$: s("~ cp ~ cp").bank("RolandTR909").room(.2).gain(.55)
$: note("<c2 a1 f2 g2>").s("sawtooth").lpf(sine.range(300, 900).slow(16)).lpq(6)
  .lpenv(3).lpd(.15).lps(0).ftype("ladder").decay(.25).sustain(0).gain(.5)
$: chord("<Cm Am7 Fm G>").voicing().s("sawtooth").lpf(sine.range(1000, 2800).slow(16)).lpq(2)
  .attack(.6).decay(1).sustain(.5).release(2).room(.6).roomsize(5).gain(.2).orbit(2)
$: s("bd*4").bank("RolandTR909").duckorbit(2).duckattack(.25).duckdepth(.8).gain(0)   // the pump
$: n("<0 ~ 4 ~ 7 ~ 4 ~>").scale("C4:harmonic:minor").s("triangle").attack(.1).release(.5)
  .delay(.5).delaytime(.234).delayfeedback(.55).pan(sine.range(.3, .7).slow(4)).gain(.2)
$: img("night").opacity(.5).gain(sine.range(.6, 1).slow(16))
$: visual("pianoroll").hue(280).amount(.8)
```

### Trance lift (138 bpm, build → breakdown → drop)

```js
setcpm(138/4)
const kick = s("bd*4").bank("RolandTR909").gain(.85)
const hats = s("[hh hh hh <hh oh>]*4").bank("RolandTR909").cut(1).gain(".6 .3 .5 .4").hpf(6000)
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.25).gain(.6)
const bass = note("c2!8").s("sawtooth").lpf(600).lpq(8).lpenv(3).lpd(.1).lps(0).ftype("ladder").decay(.15).sustain(0).gain(.5)
const pad = chord("<Cm Fm Ab Bb>").voicing().s("sawtooth").superimpose(x => x.add(note(.12))).lpf(sine.range(1500, 4000).slow(16))
  .attack(.3).sustain(.6).release(1.5).room(.5).roomsize(5).gain(.2).orbit(2)
const pump = s("bd*4").bank("RolandTR909").duckorbit(2).duckattack(.2).duckdepth(1).gain(0)
const lead = n("<0 2 4 7 4 2 0 ~>*2").scale("C4:harmonic:minor").s("sawtooth").lpf(5000)
  .attack(.02).decay(.2).sustain(.3).release(.3).delay(.4).delaytime(.217).delayfeedback(.5).gain(.22)
const build = stack(                                   // everything doubles each bar
  s("hh*<8 16 16 32>").bank("RolandTR909").gain(.35).hpf(6000),
  s("cp*<4 8 16 32>").bank("RolandTR909").gain("<.4 .5 .6 .7>").room(.5),
  s("white*16").gain(saw.range(0, .35).slow(4)).lpf(sine.range(1000, 8000).slow(4)),   // riser
)
$: arrange(
  [8, stack(kick, hats, clap, bass, pad, pump)],
  [4, stack(kick, bass, pad, pump, build, captions(['', 'hands', 'up', '']))],
  [4, stack(pad.gain(.3), lead.slow(2), s("~ ~ ~ crash").bank("soda").gain(.5).room(.8).slow(4))],
  [8, stack(kick, hats, clap, bass, pad, pump, lead)],
)
$: visual("spiral").hue(40).amount(.9)
```

## Hydra patterns (after Hydra Book, public domain)

Hydra draws under the stage. `await initHydra()` first, then one chain ending
in `.out()`. `H("<…>")` patterns any number by the cycle; `() => …` functions
run every frame. Every snippet below is a complete background – add media,
visuals and captions on top as usual.

```js
await initHydra()
// stripes → kaleidoscope, symmetry by the bar
osc(40, .1, 1).thresh(.5).kaleid(H("<3 4 6 8>")).rotate(0, .1).out()
// circles from a huge kaleid
osc(200, 0).kaleid(99).out()
// perlin noise and voronoi cells, slowly scaled
noise(H("<4 8 16>"), .1).out()
voronoi(10, .3).modulateScale(osc(4), .2).out()
// feedback: the last frame scrolled and layered under a masked oscillator
src(o0).scroll(.003, .006).layer(osc(30, .1, 1.5).mask(shape(4, .3, .01))).out()
// feedback that drifts like fluid
src(o0).modulate(osc(6, 0, 1.5).modulate(noise(3).sub(gradient()), 1).brightness(-.5), .003)
  .layer(osc(30, .1, 1.5).mask(shape(4, .3, 0))).out()
// hue drift from a slightly enlarged copy of itself
src(o0).modulateHue(src(o0).scale(1.01), 1).layer(osc(30, .1, 1.5).mask(shape(4, .3, 0))).out()
// stepped pixelation, chosen by the pattern
osc(10, 0, 1).pixelate(H("<4 8 16 32>"), H("<4 8 16 32>")).out()
// the camera (when the viewer allows it) as the Hydra source
src(s0).kaleid(4).modulateScale(osc(3), .1).out()
```

Pointers: `thresh()` and `posterize(3, 1)` turn gradients into shapes;
`pixelate(n, n)` reads as blocks; `.layer(src(o0)…)` inside a chain is the
feedback trail; keep one `.out()` per sketch. Use the stage's visuals
(`visual("spiral")`, `visual("pulse")`) for the beat and let Hydra be the room.

## Ambient dawn (beatless, 16:9)

```js
setcps(.2)
$: note("<[c3,g3,e4] [a2,e3,c4] [f2,c3,a3] [g2,d3,b3]>").s("gm_pad_warm").attack(1.5).release(3).room(.9).size(.9).gain(.5)
$: n("0 2 4 7 9 7 4 2").scale("C5:major").s("sine").degradeBy(.5).delay(.6).delayfeedback(.6).gain(.2)
$: s("pink").lpf(sine.range(300, 900).slow(16)).gain(.08)
$: img("<dusk fog>").slow(8).fade(.5)
$: visual("particles").hue(30).amount(.3)
$: captions(['first light', '', '', '']).slow(4)
```

## Mirror jam (camera-driven, 9:16)

```js
setcpm(30)
$: s("kick*4, ~ clap").bank("soda")
$: s("hat*8").bank("soda").gain(.35)
$: note("<a1 a1 c2 g1>*4").s("sawtooth").lpf(camMotion.range(250, 4500)).lpq(6).gain(.6)
$: cam().mirror(1).fx("<none posterize edges posterize>").opacity(.9)
$: visual("rings").hue(160).amount(.6)
$: captions(['move to open the filter']).slow(4)
```

## Spoken story / poem (captions carry the words)

```js
setcpm(70/4)
$: note("<d3 a2 bb2 f2>").s("gm_cello").attack(.3).release(1.5).room(.7).gain(.5)
$: s("~ ~ ~ snare:1").bank("soda").room(.8).gain(.25)
$: img("<dusk dusk fog fog>").slow(2).fade(.4)
$: captions([
  'the house kept the light',
  'long after we left',
  '',
  'and the radio',
  'kept the weather',
  '',
]).slow(2)
```

## Breakbeat chop (uses a take or any loop)

```js
setcpm(43.5)
$: s("take_loop").loopAt(2).slice(8, "<0 1 [2 2] 3 4 [5 7] 6 7>").gain(.8)   // the user's take
$: s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR808").gain(.8)
$: note("<e1 e1 g1 d1>").s("sine").decay(.6).sustain(0).gain(.9)
$: visual("pulse").hue(40)
```

`take_loop` stands in for the user's own recording – ask for its name (it is in
their Sounds page, marked take). Without one, chop a pitched layer or `s("jazz")` instead.
