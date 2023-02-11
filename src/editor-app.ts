import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import './components/code-mirror.js';

@customElement('editor-app')
export class EditorApp extends LitElement {
  @property({ type: String }) header = 'Nostr raw profile editor';

  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      color: #1a2b42;
      max-width: 960px;
      margin: 0 auto;
      text-align: center;
      background-color: var(--editor-app-background-color);
    }

    main {
      flex-grow: 1;
    }

    footer {
      margin: 1em;
      align-items: center;
    }

    footer a {
      margin-left: 5px;
    }
  `;

  render() {
    return html`
      <header>
        <h1>${this.header}</h1>
      </header>

      <main>
        <code-mirror></code-mirror>
      </main>

      <footer>
        <small>&copy; 2023 @kphrx</small>
      </footer>
    `;
  }
}
