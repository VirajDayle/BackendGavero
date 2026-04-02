import { relations } from "drizzle-orm";
import {
  userTable,
  otpVerificationTable,
  userSessionTable,
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  userRolesTable,
  authAttemptsTable,
  referralCodesTable,
  referralTable,
  authAuditLogTable,
  userDevicesTable,
} from "../models/auth";
import {
  bankAccountsTable,
  customerProfileTable,
  deliveryPartnerProfileTable,
  kycDocumentsTable,
  shopOwnerProfileTable,
} from "../models/profile";
import {
  shopsTable,
  shopReviewsTable,
  shopVerificationsTable,
} from "../models/shop";

export const userRelations = relations(userTable, ({ many, one }) => ({
  otpVerifications: many(otpVerificationTable),
  sessions: many(userSessionTable),
  roles: many(userRolesTable),
  attempts: many(authAttemptsTable),
  referralCodes: many(referralCodesTable),
  referralsAsReferrer: many(referralTable, { relationName: "referrer" }),
  referralsAsReferee: one(referralTable, {
    fields: [userTable.id],
    references: [referralTable.refereeId],
    relationName: "referee",
  }),
  auditLogs: many(authAuditLogTable),
  devices: many(userDevicesTable),
  
  // Profile relations
  bankAccounts: many(bankAccountsTable),
  kycDocuments: many(kycDocumentsTable),
  shopOwnerProfile: one(shopOwnerProfileTable),
  deliveryPartnerProfile: one(deliveryPartnerProfileTable),
  customerProfile: one(customerProfileTable),

  // Shop relations
  shops: many(shopsTable),
  shopReviews: many(shopReviewsTable),
  moderatedReviews: many(shopReviewsTable, { relationName: "reviewModerator" }),
  reviewedShopDocuments: many(shopVerificationsTable),
}));

export const otpVerificationRelations = relations(otpVerificationTable, ({ one }) => ({
  user: one(userTable, {
    fields: [otpVerificationTable.userId],
    references: [userTable.id],
  }),
}));

export const userSessionRelations = relations(userSessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userSessionTable.userId],
    references: [userTable.id],
  }),
}));

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  userRoles: many(userRolesTable),
  rolePermissions: many(rolePermissionsTable),
}));

export const permissionsRelations = relations(permissionsTable, ({ many }) => ({
  rolePermissions: many(rolePermissionsTable),
}));

export const rolePermissionsRelations = relations(rolePermissionsTable, ({ one }) => ({
  role: one(rolesTable, {
    fields: [rolePermissionsTable.roleId],
    references: [rolesTable.id],
  }),
  permission: one(permissionsTable, {
    fields: [rolePermissionsTable.permissionId],
    references: [permissionsTable.id],
  }),
}));

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userRolesTable.userId],
    references: [userTable.id],
  }),
  role: one(rolesTable, {
    fields: [userRolesTable.roleId],
    references: [rolesTable.id],
  }),
}));

export const authAttemptsRelations = relations(authAttemptsTable, ({ one }) => ({
  user: one(userTable, {
    fields: [authAttemptsTable.userId],
    references: [userTable.id],
  }),
  session: one(userSessionTable, {
    fields: [authAttemptsTable.sessionId],
    references: [userSessionTable.id],
  }),
}));

export const referralCodesRelations = relations(referralCodesTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [referralCodesTable.userId],
    references: [userTable.id],
  }),
  referrals: many(referralTable),
}));

export const referralRelations = relations(referralTable, ({ one }) => ({
  referrer: one(userTable, {
    fields: [referralTable.referrerId],
    references: [userTable.id],
    relationName: "referrer",
  }),
  referee: one(userTable, {
    fields: [referralTable.refereeId],
    references: [userTable.id],
    relationName: "referee",
  }),
  referralCode: one(referralCodesTable, {
    fields: [referralTable.referralCodeId],
    references: [referralCodesTable.id],
  }),
}));

export const authAuditLogRelations = relations(authAuditLogTable, ({ one }) => ({
  actor: one(userTable, {
    fields: [authAuditLogTable.actorId],
    references: [userTable.id],
  }),
}));

export const userDevicesRelations = relations(userDevicesTable, ({ one }) => ({
  user: one(userTable, {
    fields: [userDevicesTable.userId],
    references: [userTable.id],
  }),
}));
