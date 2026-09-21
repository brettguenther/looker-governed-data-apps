/**
 * Node implementation of the Looker SDK ICryptoHash interface.
 *
 * @looker/sdk-rtl ships BrowserCryptoHash, which depends on `window.crypto`.
 * Node 18+ exposes the identical Web Crypto API on `globalThis.crypto`, so this
 * is a direct port. safeBase64 is imported from the SDK rather than
 * reimplemented so that the PKCE code_challenge encoding is byte-identical to
 * the browser Host Shell (notably, the SDK retains "=" padding).
 */

import { safeBase64 } from '@looker/sdk-rtl';

export class NodeCryptoHash {
  arrayToHex(array: Uint8Array): string {
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  fromBase64(str: string): number[] {
    return Array.from(Buffer.from(str, 'base64'));
  }

  secureRandom(byteCount: number): string {
    const bytes = new Uint8Array(byteCount);
    globalThis.crypto.getRandomValues(bytes);
    return this.arrayToHex(bytes);
  }

  async sha256Hash(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    return safeBase64(new Uint8Array(hashBuffer));
  }
}
