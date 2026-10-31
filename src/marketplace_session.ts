import { z } from "zod";
import { InfraiAuth, InfraiError } from "./infrai_auth.ts";

export const handoffSchema = z.object({
  sellerId: z.string().min(1),
  buyerId: z.string().min(1),
  assetId: z.string().min(1),
  orderId: z.string().min(1),
  sessionId: z.string().min(1),
  refreshToken: z.string().min(1)
});

export type HandoffRequest = z.infer<typeof handoffSchema>;

export function handoffDecision(input: HandoffRequest, refreshAccepted: boolean): { state: string; orderId: string; assetId: string } {
  return {
    state: refreshAccepted ? "seller-session-active" : "seller-session-revoked",
    orderId: input.orderId,
    assetId: input.assetId
  };
}

export async function revokeAndRefresh(input: HandoffRequest, auth: InfraiAuth) {
  const request = handoffSchema.parse(input);
  await auth.revokeSession(request.sessionId);
  try {
    await auth.refreshSession({ refresh_token: request.refreshToken });
    return handoffDecision(request, true);
  } catch (error) {
    if (error instanceof InfraiError) return handoffDecision(request, false);
    throw error;
  }
}

if (process.argv[1]?.endsWith("marketplace_session.ts")) {
  const request = handoffSchema.parse(JSON.parse(process.env.HANDOFF_JSON ?? "{}"));
  revokeAndRefresh(request, new InfraiAuth()).then(console.log).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
