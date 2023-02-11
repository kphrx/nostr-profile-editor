import {
  WidgetType,
  MatchDecorator,
  Decoration /* , EditorView, ViewPlugin */,
} from '@codemirror/view';

class PlaceholderWidget extends WidgetType {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  eq(other: PlaceholderWidget) {
    return this.name === other.name;
  }

  toDOM() {
    const elt = document.createElement('span');
    elt.style.cssText = `
    border: 1px solid blue;
    border-radius: 4px;
    padding: 0 3px;
    background: lightblue;`;
    elt.textContent = this.name;
    return elt;
  }

  static ignoreEvent() {
    return false;
  }
}

export const placeholderMatcher = new MatchDecorator({
  regexp: /\[\[(\w+)\]\]/g,
  decoration: match =>
    Decoration.replace({
      widget: new PlaceholderWidget(match[1]),
    }),
});
