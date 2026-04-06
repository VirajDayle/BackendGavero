import {
  CityRepository,
  ServiceableH3ZoneRepository,
} from "./platform.repository";

import {
  H3_RES_CITY,
  h3ToBoundary,
  polyfill,
  coordsToH3,
  h3ToGeoJsonPolygon,
} from "../../utils/h3";

import { AuditLogRepository } from "../auth/auth.repository";

import { PlatformErrors } from "./platform.errors";
import { db } from "../../db";
import type { DB } from "../../db/index";
import {
  type CityPublic,
  type ServiceableH3ZonePublic,
  type CreateCityBody,
  type UpdateCityBody,
  type CreateZoneBody,
  type UpdateZoneBody,
  type PolyfillZoneBody,
  mapToZonePublic,
  type CityMapItem,
  ActiveFilter,
  CreateCity,
  UpdateCity,
} from "./platform.schema";

import type { Pagination, PaginationQuery } from "../../shared";
import { Polygon } from "geojson";

// ── Repo instances ────────────────────────────────────────────────────────────

export interface PlatformRepositories {
  cityRepo: CityRepository;
  zoneRepo: ServiceableH3ZoneRepository;
  auditRepo: AuditLogRepository;
}

// ── Meta type ─────────────────────────────────────────────────────────────────

type AdminMeta = { actorId: string; actorRoles: string[]; ip: string };

function toBoundaryWktFromGeoJSON(geoJson: Polygon): string {
  if (geoJson.type !== "Polygon") {
    throw PlatformErrors.City.boundaryRequired();
  }

  const ring = geoJson.coordinates[0]; // outer boundary

  if (!ring || ring.length < 3) {
    throw PlatformErrors.City.boundaryRequired();
  }

  // Ensure polygon is closed
  const first = ring[0];
  const last = ring[ring.length - 1];

  const closedRing =
    first[0] === last[0] && first[1] === last[1]
      ? ring
      : [...ring, first];

  // Convert to WKT (lng lat format is already correct in GeoJSON)
  const points = closedRing.map(([lng, lat]) => `${lng} ${lat}`);

  return `SRID=4326;POLYGON((${points.join(", ")}))`;
}

// =============================================================================
// 1. CityService
// =============================================================================

export class CityServiceImpl {
  constructor(
    private readonly repos: PlatformRepositories,
    private readonly db: DB,
  ) { }

  async list(
    pagination: Pagination,
    filter: ActiveFilter = "all",
    stateCode?: string,
  ): Promise<{ items: CityPublic[]; total: number }> {
    const result = await this.repos.cityRepo.list(pagination,
      { filter, stateCode }
    );
    return result;
  }

  async listWithBoundary(
    pagination: Pagination,
    filter: ActiveFilter = "all",
    stateCode?: string,
  ): Promise<{ items: CityMapItem[]; total: number }> {
    const result = await this.repos.cityRepo.listWithBoundary(pagination,
      { filter, stateCode }
    );
    return result;
  }

  async getByIdOrSlug(
    idOrSlug: string,
  ): Promise<CityPublic> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const city = isUuid
      ? await this.repos.cityRepo.findById(idOrSlug)
      : await this.repos.cityRepo.findBySlug(idOrSlug.toLowerCase());

