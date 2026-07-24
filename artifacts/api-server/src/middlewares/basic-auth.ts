import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

const REALM = "Mini Golf Scorer";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  // Compare against a same-length buffer first so a length mismatch doesn't
  // short-circuit before timingSafeEqual, which requires equal-length inputs.
  const bComparable = aBuf.length === bBuf.length ? bBuf : Buffer.alloc(aBuf.length);
  return aBuf.length === bBuf.length && timingSafeEqual(aBuf, bComparable);
}

export function requireBasicAuth(getPassword: () => Promise<string>): RequestHandler {
  return (req, res, next) => {
    const header = req.headers.authorization;

    if (header?.startsWith("Basic ")) {
      const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
      const providedPassword = decoded.slice(decoded.indexOf(":") + 1);

      getPassword()
        .then((currentPassword) => {
          if (safeEqual(providedPassword, currentPassword)) {
            next();
            return;
          }
          res.set("WWW-Authenticate", `Basic realm="${REALM}"`);
          res.status(401).json({ error: "Authentication required" });
        })
        .catch(next);
      return;
    }

    res.set("WWW-Authenticate", `Basic realm="${REALM}"`);
    res.status(401).json({ error: "Authentication required" });
  };
}
