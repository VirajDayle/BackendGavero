import { relations } from "drizzle-orm";
import {
  shopsTable,
  shopTypeTable,
  categoriesTable,
  shopVerificationsTable,
  shopBranchesTable,
  shopHoursTable,
  shopHolidaysTable,
  shopStatsTable,
  shopReviewsTable,
  shopAiRecommendationsTable,
  preCategoriesTable,
} from "../models/shop";
import { userTable } from "../models/auth";
import { addressesTable } from "../models/profile";
import { citiesTable } from "../models/location";

export const shopTypeRelations = relations(shopTypeTable, ({ many }) => ({
  shops: many(shopsTable),
}));

export const preCategoriesRelations = relations(preCategoriesTable, () => ({}));

export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
  shop: one(shopsTable, {
    fields: [categoriesTable.shopId],
    references: [shopsTable.id],
  }),
  parent: one(categoriesTable, {
    fields: [categoriesTable.parentId],
    references: [categoriesTable.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categoriesTable, {
    relationName: "categoryHierarchy",
  }),
}));

export const shopsRelations = relations(shopsTable, ({ one, many }) => ({
  owner: one(userTable, {
    fields: [shopsTable.ownerId],
    references: [userTable.id],
  }),
  type: one(shopTypeTable, {
    fields: [shopsTable.shopTypeId],
    references: [shopTypeTable.id],
  }),
  primaryAddress: one(addressesTable, {
    fields: [shopsTable.primaryAddressId],
    references: [addressesTable.id],
  }),
  city: one(citiesTable, {
    fields: [shopsTable.cityId],
    references: [citiesTable.id],
  }),
  verifications: many(shopVerificationsTable),
  branches: many(shopBranchesTable),
  hours: many(shopHoursTable),
  holidays: many(shopHolidaysTable),
  stats: one(shopStatsTable),
  reviews: many(shopReviewsTable),
  categories: many(categoriesTable),
  recommendations: many(shopAiRecommendationsTable),
}));

export const shopVerificationsRelations = relations(
  shopVerificationsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [shopVerificationsTable.shopId],
      references: [shopsTable.id],
    }),
    reviewer: one(userTable, {
      fields: [shopVerificationsTable.reviewedBy],
      references: [userTable.id],
    }),
  }),
);

export const shopBranchesRelations = relations(
  shopBranchesTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [shopBranchesTable.shopId],
      references: [shopsTable.id],
    }),
    address: one(addressesTable, {
      fields: [shopBranchesTable.addressId],
      references: [addressesTable.id],
    }),
  }),
);

export const shopHoursRelations = relations(shopHoursTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [shopHoursTable.shopId],
    references: [shopsTable.id],
  }),
}));

export const shopHolidaysRelations = relations(shopHolidaysTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [shopHolidaysTable.shopId],
    references: [shopsTable.id],
  }),
}));

export const shopStatsRelations = relations(shopStatsTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [shopStatsTable.shopId],
    references: [shopsTable.id],
  }),
}));

export const shopReviewsRelations = relations(shopReviewsTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [shopReviewsTable.shopId],
    references: [shopsTable.id],
  }),
  user: one(userTable, {
    fields: [shopReviewsTable.userId],
    references: [userTable.id],
  }),
  moderator: one(userTable, {
    fields: [shopReviewsTable.hiddenBy],
    references: [userTable.id],
    relationName: "reviewModerator",
  }),
}));

export const shopAiRecommendationsRelations = relations(
  shopAiRecommendationsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [shopAiRecommendationsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [shopAiRecommendationsTable.userId],
      references: [userTable.id],
    }),
  }),
);
