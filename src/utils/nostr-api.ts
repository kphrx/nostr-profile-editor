import type { NostrEvent } from './nostr-types';

class NostrApi {
  receivedEvents: { [key: string]: {} } = {};

  relays: Set<string> = new Set(['wss://nostr-pub.wellorder.net/']);

  request(type: string, ...filters: {}[]) {
    for (const r of this.relays) {
      const socket = new WebSocket(r);
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(['REQ', `request:${type}`, ...filters]));
      });
      socket.addEventListener('message', ev => {
        const message:
          | ['NOTICE' | 'EOSE', string]
          | ['EVENT', string, NostrEvent] = JSON.parse(ev.data);
        if (message[0] === 'EVENT') {
          const event = message[2];
          this.receivedEvents[event.id] = event;
          return;
        }
        if (message[0] === 'EOSE') {
          socket.send(JSON.stringify(['CLOSE', message[1]]));
          socket.close();
          return;
        }

        console.debug(message);
      });
    }
  }

  requestKinds(pubkey: string, ...kinds: number[]) {
    this.request('kinds', {
      kinds,
      authors: [pubkey],
    });
  }

  requestEvents(pubkey: string, ...ids: string[]) {
    this.request('events', {
      ids,
      authors: [pubkey],
    });
  }
}

const singleton = new NostrApi();

export type { NostrApi };
export default singleton;
