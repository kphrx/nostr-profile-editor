interface PartialNostrEvent {
  id?: string;
  pubkey?: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
}

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface Window {
  nostr?: {
    getPublicKey(): Promise<string>;
    signEvent(event: PartialNostrEvent): Promise<NostrEvent>;

    getRelays?(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;

    nip04?: Partial<{
      encrypt(pubkey: string, plaintext: string): Promise<string>;
      decrypt(pubkey: string, ciphertext: string): Promise<string>;
    }>;
  };
}
