import type { NostrEvent } from './nostr-types';

class NostrApi {
  receivedEvents: { [key: string]: {} } = {};

  relays: Set<string> = new Set(['wss://nostr-pub.wellorder.net/']);

  async #request(
    relay: string,
    type: string,
    filters: {}[]
  ): Promise<NostrEvent[]> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(relay);
      const events: NostrEvent[] = [];
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(['REQ', `request:${type}`, ...filters]));
      });
      socket.addEventListener('close', e => {
        console.debug(e);
        if (e.code === 1000) {
          resolve(events);
          return;
        }
        reject(new Error(`${e.code}: ${e.reason}`));
      });
      socket.addEventListener('error', e => {
        console.error(e);
        reject(new Error(`WebSocket error: ${e}`));
      });
      socket.addEventListener('message', ev => {
        const message:
          | ['NOTICE' | 'EOSE', string]
          | ['EVENT', string, NostrEvent] = JSON.parse(ev.data);
        if (message[0] === 'EVENT') {
          const event = message[2];
          if (event.id in this.receivedEvents) {
            return;
          }
          this.receivedEvents[event.id] = event;
          events.push(event);
          return;
        }
        if (message[0] === 'EOSE') {
          socket.send(JSON.stringify(['CLOSE', message[1]]));
          socket.close();
          resolve(events);
          return;
        }

        console.debug(message);
      });
    });
  }

  async requests(type: string, ...filters: {}[]) {
    const results = await Promise.allSettled(
      Array.from(this.relays).map(r => this.#request(r, type, filters))
    );
    return results.reduce<{ events: NostrEvent[]; errors: Error[] }>(
      (acc, result) => {
        switch (result.status) {
          case 'fulfilled':
            acc.events.push(...result.value);
            break;
          default:
            acc.errors.push(result.reason as Error);
        }
        return acc;
      },
      { events: [], errors: [] }
    );
  }

  requestKinds(pubkey: string, ...kinds: number[]) {
    return this.requests('kinds', {
      kinds,
      authors: [pubkey],
    });
  }

  requestEvents(pubkey: string, ...ids: string[]) {
    return this.requests('events', {
      ids,
      authors: [pubkey],
    });
  }
}

const singleton = new NostrApi();

export type { NostrApi };
export default singleton;
