export const DEFAULT_CODE = `// First light – a sunrise in two and a half minutes of music, pictures and words
// ctrl+enter (cmd+enter on a Mac) plays · ctrl+. stops · drag a slider to mix live
// Each part is a variable. arrange() at the bottom brings them in one by one,
// from the dark to full daylight – and the pictures follow the same plan.
setcpm(30) // one cycle = one bar of four beats at 120 bpm

// the bass: a pulsing root with an octave hop, its filter breathing slowly
const bass = n("<[0 0 7 0]*2 [5 5 12 5]*2 [3 3 10 3]*2 [4 4 11 <4 6>]*2>")
  .scale("D2:major").s("gm_synth_bass_2").attack(.01)
  .cutoff(perlin.range(600, 6000).slow(4))
  .room(.6).pan(.35).gain(slider(.5, 0, 1))

// the glow: wide chords, one a bar
const glow = n("<[0,2,4] [5,7,9] [3,5,7] [4,6,8]>").scale("D3:major")
  .s("supersaw").attack(.6).release(1.5).lpf(1800)
  .room(1).roomsize(6).gain(slider(.2, 0, 1))

// the song: a long, slow melody that answers itself every four bars
const song = n("<[7@3 6@3 4@2] [5@3 4@3 2@2] [3@3 4@3 5@2] [4@5 ~ 6 7]>")
  .scale("D4:major").s("supersaw").lpf(5000)
  .room(1).delay(.25).delayfeedback(.3).pan(.65).gain(slider(.4, 0, 1))

// the lift: power chords chopped into eighths, the filter opening over 16 bars
const lift = n("<[0,4,7] [5,9,12] [3,7,10] [4,8,11]>").scale("D2:major")
  .s("supersaw").seg(8).lpf(sine.range(800, 4000).slow(16))
  .room(.8).pan(.4).gain(slider(.24, 0, 1))

// the birds: bells high up, drifting across
const birds = n("<[~ 11 ~ 9] [~ 12 ~ 11] [~ 10 9 ~] [11 ~ 13 ~]>").scale("D4:major")
  .s("gm_celesta").room(1).delay(.375).delayfeedback(.4)
  .pan(sine.range(.2, .8).slow(4)).gain(slider(.8, 0, 1))

// the drums, sixteen steps a bar – a pickup every fourth bar,
// toms and a crash to mark every eighth
const kick = s("bd").struct("x - - - x - - - x - - - x - <- - - x> -")
const snare = s("sd").struct("- - - - x - - - - - - - x - - <- - - x>").gain(.8)
const hats = s("hh*16").gain("[.12 .3]*8").pan(.6)
const fill = s("- - - - - - - - - - - - mt mt lt lt").mask("<0!7 1>").gain(.7)
const crash = s("<cr -!7>").gain(.5)
const drums = stack(kick, snare, hats, fill, crash).lpf(6000).room(.15).gain(slider(.3, 0, 1))
const softdrums = stack(kick.mask("<0 1>"), s("hh*8").gain(.15).pan(.6)).lpf(2500).gain(.35)

// the dawn: pink noise and vinyl crackle under everything
$: stack(s("pink").gain(.06), s("crackle").gain(.5).lpf(4000)).slow(4)

// the plan, in bars
$: arrange(
  [4, glow.lpf(600)],                                      // dark: only the glow
  [8, stack(glow, bass)],                                  // the pulse arrives
  [8, stack(glow, bass, song)],                            // the song
  [8, stack(glow, bass, song, lift, softdrums)],           // the lift
  [16, stack(glow, bass, song, lift, drums)],              // daylight
  [16, stack(glow, bass, song, lift, drums, birds)],       // the birds
  [8, stack(glow, bass, song, birds, s("hh*8").gain(.08))   // the sun is up – fade out
    .postgain("1 .9 .8 .7 .55 .4 .25 .1".slow(8)).delay(.4)],
  [4, silence],
)

// what you see follows the same plan: night, fog clearing, dusk, sun
$: arrange(
  [4, stack(img("night").fade(.5), captions(['first light', '', '', '']))],
  [8, stack(img("fog").fade(.4).lpf(sine.range(600, 8000).slow(8)), visual("ribbon").hue(220).opacity(.5))],
  [8, stack(img("dusk").fade(.4), visual("punchcard").hue(260).opacity(.55),
    captions(['the kettle', '', 'the window', '', '', '', '', '']))],
  [8, stack(img("<dusk sun>").slow(4).fade(.4), visual("punchcard").hue(30).opacity(.55))],
  [16, stack(img("sun").fx("ripple").amount(.15), visual("rings").hue(40).amount(.5),
    visual("punchcard").hue("<20 40 330>").opacity(.5),
    captions(['', '', '', '', 'and the day begins', '', '', '']).slow(2))],
  [16, stack(img("sun"), visual("particles").hue(45).amount(.5),
    visual("punchcard").hue("<20 40 330>").opacity(.5))],
  [8, stack(img("sun").opacity("1 .9 .8 .7 .55 .4 .25 .1".slow(8)),
    captions(['', '', '', '', 'good morning', '', '', '']))],
  [4, silence],
)
`;
