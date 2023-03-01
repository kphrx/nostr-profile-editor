export interface PartialNostrEvent {
  id?: string;
  pubkey?: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

type NostrClientRequestEventFilter = Partial<{
  ids: string[];
  authors: string[];
  kinds: number[];
  since: number;
  until: number;
  limit: number;
}>;

export type NostrClientPublishEvent = ['EVENT', NostrEvent];
export type NostrClientRequestEvent = [
  'REQ',
  string,
  ...NostrClientRequestEventFilter[]
];
export type NostrClientCloseSubscription = ['CLOSE', string];

export type NostrRelaySendEvent = ['EVENT', string, NostrEvent];
export type NostrRelaySendMessage = ['NOTICE', string];

export type NostrRelayInfo = Partial<{
  name: string;
  description: string;
  pubkey: string;
  contact: string;
  supported_nips: number[];
  software: string;
  version: string;
}>;

export type NostrRelayEndOfStoredEvents = ['EOSE', string];
