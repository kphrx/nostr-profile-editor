import type { NostrEvent, PartialNostrEvent } from '../src/utils/nostr-types';

declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: PartialNostrEvent): Promise<NostrEvent>;

      getRelays?(): Promise<{
        [url: string]: { read: boolean; write: boolean };
      }>;

      nip04?: Partial<{
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      }>;
    };
  }
}
