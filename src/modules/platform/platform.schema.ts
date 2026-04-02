import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { citiesTable, serviceablePincodesTable } from "../../db/schema";

// =============================================================================
// SHARED PRIMITIVES
// =============================================================================

const uuidSchema = z.string().uuid();
const pincodeSchema = z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits");
const countryCodeSchema = z.string().length(2).transform(v => v.toUpperCase());
const stateCodeSchema = z.string().min(1).max(3).toUpperCase();
const timezoneSchema = z.string().min(1).max(60).refine(tz => {
  try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; } catch { return false; }
}, { message: "Invalid IANA timezone" });
const latitudeSchema = z.number().min(-90).max(90);
const longitudeSchema = z.number().min(-180).max(180);

// =============================================================================
// SECTION 2 — CITIES
// =============================================================================

export const citySelectSchema = createSelectSchema(citiesTable, {
  name: (s) => s.min(1).max(100),
  slug: (s) =>
    s
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  state: (s) => s.min(1).max(100),
  stateCode: () => stateCodeSchema.nullable(),
  country: (s) => s.min(1).max(100),
  countryCode: () => countryCodeSchema,
  centroidLat: () => latitudeSchema.nullable(),
  centroidLng: () => longitudeSchema.nullable(),
  timezone: () => timezoneSchema,
  metadata: () => z.record(z.string(), z.unknown()).nullable(),
});
export type City = z.infer<typeof citySelectSchema>;

export const cityInsertSchema = createInsertSchema(citiesTable, {
  name: (s) => s.min(1).max(100),
  slug: (s) =>
    s
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  state: (s) => s.min(1).max(100),
  stateCode: () => stateCodeSchema.optional(),
  country: (s) => s.min(1).max(100).optional(),
  countryCode: () => countryCodeSchema.optional(),
  centroidLat: () => latitudeSchema.optional(),
  centroidLng: () => longitudeSchema.optional(),
  timezone: () => timezoneSchema.optional(),
  metadata: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type CityInsert = z.infer<typeof cityInsertSchema>;

export const cityUpdateSchema = createUpdateSchema(citiesTable, {
  name: (s) => s.min(1).max(100).optional(),
  slug: (s) =>
    s
      .min(1)
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case")
      .optional(),
  state: (s) => s.min(1).max(100).optional(),
  stateCode: () => stateCodeSchema.optional(),
  countryCode: () => countryCodeSchema.optional(),
  centroidLat: () => latitudeSchema.optional(),
  centroidLng: () => longitudeSchema.optional(),
  timezone: () => timezoneSchema.optional(),
  metadata: () => z.record(z.string(), z.unknown()).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type CityUpdate = z.infer<typeof cityUpdateSchema>;

// =============================================================================
// SECTION 3 — SERVICEABLE PINCODES
// =============================================================================

export const serviceablePincodeSelectSchema = createSelectSchema(
  serviceablePincodesTable,
  {
    pincode: () => pincodeSchema,
    deliveryLeadTimeMins: (s) => s.min(1).nullable(),
  },
);
export type ServiceablePincode = z.infer<typeof serviceablePincodeSelectSchema>;

export const serviceablePincodeInsertSchema = createInsertSchema(
  serviceablePincodesTable,
  {
    pincode: () => pincodeSchema,
    cityId: () => uuidSchema,
    localityName: (s) => s.min(1).max(150).optional(),
    deliveryLeadTimeMins: (s) => s.min(1).optional(),
  },
).omit({ id: true, createdAt: true, updatedAt: true });
export type ServiceablePincodeInsert = z.infer<
  typeof serviceablePincodeInsertSchema
>;

export const serviceablePincodeUpdateSchema = createUpdateSchema(
  serviceablePincodesTable,
  {
    pincode: () => pincodeSchema.optional(),
    localityName: (s) => s.min(1).max(150).optional(),
    deliveryLeadTimeMins: (s) => s.min(1).optional(),
  },
).omit({ id: true, cityId: true, createdAt: true, updatedAt: true });
export type ServiceablePincodeUpdate = z.infer<
  typeof serviceablePincodeUpdateSchema
>;
