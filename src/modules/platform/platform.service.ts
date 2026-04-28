/**
 * platform.service.ts
 *
 * Service layer for the Platform module.
 *
 * This layer handles:
 * - City management (listing, creating, updating, activation)
 * - Serviceable H3 zone management (check, list, create, polyfill, sync)
 * - Administrative auditing of platform changes
 * - Geometric calculations (H3 → Polygon, Polygon → WKT)
 */

import {
  CityRepository,
  ServiceableH3ZoneRepository,
} from "./platform.repository";

import {
  H3_RES_CITY,
  polyfill,
  coordsToH3,
  h3ToGeoJsonPolygon,
} from "../../utils/h3";

import { AuditLogRepository } from "../auth/auth.repository";

import { PlatformErrors } from "./platform.errors";
import { db } from "../../db";
import type { DB } from "../../db/index";
import type {
  CityPublic,
  ServiceableH3ZonePublic,
  CityMapItem,
  ActiveFilter,
  CreateCity,
  UpdateCity,
  CreateZoneBody,
  UpdateZoneBody,
} from "./platform.schema";

import { mapToZonePublic } from "./platform.schema";
import type { Pagination } from "../../shared";
import { Polygon } from "geojson";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Collection of repositories required by the platform services */
export interface PlatformRepositories {
  cityRepo: CityRepository;
  zoneRepo: ServiceableH3ZoneRepository;
  auditRepo: AuditLogRepository;
}

/** Administrative metadata for auditing (actor, roles, ip) */
type AdminMeta = { actorId: string; actorRoles: string[]; ip: string };

// ─────────────────────────────────────────────────────────────────────────────
// Geometric Utilities (Private)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a GeoJSON Polygon into a PostGIS-compatible WKT string.
 * @param geoJson - Source GeoJSON Polygon.
 * @returns Well-Known Text (WKT) representation.
 */
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
    first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];

  // Convert to WKT (lng lat format is already correct in GeoJSON)
  const points = closedRing.map(([lng, lat]) => `${lng} ${lat}`);

  return `SRID=4326;POLYGON((${points.join(", ")}))`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. City Service
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Service implementation for managing city metadata and operational status.
 */
export class CityServiceImpl {
  constructor(
    private readonly repos: PlatformRepositories,
    private readonly db: DB,
  ) { }

  /**
   * Lists all platform cities with pagination and optional state filtering.
   */
  async list(
    pagination: Pagination,
    filter: ActiveFilter = "all",
    stateCode?: string,
  ): Promise<{ items: CityPublic[]; total: number }> {
    return await this.repos.cityRepo.list(pagination, { filter, stateCode });
  }

  /**
   * Lists cities including their full GeoJSON boasync getById(id: string) {
    const type = await this.typeRepo.findById(id);
    if (!type) throw ShopErrors.Common.notFound("Shop type not found");
    return type;
  }undaries for map visualizations.
   */
  async listWithBoundary(
    pagination: Pagination,
    filter: ActiveFilter = "all",
    stateCode?: string,
  ): Promise<{ items: CityMapItem[]; total: number }> {
    return await this.repos.cityRepo.listWithBoundary(pagination, {
      filter,
      stateCode,
    });
  }

