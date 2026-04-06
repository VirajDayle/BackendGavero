import { UAParser } from "ua-parser-js";
import { env } from "../../config/env";
import { AuthUser } from "../../middleware/auth.middleware";
import { AuthErrors } from "../../modules/auth/auth.errors";

type DeviceInfo = {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  userAgent: string;
  ip: string;
};

type RequestContext = {
  ip: string;
  userAgent: string;
  deviceInfo: DeviceInfo;
};

export function resolveRequestContext({
  request,
  server,
}: {
  request: Request;
  server: { requestIP(req: Request): { address: string } | null } | null;
}): RequestContext {
  let ip = server?.requestIP(request)?.address ?? "unknown";

  // Enforce secure IP extraction if behind a proxy.
  if (env.TRUST_PROXY) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      ip = forwardedFor.split(",")[0].trim();
    }
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  const fingerprint = request.headers.get("x-device-fingerprint") ?? "unknown";
  const parseResult = new UAParser(userAgent).getResult();

  const deviceInfo = {
    browser: parseResult.browser.name || "Unknown",
    browserVersion: parseResult.browser.version || "Unknown",
    os: parseResult.os.name || "Unknown",
    deviceType: parseResult.device.type || "desktop",
    userAgent,
    ip,
    fingerprint,
  };

  return { ip, userAgent, deviceInfo };
}

/**
 * Middleware adapter that ensures a user is authenticated.
 * Promotes the optional 'user' context to a guaranteed 'actor' object.
 *
 * @param ctx - Context from Elysia (after jwtAuthPlugin).
 * @returns An object containing the guaranteed authenticated actor.
 * @throws 401 Unauthorized if no user is found in the context.
 */
export function authenticate(ctx: { user?: AuthUser;[key: string]: unknown }): {
  actor: AuthUser;
} {
  if (!ctx.user) throw AuthErrors.Common.unauthorized();
  return { actor: ctx.user };
}
