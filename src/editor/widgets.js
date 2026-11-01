// Inline visuals in the code (._pianoroll(), ._punchcard(), ._spiral(),
// ._scope(), ._spectrum(), ._pitchwheel()) are CodeMirror block widgets, each
// with its own canvas (its DOM id comes from the transpiler: _widget__pianoroll_0,
// _widget__pianoroll_1, …).
//
// Strudel's BlockWidget says every widget equals every other (eq() → true).
// With the @codemirror/view used here, that lets CodeMirror reuse one widget's
// canvas in another widget's slot – then the real owner moves it away, lines
// vanish and two of three pianorolls never show. Widgets are equal only when
// they are the same widget, i.e. have the same id.
import { BlockWidget } from '@strudel/codemirror';
import { getWidgetID } from '@strudel/transpiler';

BlockWidget.prototype.eq = function eq(other) {
  return other instanceof BlockWidget && getWidgetID(this.widgetConfig) === getWidgetID(other.widgetConfig);
};
