import type { NostrRelayInfo } from './nostr-types';

interface NostrRelayEventMap {
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
  open: Event;
}

interface EventListenerOptions {
  capture?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

export class NostrRelay extends EventTarget {
  addEventListener<K extends keyof NostrRelayEventMap>(
    type: K,
    listener: (ev: NostrRelayEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;

  addEventListener(
    type: string,
    listener: (ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  removeEventListener<K extends keyof NostrRelayEventMap>(
    type: K,
    listener: (ev: NostrRelayEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener(
    type: string,
    listener: (ev: Event) => any,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
  }

  relay: string;

  info: NostrRelayInfo = {};

  #socket?: WebSocket;

  cannotConnect = false;

  get hasConnection() {
    return (this.#socket?.readyState ?? -1) === WebSocket.OPEN;
  }

  constructor(domain: string) {
    super();
    this.relay = domain;
    this.#initializeInfo();
  }

  async #initializeInfo() {
    try {
      const res = await fetch(`https://${this.relay}/`, {
        headers: { accept: 'application/nostr+json' },
      });
      if (res.status !== 404) {
        this.info = await res.json();
      }
      this.#connect();
    } catch {
      this.cannotConnect = true;
    }
  }

  #connect() {
    const ws = new WebSocket(`wss://${this.relay}/`);
    ws.addEventListener('open', this.dispatchEvent);
    ws.addEventListener('message', this.dispatchEvent);
    ws.addEventListener('error', e => {
      ws.close(4000, e.type);
      this.dispatchEvent(e);
    });
    ws.addEventListener('close', e => {
      this.dispatchEvent(e);
      setTimeout(() => {
        this.#connect();
      }, 1000);
    });
    this.#socket = ws;
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.cannotConnect) {
      return;
    }
    if (this.hasConnection) {
      this.#socket?.send(data);
      return;
    }
    const onOpen = () => {
      this.#socket?.send(data);
      this.removeEventListener('open', onOpen);
    };
    this.addEventListener('open', onOpen);
  }
}
