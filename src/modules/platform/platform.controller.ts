import type { AuthUser } from "../../middleware/auth.middleware";
import { LocationService } from "./location.service";
import { CityService, PincodeService } from "./platform.service";
import { paginatedRaw } from "../../core/response";

// ── Context type ──────────────────────────────────────────────────────────────

interface Ctx {
  user: AuthUser;
  ip: string;
}

function actor(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    actorRoles: ctx.user.roles,
    ip: ctx.ip,
  };
}

function actorSimple(ctx: Ctx) {
  return {
    actorId: ctx.user.id,
    ip: ctx.ip,
  };
}

export const platformController = {
  async reverseGeocode({ query }: { query: { lat: number; lng: number } }) {
    return await LocationService.reverseGeocode(query.lat, query.lng);
  },

  async geocode({ query }: { query: { address: string } }) {
    return await LocationService.geocode(query.address);
  },

  async autocomplete({
    query,
  }: {
    query: { input: string; sessionToken?: string };
  }) {
    return await LocationService.autocomplete(
      query.input,
      query.sessionToken,
    );
  },

  async retrieve({
    params,
    query,
  }: {
    params: { mapboxId: string };
    query: { sessionToken?: string };
  }) {
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

export abstract class CityController {
  static async list(pagination: { page: number; limit: number }) {
    const { items, total } = await CityService.list({
      activeOnly: true,
      ...pagination,
    });
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  }

  static async create(
    body: {
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
    ctx: Ctx,
  ) {
    return await CityService.create(body, actor(ctx));
  }

  static async update(id: string, body: Record<string, unknown>, ctx: Ctx) {
    return await CityService.update(id, body, actor(ctx));
  }

  static async setActive(id: string, isActive: boolean, ctx: Ctx) {
    return await CityService.setActive(id, isActive, actor(ctx));
  }
}

// =============================================================================
// PINCODES
// =============================================================================

export abstract class PincodeController {
  static async create(
    body: {
      pincode: string;
      cityId: string;
      localityName?: string;
      deliveryLeadTimeMins?: number;
      codAvailable?: boolean;
    },
    ctx: Ctx,
  ) {
    return await PincodeService.create(body, actor(ctx));
  }

  static async update(id: string, body: Record<string, unknown>, ctx: Ctx) {
    return await PincodeService.update(id, body, actor(ctx));
  }

  static async setActive(id: string, isActive: boolean, ctx: Ctx) {
    return await PincodeService.setActive(id, isActive, actor(ctx));
  }

  static async listByCity(
    cityId: string,
    pagination: { page: number; limit: number },
  ) {
    const { items, total } = await PincodeService.listByCity(cityId, {
      activeOnly: true,
      ...pagination,
    });
    return paginatedRaw(items, pagination.page, pagination.limit, total);
  }

  static async checkServiceability(
    check:
      | { type: "coordinates"; latitude: number; longitude: number }
      | { type: "pincode"; pincode: string },
  ) {
    return await PincodeService.checkServiceability(check);
  }
}
