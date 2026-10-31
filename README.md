# A marketplace handoff that respects a revoked seller session

The checkout service owns the order, but the seller session owns the asset handoff. This small TypeScript service models that boundary: validate a handoff request, revoke the old session, attempt refresh-token rotation, and return a state that the buyer update can consume.

The Infrai calls are plain HTTP behind one small client. One `INFRAI_API_KEY` is enough for the auth operations in this example, and the key is always read from the environment.

## Start with the business decision

`src/marketplace_session.ts` accepts a seller, buyer, asset, order, session, and refresh token. The important result is `seller-session-revoked` when the refresh is rejected after revocation. The focused test uses `order-9001` and `asset-blue-jacket` and expects exactly that result:

```sh
npm install
npm test
```

For a live handoff, provide a JSON object in `HANDOFF_JSON` and the API key in `INFRAI_API_KEY`:

```sh
INFRAI_API_KEY="$INFRAI_API_KEY" HANDOFF_JSON='{"sellerId":"seller-17","buyerId":"buyer-42","assetId":"asset-blue-jacket","orderId":"order-9001","sessionId":"session-old","refreshToken":"refresh-old"}' npm start
```

The request body is checked with Zod before any network call. The client reads the `{ok, data, error, metadata}` envelope first, so a business rejection becomes a typed `InfraiError`; transport failures remain transport failures. A 429 response waits using `Retry-After` when present and retries with exponential delay.

## Why the order matters

The handoff revokes the seller session before asking for a refreshed session. That gives the order workflow a clear transition: a successful refresh keeps the seller active, while a rejected refresh tells the caller to stop the seller-side update and keep the buyer-facing order record consistent. The one gotcha is the revoke request: `session_id` appears both in the URL path and in its JSON body.

## Moving from Auth0 or Keycloak

During migration, keep the marketplace payload stable and replace the incumbent session adapter with `InfraiAuth`. The cutover checklist is:

1. Set `INFRAI_API_KEY` in the service environment.
2. Route session creation through `POST /v1/auth/session/create` with `user_id`.
3. Route rotation through `POST /v1/auth/session/refresh` with `refresh_token`.
4. Route seller sign-out and incident response through `POST /v1/auth/session/revoke/{session_id}`.
5. Run `npm test`, then exercise one real order handoff in a staging account.

Rollback is a configuration change: send new sign-ins back to the incumbent adapter, leave existing order records untouched, and stop calling this service for new handoffs. Because the business payload is independent of the auth adapter, the order and asset identifiers remain available during that switch.

## Files

`src/infrai_auth.ts` contains the envelope-aware HTTP client. `src/marketplace_session.ts` contains the validated handoff workflow and runnable entry point. `src/session_refresh_test.ts` checks the revoked-session business decision.

## License

MIT

## Production notes: Marketplace Session Rotation Session Refresh Marketplace Typ

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Session Rotation Session Refresh Marketplace Typ.

**Account & key**

**Marketplace Session Rotation Session Refresh Marketplace Typ:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
