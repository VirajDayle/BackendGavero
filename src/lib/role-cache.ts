/**
 * lib/role-cache.ts
 *
 * In-memory role registry loaded once at app startup.
 * Maps role IDs ↔ slugs so the JWT can carry IDs (stable across renames)
 * while route definitions use readable slugs via the ROLES constant.
 *
 * This is intentionally NOT Redis — roles are static config data
 * that changes only on deploy. A process-level Map has zero latency
 * and zero network dependency.
 *
 * Usage:
 *   1. Call roleCache.load(rows) once in app bootstrap before routes register.
 *   2. Use roleCache.getId(slug) inside rbacGuard to resolve slugs → IDs.
 *   3. If you add roles via an admin UI at runtime, call roleCache.reload(rows).
 */

type RoleEntry = { id: string; slug: string };

class RoleCache {
  private byId = new Map<string, RoleEntry>();
  private bySlug = new Map<string, RoleEntry>();
  private ready = false;

  load(roles: RoleEntry[]) {
    this.byId.clear();
    this.bySlug.clear();
    for (const role of roles) {
      this.byId.set(role.id, role);
      this.bySlug.set(role.slug, role);
    }
    this.ready = true;
  }

  reload(roles: RoleEntry[]) {
    this.load(roles); // same operation, explicit name for runtime updates
  }

  getId(slug: string): string {
    if (!this.ready) throw new Error("[RoleCache] Cache not loaded — call roleCache.load() at startup");
    const role = this.bySlug.get(slug);
    if (!role) throw new Error(`[RoleCache] Unknown role slug: "${slug}" — is it seeded in DB?`);
    return role.id;
  }

  getSlug(id: string): string | undefined {
    return this.byId.get(id)?.slug;
  }

  isReady() {
    return this.ready;
  }
}

export const roleCache = new RoleCache();