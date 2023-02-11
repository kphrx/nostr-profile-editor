import {
  ViewUpdate,
  Decoration,
  EditorView,
  ViewPlugin,
} from '@codemirror/view';
import type { PluginValue, DecorationSet } from '@codemirror/view';

import { placeholderMatcher } from './placeholder-widget.js';

class PlaceholderPlugin implements PluginValue {
  placeholders: DecorationSet;

  constructor(view: EditorView) {
    this.placeholders = placeholderMatcher.createDeco(view);
  }

  update(update: ViewUpdate) {
    this.placeholders = placeholderMatcher.updateDeco(
      update,
      this.placeholders
    );
  }
}

export const placeholders = ViewPlugin.fromClass(PlaceholderPlugin, {
  decorations: instance => instance.placeholders,
  provide: plugin =>
    EditorView.atomicRanges.of(
      view => view.plugin(plugin)?.placeholders ?? Decoration.none
    ),
});
