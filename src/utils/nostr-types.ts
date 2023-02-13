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
