import type { NostrRelayInfo } from './nostr-types';

interface NostrRelayEventMap {
  close: CloseEvent;
  error: Event;
  message: MessageEvent;
  open: Event;
  init: CustomEvent;
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

  #manuallyClose = false;

  cannotConnect = false;

  get readyState() {
    return this.#socket?.readyState ?? -1;
  }

  get hasConnection() {
    return this.readyState === WebSocket.OPEN;
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

    this.dispatchEvent(new CustomEvent('init'));
  }

  #connect() {
    const ws = new WebSocket(`wss://${this.relay}/`);
    ws.addEventListener('open', e => this.dispatchEvent(new Event(e.type, e)));
    ws.addEventListener('message', e =>
      this.dispatchEvent(new MessageEvent(e.type, { ...e, ports: [] }))
    );
    ws.addEventListener('error', e => {
      this.dispatchEvent(new Event(e.type, e));
      ws.close();
    });
    ws.addEventListener('close', e => {
      if (this.#manuallyClose) {
        this.dispatchEvent(new CloseEvent(e.type, e));
        return;
      }
      setTimeout(() => {
        this.#connect();
      }, 1000);
    });
    this.#socket = ws;
  }

  close() {
    this.#manuallyClose = true;
    this.#socket?.close();
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
