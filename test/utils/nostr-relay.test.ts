import { expect } from '@open-wc/testing';

import { NostrRelay } from '../../src/utils/nostr-relay.js';

describe('NostrRelay', () => {
  it('connection', done => {
    const conn = new NostrRelay('nostr-pub.wellorder.net');
    conn.addEventListener('init', () => {
      expect(conn.cannotConnect).to.be.false;
      expect(conn.relay).to.equal('nostr-pub.wellorder.net');
      expect(conn.info).to.have.property(
        'id',
        'wss://nostr-pub.wellorder.net/'
      );
      expect(conn.info).to.have.property('name', 'Public Wellorder Relay');
      expect(conn.info).to.have.property(
        'description',
        'Public relay for nostr development and use.'
      );
      expect(conn.info).to.have.property(
        'software',
        'https://git.sr.ht/~gheartsfield/nostr-rs-relay'
      );
      expect(conn.info).to.have.property('supported_nips').that.is.an('array');
    });
    conn.addEventListener('open', () => {
      expect(conn.hasConnection).to.be.true;
      setTimeout(() => conn.close(), 1000);
    });
    conn.addEventListener('close', () => {
      expect(conn.readyState).to.equal(WebSocket.CLOSED);
      done();
    });
  });

  it('invalid domain', done => {
    const conn = new NostrRelay('nostr.relay.invalid');
    conn.addEventListener('init', () => {
      expect(conn.cannotConnect).to.be.true;
      done();
    });
  });
});
