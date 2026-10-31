export const DEFAULT_CODE = `// First light · ctrl+enter plays · ctrl+. stops · ctrl+s saves
// music, pictures, words and visuals are all patterns – change a number and press ctrl+enter
setcpm(92/4)

// music box melody, drifting gently left and right in a big room
$: n("<[0 4 7 9] [7 4 2 4] [0 2 4 7] [9 7 4 2]>").scale("D5:major pentatonic")
  .s("gm_music_box").gain(.35).room(.7).roomsize(4)
  .delay(.25).delayfeedback(.35).pan(sine.range(.3, .7).slow(8))

// a soft arpeggio, doubled left and right a moment apart for width
$: n("0 1 2 3 2 1").chord("<D Bm G A>").voicing().s("pluck").bank("soda")
  .gain(.28).room(.5).hpf(200).lpf(4000)
  .layer(x => x.pan(.2), x => x.pan(.8).late(1/48))

// strings far in the back
$: chord("<D Bm G A>").voicing().s("gm_string_ensemble_1").gain(.12)
  .room(1).roomsize(6).lpf(2500).layer(x => x.pan(0), x => x.pan(1).late(.1))

// a light pulse underneath
$: s("kick:1 ~ ~ ~").bank("soda").gain(.45).lpf(1500)
$: s("~ shaker ~ shaker").bank("soda").gain(.2).pan(.65).room(.3)
$: note("<d2 b1 g1 a1>").s("sub").bank("soda").gain(.4)

// picture and words
$: img("<sun sun dusk sun>").slow(4).fade(.4).pos(.6)
$: visual("particles").hue(45).amount(.35)
$: captions(['first light', '', 'the kettle, the window', '', 'and the day begins', '', '', '']).slow(2)
`;
