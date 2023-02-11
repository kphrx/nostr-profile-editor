import { showPanel } from '@codemirror/view';

import '../components/nostr-event-preview.js';

export function eventPreview() {
  return showPanel.of(view => {
    const dom = document.createElement('nostr-event-preview');
    dom.setAttribute('content', view.state.doc.toString());

    return {
      dom,
      update(update) {
        if (update.docChanged) {
          dom.setAttribute('content', update.state.doc.toString());
        }
      },
      top: true,
    };
  });
}
