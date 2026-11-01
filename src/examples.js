// Built-in examples for the Examples page – chosen to show the range: stories told in
// chapters, grooves, a dancefloor set written after the genre recipes in Breath of
// Strudel (vakofmaya/BreathOfStrudle, CC BY 4.0) and honcoops/strudel_trance, with
// Hydra patterns after Hydra Book (micuat/hydra-book, public domain), moods,
// technique studies, a live camera piece, and three patterns adapted from
// live-coding-music-mcp (AGPL-3.0).
// Every example is checked by tests/examples.test.js with the headless validator.
import { DEFAULT_CODE } from './default-code.js';

export const CATEGORIES = ['Start here', 'Stories', 'Grooves', 'Dancefloor', 'Moods', 'Studies', 'Live', 'From live-coding-music-mcp'];

export const EXAMPLES = [
  {
    title: 'First light',
    category: 'Start here',
    about: 'A sunrise in two and a half minutes: arrange() builds bass, chords, melody, drums and bells from the dark to daylight – night, fog, dusk and sun follow the same plan. Drag the sliders to mix.',
    aspect: 'free',
    code: DEFAULT_CODE,
  },

  // ---------- Stories ----------
  {
    title: 'Postcard from the coast',
    category: 'Stories',
    about: 'A letter in four chapters – arrange() changes sound, picture and words together.',
    aspect: '9:16',
    code: `// A postcard in four chapters. arrange() plays each chapter for a number of
// cycles, so the sound, the picture and the words all turn the page together.
// Width: the guitar is doubled left and right; depth: everything sits in a room.
setcpm(84/4)

const sea = note("c3").s("gm_seashore").attack(1).release(2).gain(.45)
  .room(.6).pan(sine.range(.3, .7).slow(8))
const guitar = n("<[0 2 4 2] [-1 1 3 1] [-2 0 2 0] [-3 -1 1 -1]>*2").scale("A3:major")
  .s("gm_acoustic_guitar_nylon:1").gain(.4).room(.5).hpf(150).lpf(5000)
  .layer(x => x.pan(.25), x => x.pan(.75).late(1/64))
const steps = s("kick:1 ~ ~ ~, ~ rim ~ rim, shaker*8").bank("soda").gain(.35)
  .lpf(5000).room(.25).pan("<.5 .5 .4 .6>")
const flute = n("4 [5 4] 2 ~ 0 ~ [2 4] ~").slow(2).scale("A4:major").s("gm_flute")
  .gain(.32).room(.7).roomsize(4).delay(.3).delayfeedback(.3).pan(.6)

$: arrange(
  [4, stack(sea, img("sea").fade(.5),
    captions(['dear you,', '', 'the sea is louder here', '']))],
  [4, stack(sea, guitar, img("sea").fx("hue").hue(-20),
    captions(['I walked the long beach', '', 'shoes in one hand', '']))],
  [8, stack(sea.gain(.25), guitar, steps, flute,
    img("<sun sun dusk dusk>"), visual("particles").hue(40).amount(.4),
    captions(['a kite', 'a dog', 'a boy chasing both', '', 'someone selling', 'too-sweet peaches', '', '']))],
  [4, stack(sea, flute.slow(2), img("night").fade(.5), visual("ribbon").hue(220).opacity(.4),
    captions(['wish you were here', '', '– x', '']))],
)
`,
  },
  {
    title: 'The last bus home',
    category: 'Stories',
    about: 'Lo-fi with a narrator: a sixteen-bar story told one caption per bar.',
    aspect: '9:16',
    code: `// Lo-fi with a narrator: one caption per bar, a small story over 16 bars.
// Dusty, not tinny: drums low-passed, Rhodes doubled wide, everything in a small room.
setcpm(78/4)

$: s("kick ~ [~ kick] ~, ~ snare:1").bank("soda").gain(.6).lpf(3500).room(.2).swingBy(1/6, 4)
$: s("hat*8").bank("soda").gain(perlin.range(.08, .22)).pan(sine.range(.35, .65).fast(2))
  .lpf(7000).swingBy(1/6, 4)
$: chord("<Am9 Dm9 Gmaj7 Cmaj7>").voicing().s("gm_epiano1").gain(.3).room(.5).lpf(2400)
  .layer(x => x.pan(.2), x => x.pan(.8).late(1/32))
$: n("<0 ~ 0 [~ 2]>").scale("A1:minor").s("bass").bank("soda").gain(.55).lpf(700)
$: s("vinyl").bank("soda").slow(4).gain(.3)
$: s("rain").bank("soda").slow(4).gain(.18)

$: img("<night night rain rain>").slow(4).fade(.3)
$: visual("ribbon").hue(260).opacity(.35)
$: captions([
  'last bus, 1:12 am', 'the driver hums', 'something old', '',
  'a woman with tulips', 'asleep against the glass', '', '',
  'my stop comes', 'I stay on', 'one more loop', '',
  'the city, lit', 'like it is waiting', 'for someone', '',
])
`,
  },
  {
    title: 'Four seasons',
    category: 'Stories',
    about: 'Sixteen bars, four seasons – each with its own scale, instruments, picture and colour.',
    aspect: '16:9',
    code: `// Four seasons in sixteen bars. Each season is its own little world:
// scale, instruments, stereo picture, room, visual colour and a word or two.
setcpm(100/4)

const spring = stack(
  n("0 2 4 7 4 2").scale("E4:major pentatonic").s("pluck").bank("soda").gain(.35).room(.4)
    .layer(x => x.pan(.3), x => x.pan(.7).late(1/48)),
  s("~ shaker ~ shaker").bank("soda").gain(.22).pan(.7),
  img("sun").pos(.7), visual("particles").hue(110).amount(.5),
  captions(['spring', '', 'green, then greener', '']))

const summer = stack(
  n("<[0 4] [2 5] [4 7] [2 5]>*2").scale("E4:major").s("gm_steel_drums").gain(.35).room(.3)
    .pan("<.3 .7>*4"),
  s("kick*4, ~ clap").bank("soda").gain(.55).lpf(6000),
  note("e2 ~ e2 b1").s("bass").bank("soda").gain(.45),
  img("sun").fx("contrast"), visual("pulse").hue(40).amount(.35),
  captions(['summer', 'loud', 'and long', '']))

const autumn = stack(
  chord("<C#m7 F#m7 Bsus4 E>").voicing().s("keys").bank("soda").gain(.32).room(.6),
  s("kick:1 ~ ~ kick:1, ~ ~ rim ~").bank("soda").gain(.4).room(.3),
  img("dusk"), visual("ribbon").hue(25).opacity(.6),
  captions(['autumn', '', 'the light leaves early', '']))

const winter = stack(
  n("<0 ~ 4 ~> <~ 7 ~ 2>").scale("C#5:minor").s("bell").bank("soda").gain(.28)
    .room(.9).roomsize(6).delay(.5).delayfeedback(.4).pan(sine.slow(4)),
  note("<c#3 a2>").s("strings").bank("soda").gain(.22).room(.8),
  img("fog").fade(.5), visual("particles").hue(200).amount(.2),
  captions(['winter', '', '', 'quiet']))

$: arrange([4, spring], [4, summer], [4, autumn], [4, winter])
`,
  },
  {
    title: 'The house kept the light',
    category: 'Stories',
    about: 'A short poem carried by cello and captions, pictures changing with the lines.',
    aspect: '9:16',
    code: `// A poem: the captions carry the words, the cello carries the feeling –
// doubled left and right and placed in a large, dark room.
setcpm(70/4)

$: note("<d3 a2 bb2 f2>").s("gm_cello").attack(.3).release(1.5).gain(.45)
  .room(.9).roomsize(6).lpf(3000).layer(x => x.pan(.3), x => x.pan(.7).late(1/24))
$: note("<d4 ~ f4 ~>").s("gm_piano").gain(.2).room(.8).delay(.4).delayfeedback(.4).pan(.65)
$: s("~ ~ ~ snare:1").bank("soda").room(.9).gain(.18).lpf(3000)
$: img("<dusk dusk fog fog>").slow(2).fade(.4)
$: captions([
  'the house kept the light',
  'long after we left',
  '',
  'and the radio',
  'kept the weather',
  '',
]).slow(2)
`,
  },

  // ---------- Grooves ----------
  {
    title: 'Late-night drive',
    category: 'Grooves',
    about: 'Lo-fi at 85 bpm: Rhodes chords, rain, a ribbon of sound across the night.',
    aspect: '9:16',
    code: `// Lo-fi at 85 bpm: Rhodes doubled wide, hats drifting across the stereo field,
// drums tucked under a low-pass, rain all around.
setcpm(85/4)
$: s("kick ~ [~ kick] ~, ~ snare").bank("soda").gain(.65).lpf(4000).room(.2)
$: s("hat*8").bank("soda").gain(perlin.range(.1, .3)).hpf(6000).pan(sine.range(.3, .7).slow(2))
$: chord("<Fm9 Ebmaj7 Dbmaj7 C7>").voicing().s("gm_epiano1").room(.6).gain(.38)
  .layer(x => x.pan(.2), x => x.pan(.8).late(1/32))
$: n("<0 [~ 2] 4 [3 ~]>").scale("F2:minor").s("triangle").lpf(600).gain(.6)
$: s("rain").bank("soda").slow(2).gain(.22)
$: img("<rain fog>").slow(4).fade(.3)
$: visual("ribbon").hue(210).opacity(.6)
$: captions(['2:14 am', '', 'exit 9', '', 'still raining', '']).slow(2)
`,
  },
  {
    title: 'Neon club',
    category: 'Grooves',
    about: 'House at 124 bpm on a 909, a filter sweep, colours that shift with the bar.',
    aspect: '9:16',
    code: `// House at 124 bpm on a 909. Width from panned hats and a wide supersaw,
// depth from a shared room on the claps and chords.
setcpm(31)
$: s("bd*4").bank("RolandTR909").gain(.85)
$: s("~ cp ~ cp").bank("RolandTR909").room(.35).gain(.55)
$: s("[~ hh]*4").bank("RolandTR909").gain(.4).pan("<.35 .65>*4").lpf(9000)
$: note("<c2 c2 eb2 f2>*8").s("sawtooth").lpf(sine.range(400, 3000).slow(8)).lpq(10)
  .decay(.15).sustain(0).gain(.48)
$: chord("<Cm9 Fm9>").voicing().s("supersaw").lpf(1800).gain(.22).room(.6).roomsize(4)
  .layer(x => x.pan(.15), x => x.pan(.85).late(1/48))
$: img("neon").fx("<none none contrast hue>").hue(sine.range(0, 90).slow(4))
$: visual("pulse").hue(320).amount(.35)
$: visual("bars").hue(280).opacity(.7)
`,
  },
  {
    title: 'Acid sunrise',
    category: 'Grooves',
    about: '303-style acid: a resonant filter opening over eight bars while the sun comes up.',
    aspect: '16:9',
    code: `// A squelchy sawtooth through a resonant filter (lpq) with an envelope (lpenv),
// a 909 underneath, a delay that throws the acid line across the stereo field,
// and the picture rising slowly with saw.range().
setcpm(126/4)

$: s("bd*4").bank("RolandTR909").gain(.85)
$: s("~ cp ~ cp").bank("RolandTR909").room(.3).gain(.5)
$: s("[~ hh]*4").bank("RolandTR909").gain(.38).pan(sine.range(.3, .7).fast(2))
$: s("~ ~ ~ oh").bank("RolandTR909").gain(.25).every(4, x => x.fast(2))
$: note("c2 c2 c3 c2 eb2 c2 [c3 c2] bb1").s("sawtooth")
  .lpf(sine.range(300, 2600).slow(8)).lpq(18).lpenv(3).decay(.12).sustain(0)
  .distort(1.2).gain(.35).sometimesBy(.2, x => x.add(note(12)))
  .delay(.3).delaytime(3/8).delayfeedback(.4).jux(x => x.late(1/8))

$: img("sun").fx("<none none contrast posterize>").pos(saw.range(.9, .4).slow(16))
$: visual("bars").hue(30).opacity(.7)
$: captions(['', '', '', '5:58 am', '', '', '', 'still dancing']).slow(2)
`,
  },
  {
    title: 'Breakbeat chase',
    category: 'Grooves',
    about: 'Drum & bass on a chopped funk break loaded from a GitHub library.',
    aspect: '9:16',
    code: `// The break comes from a GitHub sample library (yaxu/clean-breaks).
// chop(16) cuts it into slices; sometimesBy flips some slices backwards.
samples('github:yaxu/clean-breaks')
setcpm(172/4)

$: s("amen").loopAt(2).chop(16).gain(.75).hpf(80).room(.15)
  .sometimesBy(.15, x => x.speed(-1).pan(rand))
$: note("<e1 e1 g1 [d1 a0]>").s("reese").bank("soda")
  .lpf(sine.range(400, 1200).slow(4)).gain(.6)
$: s("<impact ~ ~ ~>").bank("soda").gain(.45).room(.8).roomsize(6)

$: img("<blocks blocks neon>").fx("<edges none pixelate edges>").fast(2)
$: visual("pulse").hue(0).amount(.5)
$: captions(['run', '', 'run', 'don’t look back']).fast(2)
`,
  },
  {
    title: 'Raga at dusk',
    category: 'Grooves',
    about: 'Mridangam strokes, a drone and a sitar line in phrygian dominant.',
    aspect: '16:9',
    code: `// Mridangam strokes (ta, ki, dhin, thom, nam) from Strudel's default banks,
// a low drone, and a sitar melody in D phrygian dominant – placed in a stone room.
setcpm(84/4)

$: s("ta [ki ta] dhin [~ ta], ~ thom ~ [nam nam]").gain(.6).room(.35).pan("<.4 .6>*4")
$: note("[d2,a2]").s("strings").bank("soda").gain(.22).room(.7)
$: n("<0 1 4 3> [4 5 4 1] <0 ~> [1 0 ~ ~]").scale("D4:phrygian dominant")
  .s("gm_sitar").gain(.4).room(.6).roomsize(5).delay(.25).delayfeedback(.3).pan(.6)

$: img("dusk").fx("sepia").fade(.4)
$: visual("rings").hue(30).amount(.4)
$: captions(['', 'dusk', '', 'the river keeps time']).slow(2)
`,
  },

  // ---------- Dancefloor ----------
  // Genre recipes after Breath of Strudel (CC BY 4.0) – each with a full-screen visual.
  {
    title: 'Dub techno fog',
    category: 'Dancefloor',
    about: 'Dub techno at 118: chord stabs lost in reverb and delay, the picture sinking into the same fog.',
    aspect: 'free',
    code: `// Dub techno (after Breath of Strudel, CC BY 4.0): a muted sine kick, a chord
// stab that is mostly tail, rimshots drenched in delay. The stab's effect
// chain is shared with the picture, so the fog blurs and echoes with the music
// (the picture's glow turned down – .room() set again wins).
setcpm(118/4)

const dub = x => x.lpf(sine.range(500, 2400).slow(16)).room(.85).roomsize(6)
  .delay(.5).delaytime(.375).delayfeedback(.65)

$: note("c1!4").s("sine").penv(16).pdecay(.08).decay(.5).sustain(0).gain(.75)
$: s("hh*8").bank("RolandTR909").gain(".4 .2 .3 .2").hpf(7000).room(.3)
$: s("rim(3,8)").bank("RolandTR909").gain(.3).pan(rand)
  .delay(.6).delaytime(.1875).delayfeedback(.7).room(.4)
$: dub(note("<[c3,eb3,g3] [bb2,d3,f3] [ab2,c3,eb3] [g2,bb2,d3]>").s("sawtooth")
  .lpq(3).decay(.08).sustain(0).release(.02).gain(.35))
$: note("<c1 c1 ab1 bb1>").s("sine").lpf(150).decay(.5).sustain(.5).gain(.5)
$: s("crackle*2").density(.04).gain(.08)

$: dub(img("<fog rain>").slow(8).fade(.3)).room(.3).pan(sine.range(.4, .6).slow(32))   // less glow than the stab
$: visual("spectrum").hue(190).amount(.3).opacity(.6).blend("screen")
$: captions(['', '', 'arriving through fog', '']).slow(4)
`,
  },
  {
    title: 'Melodic techno',
    category: 'Dancefloor',
    about: 'Melodic techno at 124: a sidechained pad, a haunting delayed lead, notes drawn on a pianoroll.',
    aspect: 'free',
    code: `// Melodic techno (after Breath of Strudel, CC BY 4.0). The pad lives on orbit 2
// and the silent bd*4 on duckorbit(2) pumps it. The pianoroll visual shows
// every note of every layer scrolling past the playhead.
setcpm(124/4)

$: note("c1!4").s("sine").penv(20).pdecay(.07).decay(.45).sustain(0).gain(.82)
$: s("hh*16").bank("RolandTR909").gain(".4 .2 .5 .2").hpf(7000)
$: s("~ cp ~ cp").bank("RolandTR909").room(.2).gain(.55)
$: note("<c2 a1 f2 g2>").s("sawtooth").lpf(sine.range(300, 900).slow(16)).lpq(6)
  .lpenv(3).lpd(.15).lps(0).ftype("ladder").decay(.25).sustain(0).gain(.5)
$: chord("<Cm Am7 Fm G>").voicing().s("sawtooth")
  .lpf(sine.range(1000, 2800).slow(16)).lpq(2)
  .attack(.6).decay(1).sustain(.5).release(2).room(.6).roomsize(5).gain(.2).orbit(2)
$: s("bd*4").bank("RolandTR909").duckorbit(2).duckattack(.25).duckdepth(.8).gain(0)
$: n("<0 ~ 4 ~ 7 ~ 4 ~>").scale("C4:harmonic:minor").s("triangle")
  .attack(.1).decay(.3).sustain(.2).release(.5)
  .delay(.5).delaytime(.234).delayfeedback(.55).pan(sine.range(.3, .7).slow(4)).gain(.2)
$: s("rim(5,16)").bank("RolandTR909").iter(4).gain(rand.range(.15, .35)).pan(rand)

$: img("night").fx("<none contrast>").slow(8).opacity(.5).gain(sine.range(.6, 1).slow(16))
$: visual("pianoroll").hue(280).amount(.8).opacity(.9)
`,
  },
  {
    title: 'Trance lift',
    category: 'Dancefloor',
    about: 'Trance at 138 in four chapters: groove, build, breakdown, drop – hats double, claps roll, a riser climbs.',
    aspect: 'free',
    code: `// Trance (after Breath of Strudel, CC BY 4.0; arc after honcoops/strudel_trance).
// arrange() turns the pages: groove → build (hats and claps double every bar,
// a noise riser climbs) → breakdown (pad alone) → drop. The spiral lights one
// turn per cycle; captions mark the lift.
setcpm(138/4)

const kick = s("bd*4").bank("RolandTR909").gain(.85)
const hats = s("[hh hh hh <hh oh>]*4").bank("RolandTR909").cut(1).gain(".6 .3 .5 .4").hpf(6000)
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.25).gain(.6)
const bass = note("c2!8").s("sawtooth").lpf(600).lpq(8).lpenv(3).lpd(.1).lps(0)
  .ftype("ladder").decay(.15).sustain(0).gain(.5)
const pad = chord("<Cm Fm Ab Bb>").voicing().s("sawtooth").superimpose(x => x.add(note(.12)))
  .lpf(sine.range(1500, 4000).slow(16)).lpq(2).attack(.3).sustain(.6).release(1.5)
  .room(.5).roomsize(5).gain(.2).orbit(2)
const pump = s("bd*4").bank("RolandTR909").duckorbit(2).duckattack(.2).duckdepth(1).gain(0)
const lead = n("<0 2 4 7 4 2 0 ~>*2").scale("C4:harmonic:minor").s("sawtooth")
  .lpf(5000).lpq(3).attack(.02).decay(.2).sustain(.3).release(.3)
  .delay(.4).delaytime(.217).delayfeedback(.5).room(.3).gain(.22)
const gate = chord("<Cm Fm Ab Bb>").voicing().s("sawtooth").lpf(3000)
  .struct("[x x ~ x x ~ x ~]*2").decay(.08).sustain(0).release(.03)
  .delay(.3).delaytime(.1).delayfeedback(.4).gain(.15)
const build = stack(
  s("hh*<8 16 16 32>").bank("RolandTR909").gain(.35).hpf(6000),
  s("cp*<4 8 16 32>").bank("RolandTR909").gain("<.4 .5 .6 .7>").room(.5),
  s("white*16").gain(saw.range(0, .35).slow(4)).lpf(sine.range(1000, 8000).slow(4)).room(.6),
)

$: arrange(
  [8, stack(kick, hats, clap, bass, pad, pump, gate)],
  [4, stack(kick, bass, pad, pump, build, captions(['', 'hands', 'up', '']))],
  [4, stack(pad.gain(.3), lead.slow(2), s("~ ~ ~ crash").bank("soda").gain(.5).room(.8).slow(4),
    captions(['', '', '', 'now']))],
  [8, stack(kick, hats, clap, bass, pad, pump, gate, lead)],
)
$: img("<neon sun>").slow(12).fx("<none none contrast hue>").hue(saw.range(0, 180).slow(24)).opacity(.6)
$: visual("spiral").hue(40).amount(.9).opacity(.9)
`,
  },
  {
    title: 'Psy roll',
    category: 'Dancefloor',
    about: 'Psytrance at 142: an offbeat rolling bass, a phrygian lead through a phaser, the pattern on a punchcard.',
    aspect: 'free',
    code: `// Psytrance (after Breath of Strudel, CC BY 4.0). The kick sits on the beat
// and the bass fills every offbeat; the phrygian scale gives the lead its edge.
// A punchcard shows the kick/bass interlock as scrolling blocks.
setcpm(142/4)

$: note("c1!4").s("sine").penv(36).pdecay(.04).decay(.2).sustain(0).gain(.85)
$: note("[~ c2 ~ c2 ~ c2 ~ c2]*2").s("sawtooth").lpf(sine.range(400, 2000).slow(4))
  .lpq(8).ftype("ladder").decay(.12).sustain(0).distort("1.5:.5").gain(.55)
$: s("hh*16").bank("RolandTR909").gain(".5 .3 .6 .3").hpf(8000)
$: s("~ cp ~ ~").bank("RolandTR909").room(.1).gain(.5)
$: n("<[0 1 4 3] [0 5 4 1] [0 3 2 5] [0 1 6 3]>").scale("C4:phrygian").s("square")
  .lpf(sine.range(1000, 5000).slow(8)).lpq(5).decay(.1).sustain(0)
  .delay(.4).delaytime(.125).delayfeedback(.5).phaser(.5).phaserdepth(.6).gain(.2)
$: note("c5").s("sine").fm(sine.range(2, 12).slow(16)).fmh("<1.41 2.76 3.14 1.73>")
  .fmdecay(.3).fmsustain(0).decay(.5).sustain(0).room(.5).roomsize(5)
  .delay(.3).delaytime(.25).delayfeedback(.4).degradeBy(.5).gain(.12)

$: img("blocks").fx("<pixelate edges>").slow(4).coarse(sine.range(1, 12).slow(8)).opacity(.5)
$: visual("punchcard").hue(120).opacity(.9)
`,
  },
  {
    title: 'Hard techno kaleid',
    category: 'Dancefloor',
    about: 'Industrial techno at 145 under a Hydra kaleidoscope with feedback, the bar count driving the symmetry.',
    aspect: 'free',
    code: `// Industrial techno (after Breath of Strudel, CC BY 4.0) with a Hydra pattern
// after Hydra Book (public domain): a kaleidoscope with thresholded stripes,
// fed back through itself with a slow scroll. H("…") changes the symmetry every bar.
await initHydra()
osc(40, .1, 1).thresh(.5).kaleid(H("<3 4 6 8>")).rotate(0, .1)
  .layer(src(o0).scale(1.02).scroll(.003, .006).brightness(-.02).mask(shape(4, .6, .3)))
  .modulate(noise(3), .05).out()

setcpm(145/4)
$: note("d1!4").s("sine").penv(36).pdecay(.04).decay(.3).sustain(0).distort("4:.5").gain(.9)
$: s("hh*16").bank("RolandTR909").gain(".6 .3 .8 .3").crush(6).hpf(6000)
$: s("~ sd ~ [sd sd]").bank("RolandTR909").distort("2:.5").gain(.7)
$: note("[c2!4 <eb2 f2>!2 c2!2]*2").s("sawtooth").lpf(sine.range(200, 1500).fast(2)).lpq(10)
  .ftype("ladder").decay(.1).sustain(0).distort("3:.5").gain(.55)
$: s("white(3,8)").bpf(sine.range(1000, 5000).slow(4)).bpq(8).decay(.05).sustain(0)
  .distort("2:.5").gain(.3)
$: s("brown*2").coarse(16).crush(4).gain(.08)

$: visual("pulse").hue(0).amount(.4).opacity(.6)
$: captions(['', '', '', '', '', '', '', 'harder']).slow(2)
`,
  },

  // ---------- Moods ----------
  {
    title: 'Ambient dawn',
    category: 'Moods',
    about: 'Beatless: warm pads, sparse sine bells, pink noise like distant air.',
    aspect: '16:9',
    code: `// Beatless: warm pads spread wide, sparse sine bells echoing across the room,
// pink noise like distant air.
setcps(.2)
$: note("<[c3,g3,e4] [a2,e3,c4] [f2,c3,a3] [g2,d3,b3]>").s("gm_pad_warm").attack(1.5).release(3)
  .room(.9).roomsize(8).gain(.42).layer(x => x.pan(.1), x => x.pan(.9).late(.15))
$: n("0 2 4 7 9 7 4 2").scale("C5:major").s("sine").degradeBy(.5)
  .delay(.6).delayfeedback(.6).gain(.18).pan(rand).room(.8)
$: s("pink").lpf(sine.range(300, 900).slow(16)).gain(.07)
$: img("<dusk fog>").slow(8).fade(.5)
$: visual("particles").hue(30).amount(.3)
$: captions(['first light', '', '', '']).slow(4)
`,
  },
  {
    title: 'Machine choir',
    category: 'Moods',
    about: 'Synthetic voices – soda’s vox, a GM choir and strings – singing a short poem.',
    aspect: '9:16',
    code: `// Three kinds of voice: soda's synthesised vox, a General MIDI choir doubled
// left and right, and strings – all in a long reverb.
setcpm(60/4)

$: chord("<Fmaj7 Em7 Dm9 Cmaj7>").voicing().s("vox").bank("soda")
  .attack(.4).release(1.2).gain(.26).room(.8).roomsize(6)
$: chord("<Fmaj7 Em7 Dm9 Cmaj7>").voicing().s("gm_choir_aahs").gain(.18).room(.9)
  .layer(x => x.pan(.1), x => x.pan(.9).late(.08))
$: note("<f2 e2 d2 c2>").s("strings").bank("soda").gain(.26).room(.6)
$: n("~ 4 ~ [7 9]").scale("C5:major").s("bell").bank("soda")
  .gain(.18).delay(.5).delayfeedback(.45).room(.8).degradeBy(.3).pan(sine.slow(3))

$: img("<fog night>").slow(4).fade(.5)
$: visual("ribbon").hue(180).opacity(.5)
$: captions(['we were built', 'to hum', 'so we hum', '', 'in the long dark', 'of the server hall', '', '']).slow(2)
`,
  },

  // ---------- Studies ----------
  {
    title: 'Three against four against five',
    category: 'Studies',
    about: 'Polyrhythm: three layers divide the cycle in 3, 4 and 5 and meet at every downbeat.',
    aspect: '1:1',
    code: `// Each layer splits one cycle into a different number of steps – and sits in
// its own place in the stereo field, so you can follow them separately.
// They only line up on the first beat of every cycle – watch the rings.
setcpm(80/4)

$: n("0 2 4").scale("C4:major").s("gm_marimba").gain(.45).pan(.15).room(.4)
$: n("7 9 11 9").scale("C4:major").s("gm_kalimba").gain(.38).pan(.85).room(.4)
$: n("0 4 2 6 4").scale("C3:major").s("pluck").bank("soda").gain(.35).pan(.5).room(.4)
$: s("kick:1").bank("soda").gain(.45)

$: visual("rings").hue(160).amount(.7)
$: captions(['3 (left)', '3 : 4 (right)', '3 : 4 : 5 (centre)', 'together again at every downbeat']).slow(2)
`,
  },
  {
    title: 'Generative garden',
    category: 'Studies',
    about: 'Chance, noise and choice: a piece that never plays the same bar twice.',
    aspect: '16:9',
    code: `// irand picks random notes, degradeBy drops some, perlin drifts the volume,
// pan(rand) scatters them in space, chooseCycles picks a kick pattern each cycle.
// Nothing repeats.
setcpm(88/4)

$: n(irand(8).segment(8)).scale("G4:major pentatonic").s("gm_kalimba")
  .degradeBy(.35).gain(perlin.range(.2, .45)).room(.7).roomsize(4).delay(.3).pan(rand)
$: n(irand(5).segment(4)).scale("G2:major pentatonic").s("gm_marimba")
  .sometimesBy(.5, x => x.ply(2)).gain(.32).pan(perlin.range(.3, .7)).room(.4)
$: s("shaker*8?").bank("soda").gain(.14).pan(sine.fast(2))
$: chooseCycles(s("kick:1 ~ ~ ~"), s("kick:1 ~ kick:1 ~"), s("~ ~ kick:1 ~")).bank("soda").gain(.38)

$: img("<sun fog dusk>").slow(8).fade(.5)
$: visual("particles").hue(perlin.range(80, 160)).amount(.5)
$: captions(['nothing here repeats', '', '', '', 'listen longer', '', '', '']).slow(2)
`,
  },
  {
    title: 'Dub picture',
    category: 'Studies',
    about: 'One effect chain for sound and picture: the filter that opens the bass also sharpens the image, the room that holds the chords makes it glow.',
    aspect: '9:16',
    code: `// Strudel's audio effects mean the same thing on a picture: lpf blurs,
// room glows, delay echoes, crush posterizes, pan slides the crop.
// dub() is applied to the bass AND to the image, so they move together.
setcpm(70/4)

const dub = x => x.lpf(sine.range(300, 6000).slow(8)).room(.7).roomsize(4).delay(.4).delayfeedback(.6)

$: s("kick:1 ~ ~ kick:1, ~ ~ snare:1 ~, hat*4").bank("soda").gain(.5).lpf(4000).room(.2)
$: dub(note("<c2 c2 eb2 g1>").s("bass").bank("soda").gain(.5))
$: dub(chord("<Cm7 Cm7 Eb^7 Gm7>").voicing().s("gm_epiano1").gain(.28)).delaytime(.375)

$: dub(img("<night neon rain dusk>").slow(4).fade(.2)).pan(sine.range(.3, .7).slow(16))
$: visual("pulse").hue(200).amount(.3).opacity(.5)
$: captions(['the same chain', '', 'shapes the sound', '', 'and the picture', '', '', '']).slow(2)
`,
  },
  {
    title: 'Hydra dream',
    category: 'Studies',
    about: 'Hydra, a live video synth, painted under the stage and driven by the same patterns.',
    aspect: '16:9',
    code: `// Hydra draws under everything else. H("…") feeds a pattern into Hydra,
// so the kaleidoscope changes with the bar, like the chords do.
await initHydra()
osc(H("<8 16 32 16>"), .05, 1.2).kaleid(H("<4 6>")).modulate(noise(2), .2).out()

setcpm(70/4)
$: chord("<Am Fmaj7 C G>").voicing().s("gm_pad_halo").gain(.26).room(.8).roomsize(6)
  .layer(x => x.pan(.15), x => x.pan(.85).late(.1))
$: n("0 [2 4] <7 9> 4").scale("A4:minor").s("bell").bank("soda").gain(.26)
  .delay(.4).delayfeedback(.4).pan(sine.slow(2)).room(.6)
$: s("kick:1 ~ ~ ~, ~ ~ snare:2 ~").bank("soda").gain(.38).room(.4)
$: visual("particles").hue(300).amount(.3).blend("screen")
$: captions(['', 'the screen', 'dreams in', 'the key of A']).slow(2)
`,
  },

  // ---------- Live ----------
  {
    title: 'Mirror jam',
    category: 'Live',
    about: 'Camera-driven: your movement opens the filter, your face becomes the picture.',
    aspect: '9:16',
    code: `// Turn the camera on (toolbar) – move to open the bass filter.
setcpm(30)
$: s("kick*4, ~ clap").bank("soda").gain(.6).room(.2)
$: s("hat*8").bank("soda").gain(.3).pan(sine.range(.3, .7).fast(2))
$: note("<a1 a1 c2 g1>*4").s("sawtooth").lpf(camMotion.range(250, 4500)).lpq(6).gain(.5)
  .jux(x => x.late(1/16))
$: cam().mirror(1).fx("<none posterize edges posterize>").opacity(.9)
$: visual("rings").hue(160).amount(.6)
$: captions(['move to open the filter']).slow(4)
`,
  },
  {
    title: 'Video booth',
    category: 'Live',
    about: 'Camera through the video effectors: kaleidoscope, slit-scan, VHS, feedback – one look per bar, strength from your movement.',
    aspect: 'free',
    code: `// Turn the camera on (toolbar). .fx() chains effectors in order – "vhs:kaleido"
// is VHS then kaleidoscope – and .amount() is their strength. Here the look
// changes every bar and camMotion (how much you move) sets how strong it is.
setcpm(110/4)
$: s("kick*4, ~ clap, hat*8").bank("soda").gain(.55).room(.2)
$: note("<c2 c2 eb2 g1>*8").s("sawtooth").lpf(camMotion.range(300, 3000)).lpq(8).decay(.15).sustain(0).gain(.45)
$: chord("<Cm9 Abmaj7>").voicing().s("gm_epiano1").gain(.25).room(.5).delay(.3).delayfeedback(.4)

$: cam().mirror(1)
  .fx("<kaleido timeslice vhs:rgbshift feedback symmetry glitch:scanlines halftone sort>")
  .amount(camMotion.range(.2, .9))
  .hue(saw.range(0, 360).slow(8))
$: visual("pulse").hue(200).amount(.25)
$: captions(['', 'move', '', 'the picture follows']).slow(2)
`,
  },

  // ---------- From live-coding-music-mcp ----------
  {
    title: 'Ambient drone',
    category: 'From live-coding-music-mcp',
    about: 'Slow sawtooth drone with a filter sweeping over 16 cycles.',
    aspect: 'free',
    code: `// adapted from live-coding-music-mcp (AGPL-3.0) examples/patterns/ambient-drone.tidal
// Ambient Drone Pattern
setcpm(60/4) // one cycle = one 4/4 bar

stack(
  // Drone layer
  note("c2 c3 g3 c4")
    .s("sawtooth")
    .attack(4)
    .decay(2)
    .sustain(0.7)
    .release(8)
    .cutoff(sine.slow(16).range(200, 1500))
    .room(0.9)
    .delay(0.75)
    .gain(0.4),

  // Texture layer
  note("c5 e5 g5 c6")
    .struct("~ 1 ~ ~ 1 ~ ~ ~")
    .s("triangle")
    .room(0.95)
    .delay(0.5)
    .delaytime(0.375)
    .delayfeedback(0.7)
    .pan(perlin.range(-0.8, 0.8))
    .gain(0.3),

  // Subtle percussion
  s("~ ~ ~ hh:8")
    .gain(0.1)
    .room(0.8)
    .hpf(8000)
).gain(0.7)
`,
  },
  {
    title: 'Drum & bass 174',
    category: 'From live-coding-music-mcp',
    about: 'Breakbeat, sub and reese bass at 174 bpm.',
    aspect: 'free',
    code: `// adapted from live-coding-music-mcp (AGPL-3.0) examples/patterns/dnb-174bpm.tidal
// Drum & Bass at 174 BPM
setcpm(174/4) // one cycle = one 4/4 bar

stack(
  // Breakbeat
  s("bd ~ ~ [bd bd] ~ ~ bd ~, ~ ~ sd:3 ~ ~ sd:3 ~ ~")
    .fast(2),

  // Hi-hats
  s("hh*16")
    .gain(0.5)
    .pan(sine.range(-0.3, 0.3)),

  // Ride
  s("~ ~ ~ ~ rd ~ ~ ~"),

  // Sub bass
  note("c1 ~ ~ c2 ~ c1 ~ ~")
    .s("sine:2")
    .gain(0.8)
    .lpf(200),

  // Reese bass
  note("c2 c2 ~ eb2 ~ ~ g1 ~")
    .s("sawtooth")
    .detune(0.1)
    .cutoff(sine.range(400, 1200).fast(2))
    .gain(0.6)
).room(0.1).gain(0.9)
`,
  },
  {
    title: 'Minimal techno 130',
    category: 'From live-coding-music-mcp',
    about: 'Four on the floor, a minimal bassline and a swung hat.',
    aspect: 'free',
    code: `// adapted from live-coding-music-mcp (AGPL-3.0) examples/patterns/techno-130bpm.tidal
// Minimal Techno at 130 BPM
setcpm(130/4) // one cycle = one 4/4 bar

stack(
  // Kick drum - four on the floor
  s("bd*4").gain(0.9),

  // Clap on 2 and 4
  s("~ cp ~ cp").room(0.2),

  // Hi-hats with movement
  s("hh*16").gain(0.4).pan(sine.range(-0.5, 0.5)),

  // Minimal bassline
  note("c2 c2 eb2 c2").s("sawtooth").cutoff(800).gain(0.6),

  // Occasional open hat
  s("~ ~ ~ oh").gain(0.3).every(4, x => x.fast(2))
).swing(0.05)
`,
  },
];
