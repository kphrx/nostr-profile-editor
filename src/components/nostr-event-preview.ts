import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

const PreviewMessages = {
  Checking: 'Checking NIP-07 extension...',
  Require: 'Require NIP-07 extension.',
  FailedSigning: 'Failed signing event.',
};

@customElement('nostr-event-preview')
export class NostrEventPreview extends LitElement {
  static styles = css`
    p {
      display: inline-block;
      margin: 0;
      line-height: 1em;
      height: 1em;
    }
  `;

  @state()
  message: string = PreviewMessages.Checking;

  @state()
  result: string = JSON.stringify(
    {
      id: '<32-bytes lowercase hex-encoded sha256 of the the serialized event data>',
      pubkey:
        '<32-bytes lowercase hex-encoded public key of the event creator>',
      created_at: '<unix timestamp in seconds>',
      kind: 0,
      tags: [],
      content:
        '{"name": <username>, "about": <string>, "picture": <url, string>}',
      sig: '<64-bytes hex of the signature of the sha256 hash of the serialized event data, which is the same as the "id" field>',
    },
    null,
    4
  );

  @state()
  publicKey?: string;

  @property({ type: String, reflect: true })
  content = '';

  get #currentEvent() {
    let content;
    try {
      content = JSON.stringify(JSON.parse(this.content));
    } catch {
      throw Error('invalid profile json');
    }
    return {
      created_at: Math.round(Date.now() / 1000),
      kind: 0,
      tags: [],
      content,
    };
  }

  async #getPublicKey() {
    try {
      const pubkey = await window.nostr?.getPublicKey();
      if (pubkey == null) {
        this.message = PreviewMessages.Require;
        return;
      }
      this.message = '';
      this.publicKey = pubkey;
    } catch {
      this.message = PreviewMessages.Require;
    }
  }

  #checkNip07(timeout: number, recursive: number = 0) {
    if (window.nostr != null) {
      this.#getPublicKey();
      return;
    }
    if (recursive >= 10) {
      this.message = PreviewMessages.Require;
      return;
    }
    setTimeout(() => this.#checkNip07(timeout * 2, recursive + 1), timeout * 2);
  }

  connectedCallback() {
    super.connectedCallback();
    if (window.nostr != null) {
      this.#getPublicKey();
      return;
    }
    setTimeout(() => this.#checkNip07(100), 100);
  }

  previewMessage() {
    return html`<p>${this.message}</p>`;
  }

  async #signEvent() {
    let event = JSON.parse(this.result);
    try {
      event = await window.nostr?.signEvent(event);
      if (event == null) {
        this.message = PreviewMessages.FailedSigning;
        return;
      }
    } catch {
      this.message = PreviewMessages.FailedSigning;
      return;
    }
    this.result = JSON.stringify(event, null, 4);
  }

  signButton() {
    if (
      this.message === PreviewMessages.Checking ||
      this.message === PreviewMessages.Require
    ) {
      return '';
    }
    return html`<button @click=${() => this.#signEvent()}>Sign</button>`;
  }

  preformatResult() {
    if (
      this.message === PreviewMessages.Checking ||
      this.message === PreviewMessages.Require
    ) {
      return '';
    }
    return html`<pre><code>${this.result}</code></pre>`;
  }

  render() {
    return html`
      <div>
        ${this.preformatResult()}
        <div>${this.signButton()} ${this.previewMessage()}</div>
      </div>
    `;
  }

  async #getEventHash() {
    const event = this.#currentEvent;
    const pubkey = this.publicKey!;
    const encoder = new TextEncoder();
    const selializedEvent = JSON.stringify([
      0,
      pubkey,
      event.created_at,
      event.kind,
      event.tags,
      event.content,
    ]);
    const digest = await window.crypto.subtle.digest(
      'SHA-256',
      encoder.encode(selializedEvent)
    );
    this.message = '';
    this.result = JSON.stringify(
      {
        id: Array.from(new Uint8Array(digest))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''),
        pubkey,
        ...event,
        sig: '',
      },
      null,
      4
    );
  }

  willUpdate(changedProperties: PropertyValues<this>) {
    if (this.publicKey == null) {
      return;
    }
    if (
      changedProperties.has('content') ||
      changedProperties.has('publicKey')
    ) {
      this.#getEventHash().catch((e: Error) => {
        this.message = e.message;
      });
    }
  }
}
