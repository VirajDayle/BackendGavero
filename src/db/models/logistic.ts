import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./auth";
import { shopsTable } from "./shop";
import { deliveryPartnerProfileTable } from "./profile";
import { citiesTable, serviceablePincodesTable } from "./location";
import { ordersTable, shipmentsTable } from "./commerce";
import {
  deliveryTaskStatusEnum,
  deliveryPartnerStatusEnum,
  deliveryTypeEnum,
  assignmentStrategyEnum,
  deliveryFailureReasonEnum,
  podTypeEnum,
  deliveryIncidentTypeEnum,
  incidentSeverityEnum,
  incidentStatusEnum,
  partnerPayoutStatusEnum,
  carrierStatusEnum,
  carrierTrackingEventTypeEnum,
  routeStatusEnum,
  routeStopTypeEnum,
  earningsEntryTypeEnum,
} from "../shared/enums";
import { geographyPoint } from "../shared/types";

// =============================================================================
// SECTION 2 — SERVICE ZONES, ZONE PINCODES & SHOP–ZONE ASSIGNMENTS
// =============================================================================

export const serviceZonesTable = table(
  "service_zones",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    cityId: t
      .uuid("city_id")
      .notNull()
      .references(() => citiesTable.id, { onDelete: "restrict" }),

    name: t.varchar("name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 180 }).notNull(),
    description: t.text("description"),

    centroidLat: t.doublePrecision("centroid_lat"),
    centroidLng: t.doublePrecision("centroid_lng"),

    isActive: t.boolean("is_active").default(true).notNull(),

    maxDeliveryRadiusMetres: t.integer("max_delivery_radius_metres"),
    maxConcurrentTasks: t.integer("max_concurrent_tasks"),

    activeSurgePricingId: t.uuid("active_surge_pricing_id"),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("service_zones_city_slug_uq_idx").on(tbl.cityId, tbl.slug),
    t.index("service_zones_city_idx").on(tbl.cityId, tbl.isActive),
  ],
);

export const zoneServiceablePincodesTable = table(
  "zone_serviceable_pincodes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    zoneId: t
      .uuid("zone_id")
      .notNull()
      .references(() => serviceZonesTable.id, { onDelete: "cascade" }),

    serviceablePincodeId: t
      .uuid("serviceable_pincode_id")
      .notNull()
      .references(() => serviceablePincodesTable.id, { onDelete: "cascade" }),

    isPrimary: t.boolean("is_primary").default(false).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("zone_pincodes_uq_idx")
      .on(tbl.zoneId, tbl.serviceablePincodeId),
    t.index("zone_pincodes_zone_idx").on(tbl.zoneId),
    t.index("zone_pincodes_pincode_idx").on(tbl.serviceablePincodeId),
  ],
);

export const shopServiceZonesTable = table(
  "shop_service_zones",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    zoneId: t
      .uuid("zone_id")
      .notNull()
      .references(() => serviceZonesTable.id, { onDelete: "cascade" }),

    priority: t.smallint("priority").default(0).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("shop_service_zones_uq_idx").on(tbl.shopId, tbl.zoneId),
    t.index("shop_service_zones_shop_idx").on(tbl.shopId, tbl.isActive),
    t.index("shop_service_zones_zone_idx").on(tbl.zoneId, tbl.isActive),
  ],
);

// =============================================================================
// SECTION 3 — PARTNER SHIFTS & AVAILABILITY SLOTS
// =============================================================================

export const partnerShiftsTable = table(
  "partner_shifts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "set null" }),

    shiftStart: t
      .timestamp("shift_start", { withTimezone: true })
      .notNull(),
    shiftEnd: t.timestamp("shift_end", { withTimezone: true }),

    plannedShiftEnd: t.timestamp("planned_shift_end", { withTimezone: true }),

    vehicleType: t.varchar("vehicle_type", { length: 50 }),
    vehicleNumber: t.varchar("vehicle_number", { length: 20 }),

    tasksCompleted: t.integer("tasks_completed").default(0).notNull(),
    tasksCancelled: t.integer("tasks_cancelled").default(0).notNull(),
    totalDistanceMetres: t
      .integer("total_distance_metres")
      .default(0)
      .notNull(),
    totalEarningsPaise: t
      .integer("total_earnings_paise")
      .default(0)
      .notNull(),

    breaks: t
      .jsonb("breaks")
      .$type<{ startedAt: string; endedAt: string | null }[]>(),

    clockOutLat: t.doublePrecision("clock_out_lat"),
    clockOutLng: t.doublePrecision("clock_out_lng"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("partner_shifts_partner_idx").on(tbl.partnerId, tbl.shiftStart),
    t.index("partner_shifts_zone_idx").on(tbl.zoneId, tbl.shiftStart),
    t
      .index("partner_shifts_open_idx")
      .on(tbl.partnerId)
      .where(sql`shift_end IS NULL`),

    t.check(
      "partner_shifts_window_chk",
      sql`${tbl.shiftEnd} IS NULL OR ${tbl.shiftEnd} > ${tbl.shiftStart}`,
    ),
    t.check(
      "partner_shifts_earnings_chk",
      sql`${tbl.totalEarningsPaise} >= 0 AND ${tbl.totalDistanceMetres} >= 0`,
    ),
  ],
);

export const deliveryPartnerSessionsTable = table(
  "delivery_partner_sessions",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    shiftId: t
      .uuid("shift_id")
      .references(() => partnerShiftsTable.id, { onDelete: "set null" }),

    status: deliveryPartnerStatusEnum("status").default("offline").notNull(),

    currentLocation: geographyPoint("current_location"),
    locationUpdatedAt: t.timestamp("location_updated_at", {
      withTimezone: true,
    }),

    activeTaskId: t.uuid("active_task_id"),

    sessionStart: t
      .timestamp("session_start", { withTimezone: true })
      .defaultNow()
      .notNull(),

    sessionEnd: t.timestamp("session_end", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("dp_sessions_partner_idx").on(tbl.partnerId, tbl.sessionStart),

    t
      .index("dp_sessions_status_idx")
      .on(tbl.status)
      .where(sql`status = 'available'`),

    t
      .index("dp_sessions_active_idx")
      .on(tbl.partnerId)
      .where(sql`session_end IS NULL`),
  ],
);

