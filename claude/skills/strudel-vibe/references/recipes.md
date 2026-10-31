# Recipes

Complete, validated starting points. The app's Examples page has more (src/examples.js): The last bus home, Four seasons, Acid sunrise, Breakbeat chase, Raga at dusk, Machine choir, polyrhythm and generative studies, Hydra dream. Change sounds, keys and pictures to fit
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
