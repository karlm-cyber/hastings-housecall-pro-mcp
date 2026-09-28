import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { authorize, verifyAccess, RESOURCE } from "../lib/oauth.js";

test("OAuth rejects wrong audience, issuer, user, scope, expiry and signature", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const config = { issuer: "https://example.auth0.com/", subjects: ["auth0|karl"] };
  const token = async (overrides = {}, key = privateKey) => new SignJWT({
    iss: config.issuer, aud: RESOURCE, sub: "auth0|karl", scope: "hcp:read",
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 60,
    ...overrides,
  }).setProtectedHeader({ alg: "RS256" }).sign(key);
  assert.equal((await verifyAccess(await token(), config, publicKey)).sub, "auth0|karl");
  for (const overrides of [{ aud: "another-api" }, { iss: "https://attacker.example/" },
    { sub: "auth0|stranger" }, { scope: "openid" }, { exp: 1 }]) {
    await assert.rejects(verifyAccess(await token(overrides), config, publicKey));
  }
  const other = await generateKeyPair("RS256");
  await assert.rejects(verifyAccess(await token({}, other.privateKey), config, publicKey));
});

test("missing configuration or credentials denies access", async () => {
  delete process.env.OAUTH_ISSUER;
  assert.equal((await authorize(new Request(RESOURCE))).status, 503);
  process.env.OAUTH_ISSUER = "https://example.auth0.com/";
  process.env.OAUTH_ALLOWED_SUBJECTS = "auth0|karl";
  const result = await authorize(new Request(RESOURCE));
  assert.equal(result.status, 401);
  assert.match(result.headers.get("www-authenticate"), /oauth-protected-resource/);
  delete process.env.OAUTH_ISSUER;
  delete process.env.OAUTH_ALLOWED_SUBJECTS;
});