export const partnerAvailabilitySlotsTable = table(
  "partner_availability_slots",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "set null" }),

    dayOfWeek: t.smallint("day_of_week").notNull(),
    startTime: t.time("start_time").notNull(),
    endTime: t.time("end_time").notNull(),

    maxTasksPerSlot: t.smallint("max_tasks_per_slot").default(10).notNull(),

    isActive: t.boolean("is_active").default(true).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("partner_avail_slots_partner_idx")
      .on(tbl.partnerId, tbl.dayOfWeek),

    t.check(
      "partner_avail_slots_day_chk",
      sql`${tbl.dayOfWeek} >= 0 AND ${tbl.dayOfWeek} <= 6`,
    ),
    t.check(
      "partner_avail_slots_time_chk",
      sql`${tbl.endTime} > ${tbl.startTime}`,
    ),
    t.check(
      "partner_avail_slots_max_tasks_chk",
      sql`${tbl.maxTasksPerSlot} > 0`,
    ),
  ],
);

// =============================================================================
// SECTION 4 — DELIVERY TASKS
// =============================================================================

export const deliveryTasksTable = table(
  "delivery_tasks",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    taskNumber: t.varchar("task_number", { length: 50 }).notNull(),

    orderId: t
      .uuid("order_id")
      .notNull()
      .references(() => ordersTable.id, { onDelete: "restrict" }),

    shipmentId: t
      .uuid("shipment_id")
      .references(() => shipmentsTable.id, { onDelete: "set null" }),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "restrict" }),

    partnerId: t
      .uuid("partner_id")
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "set null",
      }),

    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "set null" }),

    routeId: t.uuid("route_id"),

    deliveryType: deliveryTypeEnum("delivery_type").notNull(),
    assignmentStrategy: assignmentStrategyEnum("assignment_strategy")
      .notNull()
      .default("auto_nearest"),

    status: deliveryTaskStatusEnum("status").notNull().default("pending"),

    predecessorTaskId: t.uuid("predecessor_task_id"),

    pickupName: t.varchar("pickup_name", { length: 255 }).notNull(),
    pickupLine1: t.varchar("pickup_line1", { length: 255 }).notNull(),
    pickupLine2: t.varchar("pickup_line2", { length: 255 }),
    pickupCity: t.varchar("pickup_city", { length: 100 }).notNull(),
    pickupState: t.varchar("pickup_state", { length: 100 }).notNull(),
    pickupPincode: t.varchar("pickup_pincode", { length: 10 }).notNull(),
    pickupPhone: t.varchar("pickup_phone", { length: 20 }),
    pickupLat: t.doublePrecision("pickup_lat"),
    pickupLng: t.doublePrecision("pickup_lng"),
    pickupInstructions: t.text("pickup_instructions"),

    deliveryName: t.varchar("delivery_name", { length: 255 }).notNull(),
    deliveryLine1: t.varchar("delivery_line1", { length: 255 }).notNull(),
    deliveryLine2: t.varchar("delivery_line2", { length: 255 }),
    deliveryCity: t.varchar("delivery_city", { length: 100 }).notNull(),
    deliveryState: t.varchar("delivery_state", { length: 100 }).notNull(),
    deliveryPincode: t.varchar("delivery_pincode", { length: 10 }).notNull(),
    deliveryPhone: t.varchar("delivery_phone", { length: 20 }).notNull(),
    deliveryLat: t.doublePrecision("delivery_lat"),
    deliveryLng: t.doublePrecision("delivery_lng"),
    deliveryInstructions: t.text("delivery_instructions"),

    packageCount: t.smallint("package_count").default(1).notNull(),
    totalWeightGrams: t.integer("total_weight_grams"),
    isFoodOrder: t.boolean("is_food_order").default(false).notNull(),
    isFragile: t.boolean("is_fragile").default(false).notNull(),
    requiresRefrigeration: t
      .boolean("requires_refrigeration")
      .default(false)
      .notNull(),

    isCod: t.boolean("is_cod").default(false).notNull(),
    codAmountPaise: t.integer("cod_amount_paise"),
    codCollectedPaise: t.integer("cod_collected_paise"),
    codCollectedAt: t.timestamp("cod_collected_at", { withTimezone: true }),
    codRemittedAt: t.timestamp("cod_remitted_at", { withTimezone: true }),

    scheduledPickupTime: t.timestamp("scheduled_pickup_time", {
      withTimezone: true,
    }),
    scheduledDeliveryWindowStart: t.timestamp(
      "scheduled_delivery_window_start",
      { withTimezone: true },
    ),
    scheduledDeliveryWindowEnd: t.timestamp(
      "scheduled_delivery_window_end",
      { withTimezone: true },
    ),

    slaPolicyId: t.uuid("sla_policy_id"),
    slaDeadline: t.timestamp("sla_deadline", { withTimezone: true }),
    isSlaBreached: t.boolean("is_sla_breached").default(false).notNull(),
    slaBreachedAt: t.timestamp("sla_breached_at", { withTimezone: true }),

    estimatedDistanceMetres: t.integer("estimated_distance_metres"),
    actualDistanceMetres: t.integer("actual_distance_metres"),
    estimatedDurationSeconds: t.integer("estimated_duration_seconds"),
    actualDurationSeconds: t.integer("actual_duration_seconds"),

    deliveryFeePaise: t.integer("delivery_fee_paise").notNull().default(0),
    partnerEarningPaise: t
      .integer("partner_earning_paise")
      .notNull()
      .default(0),
    surgePaise: t.integer("surge_paise").default(0).notNull(),
    tipPaise: t.integer("tip_paise").default(0).notNull(),
    penaltyPaise: t.integer("penalty_paise").default(0).notNull(),

    maxAttempts: t.smallint("max_attempts").default(3).notNull(),
    attemptCount: t.smallint("attempt_count").default(0).notNull(),

    broadcastStartedAt: t.timestamp("broadcast_started_at", {
      withTimezone: true,
    }),
    broadcastExpiresAt: t.timestamp("broadcast_expires_at", {
      withTimezone: true,
    }),
    broadcastRadiusMetres: t.integer("broadcast_radius_metres"),

    assignedAt: t.timestamp("assigned_at", { withTimezone: true }),
    partnerEnroutePickupAt: t.timestamp("partner_enroute_pickup_at", {
      withTimezone: true,
    }),
    arrivedPickupAt: t.timestamp("arrived_pickup_at", { withTimezone: true }),
    pickedUpAt: t.timestamp("picked_up_at", { withTimezone: true }),
    partnerEnrouteDeliveryAt: t.timestamp("partner_enroute_delivery_at", {
      withTimezone: true,
    }),
    arrivedDeliveryAt: t.timestamp("arrived_delivery_at", {
      withTimezone: true,
    }),
    deliveredAt: t.timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: t.timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: t.text("cancellation_reason"),
    cancelledBy: t.uuid("cancelled_by"),

    lastFailureReason: deliveryFailureReasonEnum("last_failure_reason"),
    lastFailureNote: t.text("last_failure_note"),

    deliveryOtpHash: t.varchar("delivery_otp_hash", { length: 255 }),
    deliveryOtpExpiresAt: t.timestamp("delivery_otp_expires_at", {
      withTimezone: true,
    }),
    deliveryOtpVerifiedAt: t.timestamp("delivery_otp_verified_at", {
      withTimezone: true,
    }),

    customerRatingId: t.uuid("customer_rating_id"),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("delivery_tasks_number_uq_idx").on(tbl.taskNumber),

    t.index("delivery_tasks_order_idx").on(tbl.orderId),
    t.index("delivery_tasks_partner_status_idx").on(tbl.partnerId, tbl.status),
    t.index("delivery_tasks_shop_idx").on(tbl.shopId, tbl.createdAt),
    t.index("delivery_tasks_zone_idx").on(tbl.zoneId, tbl.status),
    t.index("delivery_tasks_status_idx").on(tbl.status, tbl.createdAt),
    t.index("delivery_tasks_route_idx").on(tbl.routeId),

    t
      .index("delivery_tasks_dispatch_idx")
      .on(tbl.zoneId, tbl.status, tbl.createdAt)
      .where(sql`status IN ('pending', 'broadcast')`),

    t
      .index("delivery_tasks_sla_idx")
      .on(tbl.slaDeadline, tbl.isSlaBreached)
      .where(sql`is_sla_breached = false AND sla_deadline IS NOT NULL`),

    t
      .index("delivery_tasks_cod_unremitted_idx")
      .on(tbl.isCod, tbl.codRemittedAt)
      .where(sql`is_cod = true AND cod_remitted_at IS NULL`),

    t.check(
      "delivery_tasks_attempts_chk",
      sql`${tbl.attemptCount} <= ${tbl.maxAttempts}`,
    ),
    t.check(
      "delivery_tasks_cod_amount_chk",
      sql`${tbl.isCod} = false OR ${tbl.codAmountPaise} IS NOT NULL`,
    ),
    t.check(
      "delivery_tasks_schedule_window_chk",
      sql`
        ${tbl.scheduledDeliveryWindowEnd} IS NULL OR
        ${tbl.scheduledDeliveryWindowStart} IS NULL OR
        ${tbl.scheduledDeliveryWindowEnd} > ${tbl.scheduledDeliveryWindowStart}
      `,
    ),
    t.check(
      "delivery_tasks_financials_chk",
      sql`
        ${tbl.deliveryFeePaise}    >= 0 AND
        ${tbl.partnerEarningPaise} >= 0 AND
        ${tbl.surgePaise}          >= 0 AND
        ${tbl.tipPaise}            >= 0 AND
        ${tbl.penaltyPaise}        >= 0
      `,
    ),
  ],
);