    if (!city) throw PlatformErrors.City.notFound();
    return city;
  }

  async create(data: CreateCity, meta: AdminMeta): Promise<CityPublic> {
    const existing = await this.repos.cityRepo.findBySlug(
      data.slug.toLowerCase(),
    );
    if (existing) throw PlatformErrors.City.slugConflict(data.slug);

    const boundaryWkt = toBoundaryWktFromGeoJSON(data.boundary);

    return await this.db.transaction(async (tx) => {
      // Create local repositories wrapping the transaction
      const txCityRepo = new CityRepository(tx as unknown as typeof db);
      const txZoneRepo = new ServiceableH3ZoneRepository(
        tx as unknown as typeof db,
      );
      const txAuditRepo = new AuditLogRepository(tx as unknown as typeof db);

      // Create a local set of repos for the transaction
      const txRepos: PlatformRepositories = {
        ...this.repos,
        cityRepo: txCityRepo,
        zoneRepo: txZoneRepo,
        auditRepo: txAuditRepo,
      };

      // Create the city using the tx-repo
      const city = await txCityRepo.create({
        ...data,
        boundary: boundaryWkt,
      });

      // Auto-polyfill using the transaction
      const txZoneService = new ServiceableZoneServiceImpl(txRepos);
      await txZoneService.polyfill(
        city.id,
        data.boundary,
        meta,
        `${city.name} Auto-Zone`,
      );

      // Audit log within the transaction
      await txAuditRepo.create({
        actorId: meta.actorId,
        actorIp: meta.ip,
        action: "city.created",
        resource: "city",
        resourceId: city.id,
        after: { name: city.name, slug: city.slug },
      });

      return city;
    });
  }

  async update(
    id: string,
    data: UpdateCity,
    meta: AdminMeta,
  ): Promise<CityPublic> {

    const existing = await this.repos.cityRepo.findById(id);
    if (!existing) throw PlatformErrors.City.notFound();

    if (data.slug && data.slug.toLowerCase() !== existing.slug) {
      const conflict = await this.repos.cityRepo.findBySlug(
        data.slug.toLowerCase(),
      );
      if (conflict) throw PlatformErrors.City.slugConflict(data.slug);
    }

    const boundaryWkt = data.boundary
      ? toBoundaryWktFromGeoJSON(data.boundary)
      : undefined;

    return await this.db.transaction(async (tx) => {
      const txCityRepo = new CityRepository(tx as unknown as typeof db);
      const txZoneRepo = new ServiceableH3ZoneRepository(
        tx as unknown as typeof db,
      );
      const txAuditRepo = new AuditLogRepository(tx as unknown as typeof db);

      const txRepos: PlatformRepositories = {
        ...this.repos,
        cityRepo: txCityRepo,
        zoneRepo: txZoneRepo,
        auditRepo: txAuditRepo,
      };

      const { boundary, ...rest } = data;

      const updated = await txCityRepo.update(id, {
        ...rest,
        ...(boundaryWkt ? { boundary: boundaryWkt } : {}),
      });

      if (!updated) throw PlatformErrors.City.notFound();

      // If boundary is updated, sync zones
      if (data.boundary) {
        const txZoneService = new ServiceableZoneServiceImpl(txRepos);
        await txZoneService.syncZonesWithBoundary(id, data.boundary, meta);
      }

      await txAuditRepo.create({
        actorId: meta.actorId,
        actorIp: meta.ip,
        action: "city.updated",
        resource: "city",
        resourceId: id,
        before: { name: existing.name, slug: existing.slug },
        after: { name: updated.name, slug: updated.slug },
      });

      return updated;
    });
  }

  async setActive(
    id: string,
    isActive: boolean,
    meta: AdminMeta,
  ): Promise<CityPublic> {

    return await this.db.transaction(async (tx) => {
      const txCityRepo = new CityRepository(tx as unknown as typeof db);
      const txZoneRepo = new ServiceableH3ZoneRepository(
        tx as unknown as typeof db,
      );
      const txAuditRepo = new AuditLogRepository(tx as unknown as typeof db);

      const txRepos = {
        ...this.repos,
        cityRepo: txCityRepo,
        zoneRepo: txZoneRepo,
        auditRepo: txAuditRepo,
      };

      const updated = await txCityRepo.setActive(id, isActive);
      if (!updated) throw PlatformErrors.City.notFound();

      const txZoneService = new ServiceableZoneServiceImpl(txRepos);
      await txZoneService.setActiveByCity(id, isActive, meta);

      await txAuditRepo.create({
        actorId: meta.actorId,
        actorIp: meta.ip,
        action: isActive ? "city.activated" : "city.deactivated",
        resource: "city",
        resourceId: id,
      });

      return updated;
    });
  }
}

// =============================================================================
// 2. ServiceableZoneService (H3)
// =============================================================================

export class ServiceableZoneServiceImpl {
  constructor(private readonly repos: PlatformRepositories) { }

