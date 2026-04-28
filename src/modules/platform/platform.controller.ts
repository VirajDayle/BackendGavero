/**
 * platform.controller.ts
 *
 * Controller layer for the Platform module.
 *
 * This layer handles:
 * - Geolocation services (Mapbox integration)
 * - Banking utilities (IFSC lookup)
 * - City and H3 Zone management orchestration
 */

import type { LocationService } from "./location.service";
import { CityService, ServiceableZoneService } from "./platform.service";
import { paginatedRaw } from "../../core/response";
import { parsePagination } from "../../shared";
import {
  ReverseGeocodeQuery,
  GeocodeQuery,
  AutocompleteQuery,
  RetrieveParam,
  RetrieveQuery,
  CreateZoneBody,
  UpdateZoneBody,
  PolyfillZoneBody,
  CityListRequest,
  ActiveFilter,
  CityGetByIdOrSlugRequest,
  CreateCity,
  UpdateCity,
  ZoneListQuery,
  SyncZoneWithBoundaryBody,
  ServiceabilityCheck,
} from "./platform.schema";

// ─────────────────────────────────────────────────────────────────────────────
// Context & Actor Types
// ─────────────────────────────────────────────────────────────────────────────

/** Metadata extracted from the request context (IP, User-Agent) */
export type Meta = {
  ip: string;
  userAgent: string;
};

/** Representation of the authenticated user performing an action */
export type Actor = {
  id: string;
  roles: string[];
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. Platform Controller (Geo & Banking)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Controller for general platform utilities including geocoding and banking.
 */
export const platformController = {
  /**
    * Converts coordinates into a human-readable address.
    */
  async reverseGeocode({ query }: { query: ReverseGeocodeQuery }) {
    // Note: Implicitly uses LocationService
    const { LocationService: loc } = await import("./location.service");
    return await loc.reverseGeocode(query.lat, query.lng);
  },

  /**
    * Converts an address string into longitude/latitude coordinates.
    */
  async geocode({ query }: { query: GeocodeQuery }) {
    const { LocationService: loc } = await import("./location.service");
    return await loc.geocode(query.address);
  },

  /**
    * Fetches predictive address suggestions from Mapbox.
    */
  async autocomplete({ query }: { query: AutocompleteQuery }) {
    const { LocationService: loc } = await import("./location.service");
    return await loc.autocomplete(
      query.input,
      query.sessionToken,
    );
  },

  /**
    * Retrieves detailed geometry and address components for a Mapbox suggest ID.
    */
  async retrieve({ params, query }: { params: RetrieveParam; query: RetrieveQuery }) {
    const { LocationService: loc } = await import("./location.service");
    return await loc.retrieve(
      params.mapboxId,
      query.sessionToken,
    );
  },

  /**
    * Resolves Indian banking details (Bank name, branch, city) from an IFSC code.
    */
  async fetchIfsc({ params }: { params: { ifsc: string } }) {
    const rawCode = params.ifsc.toUpperCase();
    const response = await fetch(`https://ifsc.razorpay.com/${rawCode}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Invalid IFSC code");
      }
      throw new Error("Failed to fetch IFSC details");
    }
    return await response.json();
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// 2. City Controller
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Controller for managing administrative cities and their boundaries.
 */
export const CityController = {
  /**
    * Lists all cities with pagination and optional status filter.
    */
  async list(query: CityListRequest) {
    const { filter, stateCode, ...paginationParams } = query;
    const pagination = parsePagination(paginationParams);
    const { items, total } = await CityService.list(
      pagination,
      filter as ActiveFilter,
      stateCode,
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
    * Lists cities including their full GeoJSON boundary geometry.
    */
  async listWithBoundary(query: CityListRequest) {
    const { filter, stateCode, ...paginationParams } = query;
    const pagination = parsePagination(paginationParams);
    const { items, total } = await CityService.listWithBoundary(
      pagination,
      filter as ActiveFilter,
      stateCode,
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
    * Fetches a single city by its UUID or URL-safe slug.
    */
  async getByIdOrSlug(params: CityGetByIdOrSlugRequest) {
    return await CityService.getByIdOrSlug(params.idOrSlug);
  },

  /**
    * Onboards a new city into the platform and auto-polyfills its H3 zones.
    */
  async create(body: CreateCity, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.create(body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Updates city metadata (name, state, timezone) or its boundary polygon.
    */
  async update(id: string, body: UpdateCity, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.update(id, body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Toggles city operational status. Deactivation cascaded to all its zones.
    */
  async setActive(id: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.setActive(id, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. Serviceable Zone Controller (H3)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Controller for managing H3-based delivery zones within cities.
 */
export const ServiceableZoneController = {
  /**
    * Manually adds a single H3 index to a city's serviceable area.
    */
  async create(body: CreateZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.create(body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Updates zone properties (currently only 'label' is mutable).
    */
  async update(id: string, body: UpdateZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.update(id, body as any, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Activates or deactivates a specific H3 cell for delivery.
    */
  async setActive(id: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.setActive(id, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Lists all zones within a given city.
    */
  async listByCity(cityId: string, query: ZoneListQuery) {
    const { filter, ...paginationParams } = query;
    const pagination = parsePagination(paginationParams);
    const { items, total } = await ServiceableZoneService.listByCity(
      cityId,
      pagination,
      filter === "active",
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  /**
    * Fills a city's boundary polygon with H3 cells (Resolution 7).
    */
  async polyfill(body: PolyfillZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.polyfill(
      body.cityId,
      body.boundary,
      { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip },
      body.label,
    );
  },

  /**
    * Bulk toggle status for all zones inside a specific city.
    */
  async setActiveByCity(cityId: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.setActiveByCity(cityId, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Syncs multiple H3 zones with an updated city boundary polygon.
    */
  async syncZonesWithBoundary(cityId: string, body: SyncZoneWithBoundaryBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.syncZonesWithBoundary(cityId, body.boundary, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  /**
    * Determines if provided coordinates sit within an active delivery zone.
    */
  async checkServiceability(query: ServiceabilityCheck) {
    return await ServiceableZoneService.checkServiceability(query.latitude, query.longitude);
  },
}
