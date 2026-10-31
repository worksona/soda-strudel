# UX principles

soda.strudel adds a lot of multimedia without adding screens. These rules keep
it that way. Check new features against them.

1. **Code first.** Every creative capability – media, camera, captions, visuals,
   scenes – is reachable from code before it gets any UI. Claude writes the code,
   so rich pieces come from describing them, not from learning panels.
2. **UI only for what code can't do:** permissions (mic, camera), files (import,
   export), and sharing. A new top-level button needs one of those reasons.
3. **One row of outlined icons, one level of pages.** Left: brand (About),
   three pulldowns – File, View (code / stage / full screen), Input (mic,
   camera) – then Play and Update (lit when there are changes to apply). Pulldowns show state on their button: View's icon is
   the current view, Input glows while recording or the camera is on. Right: pages (Examples,
   Sounds, Media, Reference), actions (Export, Share, Claude), then About and
   Settings. Tiny captions under the icons (can be turned off). Every
   page has its own button and opens on the right, under the buttons – no
   menus inside menus, no tabs inside pages, no modal dialogs (Export and
   Share are pages too). The open page's icon is lit and
   the panel title says where you are. On phones, pages and actions fold into
   one Pages button beside the panel it opens. Square corners everywhere.
4. **One thing, one place.** No feature appears on two pages. Sounds behave the
   same everywhere: click to hear, double-click / Enter to insert. Light, dark
   and system appearance; the stage stays dark in all of them.
5. **Viewers get less.** A shared link shows a title card, one tap to play, full
   screen and Remix. No toolbar, no code unless they ask.
6. **Never block playback.** Missing media shows a soft placeholder, denied
   camera plays without it, a code error keeps the last good version playing.
7. **Nothing starts on its own.** Camera and mic only from a tap, with a live
   indicator, paused when the tab is hidden. Nothing leaves the device unless the
   user shares or exports.
8. **Phone first.** Every action works by touch (no double-click-only or
   keyboard-only paths: the Update button replaces ctrl+enter, Insert replaces
   double-click); 16px inputs; safe areas respected. **Phone first for output.** Test the 9:16 stage on a phone before shipping a
   visual or layout change. Keep captions clear of the bottom ~20%.
9. **Say where things live.** "Stays in this browser", "nothing is uploaded",
   "others will hear gaps" – short, at the moment it matters.