  async checkServiceability(lat: number, lng: number) {
    const h3Index = coordsToH3(lat, lng, H3_RES_CITY);
    const match = await this.repos.zoneRepo.findByH3Index(h3Index);

    return {
      serviceable: !!match,
      h3Index,
      cityId: match?.cityId ?? null,
      label: match?.label ?? null,
    };
  }

  async listByCity(
    cityId: string,
    pagination: Pagination,
    activeOnly: boolean,
  ): Promise<{ items: ServiceableH3ZonePublic[]; total: number }> {
    const result = await this.repos.zoneRepo.listByCity(cityId, pagination, {
      filter: activeOnly ? "active" : "all",
    });
    return {
      ...result,
      items: result.items.map((zone) =>
        mapToZonePublic({
          ...zone,
          boundary: h3ToGeoJsonPolygon(zone.h3Index),
        }),
      ),
    };
  }

  async create(
    data: CreateZoneBody,
    meta: AdminMeta,
  ): Promise<ServiceableH3ZonePublic> {

    const city = await this.repos.cityRepo.findById(data.cityId);
    if (!city) throw PlatformErrors.City.notFound();

    const zone = await this.repos.zoneRepo.create(data);

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "zone.created",
      resource: "serviceable_h3_zone",
      resourceId: zone.id,
      after: { h3Index: zone.h3Index, cityId: zone.cityId },
    });

    return mapToZonePublic({
      ...zone,
      boundary: h3ToGeoJsonPolygon(zone.h3Index),
    });
  }

  async update(
    id: string,
    data: UpdateZoneBody,
    meta: AdminMeta,
  ): Promise<ServiceableH3ZonePublic> {

    const updated = await this.repos.zoneRepo.update(id, data as any);
    if (!updated) throw PlatformErrors.Zone.notFound();

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "zone.updated",
      resource: "serviceable_h3_zone",
      resourceId: id,
    });

    return mapToZonePublic({ ...updated, boundary: h3ToGeoJsonPolygon(updated.h3Index) });
  }

  async setActive(
    id: string,
    isActive: boolean,
    meta: AdminMeta,
  ): Promise<ServiceableH3ZonePublic> {

    const updated = await this.repos.zoneRepo.setActive(id, isActive);
    if (!updated) throw PlatformErrors.Zone.notFound();

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: isActive ? "zone.activated" : "zone.deactivated",
      resource: "serviceable_h3_zone",
      resourceId: id,
    });

    return mapToZonePublic({ ...updated, boundary: h3ToGeoJsonPolygon(updated.h3Index) });
  }

  async setActiveByCity(cityId: string, isActive: boolean, meta: AdminMeta) {
    await this.repos.zoneRepo.setActiveByCity(cityId, isActive);

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: isActive ? "zones.city_activated" : "zones.city_deactivated",
      resource: "city",
      resourceId: cityId,
    });
  }

  async polyfill(
    cityId: string,
    boundary: Polygon,
    meta: AdminMeta,
    label?: string,
  ) {

    const city = await this.repos.cityRepo.findById(cityId);
    if (!city) throw PlatformErrors.City.notFound();

    const h3Indexes = polyfill(boundary, H3_RES_CITY);
    const data = h3Indexes.map((idx) => ({
      h3Index: idx,
      cityId,
      label,
    }));

    await this.repos.zoneRepo.bulkCreate(data);

    await this.repos.auditRepo.create({
      actorId: meta.actorId,
      actorIp: meta.ip,
      action: "zone.polyfilled",
      resource: "city",
      resourceId: cityId,
      after: { count: h3Indexes.length },
    });

    return { count: h3Indexes.length };
  }

  async syncZonesWithBoundary(
    cityId: string,
    boundary: Polygon,
    meta: AdminMeta,
  ) {

    const city = await this.repos.cityRepo.findById(cityId);
    if (!city) throw PlatformErrors.City.notFound();

    // 1. Delete old auto-zones
    // We use a pattern match to avoid touching manually added zones
    await this.repos.zoneRepo.deleteZonesByCityAndLabelPattern(
      cityId,
      "%Auto-Zone",
    );

    // 2. Re-polyfill new ones
    await this.polyfill(cityId, boundary, meta, `${city.name} Auto-Zone`);
  }
}

