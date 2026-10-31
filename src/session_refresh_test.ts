import assert from "node:assert/strict";
import { handoffDecision, handoffSchema } from "./marketplace_session.ts";

const request = handoffSchema.parse({
  sellerId: "seller-17",
  buyerId: "buyer-42",
  assetId: "asset-blue-jacket",
  orderId: "order-9001",
  sessionId: "session-old",
  refreshToken: "refresh-old"
});

assert.deepEqual(handoffDecision(request, false), {
  state: "seller-session-revoked",
  orderId: "order-9001",
  assetId: "asset-blue-jacket"
});
console.log("session refresh decision test passed");
