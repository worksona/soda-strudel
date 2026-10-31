export const DEFAULT_CODE = `// soda-strudel · ctrl+enter plays/updates · ctrl+. stops
// music, media, captions and visuals are all patterns
setcps(.5)

$: s("kick*2 [~ snare] [~ kick] snare").bank("soda").gain(.9)
$: s("hat*8").bank("soda").gain(perlin.range(.15, .45))
$: note("<c2 c2 eb2 bb1>").s("sawtooth")
  .lpf(sine.range(300, 1600).slow(8)).decay(.25).sustain(0).gain(.6)
$: n("<0 2 4 [6 4]>*2").scale("C4:minor").s("triangle").delay(.4).room(.5).gain(.35)
$: s("pad").bank("soda").slow(2).room(.6).gain(.4)

$: img("<rain neon dusk fog>").slow(4).fade(.3)
$: visual("particles").hue(200)
$: visual("ribbon").opacity(.5)
$: captions(['soda-strudel', '', 'sound · image · story', '']).slow(2)
`;
