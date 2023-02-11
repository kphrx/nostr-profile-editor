import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { EditorView, minimalSetup } from 'codemirror';
import { lineNumbers, gutter } from '@codemirror/view';
import { json } from '@codemirror/lang-json';
import { basicLight as theme } from 'cm6-theme-basic-light';

@customElement('code-mirror')
export class CodeMirror extends LitElement {
  static styles = css`
    .editor {
      align-items: center;
      width: 90vw;
      max-width: 960px;
      text-align: left;
    }
  `;

  editor?: EditorView;

  render() {
    return html`<div class="editor"></div>`;
  }

  firstUpdated() {
    this.editor = new EditorView({
      extensions: [
        minimalSetup,
        theme,
        lineNumbers(),
        gutter({ class: 'cm-gutter' }),
        json(),
      ],
      parent: this.shadowRoot?.querySelector('div.editor')!,
    });
  }
}
