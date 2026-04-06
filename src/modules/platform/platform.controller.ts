import type { AuthUser } from "../../middleware/auth.middleware";
import { LocationService } from "./location.service";
import { CityService, PincodeService, ServiceableZoneService } from "./platform.service";
import { paginatedRaw } from "../../core/response";
import { type PaginationQuery, parsePagination } from "../../shared";
import {
  ReverseGeocodeQuery,
  GeocodeQuery,
  AutocompleteQuery,
  RetrieveParam,
  RetrieveQuery,
  CreateCityBody,
  UpdateCityBody,
  CreatePincodeBody,
  UpdatePincodeBody,
  ServiceabilityCheck,
  CreateZoneBody,
  UpdateZoneBody,
  PolyfillZoneBody,
  CityListRequest,
  ActiveFilter,
  CityGetByIdOrSlugRequest,
  CreateCity,
  UpdateCity,
  PincodeList,
  ZoneListQuery,
  SyncZoneWithBoundaryBody,
} from "./platform.schema";


// ── Context type ──────────────────────────────────────────────────────────────

export type Meta = {
  ip: string;
  userAgent: string;
};

export type Actor = {
  id: string;
  roles: string[];
};

type Ctx = {
  user: AuthUser;
  ip: string;
};

const actor = (ctx: Ctx) => ({
  actorId: ctx.user.id,
  actorRoles: ctx.user.roles,
  ip: ctx.ip,
});



export const platformController = {
  async reverseGeocode({ query }: { query: ReverseGeocodeQuery }) {
    return await LocationService.reverseGeocode(query.lat, query.lng);
  },

  async geocode({ query }: { query: GeocodeQuery }) {
    return await LocationService.geocode(query.address);
  },

  async autocomplete({ query }: { query: AutocompleteQuery }) {
    return await LocationService.autocomplete(
      query.input,
      query.sessionToken,
    );
  },

  async retrieve({ params, query }: { params: RetrieveParam; query: RetrieveQuery }) {
    return await LocationService.retrieve(
      params.mapboxId,
      query.sessionToken,
    );
  },

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

// =============================================================================
// CITIES
// =============================================================================

export const CityController = {
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

  async getByIdOrSlug(params: CityGetByIdOrSlugRequest) {
    return await CityService.getByIdOrSlug(params.idOrSlug);
  },

  async create(body: CreateCity, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.create(body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async update(id: string, body: UpdateCity, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.update(id, body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async setActive(id: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await CityService.setActive(id, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },
}

// =============================================================================
// PINCODES
// =============================================================================

export const PincodeController = {
  async create(body: CreatePincodeBody, ctx: Ctx) {
    return await PincodeService.create(body, actor(ctx));
  },

  async update(id: string, body: UpdatePincodeBody, ctx: Ctx) {
    return await PincodeService.update(id, body as any, actor(ctx));
  },

  async setActive(id: string, isActive: boolean, ctx: Ctx) {
    return await PincodeService.setActive(id, isActive, actor(ctx));
  },

  async list(query: PincodeList) {
    const { filter, ...paginationParams } = query;
    const pagination = parsePagination(paginationParams);
    const { items, total } = await PincodeService.list(
      pagination,
      filter as ActiveFilter,
    );
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  },

  async listByCity(cityId: string, pagination: PaginationQuery) {
    const parsed = parsePagination(pagination);
    const { items, total } = await PincodeService.listByCity(
      cityId,
      parsed,
      true,
    );
    return paginatedRaw(items, parsed.page, parsed.limit, total);
  },

  async checkServiceability(check: ServiceabilityCheck) {
    return await PincodeService.checkServiceability(check);
  }
}

// =============================================================================
// SERVICEABLE ZONES (H3)
// =============================================================================

export const ServiceableZoneController = {
  async create(body: CreateZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.create(body, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async update(id: string, body: UpdateZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.update(id, body as any, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async setActive(id: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.setActive(id, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

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

  async polyfill(body: PolyfillZoneBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.polyfill(
      body.cityId,
      body.boundary,
      { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip },
      body.label,
    );
  },

  async setActiveByCity(cityId: string, isActive: boolean, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.setActiveByCity(cityId, isActive, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async syncZonesWithBoundary(cityId: string, body: SyncZoneWithBoundaryBody, actor: Actor, meta: Pick<Meta, "ip">) {
    return await ServiceableZoneService.syncZonesWithBoundary(cityId, body.boundary, { actorId: actor.id, actorRoles: actor.roles, ip: meta.ip });
  },

  async checkServiceability(check: ServiceabilityCheck) {
    return await ServiceableZoneService.checkServiceability(check.latitude, check.longitude);
  },
}
