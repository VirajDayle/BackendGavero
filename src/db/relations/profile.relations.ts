import { relations } from "drizzle-orm";
import {
  addressesTable,
  bankAccountsTable,
  customerProfileTable,
  deliveryPartnerProfileTable,
  kycDocumentsTable,
  shopOwnerProfileTable,
} from "../models/profile";
import { userTable } from "../models/auth";
import { citiesTable, serviceablePincodesTable } from "../models/location";
import { shopsTable, shopBranchesTable } from "../models/shop";

export const citiesRelations = relations(citiesTable, ({ many }) => ({
  serviceablePincodes: many(serviceablePincodesTable),
  addresses: many(addressesTable),
  deliveryPartners: many(deliveryPartnerProfileTable),
  shops: many(shopsTable),
}));

export const serviceablePincodesRelations = relations(
  serviceablePincodesTable,
  ({ one }) => ({
    city: one(citiesTable, {
      fields: [serviceablePincodesTable.cityId],
      references: [citiesTable.id],
    }),
  }),
);

export const bankAccountsRelations = relations(bankAccountsTable, ({ one }) => ({
  user: one(userTable, {
    fields: [bankAccountsTable.userId],
    references: [userTable.id],
  }),
}));

export const kycDocumentsRelations = relations(kycDocumentsTable, ({ one }) => ({
  user: one(userTable, {
    fields: [kycDocumentsTable.userId],
    references: [userTable.id],
  }),
  reviewer: one(userTable, {
    fields: [kycDocumentsTable.reviewedBy],
    references: [userTable.id],
    relationName: "kycReviewer",
  }),
}));

export const addressesRelations = relations(addressesTable, ({ one }) => ({
  user: one(userTable, {
    fields: [addressesTable.userId],
    references: [userTable.id],
  }),
  city: one(citiesTable, {
    fields: [addressesTable.cityId],
    references: [citiesTable.id],
  }),
  shop: one(shopsTable, {
    fields: [addressesTable.shopId],
    references: [shopsTable.id],
  }),
  branch: one(shopBranchesTable, {
    fields: [addressesTable.id],
    references: [shopBranchesTable.addressId],
  }),
}));

export const shopOwnerProfileRelations = relations(
  shopOwnerProfileTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [shopOwnerProfileTable.userId],
      references: [userTable.id],
    }),
    primaryBankAccount: one(bankAccountsTable, {
      fields: [shopOwnerProfileTable.primaryBankAccountId],
      references: [bankAccountsTable.id],
    }),
  }),
);

export const deliveryPartnerProfileRelations = relations(
  deliveryPartnerProfileTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [deliveryPartnerProfileTable.userId],
      references: [userTable.id],
    }),
    city: one(citiesTable, {
      fields: [deliveryPartnerProfileTable.cityId],
      references: [citiesTable.id],
    }),
    primaryBankAccount: one(bankAccountsTable, {
      fields: [deliveryPartnerProfileTable.primaryBankAccountId],
      references: [bankAccountsTable.id],
    }),
  }),
);

export const customerProfileRelations = relations(
  customerProfileTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [customerProfileTable.userId],
      references: [userTable.id],
    }),
  }),
);
