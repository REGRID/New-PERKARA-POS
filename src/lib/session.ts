export interface SessionPayload {
  id: string;
  name: string;
  role: "owner" | "admin" | "karyawan";
  username?: string;
  outletName?: string;
  exp: number; // Unix timestamp in ms
}

const DEFAULT_SECRET = process.env.SESSION_SECRET || "perkara_pos_super_secret_jwt_key_2026";
export const SESSION_COOKIE_NAME = "perkara_session";

// Base64URL encode/decode helpers
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return atob(base64);
}

// Convert string key to CryptoKey
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Sign a session payload into a compact token
export async function signSession(
  payload: Omit<SessionPayload, "exp">,
  expiresInDays = 7,
  secret = DEFAULT_SECRET
): Promise<string> {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const fullPayload: SessionPayload = { ...payload, exp };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataToSign)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureString = String.fromCharCode(...signatureArray);
  const encodedSignature = base64UrlEncode(signatureString);

  return `${dataToSign}.${encodedSignature}`;
}

// Verify session token and return payload if valid and not expired
export async function verifySession(
  token: string,
  secret = DEFAULT_SECRET
): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey(secret);
    const signatureBinary = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(
      signatureBinary.split("").map((c) => c.charCodeAt(0))
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(dataToVerify)
    );

    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
