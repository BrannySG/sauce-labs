// Privacy helper: we never store raw IPs or user-agents. Instead we store a
// salted SHA-256 hash, which lets us roughly distinguish submitters (e.g. for
// future abuse review) without retaining personal data.

/** Returns a hex SHA-256 hash of `value` salted with `salt`, or null if no value. */
export async function saltedHash(
  value: string | null | undefined,
  salt: string,
): Promise<string | null> {
  if (!value) return null;
  const data = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
