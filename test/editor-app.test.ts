import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';

import type { EditorApp } from '../src/editor-app.js';
import '../src/editor-app.js';

describe('EditorApp', () => {
  let element: EditorApp;
  beforeEach(async () => {
    element = await fixture(html`<editor-app></editor-app>`);
  });

  it('renders a h1', () => {
    const h1 = element.shadowRoot!.querySelector('h1')!;
    expect(h1).to.exist;
    expect(h1.textContent).to.equal('Nostr raw profile editor');
  });

  it('passes the a11y audit', async () => {
    await expect(element).shadowDom.to.be.accessible();
  });
});