  /**
   * Retrieves a city profile by its ID (UUID) or Slug.
   */
  async getByIdOrSlug(idOrSlug: string): Promise<CityPublic> {
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

  /**
   * Onboards a new city into the platform. This is an atomic operation that:
   * 1. Creates the city record.
   * 2. Auto-polyfills initial delivery zones.
   * 3. Creates an audit log entry.
   */
  async create(data: CreateCity, meta: AdminMeta): Promise<CityPublic> {
    const existing = await this.repos.cityRepo.findBySlug(
      data.slug.toLowerCase(),
    );
    if (existing) throw PlatformErrors.City.slugConflict(data.slug);

    const boundaryWkt = toBoundaryWktFromGeoJSON(data.boundary);

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

      const city = await txCityRepo.create({ ...data, boundary: boundaryWkt });

      const txZoneService = new ServiceableZoneServiceImpl(txRepos);
      await txZoneService.polyfill(
        city.id,
        data.boundary,
        meta,
        `${city.name} Auto-Zone`,
      );

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

  /**
   * Updates an existing city. If the boundary is changed, all auto-generated
   * zones are re-polyfilled to match the new geometry.
   */
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

  /**
   * Toggles the operational status of a city.
   */
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

// ═════════════════════════════════════════════════════════════════════════════
// 2. Serviceable Zone Service (H3)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Service implementation for managing delivery serviceability using Uber's H3 grid.
 */
export class ServiceableZoneServiceImpl {
  constructor(private readonly repos: PlatformRepositories) { }

  /**
   * Determines if provided coordinates sit within any active serviceable cell.
   */
  async checkServiceability(lat: number, lng: number): Promise<
    | { serviceable: true; cityId: string; h3Index: string; label: string | null }
    | { serviceable: false; cityId: null; h3Index: string; label: null }
  > {
    const h3Index = coordsToH3(lat, lng, H3_RES_CITY);
    const match = await this.repos.zoneRepo.findByH3Index(h3Index);

    if (!match) {
      return {
        serviceable: false,
        h3Index,
        cityId: null,
        label: null,
      }
    }

    return {
      serviceable: true,
      h3Index,
      cityId: match.cityId,
      label: match.label,
    };
  }

  /**
   * Lists all H3 zones for a city with pagination and GeoJSON geometry derived from indices.
   */
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


  /**
   * Manually creates a new H3 serviceable zone.
   */
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

  /**
   * Updates metadata for an H3 zone.
   */
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

    return mapToZonePublic({
      ...updated,
      boundary: h3ToGeoJsonPolygon(updated.h3Index),
    });
  }

  /**
   * Toggles the operational status of a single H3 zone.
   */
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

    return mapToZonePublic({
      ...updated,
      boundary: h3ToGeoJsonPolygon(updated.h3Index),
    });
  }

  /**
   * Bulk toggles the operational status of all zones within a city.
   */
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

  /**
   * Fills a city's boundary polygon with H3 index Resolution 7 cells.
   */
  async polyfill(
    cityId: string,
    boundary: Polygon,
    meta: AdminMeta,
    label?: string,
  ) {
    const city = await this.repos.cityRepo.findById(cityId);
    if (!city) throw PlatformErrors.City.notFound();

    const h3Indexes = polyfill(boundary, H3_RES_CITY);
    const data = h3Indexes.map((idx) => ({ h3Index: idx, cityId, label }));

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

  /**
   * Synchronizes city zones with a new boundary by deleting old auto-zones and re-polyfilling.
   */
  async syncZonesWithBoundary(
    cityId: string,
    boundary: Polygon,
    meta: AdminMeta,
  ) {
    const city = await this.repos.cityRepo.findById(cityId);
    if (!city) throw PlatformErrors.City.notFound();

    // 1. Delete old auto-zones via pattern match
    await this.repos.zoneRepo.deleteZonesByCityAndLabelPattern(
      cityId,
      "%Auto-Zone",
    );

    // 2. Re-polyfill using the new boundary
    await this.polyfill(cityId, boundary, meta, `${city.name} Auto-Zone`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Instances / Exports
// ─────────────────────────────────────────────────────────────────────────────

/** Default repository set using primary database connection */
export const defaultRepos: PlatformRepositories = {
  cityRepo: new CityRepository(db),
  zoneRepo: new ServiceableH3ZoneRepository(db),
  auditRepo: new AuditLogRepository(db),
};

export const CityService = new CityServiceImpl(defaultRepos, db);
export const ServiceableZoneService = new ServiceableZoneServiceImpl(
  defaultRepos,
);