// // =============================================================================
// // 3. PincodeService
// // =============================================================================

// export class PincodeServiceImpl {
//   constructor(private readonly repos: PlatformRepositories) { }

//   async create(
//     data: CreatePincodeBody,
//     meta: AdminMeta,
//   ): Promise<ServiceablePincodePublic> {

//     const city = await this.repos.cityRepo.findById(data.cityId);
//     if (!city) throw PlatformErrors.City.notFound();

//     const existing = await this.repos.pincodeRepo.findByPincode(data.pincode);
//     if (existing) throw PlatformErrors.Pincode.conflict(data.pincode);

//     const pincode = await this.repos.pincodeRepo.create(data);

//     await this.repos.auditRepo.create({
//       actorId: meta.actorId,
//       actorIp: meta.ip,
//       action: "pincode.created",
//       resource: "serviceable_pincode",
//       resourceId: pincode.id,
//       after: { pincode: pincode.pincode, cityId: city.id },
//     });

//     return mapToPincodePublic(pincode);
//   }

//   async update(
//     id: string,
//     data: UpdatePincodeBody,
//     meta: AdminMeta,
//   ): Promise<ServiceablePincodePublic> {

//     const updated = await this.repos.pincodeRepo.update(id, data as any);
//     if (!updated) throw PlatformErrors.Pincode.notFound();

//     await this.repos.auditRepo.create({
//       actorId: meta.actorId,
//       actorIp: meta.ip,
//       action: "pincode.updated",
//       resource: "serviceable_pincode",
//       resourceId: id,
//     });

//     return mapToPincodePublic(updated);
//   }

//   async setActive(
//     id: string,
//     isActive: boolean,
//     meta: AdminMeta,
//   ): Promise<ServiceablePincodePublic> {

//     const updated = await this.repos.pincodeRepo.setActive(id, isActive);
//     if (!updated) throw PlatformErrors.Pincode.notFound();

//     await this.repos.auditRepo.create({
//       actorId: meta.actorId,
//       actorIp: meta.ip,
//       action: isActive ? "pincode.activated" : "pincode.deactivated",
//       resource: "serviceable_pincode",
//       resourceId: id,
//     });

//     return mapToPincodePublic(updated);
//   }

//   async list(
//     pagination: Pagination,
//     filter: ActiveFilter = "all",
//   ): Promise<{ items: ServiceablePincodePublic[]; total: number }> {
//     const result = await this.repos.pincodeRepo.list(pagination, { filter });
//     return {
//       ...result,
//       items: result.items.map(mapToPincodePublic),
//     };
//   }

//   async listByCity(
//     cityId: string,
//     pagination: Pagination,
//     activeOnly: boolean = true,
//   ): Promise<{ items: ServiceablePincodePublic[]; total: number }> {
//     const result = await this.repos.pincodeRepo.listByCity(cityId, pagination, {
//       activeOnly,
//     });
//     return {
//       ...result,
//       items: result.items.map(mapToPincodePublic),
//     };
//   }

//   async checkServiceability(check: ServiceabilityCheck) {
//     if (check.type === "coordinates") {
//       return ServiceableZoneService.checkServiceability(
//         check.latitude,
//         check.longitude,
//       );
//     }

//     const match = await this.repos.pincodeRepo.findActiveByPincode(
//       check.pincode,
//     );
//     return {
//       serviceable: !!match,
//       pincode: match?.pincode ?? null,
//       localityName: match?.localityName ?? null,
//     };
//   }
// }

// ── Export default instances ───────────────────────────────────────────────────

export const defaultRepos: PlatformRepositories = {
  cityRepo: new CityRepository(db),
  zoneRepo: new ServiceableH3ZoneRepository(db),
  auditRepo: new AuditLogRepository(db),
};

export const CityService = new CityServiceImpl(defaultRepos, db);
export const ServiceableZoneService = new ServiceableZoneServiceImpl(
  defaultRepos,
);

