export const COOKIE_NAME = "admin_session";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function b64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(str: string): ArrayBuffer {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }

  const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0));
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const key = await getKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(timestamp)
  );

  return `${timestamp}.${b64urlEncode(signature)}`;
}

export async function verifyToken(token: string, secret: string): Promise<boolean> {
  const separator = token.lastIndexOf(".");
  if (separator === -1) return false;

  const timestamp = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const issuedAt = Number.parseInt(timestamp, 10);

  if (!Number.isFinite(issuedAt)) return false;

  const age = Date.now() - issuedAt;
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_MS) {
    return false;
  }

  try {
    const key = await getKey(secret);
    return crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(signature),
      new TextEncoder().encode(timestamp)
    );
  } catch {
    return false;
  }
}
