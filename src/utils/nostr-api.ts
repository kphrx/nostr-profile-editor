import type {
  NostrEvent,
  NostrClientRequestEvent,
  NostrClientCloseSubscription,
  NostrRelaySendEvent,
  NostrRelaySendMessage,
  NostrRelayEndOfStoredEvents,
} from './nostr-types';
import { NostrRelay } from './nostr-relay.js';

class NostrApi {
  receivedEvents: { [key: string]: {} } = {};

  relays: {
    [domain: string]: {
      connection: NostrRelay;
    };
  } = {};

  static #requestEvent(type: string, filters: {}[]): NostrClientRequestEvent {
    return ['REQ', `request:${type}`, ...filters];
  }

  static #closeRequestEvent(type: string): NostrClientCloseSubscription {
    return ['CLOSE', `request:${type}`];
  }

  constructor() {
    const preparedRelays = ['nostr-pub.wellorder.net'];

    for (const relay of preparedRelays) {
      this.relays[relay] = { connection: new NostrRelay(relay) };
    }
  }

  #supportedNip15(relay: string): boolean {
    return (
      this.relays[relay].connection.info.supported_nips?.includes(15) ?? false
    );
  }

  #messageHandler(
    relay: string,
    receive: (event: NostrEvent) => void,
    end: (by: 'EOSE' | 'TIMEOUT') => void
  ): (ev: MessageEvent) => void {
    if (this.#supportedNip15(relay)) {
      return (ev: MessageEvent) => {
        const message:
          | NostrRelaySendEvent
          | NostrRelaySendMessage
          | NostrRelayEndOfStoredEvents = JSON.parse(ev.data);
        switch (message[0]) {
          case 'EVENT':
            receive(message[2]);
            break;
          case 'EOSE':
            end('EOSE');
            break;
          default:
            break;
        }
      };
    }
    return (ev: MessageEvent) => {
      const message: NostrRelaySendEvent | NostrRelaySendMessage = JSON.parse(
        ev.data
      );
      if (message[0] === 'EVENT') {
        receive(message[2]);
        end('TIMEOUT');
      }
    };
  }

  async #request(
    relay: string,
    type: string,
    filters: {}[]
  ): Promise<NostrEvent[]> {
    return new Promise((resolve, reject) => {
      const conn = this.relays[relay].connection;
      if (conn.cannotConnect) {
        reject(new Error(`WebSocket cannot connect: wss://${relay}/`));
        return;
      }
      const events: NostrEvent[] = [];
      let timeoutId: number | undefined;
      const messageHandler = this.#messageHandler(
        relay,
        (event: NostrEvent) => {
          if (timeoutId != null) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
          if (event.id in this.receivedEvents) {
            return;
          }
          this.receivedEvents[event.id] = event;
          events.push(event);
        },
        (by: 'EOSE' | 'TIMEOUT') => {
          switch (by) {
            case 'TIMEOUT': {
              timeoutId = window.setTimeout(() => {
                conn.send(JSON.stringify(NostrApi.#closeRequestEvent(type)));
                resolve(events);
                conn.removeEventListener('message', messageHandler);
              }, 10000);
              return;
            }
            case 'EOSE':
            default: {
              conn.send(JSON.stringify(NostrApi.#closeRequestEvent(type)));
              resolve(events);
              conn.removeEventListener('message', messageHandler);
              break;
            }
          }
        }
      );
      conn.addEventListener('message', messageHandler);
      timeoutId = window.setTimeout(() => {
        conn.send(JSON.stringify(NostrApi.#closeRequestEvent(type)));
        resolve(events);
        conn.removeEventListener('message', messageHandler);
      }, 10000);
      conn.send(JSON.stringify(NostrApi.#requestEvent(type, filters)));
    });
  }

  async requests(type: string, ...filters: {}[]) {
    const results = await Promise.allSettled(
      Object.keys(this.relays).map(r => this.#request(r, type, filters))
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
