import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { minimalSetup } from 'codemirror';
import { EditorView, lineNumbers, gutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { basicLight as theme } from 'cm6-theme-basic-light';

import { eventPreview } from '../extensions/event-preview.js';
import { placeholders } from '../extensions/placeholders.js';

@customElement('code-mirror')
export class CodeMirror extends LitElement {
  static styles = css`
    .editor {
      align-items: center;
      width: 100%;
      max-width: 960px;
      text-align: left;
    }
  `;

  @property({ type: String })
  defaultContent =
    '{"name": "[[username]]", "about": "[[string]]", "picture": "[[url]]"}';

  editor?: EditorView;

  render() {
    return html`<div class="editor"></div>`;
  }

  firstUpdated() {
    const extensions = [
      placeholders,
      eventPreview(),
      minimalSetup,
      theme,
      lineNumbers(),
      gutter({ class: 'cm-gutter' }),
      json(),
    ];
    const state = EditorState.create({
      doc: JSON.stringify(JSON.parse(this.defaultContent), null, 4),
      extensions,
    });
    this.editor = new EditorView({
      state,
      parent: this.shadowRoot?.querySelector('div.editor')!,
    });
  }
}
