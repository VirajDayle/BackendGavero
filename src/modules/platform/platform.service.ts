import {
  CityRepository,
  ServiceablePincodeRepository,
} from "./platform.repository";

import {
  AuditLogRepository,
} from "../auth/auth.repository";

import { PlatformErrors } from "./platform.errors";
import { ProfileErrors } from "../profile/profile.errors";
import { db } from "../../db";

// ── Repo instances ────────────────────────────────────────────────────────────

const cityRepo = new CityRepository(db);
const pincodeRepo = new ServiceablePincodeRepository(db);
const auditRepo = new AuditLogRepository(db);

// ── Meta type ─────────────────────────────────────────────────────────────────

type AdminMeta = { actorId: string; actorRoles: string[]; ip: string };

function requireAdmin(roles: string[]) {
  if (!roles.includes("admin")) throw PlatformErrors.Common.adminRequired();
}

// =============================================================================
// 1. CityService
// =============================================================================

export abstract class CityService {
  static async list(
    opts: { activeOnly?: boolean; page?: number; limit?: number } = {},
  ) {
    return cityRepo.list(opts);
  }

  static async getByIdOrSlug(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const city = isUuid
      ? await cityRepo.findById(idOrSlug)
      : await cityRepo.findBySlug(idOrSlug.toLowerCase());

    if (!city) throw PlatformErrors.City.notFound();
    return city;
  }

  static async create(
    data: {
      name: string;
      slug: string;
      state: string;
      district?: string;
      stateCode?: string;
      country?: string;
      countryCode?: string;
      centroidLat?: number;
      centroidLng?: number;
      timezone?: string;
      metadata?: Record<string, unknown>;
    },
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const existing = await cityRepo.findBySlug(data.slug.toLowerCase());
    if (existing) throw PlatformErrors.City.slugConflict(data.slug);

    const city = await cityRepo.create(data);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "city.created",
      resource: "city",
      resourceId: city.id,
      after: { name: city.name, slug: city.slug },
    });

    return city;
  }

  static async update(
    id: string,
    data: Record<string, unknown>,
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const existing = await cityRepo.findById(id);
    if (!existing) throw PlatformErrors.City.notFound();

    if (
      data.slug &&
      typeof data.slug === "string" &&
      data.slug.toLowerCase() !== existing.slug
    ) {
      const conflict = await cityRepo.findBySlug(data.slug.toLowerCase());
      if (conflict) throw PlatformErrors.City.slugConflict(data.slug);
    }

    const updated = await cityRepo.update(id, data as any);
    if (!updated) throw PlatformErrors.City.notFound();

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "city.updated",
      resource: "city",
      resourceId: id,
      before: { name: existing.name, slug: existing.slug },
      after: { name: updated.name, slug: updated.slug },
    });

    return updated;
  }

  static async setActive(id: string, isActive: boolean, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const updated = await cityRepo.setActive(id, isActive);
    if (!updated) throw PlatformErrors.City.notFound();

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: isActive ? "city.activated" : "city.deactivated",
      resource: "city",
      resourceId: id,
    });

    return updated;
  }
}

// =============================================================================
// 2. PincodeService
// =============================================================================

export abstract class PincodeService {
  static async create(
    data: {
      pincode: string;
      cityId: string;
      localityName?: string;
      deliveryLeadTimeMins?: number;
    },
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const city = await cityRepo.findById(data.cityId);
    if (!city) throw PlatformErrors.City.notFound();

    const existing = await pincodeRepo.findByPincode(data.pincode);
    if (existing) throw PlatformErrors.Pincode.conflict(data.pincode);

    const pincode = await pincodeRepo.create(data);

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "pincode.created",
      resource: "serviceable_pincode",
      resourceId: pincode.id,
      after: { pincode: pincode.pincode, cityId: city.id },
    });

    return pincode;
  }

  static async update(
    id: string,
    data: Record<string, unknown>,
    meta: AdminMeta,
  ) {
    requireAdmin(meta.actorRoles);

    const updated = await pincodeRepo.update(id, data as any);
    if (!updated) throw PlatformErrors.Pincode.notFound();

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "pincode.updated",
      resource: "serviceable_pincode",
      resourceId: id,
    });

    return updated;
  }

  static async setActive(id: string, isActive: boolean, meta: AdminMeta) {
    requireAdmin(meta.actorRoles);

    const updated = await pincodeRepo.setActive(id, isActive);
    if (!updated) throw PlatformErrors.Pincode.notFound();

    await auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: isActive ? "pincode.activated" : "pincode.deactivated",
      resource: "serviceable_pincode",
      resourceId: id,
    });

    return updated;
  }

  static async listByCity(
    cityId: string,
    opts: { activeOnly?: boolean; page?: number; limit?: number } = {},
  ) {
    return pincodeRepo.listByCity(cityId, opts);
  }

  static async checkServiceability(
    check:
      | { type: "coordinates"; latitude: number; longitude: number }
      | { type: "pincode"; pincode: string },
  ) {
    if (check.type === "coordinates") {
      const match = await pincodeRepo.findByCoordinates(
        check.latitude,
        check.longitude,
      );
      return {
        serviceable: !!match,
        pincode: match?.pincode ?? null,
        localityName: match?.localityName ?? null,
      };
    }

    const match = await pincodeRepo.findActiveByPincode(check.pincode);
    return {
      serviceable: !!match,
      pincode: match?.pincode ?? null,
      localityName: match?.localityName ?? null,
    };
  }
}