// =============================================================================
// SECTION 5 — DELIVERY TASK STATUS HISTORY (append-only)
// =============================================================================

export const deliveryTaskStatusHistoryTable = table(
  "delivery_task_status_history",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    taskId: t
      .uuid("task_id")
      .notNull()
      .references(() => deliveryTasksTable.id, { onDelete: "cascade" }),

    previousStatus: deliveryTaskStatusEnum("previous_status"),
    newStatus: deliveryTaskStatusEnum("new_status").notNull(),

    changedBy: t.uuid("changed_by"),
    changedByType: t.varchar("changed_by_type", { length: 20 }),

    latAtChange: t.doublePrecision("lat_at_change"),
    lngAtChange: t.doublePrecision("lng_at_change"),

    note: t.text("note"),
    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("delivery_task_history_task_idx")
      .on(tbl.taskId, tbl.createdAt),
  ],
);

// =============================================================================
// SECTION 6 — DELIVERY ROUTES (batched multi-stop runs)
// =============================================================================

export const deliveryRoutesTable = table(
  "delivery_routes",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    routeNumber: t.varchar("route_number", { length: 50 }).notNull(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    shiftId: t
      .uuid("shift_id")
      .references(() => partnerShiftsTable.id, { onDelete: "set null" }),

    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "set null" }),

    status: routeStatusEnum("status")
      .notNull()
      .default("planned"),

    totalStops: t.smallint("total_stops").notNull(),
    completedStops: t.smallint("completed_stops").default(0).notNull(),

    estimatedDistanceMetres: t.integer("estimated_distance_metres"),
    estimatedDurationSeconds: t.integer("estimated_duration_seconds"),
    actualDistanceMetres: t.integer("actual_distance_metres"),
    actualDurationSeconds: t.integer("actual_duration_seconds"),

    totalEarningsPaise: t.integer("total_earnings_paise").default(0).notNull(),

    startedAt: t.timestamp("started_at", { withTimezone: true }),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("delivery_routes_number_uq_idx").on(tbl.routeNumber),

    t.index("delivery_routes_partner_idx").on(tbl.partnerId, tbl.createdAt),
    t.index("delivery_routes_shift_idx").on(tbl.shiftId),
    t.index("delivery_routes_zone_status_idx").on(tbl.zoneId, tbl.status),

    t.check(
      "delivery_routes_stops_chk",
      sql`${tbl.completedStops} <= ${tbl.totalStops}`,
    ),
    t.check(
      "delivery_routes_earnings_chk",
      sql`${tbl.totalEarningsPaise} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 7 — DELIVERY ROUTE STOPS
// =============================================================================

export const deliveryRouteStopsTable = table(
  "delivery_route_stops",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    routeId: t
      .uuid("route_id")
      .notNull()
      .references(() => deliveryRoutesTable.id, { onDelete: "cascade" }),

    taskId: t
      .uuid("task_id")
      .notNull()
      .references(() => deliveryTasksTable.id, { onDelete: "restrict" }),

    sequence: t.smallint("sequence").notNull(),

    stopType: routeStopTypeEnum("stop_type").notNull(),

    estimatedArrivalAt: t.timestamp("estimated_arrival_at", {
      withTimezone: true,
    }),
    actualArrivalAt: t.timestamp("actual_arrival_at", { withTimezone: true }),
    estimatedLegDistanceMetres: t.integer("estimated_leg_distance_metres"),
    estimatedLegDurationSeconds: t.integer("estimated_leg_duration_seconds"),

    isCompleted: t.boolean("is_completed").default(false).notNull(),
    completedAt: t.timestamp("completed_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("route_stops_route_task_uq_idx").on(tbl.routeId, tbl.taskId),
    t
      .uniqueIndex("route_stops_sequence_uq_idx")
      .on(tbl.routeId, tbl.sequence),

    t.index("route_stops_route_idx").on(tbl.routeId, tbl.sequence),
    t.index("route_stops_task_idx").on(tbl.taskId),

    t.check("route_stops_sequence_chk", sql`${tbl.sequence} > 0`),
  ],
);

// =============================================================================
// SECTION 8 — LIVE LOCATION PINGS (high-frequency append-only)
// =============================================================================

export const liveLocationPingsTable = table(
  "live_location_pings",
  {
    id: t
      .bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    taskId: t
      .uuid("task_id")
      .references(() => deliveryTasksTable.id, { onDelete: "set null" }),

    shiftId: t
      .uuid("shift_id")
      .references(() => partnerShiftsTable.id, { onDelete: "set null" }),

    location: geographyPoint("location").notNull(),

    lat: t.doublePrecision("lat").notNull(),
    lng: t.doublePrecision("lng").notNull(),

    accuracyMetres: t.real("accuracy_metres"),
    bearingDegrees: t.real("bearing_degrees"),
    speedMps: t.real("speed_mps"),
    altitudeMetres: t.real("altitude_metres"),

    batteryPct: t.smallint("battery_pct"),

    networkType: t.varchar("network_type", { length: 20 }),

    capturedAt: t
      .timestamp("captured_at", { withTimezone: true })
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("live_pings_partner_captured_idx")
      .on(tbl.partnerId, tbl.capturedAt),
    t
      .index("live_pings_task_idx")
      .on(tbl.taskId)
      .where(sql`task_id IS NOT NULL`),
    t
      .index("live_pings_shift_idx")
      .on(tbl.shiftId)
      .where(sql`shift_id IS NOT NULL`),

    t.check(
      "live_pings_battery_chk",
      sql`${tbl.batteryPct} IS NULL OR (${tbl.batteryPct} >= 0 AND ${tbl.batteryPct} <= 100)`,
    ),
    t.check(
      "live_pings_bearing_chk",
      sql`${tbl.bearingDegrees} IS NULL OR (${tbl.bearingDegrees} >= 0 AND ${tbl.bearingDegrees} < 360)`,
    ),
    t.check(
      "live_pings_speed_chk",
      sql`${tbl.speedMps} IS NULL OR ${tbl.speedMps} >= 0`,
    ),
  ],
);

// =============================================================================
// SECTION 9 — LOCATION SNAPSHOTS
// =============================================================================

export const locationSnapshotsTable = table(
  "location_snapshots",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    taskId: t
      .uuid("task_id")
      .references(() => deliveryTasksTable.id, { onDelete: "set null" }),

    shiftId: t
      .uuid("shift_id")
      .references(() => partnerShiftsTable.id, { onDelete: "set null" }),

    location: geographyPoint("location").notNull(),
    lat: t.doublePrecision("lat").notNull(),
    lng: t.doublePrecision("lng").notNull(),

    snapshotReason: t.varchar("snapshot_reason", { length: 50 }).notNull(),

    snapshotAt: t
      .timestamp("snapshot_at", { withTimezone: true })
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .index("location_snapshots_partner_idx")
      .on(tbl.partnerId, tbl.snapshotAt),
    t
      .index("location_snapshots_task_idx")
      .on(tbl.taskId)
      .where(sql`task_id IS NOT NULL`),
  ],
);

// =============================================================================
// SECTION 10 — PROOF OF DELIVERY
// =============================================================================

export const proofOfDeliveryTable = table(
  "proof_of_delivery",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    taskId: t
      .uuid("task_id")
      .notNull()
      .references(() => deliveryTasksTable.id, { onDelete: "cascade" }),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    podType: podTypeEnum("pod_type").notNull(),

    photoKey: t.varchar("photo_key", { length: 500 }),
    signatureKey: t.varchar("signature_key", { length: 500 }),

    otpVerified: t.boolean("otp_verified").default(false).notNull(),
    otpVerifiedAt: t.timestamp("otp_verified_at", { withTimezone: true }),

    scannedCode: t.varchar("scanned_code", { length: 255 }),

    recipientName: t.varchar("recipient_name", { length: 255 }),
    handedTo: t.varchar("handed_to", { length: 50 }),

    lat: t.doublePrecision("lat"),
    lng: t.doublePrecision("lng"),
    locationAccuracyMetres: t.real("location_accuracy_metres"),

    notes: t.text("notes"),

    capturedAt: t
      .timestamp("captured_at", { withTimezone: true })
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("pod_task_uq_idx").on(tbl.taskId),
    t.index("pod_partner_idx").on(tbl.partnerId, tbl.capturedAt),
  ],
);

// =============================================================================
// SECTION 11 — DELIVERY ATTEMPTS
// =============================================================================

export const deliveryAttemptsTable = table(
  "delivery_attempts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    taskId: t
      .uuid("task_id")
      .notNull()
      .references(() => deliveryTasksTable.id, { onDelete: "cascade" }),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    attemptNumber: t.smallint("attempt_number").notNull(),

    failureReason: deliveryFailureReasonEnum("failure_reason").notNull(),
    failureNote: t.text("failure_note"),

    lat: t.doublePrecision("lat"),
    lng: t.doublePrecision("lng"),

    evidencePhotoKey: t.varchar("evidence_photo_key", { length: 500 }),

    customerCalled: t.boolean("customer_called").default(false).notNull(),
    callDurationSeconds: t.integer("call_duration_seconds"),

    nextAttemptScheduledAt: t.timestamp("next_attempt_scheduled_at", {
      withTimezone: true,
    }),

    attemptedAt: t
      .timestamp("attempted_at", { withTimezone: true })
      .notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("delivery_attempts_task_number_uq_idx")
      .on(tbl.taskId, tbl.attemptNumber),

    t.index("delivery_attempts_task_idx").on(tbl.taskId),
    t
      .index("delivery_attempts_partner_idx")
      .on(tbl.partnerId, tbl.attemptedAt),

    t.check("delivery_attempts_number_chk", sql`${tbl.attemptNumber} > 0`),
  ],
);

// =============================================================================
// SECTION 12 — PARTNER EARNINGS LEDGER (transactional)
// =============================================================================

export const partnerEarningsLedgerTable = table(
  "partner_earnings_ledger",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    taskId: t
      .uuid("task_id")
      .references(() => deliveryTasksTable.id, { onDelete: "set null" }),

    shiftId: t
      .uuid("shift_id")
      .references(() => partnerShiftsTable.id, { onDelete: "set null" }),

    payoutId: t.uuid("payout_id"),

    entryType: earningsEntryTypeEnum("entry_type").notNull(),

    amountPaise: t.integer("amount_paise").notNull(),
    currency: t.varchar("currency", { length: 3 }).default("INR").notNull(),

    description: t.text("description"),
    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("partner_earnings_partner_idx").on(tbl.partnerId, tbl.createdAt),
    t.index("partner_earnings_task_idx").on(tbl.taskId),
    t.index("partner_earnings_payout_idx").on(tbl.payoutId),

    t.check("partner_earnings_amount_chk", sql`${tbl.amountPaise} <> 0`),
  ],
);

// =============================================================================
// SECTION 13 — PARTNER PAYOUTS
// =============================================================================

export const partnerPayoutsTable = table(
  "partner_payouts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    payoutNumber: t.varchar("payout_number", { length: 50 }).notNull(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    amountPaise: t.integer("amount_paise").notNull(),

    status: partnerPayoutStatusEnum("status").default("pending").notNull(),

    // External payment gateway reference
    gatewayReference: t.varchar("gateway_reference", { length: 255 }),
    gatewayResponse: t.jsonb("gateway_response"),

    periodStart: t.date("period_start").notNull(),
    periodEnd: t.date("period_end").notNull(),

    processedAt: t.timestamp("processed_at", { withTimezone: true }),
    failedAt: t.timestamp("failed_at", { withTimezone: true }),
    failureReason: t.text("failure_reason"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("partner_payouts_number_uq_idx").on(tbl.payoutNumber),
    t.index("partner_payouts_partner_idx").on(tbl.partnerId, tbl.createdAt),

    t.check("partner_payouts_amount_chk", sql`${tbl.amountPaise} > 0`),
    t.check(
      "partner_payouts_period_chk",
      sql`${tbl.periodEnd} >= ${tbl.periodStart}`,
    ),
  ],
);

// =============================================================================
// SECTION 14 — PARTNER PERFORMANCE (daily roll-up)
// =============================================================================

export const partnerPerformanceTable = table(
  "partner_performance",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "cascade",
      }),

    date: t.date("date").notNull(),

    loginHours: t.decimal("login_hours", { precision: 5, scale: 2 }),
    onlineHours: t.decimal("online_hours", { precision: 5, scale: 2 }),

    tasksAssigned: t.integer("tasks_assigned").default(0).notNull(),
    tasksCompleted: t.integer("tasks_completed").default(0).notNull(),
    tasksRejected: t.integer("tasks_rejected").default(0).notNull(),
    tasksCancelled: t.integer("tasks_cancelled").default(0).notNull(),

    acceptanceRate: t.decimal("acceptance_rate", { precision: 5, scale: 2 }),
    completionRate: t.decimal("completion_rate", { precision: 5, scale: 2 }),

    avgRating: t.decimal("avg_rating", { precision: 3, scale: 2 }),

    totalDistanceMetres: t.integer("total_distance_metres").default(0),
    totalEarningsPaise: t.integer("total_earnings_paise").default(0),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("partner_performance_uq_idx").on(tbl.partnerId, tbl.date),
    t.index("partner_performance_date_idx").on(tbl.date),
  ],
);

// =============================================================================
// SECTION 15 — CUSTOMER DELIVERY RATINGS
// =============================================================================

export const customerDeliveryRatingsTable = table(
  "customer_delivery_ratings",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    taskId: t
      .uuid("task_id")
      .notNull()
      .references(() => deliveryTasksTable.id, { onDelete: "cascade" }),

    customerId: t
      .uuid("customer_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    partnerId: t
      .uuid("partner_id")
      .notNull()
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "restrict",
      }),

    rating: t.smallint("rating").notNull(), // 1–5
    speedRating: t.smallint("speed_rating"), // 1–5
    courtesyRating: t.smallint("courtesy_rating"), // 1–5
    packagingRating: t.smallint("packaging_rating"), // 1–5

    comment: t.text("comment"),
    isAnonymous: t.boolean("is_anonymous").default(false).notNull(),

    tipAmountPaise: t.integer("tip_amount_paise").default(0).notNull(),
    tipGivenAt: t.timestamp("tip_given_at", { withTimezone: true }),

    isHidden: t.boolean("is_hidden").default(false).notNull(),
    hiddenReason: t.varchar("hidden_reason", { length: 255 }),
    hiddenBy: t
      .uuid("hidden_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("customer_delivery_ratings_task_uq_idx").on(tbl.taskId),

    t
      .index("customer_delivery_ratings_partner_idx")
      .on(tbl.partnerId, tbl.createdAt),
    t.index("customer_delivery_ratings_customer_idx").on(tbl.customerId),

    t.check(
      "customer_delivery_ratings_rating_chk",
      sql`${tbl.rating} >= 1 AND ${tbl.rating} <= 5`,
    ),
    t.check(
      "customer_delivery_ratings_speed_chk",
      sql`${tbl.speedRating} IS NULL OR (${tbl.speedRating} >= 1 AND ${tbl.speedRating} <= 5)`,
    ),
    t.check(
      "customer_delivery_ratings_courtesy_chk",
      sql`${tbl.courtesyRating} IS NULL OR (${tbl.courtesyRating} >= 1 AND ${tbl.courtesyRating} <= 5)`,
    ),
    t.check(
      "customer_delivery_ratings_packaging_chk",
      sql`${tbl.packagingRating} IS NULL OR (${tbl.packagingRating} >= 1 AND ${tbl.packagingRating} <= 5)`,
    ),
    t.check(
      "customer_delivery_ratings_tip_chk",
      sql`${tbl.tipAmountPaise} >= 0`,
    ),
    t.check(
      "customer_delivery_ratings_hidden_reason_chk",
      sql`${tbl.isHidden} = false OR ${tbl.hiddenReason} IS NOT NULL`,
    ),
  ],
);

// =============================================================================
// SECTION 16 — DELIVERY SLA POLICIES
// =============================================================================

export const deliverySlaPoliciesTable = table(
  "delivery_sla_policies",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 180 }).notNull(),
    description: t.text("description"),

    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),
    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "cascade" }),

    deliveryType: deliveryTypeEnum("delivery_type"),

    maxPickupWaitSeconds: t.integer("max_pickup_wait_seconds"),
    maxPreparationSeconds: t.integer("max_preparation_seconds"),
    maxTransitSeconds: t.integer("max_transit_seconds"),
    maxTotalSeconds: t.integer("max_total_seconds"),

    notifyPartnerOnBreachRiskPct: t.smallint(
      "notify_partner_on_breach_risk_pct",
    ).default(80),
    notifyDispatcherOnBreach: t
      .boolean("notify_dispatcher_on_breach")
      .default(true)
      .notNull(),
    autoReassignOnBreach: t
      .boolean("auto_reassign_on_breach")
      .default(false)
      .notNull(),

    priority: t.smallint("priority").default(0).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("delivery_sla_policies_slug_uq_idx").on(tbl.slug),

    t.index("delivery_sla_policies_zone_idx").on(tbl.zoneId, tbl.isActive),
    t.index("delivery_sla_policies_city_idx").on(tbl.cityId, tbl.isActive),

    t.check(
      "delivery_sla_policies_scope_chk",
      sql`${tbl.zoneId} IS NULL OR ${tbl.cityId} IS NOT NULL`,
    ),
    t.check(
      "delivery_sla_policies_budgets_chk",
      sql`
        (${tbl.maxPickupWaitSeconds}  IS NULL OR ${tbl.maxPickupWaitSeconds}  > 0) AND
        (${tbl.maxPreparationSeconds} IS NULL OR ${tbl.maxPreparationSeconds} > 0) AND
        (${tbl.maxTransitSeconds}     IS NULL OR ${tbl.maxTransitSeconds}     > 0) AND
        (${tbl.maxTotalSeconds}       IS NULL OR ${tbl.maxTotalSeconds}       > 0)
      `,
    ),
  ],
);

// =============================================================================
// SECTION 17 — SURGE PRICING WINDOWS
// =============================================================================

export const surgePricingWindowsTable = table(
  "surge_pricing_windows",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    zoneId: t
      .uuid("zone_id")
      .notNull()
      .references(() => serviceZonesTable.id, { onDelete: "cascade" }),

    reason: t.varchar("reason", { length: 255 }),

    multiplier: t.decimal("multiplier", { precision: 4, scale: 2 }).notNull(),

    flatSurgePaise: t.integer("flat_surge_paise").default(0).notNull(),

    partnerSurgeShareRate: t
      .decimal("partner_surge_share_rate", { precision: 4, scale: 2 })
      .default("0.80")
      .notNull(),

    activatedAt: t
      .timestamp("activated_at", { withTimezone: true })
      .notNull(),
    deactivatedAt: t.timestamp("deactivated_at", { withTimezone: true }),

    isActive: t.boolean("is_active").default(true).notNull(),

    activatedBy: t
      .uuid("activated_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    deactivatedBy: t
      .uuid("deactivated_by")
      .references(() => userTable.id, { onDelete: "set null" }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.index("surge_pricing_zone_active_idx").on(tbl.zoneId, tbl.isActive),
    t
      .index("surge_pricing_active_only_idx")
      .on(tbl.isActive, tbl.activatedAt)
      .where(sql`is_active = true`),

    t.check(
      "surge_pricing_multiplier_chk",
      sql`${tbl.multiplier} >= 1.00`,
    ),
    t.check(
      "surge_pricing_flat_surge_chk",
      sql`${tbl.flatSurgePaise} >= 0`,
    ),
    t.check(
      "surge_pricing_partner_share_chk",
      sql`${tbl.partnerSurgeShareRate} >= 0 AND ${tbl.partnerSurgeShareRate} <= 1`,
    ),
    t.check(
      "surge_pricing_window_chk",
      sql`
        ${tbl.deactivatedAt} IS NULL OR
        ${tbl.deactivatedAt} > ${tbl.activatedAt}
      `,
    ),
  ],
);

// =============================================================================
// SECTION 18 — DELIVERY INCIDENTS
// =============================================================================

export const deliveryIncidentsTable = table(
  "delivery_incidents",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    incidentNumber: t.varchar("incident_number", { length: 50 }).notNull(),

    taskId: t
      .uuid("task_id")
      .references(() => deliveryTasksTable.id, { onDelete: "set null" }),

    partnerId: t
      .uuid("partner_id")
      .references(() => deliveryPartnerProfileTable.id, {
        onDelete: "set null",
      }),

    customerId: t
      .uuid("customer_id")
      .references(() => userTable.id, { onDelete: "set null" }),

    shopId: t
      .uuid("shop_id")
      .references(() => shopsTable.id, { onDelete: "set null" }),

    incidentType: deliveryIncidentTypeEnum("incident_type").notNull(),
    severity: incidentSeverityEnum("severity").notNull().default("medium"),
    status: incidentStatusEnum("status").notNull().default("open"),

    title: t.varchar("title", { length: 255 }).notNull(),
    description: t.text("description").notNull(),

    lat: t.doublePrecision("lat"),
    lng: t.doublePrecision("lng"),
    locationDescription: t.varchar("location_description", { length: 255 }),

    estimatedLossPaise: t.integer("estimated_loss_paise"),
    resolvedAmountPaise: t.integer("resolved_amount_paise"),

    attachmentKeys: t.jsonb("attachment_keys").$type<string[]>(),

    assignedTo: t
      .uuid("assigned_to")
      .references(() => userTable.id, { onDelete: "set null" }),
    assignedAt: t.timestamp("assigned_at", { withTimezone: true }),

    resolvedBy: t
      .uuid("resolved_by")
      .references(() => userTable.id, { onDelete: "set null" }),
    resolvedAt: t.timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: t.text("resolution_notes"),

    escalatedTo: t
      .uuid("escalated_to")
      .references(() => userTable.id, { onDelete: "set null" }),
    escalatedAt: t.timestamp("escalated_at", { withTimezone: true }),
    escalationReason: t.text("escalation_reason"),

    reportedAt: t
      .timestamp("reported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    metadata: t.jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("delivery_incidents_number_uq_idx").on(tbl.incidentNumber),

    t.index("delivery_incidents_task_idx").on(tbl.taskId),
    t
      .index("delivery_incidents_partner_idx")
      .on(tbl.partnerId, tbl.reportedAt),
    t.index("delivery_incidents_status_idx").on(tbl.status, tbl.severity),
    t
      .index("delivery_incidents_open_idx")
      .on(tbl.severity, tbl.reportedAt)
      .where(
        sql`status IN ('open', 'under_investigation', 'escalated')`,
      ),

    t.check(
      "delivery_incidents_loss_chk",
      sql`
        (${tbl.estimatedLossPaise}  IS NULL OR ${tbl.estimatedLossPaise}  >= 0) AND
        (${tbl.resolvedAmountPaise} IS NULL OR ${tbl.resolvedAmountPaise} >= 0)
      `,
    ),
    t.check(
      "delivery_incidents_resolution_chk",
      sql`
        ${tbl.status} <> 'resolved' OR (
          ${tbl.resolvedBy}      IS NOT NULL AND
          ${tbl.resolvedAt}      IS NOT NULL AND
          ${tbl.resolutionNotes} IS NOT NULL
        )
      `,
    ),
  ],
);

// =============================================================================
// SECTION 19 — THIRD-PARTY CARRIERS & SHOP CARRIER ACCOUNTS
// =============================================================================

export const carriersTable = table(
  "carriers",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    name: t.varchar("name", { length: 150 }).notNull(),
    slug: t.varchar("slug", { length: 180 }).notNull(),

    logoKey: t.varchar("logo_key", { length: 500 }),

    trackingUrlTemplate: t.text("tracking_url_template"),

    apiBaseUrl: t.text("api_base_url"),
    supportsRealTimeTracking: t
      .boolean("supports_real_time_tracking")
      .default(false)
      .notNull(),
    supportsWebhooks: t.boolean("supports_webhooks").default(false).notNull(),
    supportsLabelGeneration: t
      .boolean("supports_label_generation")
      .default(false)
      .notNull(),

    supportedServices: t.jsonb("supported_services").$type<string[]>(),

    status: carrierStatusEnum("status").default("active").notNull(),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t.uniqueIndex("carriers_slug_uq_idx").on(tbl.slug),
    t.index("carriers_status_idx").on(tbl.status),
  ],
);

export const shopCarrierAccountsTable = table(
  "shop_carrier_accounts",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    shopId: t
      .uuid("shop_id")
      .notNull()
      .references(() => shopsTable.id, { onDelete: "cascade" }),

    carrierId: t
      .uuid("carrier_id")
      .notNull()
      .references(() => carriersTable.id, { onDelete: "restrict" }),

    accountIdentifier: t.varchar("account_identifier", { length: 255 }),

    credentialsEncrypted: t.text("credentials_encrypted"),

    pickupAddressId: t.uuid("pickup_address_id"),

    isDefault: t.boolean("is_default").default(false).notNull(),
    isActive: t.boolean("is_active").default(true).notNull(),

    negotiatedRateCardKey: t.varchar("negotiated_rate_card_key", {
      length: 500,
    }),

    lastSyncedAt: t.timestamp("last_synced_at", { withTimezone: true }),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: t
      .timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("shop_carrier_accounts_shop_carrier_uq_idx")
      .on(tbl.shopId, tbl.carrierId),

    t
      .index("shop_carrier_accounts_shop_idx")
      .on(tbl.shopId, tbl.isActive),

    t
      .uniqueIndex("shop_carrier_accounts_default_uq_idx")
      .on(tbl.shopId)
      .where(sql`is_default = true AND is_active = true`),
  ],
);

// =============================================================================
// SECTION 20 — CARRIER TRACKING EVENTS (append-only)
// =============================================================================

export const carrierTrackingEventsTable = table(
  "carrier_tracking_events",
  {
    id: t
      .bigint("id", { mode: "bigint" })
      .generatedAlwaysAsIdentity()
      .primaryKey(),

    shipmentId: t
      .uuid("shipment_id")
      .notNull()
      .references(() => shipmentsTable.id, { onDelete: "cascade" }),

    carrierId: t
      .uuid("carrier_id")
      .notNull()
      .references(() => carriersTable.id, { onDelete: "restrict" }),

    trackingNumber: t.varchar("tracking_number", { length: 100 }).notNull(),

    eventType: carrierTrackingEventTypeEnum("event_type").notNull(),

    carrierStatusCode: t.varchar("carrier_status_code", { length: 100 }),
    carrierStatusDescription: t.text("carrier_status_description"),

    locationDescription: t.varchar("location_description", { length: 255 }),
    lat: t.doublePrecision("lat"),
    lng: t.doublePrecision("lng"),

    eventAt: t.timestamp("event_at", { withTimezone: true }).notNull(),

    receivedAt: t
      .timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    rawPayload: t.jsonb("raw_payload").$type<Record<string, unknown>>(),

    idempotencyKey: t.varchar("idempotency_key", { length: 255 }),

    isProcessed: t.boolean("is_processed").default(false).notNull(),
    processedAt: t.timestamp("processed_at", { withTimezone: true }),
    processedError: t.text("processed_error"),

    createdAt: t
      .timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("carrier_tracking_events_idempotency_uq_idx")
      .on(tbl.idempotencyKey)
      .where(sql`idempotency_key IS NOT NULL`),

    t
      .index("carrier_tracking_events_shipment_idx")
      .on(tbl.shipmentId, tbl.eventAt),
    t
      .index("carrier_tracking_events_tracking_number_idx")
      .on(tbl.trackingNumber, tbl.eventAt),
    t
      .index("carrier_tracking_events_unprocessed_idx")
      .on(tbl.isProcessed, tbl.receivedAt)
      .where(sql`is_processed = false`),
  ],
);

// =============================================================================
// SECTION 21 — DELIVERY ANALYTICS (daily roll-up)
// =============================================================================

export const deliveryAnalyticsTable = table(
  "delivery_analytics",
  {
    id: t.uuid("id").defaultRandom().primaryKey(),

    zoneId: t
      .uuid("zone_id")
      .references(() => serviceZonesTable.id, { onDelete: "cascade" }),
    cityId: t
      .uuid("city_id")
      .references(() => citiesTable.id, { onDelete: "cascade" }),

    date: t.date("date").notNull(),
    dayOfWeek: t.smallint("day_of_week").notNull(),

    tasksCreated: t.integer("tasks_created").default(0).notNull(),
    tasksCompleted: t.integer("tasks_completed").default(0).notNull(),
    tasksFailed: t.integer("tasks_failed").default(0).notNull(),
    tasksCancelled: t.integer("tasks_cancelled").default(0).notNull(),
    tasksReassigned: t.integer("tasks_reassigned").default(0).notNull(),

    activePartnersCount: t.integer("active_partners_count").default(0).notNull(),
    totalOnlinePartnerHours: t.decimal("total_online_partner_hours", {
      precision: 10,
      scale: 2,
    }),
    avgConcurrentActivePartners: t.decimal("avg_concurrent_active_partners", {
      precision: 8,
      scale: 2,
    }),

    avgPickupTimeMins: t.decimal("avg_pickup_time_mins", {
      precision: 8,
      scale: 2,
    }),
    avgDeliveryTimeMins: t.decimal("avg_delivery_time_mins", {
      precision: 8,
      scale: 2,
    }),
    avgTotalTimeMins: t.decimal("avg_total_time_mins", {
      precision: 8,
      scale: 2,
    }),

    slaBreachCount: t.integer("sla_breach_count").default(0).notNull(),
    onTimeDeliveryRate: t.decimal("on_time_delivery_rate", {
      precision: 5,
      scale: 2,
    }),

    totalDistanceMetres: t
      .bigint("total_distance_metres", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    avgDistancePerDeliveryMetres: t.integer("avg_distance_per_delivery_metres"),

    codTasksCount: t.integer("cod_tasks_count").default(0).notNull(),
    codAmountCollectedPaise: t
      .bigint("cod_amount_collected_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    totalDeliveryFeesPaise: t
      .bigint("total_delivery_fees_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalPartnerEarningsPaise: t
      .bigint("total_partner_earnings_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalSurgePaise: t
      .bigint("total_surge_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),
    totalTipsPaise: t
      .bigint("total_tips_paise", { mode: "bigint" })
      .default(sql`0`)
      .notNull(),

    avgRating: t.decimal("avg_rating", { precision: 4, scale: 2 }),
    incidentsCount: t.integer("incidents_count").default(0).notNull(),
    deliverySuccessRate: t.decimal("delivery_success_rate", {
      precision: 5,
      scale: 2,
    }),

    surgeWindowsCount: t.integer("surge_windows_count").default(0).notNull(),
    surgeDurationMins: t.integer("surge_duration_mins").default(0).notNull(),

    avgBroadcastAcceptTimeSecs: t.decimal("avg_broadcast_accept_time_secs", {
      precision: 8,
      scale: 2,
    }),
    broadcastTimeoutCount: t
      .integer("broadcast_timeout_count")
      .default(0)
      .notNull(),

    tasksGrowthPct: t.decimal("tasks_growth_pct", { precision: 10, scale: 2 }),
    revenueGrowthPct: t.decimal("revenue_growth_pct", {
      precision: 10,
      scale: 2,
    }),

    calculatedAt: t
      .timestamp("calculated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (tbl) => [
    t
      .uniqueIndex("delivery_analytics_zone_date_uq_idx")
      .on(tbl.zoneId, tbl.date)
      .where(sql`zone_id IS NOT NULL`),
    t
      .uniqueIndex("delivery_analytics_city_date_uq_idx")
      .on(tbl.cityId, tbl.date)
      .where(sql`city_id IS NOT NULL`),

    t.index("delivery_analytics_date_idx").on(tbl.date),

    t.check(
      "delivery_analytics_scope_chk",
      sql`
        (${tbl.zoneId} IS NOT NULL AND ${tbl.cityId} IS NULL) OR
        (${tbl.zoneId} IS NULL     AND ${tbl.cityId} IS NOT NULL)
      `,
    ),
    t.check(
      "delivery_analytics_rates_chk",
      sql`
        (${tbl.onTimeDeliveryRate}  IS NULL OR (${tbl.onTimeDeliveryRate}  >= 0 AND ${tbl.onTimeDeliveryRate}  <= 1)) AND
        (${tbl.deliverySuccessRate} IS NULL OR (${tbl.deliverySuccessRate} >= 0 AND ${tbl.deliverySuccessRate} <= 1))
      `,
    ),
    t.check(
      "delivery_analytics_day_chk",
      sql`${tbl.dayOfWeek} >= 0 AND ${tbl.dayOfWeek} <= 6`,
    ),
  ],
);

// =============================================================================
// PENDING MIGRATION NOTES
// =============================================================================
//
// Run these after every `drizzle-kit migrate` or `push`:
//
// ── 1. GIST spatial indexes ──────────────────────────────────────────────────
//
//    CREATE INDEX idx_live_location_pings_location
//      ON live_location_pings USING GIST(location);
//
//    CREATE INDEX idx_location_snapshots_location
//      ON location_snapshots USING GIST(location);
//
//    -- The delivery_partner_profiles.current_location GIST index is noted
//    -- in profile.model.ts migration notes.
//
// ── 2. Partition live_location_pings by created_at (monthly) ────────────────
//
//    -- Run BEFORE first data load.
//
//    ALTER TABLE live_location_pings
//      PARTITION BY RANGE (created_at);
//
//    CREATE TABLE live_location_pings_2026_04
//      PARTITION OF live_location_pings
//      FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
//
// ── 3. Forward-reference FK: delivery_tasks.route_id ────────────────────────
//
//    ALTER TABLE delivery_tasks
//      ADD CONSTRAINT delivery_tasks_route_id_fk
//      FOREIGN KEY (route_id) REFERENCES delivery_routes(id)
//      ON DELETE SET NULL;
//
// ── 4. Forward-reference FK: delivery_tasks.sla_policy_id ───────────────────
//
//    ALTER TABLE delivery_tasks
//      ADD CONSTRAINT delivery_tasks_sla_policy_id_fk
//      FOREIGN KEY (sla_policy_id) REFERENCES delivery_sla_policies(id)
//      ON DELETE SET NULL;
//
// ── 5. Forward-reference FK: delivery_tasks.customer_rating_id ──────────────
//
//    ALTER TABLE delivery_tasks
//      ADD CONSTRAINT delivery_tasks_customer_rating_id_fk
//      FOREIGN KEY (customer_rating_id)
//      REFERENCES customer_delivery_ratings(id)
//      ON DELETE SET NULL;
//
// ── 6. Forward-reference FK: service_zones.active_surge_pricing_id ──────────
//
//    ALTER TABLE service_zones
//      ADD CONSTRAINT service_zones_active_surge_pricing_id_fk
//      FOREIGN KEY (active_surge_pricing_id)
//      REFERENCES surge_pricing_windows(id)
//      ON DELETE SET NULL;
//
// ── 7. Forward-reference FK: partner_earnings_ledger.payout_id ──────────────
//
//    ALTER TABLE partner_earnings_ledger
//      ADD CONSTRAINT partner_earnings_ledger_payout_id_fk
//      FOREIGN KEY (payout_id) REFERENCES partner_payouts(id)
//      ON DELETE SET NULL;
