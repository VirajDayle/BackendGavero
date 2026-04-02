import { env } from "../../config/env";
import { logger } from "../../core/logger";
import { AppError } from "../../core/errors";
import {
  MapboxApiError,
  GeocodingFailedError,
  AutocompleteFailedError,
} from "./platform.errors";

export interface AddressDetails {
  formattedAddress: string;
  line1: string;
  line2: string;
  locality: string;
  state: string;
  country: string;
  pincode: string;
  lat: number;
  lng: number;
}

export interface AutocompleteSuggestion {
  mapboxId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export class LocationService {
  private static readonly GEOCODE_URL = "https://api.mapbox.com/search/geocode/v6";
  private static readonly SEARCHBOX_URL = "https://api.mapbox.com/search/searchbox/v1";

  /**
   * Converts coordinates into a detailed address using Mapbox Geocoding V6.
   */
  static async reverseGeocode(
    lat: number,
    lng: number,
  ): Promise<AddressDetails> {
    const url = new URL(`${this.GEOCODE_URL}/reverse`);
    url.searchParams.append("latitude", lat.toString());
    url.searchParams.append("longitude", lng.toString());
    url.searchParams.append("access_token", env.MAPBOX_ACCESS_TOKEN);
    url.searchParams.append("language", "en");
    url.searchParams.append("limit", "1");

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new MapboxApiError(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        throw new GeocodingFailedError("No address found for these coordinates");
      }

      const feature = data.features[0];
      return this.parseMapboxFeature(feature);
    } catch (error) {
      logger.error({ err: error, lat, lng }, "Mapbox reverse geocoding failed");
      if (error instanceof AppError) throw error;
      throw new GeocodingFailedError("An unexpected error occurred during reverse geocoding");
    }
  }

  /**
   * Converts an address string into coordinates using Mapbox Geocoding V6.
   */
  static async geocode(address: string): Promise<AddressDetails> {
    const url = new URL(`${this.GEOCODE_URL}/forward`);
    url.searchParams.append("q", address);
    url.searchParams.append("access_token", env.MAPBOX_ACCESS_TOKEN);
    url.searchParams.append("language", "en");
    url.searchParams.append("limit", "1");
    // Bias results to India if required
    url.searchParams.append("country", "in");

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new MapboxApiError(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        throw new GeocodingFailedError("Address could not be resolved");
      }

      const feature = data.features[0];
      return this.parseMapboxFeature(feature);
    } catch (error) {
      logger.error({ err: error, address }, "Mapbox geocoding failed");
      if (error instanceof AppError) throw error;
      throw new GeocodingFailedError("An unexpected error occurred during geocoding");
    }
  }

  /**
   * Fetches autocomplete suggestions using Mapbox SearchBox API.
   */
  static async autocomplete(
    input: string,
    sessionToken?: string,
  ): Promise<AutocompleteSuggestion[]> {
    const url = new URL(`${this.SEARCHBOX_URL}/suggest`);
    url.searchParams.append("q", input);
    url.searchParams.append("access_token", env.MAPBOX_ACCESS_TOKEN);
    url.searchParams.append("language", "en");
    url.searchParams.append("limit", "10");
    url.searchParams.append("country", "in");
    if (sessionToken) {
      url.searchParams.append("session_token", sessionToken);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new MapboxApiError(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.suggestions) return [];

      return data.suggestions.map((s: any) => ({
        mapboxId: s.mapbox_id,
        description: s.full_address || s.name,
        mainText: s.name || "",
        secondaryText: s.place_formatted || "",
      }));
    } catch (error) {
      logger.error({ err: error, input }, "Mapbox autocomplete failed");
      if (error instanceof AppError) throw error;
      throw new AutocompleteFailedError("An unexpected error occurred fetching suggestions");
    }
  }

  /**
   * Retrieves full details for a Mapbox suggest result.
   */
  static async retrieve(
    mapboxId: string,
    sessionToken?: string,
  ): Promise<AddressDetails> {
    const url = new URL(`${this.SEARCHBOX_URL}/retrieve/${mapboxId}`);
    url.searchParams.append("access_token", env.MAPBOX_ACCESS_TOKEN);
    if (sessionToken) {
      url.searchParams.append("session_token", sessionToken);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new MapboxApiError(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        throw new GeocodingFailedError("Could not retrieve details for this place");
      }

      const feature = data.features[0];
      return this.parseMapboxFeature(feature);
    } catch (error) {
      logger.error({ err: error, mapboxId }, "Mapbox retrieve failed");
      if (error instanceof AppError) throw error;
      throw new GeocodingFailedError("An unexpected error occurred retrieving place details");
    }
  }

  /**
   * Parses Mapbox feature into standardized AddressDetails.
   * Works for both Geocoding V6 and SearchBox Retrieve.
   */
  private static parseMapboxFeature(feature: any): AddressDetails {
    const props = feature.properties;
    const ctx = props.context || {};
    const coords = feature.geometry.coordinates; // [lng, lat]

    // Mapbox V6 Context fields
    const line1 = props.name || props.address_line1 || "";
    const locality = ctx.place?.name || ctx.district?.name || "";
    const state = ctx.region?.name || "";
    const pincode = ctx.postcode?.name || "";
    const country = ctx.country?.name || "India";

    // Sublocality often maps to neighborhood or subdistrict in Mapbox
    const line2 = ctx.neighborhood?.name || ctx.locality?.name || "";

    return {
      formattedAddress: props.full_address || "",
      line1,
      line2,
      locality,
      state,
      country,
      pincode,
      lat: coords[1],
      lng: coords[0],
    };
  }
}

