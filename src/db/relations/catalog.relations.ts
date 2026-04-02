import { relations } from "drizzle-orm";
import {
  brandTable,
  brandCategoriesTable,
  masterProductTable,
  masterProductVariantTable,
  masterProductImagesTable,
  shopProductTable,
  shopProductVariantTable,
  shopProductImagesTable,
  shopProductPriceTable,
  shopProductPricingTiersTable,
  shopCollectionsTable,
  shopCollectionProductsTable,
  productBundlesTable,
  bundleItemsTable,
  productLinksTable,
  recommendationQueueTable,
  dailyPicksTable,
  dailyPickProductsTable,
  productFiltersTable,
  productFilterValuesTable,
  filterPresetsTable,
  filterGroupsTable,
  filterGroupMembersTable,
  productViewsTable,
  productViewAggregatesTable,
  productInteractionsTable,
  productComparisonsTable,
  searchQueriesTable,
  searchSuggestionsTable,
  trendingProductsTable,
  trendingCategoriesTable,
  trendingSearchesTable,
  productPopularityScoresTable,
  productQuestionsTable,
  questionVotesTable,
  shopAnnouncementsTable,
  announcementDismissalsTable,
  stockAlertsTable,
  stockAlertHistoryTable,
  savedForLaterTable,
  priceDropAlertsTable,
  backInStockAlertsTable,
  savedItemCollectionsTable,
  productPriceHistoryTable,
  catalogAiRecommendationsTable,
  masterProductPushSuggestionsTable,
  masterProductMatchingQueueTable,
  duplicateMasterProductReportsTable,
  shopCouponsTable,
  couponProductsTable,
  couponCollectionsTable,
  couponCategoriesTable,
  couponUsageHistoryTable,
  couponCodeBatchesTable,
  couponCodeInstancesTable,
  couponValidationAttemptsTable,
  shopCoinsConfigTable,
  customerCoinsBalanceTable,
  coinsTransactionsTable,
  coinsRedemptionCatalogTable,
  coinsRedemptionsTable,
  coinsExpirationLedgerTable,
  coinsDailyCheckinsTable,
  customerTierHistoryTable,
  coinsReferralsTable,
} from "../models/catalog";
import { shopsTable, categoriesTable } from "../models/shop";
import { userTable } from "../models/auth";

// --- SECTION 2: BRANDS ---

export const brandRelations = relations(brandTable, ({ one, many }) => ({
  parent: one(brandTable, {
    fields: [brandTable.parentBrandId],
    references: [brandTable.id],
    relationName: "brandHierarchy",
  }),
  children: many(brandTable, {
    relationName: "brandHierarchy",
  }),
  categories: many(brandCategoriesTable),
  masterProducts: many(masterProductTable),
  creator: one(userTable, {
    fields: [brandTable.createdBy],
    references: [userTable.id],
  }),
}));

export const brandCategoriesRelations = relations(
  brandCategoriesTable,
  ({ one }) => ({
    brand: one(brandTable, {
      fields: [brandCategoriesTable.brandId],
      references: [brandTable.id],
    }),
    category: one(categoriesTable, {
      fields: [brandCategoriesTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
);

// --- SECTION 3: MASTER PRODUCTS ---

export const masterProductRelations = relations(
  masterProductTable,
  ({ one, many }) => ({
    category: one(categoriesTable, {
      fields: [masterProductTable.leafCategoryId],
      references: [categoriesTable.id],
    }),
    brand: one(brandTable, {
      fields: [masterProductTable.brandId],
      references: [brandTable.id],
    }),
    variants: many(masterProductVariantTable),
    images: many(masterProductImagesTable),
    shopInstances: many(shopProductTable),
    uploader: one(userTable, {
      fields: [masterProductTable.uploaderAdminId],
      references: [userTable.id],
    }),
  }),
);

export const masterProductVariantRelations = relations(
  masterProductVariantTable,
  ({ one, many }) => ({
    masterProduct: one(masterProductTable, {
      fields: [masterProductVariantTable.masterProductId],
      references: [masterProductTable.id],
    }),
    images: many(masterProductImagesTable),
    shopVariants: many(shopProductVariantTable),
  }),
);

export const masterProductImagesRelations = relations(
  masterProductImagesTable,
  ({ one }) => ({
    masterProduct: one(masterProductTable, {
      fields: [masterProductImagesTable.masterProductId],
      references: [masterProductTable.id],
    }),
    variant: one(masterProductVariantTable, {
      fields: [masterProductImagesTable.variantId],
      references: [masterProductVariantTable.id],
    }),
  }),
);

// --- SECTION 4: SHOP PRODUCTS ---

export const shopProductRelations = relations(
  shopProductTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [shopProductTable.shopId],
      references: [shopsTable.id],
    }),
    masterProduct: one(masterProductTable, {
      fields: [shopProductTable.masterProductId],
      references: [masterProductTable.id],
    }),
    variants: many(shopProductVariantTable),
    images: many(shopProductImagesTable),
    prices: many(shopProductPriceTable),
    pricingTiers: many(shopProductPricingTiersTable),
    collectionAssociations: many(shopCollectionProductsTable),
    bundleAssociations: many(bundleItemsTable),
    linksAsSource: many(productLinksTable, { relationName: "sourceProduct" }),
    linksAsTarget: many(productLinksTable, { relationName: "linkedProduct" }),
    dailyPickAssociations: many(dailyPickProductsTable),
    filterValues: many(productFilterValuesTable),
    views: many(productViewsTable),
    viewAggregates: many(productViewAggregatesTable),
    interactions: many(productInteractionsTable),
    questions: many(productQuestionsTable),
    stockAlerts: many(stockAlertsTable),
    savedItems: many(savedForLaterTable),
    priceHistory: many(productPriceHistoryTable),
    popularityScores: one(productPopularityScoresTable),
    creator: one(userTable, {
      fields: [shopProductTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const shopProductVariantRelations = relations(
  shopProductVariantTable,
  ({ one, many }) => ({
    shopProduct: one(shopProductTable, {
      fields: [shopProductVariantTable.shopProductId],
      references: [shopProductTable.id],
    }),
    masterVariant: one(masterProductVariantTable, {
      fields: [shopProductVariantTable.masterProductVariantId],
      references: [masterProductVariantTable.id],
    }),
    images: many(shopProductImagesTable),
    prices: many(shopProductPriceTable),
    pricingTiers: many(shopProductPricingTiersTable),
    bundleAssociations: many(bundleItemsTable),
    stockAlerts: many(stockAlertsTable),
  }),
);

export const shopProductImagesRelations = relations(
  shopProductImagesTable,
  ({ one }) => ({
    shopProduct: one(shopProductTable, {
      fields: [shopProductImagesTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [shopProductImagesTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
  }),
);

// --- SECTION 5: PRICING ---

export const shopProductPriceRelations = relations(
  shopProductPriceTable,
  ({ one }) => ({
    shopProduct: one(shopProductTable, {
      fields: [shopProductPriceTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [shopProductPriceTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
  }),
);

export const shopProductPricingTiersRelations = relations(
  shopProductPricingTiersTable,
  ({ one }) => ({
    shopProduct: one(shopProductTable, {
      fields: [shopProductPricingTiersTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [shopProductPricingTiersTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
  }),
);

// --- SECTION 6: COLLECTIONS ---

export const shopCollectionsRelations = relations(
  shopCollectionsTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [shopCollectionsTable.shopId],
      references: [shopsTable.id],
    }),
    products: many(shopCollectionProductsTable),
    creator: one(userTable, {
      fields: [shopCollectionsTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const shopCollectionProductsRelations = relations(
  shopCollectionProductsTable,
  ({ one }) => ({
    collection: one(shopCollectionsTable, {
      fields: [shopCollectionProductsTable.collectionId],
      references: [shopCollectionsTable.id],
    }),
    product: one(shopProductTable, {
      fields: [shopCollectionProductsTable.shopProductId],
      references: [shopProductTable.id],
    }),
    adder: one(userTable, {
      fields: [shopCollectionProductsTable.addedBy],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 7: BUNDLES ---

export const productBundlesRelations = relations(
  productBundlesTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [productBundlesTable.shopId],
      references: [shopsTable.id],
    }),
    items: many(bundleItemsTable),
    creator: one(userTable, {
      fields: [productBundlesTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const bundleItemsRelations = relations(bundleItemsTable, ({ one }) => ({
  bundle: one(productBundlesTable, {
    fields: [bundleItemsTable.bundleId],
    references: [productBundlesTable.id],
  }),
  product: one(shopProductTable, {
    fields: [bundleItemsTable.shopProductId],
    references: [shopProductTable.id],
  }),
  variant: one(shopProductVariantTable, {
    fields: [bundleItemsTable.shopProductVariantId],
    references: [shopProductVariantTable.id],
  }),
}));

// --- SECTION 8: PRODUCT LINKS ---

export const productLinksRelations = relations(productLinksTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [productLinksTable.shopId],
    references: [shopsTable.id],
  }),
  sourceProduct: one(shopProductTable, {
    fields: [productLinksTable.sourceProductId],
    references: [shopProductTable.id],
    relationName: "sourceProduct",
  }),
  linkedProduct: one(shopProductTable, {
    fields: [productLinksTable.linkedProductId],
    references: [shopProductTable.id],
    relationName: "linkedProduct",
  }),
  creator: one(userTable, {
    fields: [productLinksTable.createdBy],
    references: [userTable.id],
  }),
}));

export const recommendationQueueRelations = relations(
  recommendationQueueTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [recommendationQueueTable.shopId],
      references: [shopsTable.id],
    }),
    sourceProduct: one(shopProductTable, {
      fields: [recommendationQueueTable.sourceProductId],
      references: [shopProductTable.id],
    }),
    recommendedProduct: one(shopProductTable, {
      fields: [recommendationQueueTable.recommendedProductId],
      references: [shopProductTable.id],
    }),
    reviewer: one(userTable, {
      fields: [recommendationQueueTable.reviewedBy],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 9: DAILY PICKS ---

export const dailyPicksRelations = relations(
  dailyPicksTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [dailyPicksTable.shopId],
      references: [shopsTable.id],
    }),
    products: many(dailyPickProductsTable),
    creator: one(userTable, {
      fields: [dailyPicksTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const dailyPickProductsRelations = relations(
  dailyPickProductsTable,
  ({ one }) => ({
    dailyPick: one(dailyPicksTable, {
      fields: [dailyPickProductsTable.dailyPickId],
      references: [dailyPicksTable.id],
    }),
    product: one(shopProductTable, {
      fields: [dailyPickProductsTable.shopProductId],
      references: [shopProductTable.id],
    }),
  }),
);

// --- SECTION 10: FILTERS ---

export const productFiltersRelations = relations(
  productFiltersTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [productFiltersTable.shopId],
      references: [shopsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [productFiltersTable.categoryId],
      references: [categoriesTable.id],
    }),
    parentFilter: one(productFiltersTable, {
      fields: [productFiltersTable.dependsOnFilterId],
      references: [productFiltersTable.id],
      relationName: "filterHierarchy",
    }),
    childFilters: many(productFiltersTable, {
      relationName: "filterHierarchy",
    }),
    values: many(productFilterValuesTable),
    creator: one(userTable, {
      fields: [productFiltersTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const productFilterValuesRelations = relations(
  productFilterValuesTable,
  ({ one }) => ({
    product: one(shopProductTable, {
      fields: [productFilterValuesTable.shopProductId],
      references: [shopProductTable.id],
    }),
    filter: one(productFiltersTable, {
      fields: [productFilterValuesTable.filterId],
      references: [productFiltersTable.id],
    }),
    verifier: one(userTable, {
      fields: [productFilterValuesTable.verifiedBy],
      references: [userTable.id],
    }),
  }),
);

export const filterPresetsRelations = relations(filterPresetsTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [filterPresetsTable.shopId],
    references: [shopsTable.id],
  }),
  category: one(categoriesTable, {
    fields: [filterPresetsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

export const filterGroupsRelations = relations(
  filterGroupsTable,
  ({ one, many }) => ({
    category: one(categoriesTable, {
      fields: [filterGroupsTable.categoryId],
      references: [categoriesTable.id],
    }),
    members: many(filterGroupMembersTable),
  }),
);

export const filterGroupMembersRelations = relations(
  filterGroupMembersTable,
  ({ one }) => ({
    group: one(filterGroupsTable, {
      fields: [filterGroupMembersTable.groupId],
      references: [filterGroupsTable.id],
    }),
    filter: one(productFiltersTable, {
      fields: [filterGroupMembersTable.filterId],
      references: [productFiltersTable.id],
    }),
  }),
);

// --- SECTION 11: BEHAVIOURAL ANALYTICS ---

export const productViewsRelations = relations(productViewsTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [productViewsTable.shopId],
    references: [shopsTable.id],
  }),
  product: one(shopProductTable, {
    fields: [productViewsTable.shopProductId],
    references: [shopProductTable.id],
  }),
  variant: one(shopProductVariantTable, {
    fields: [productViewsTable.shopProductVariantId],
    references: [shopProductVariantTable.id],
  }),
  user: one(userTable, {
    fields: [productViewsTable.userId],
    references: [userTable.id],
  }),
}));

export const productViewAggregatesRelations = relations(
  productViewAggregatesTable,
  ({ one }) => ({
    product: one(shopProductTable, {
      fields: [productViewAggregatesTable.shopProductId],
      references: [shopProductTable.id],
    }),
  }),
);

export const productInteractionsRelations = relations(
  productInteractionsTable,
  ({ one }) => ({
    product: one(shopProductTable, {
      fields: [productInteractionsTable.shopProductId],
      references: [shopProductTable.id],
    }),
    user: one(userTable, {
      fields: [productInteractionsTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const productComparisonsRelations = relations(
  productComparisonsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [productComparisonsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [productComparisonsTable.userId],
      references: [userTable.id],
    }),
    selectedProduct: one(shopProductTable, {
      fields: [productComparisonsTable.selectedProductId],
      references: [shopProductTable.id],
    }),
    category: one(categoriesTable, {
      fields: [productComparisonsTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
);

// --- SECTION 12: SEARCH ---

export const searchQueriesRelations = relations(searchQueriesTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [searchQueriesTable.shopId],
    references: [shopsTable.id],
  }),
  user: one(userTable, {
    fields: [searchQueriesTable.userId],
    references: [userTable.id],
  }),
}));

export const searchSuggestionsRelations = relations(
  searchSuggestionsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [searchSuggestionsTable.shopId],
      references: [shopsTable.id],
    }),
  }),
);

// --- SECTION 13: TRENDING ---

export const trendingProductsRelations = relations(
  trendingProductsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [trendingProductsTable.shopId],
      references: [shopsTable.id],
    }),
  }),
);

export const trendingCategoriesRelations = relations(
  trendingCategoriesTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [trendingCategoriesTable.shopId],
      references: [shopsTable.id],
    }),
  }),
);

export const trendingSearchesRelations = relations(
  trendingSearchesTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [trendingSearchesTable.shopId],
      references: [shopsTable.id],
    }),
  }),
);

export const productPopularityScoresRelations = relations(
  productPopularityScoresTable,
  ({ one }) => ({
    product: one(shopProductTable, {
      fields: [productPopularityScoresTable.shopProductId],
      references: [shopProductTable.id],
    }),
  }),
);

// --- SECTION 14: PRODUCT Q&A ---

export const productQuestionsRelations = relations(
  productQuestionsTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [productQuestionsTable.shopId],
      references: [shopsTable.id],
    }),
    product: one(shopProductTable, {
      fields: [productQuestionsTable.shopProductId],
      references: [shopProductTable.id],
    }),
    asker: one(userTable, {
      fields: [productQuestionsTable.askedByUserId],
      references: [userTable.id],
      relationName: "askedBy",
    }),
    answerer: one(userTable, {
      fields: [productQuestionsTable.answeredByUserId],
      references: [userTable.id],
      relationName: "answeredBy",
    }),
    moderator: one(userTable, {
      fields: [productQuestionsTable.moderatedBy],
      references: [userTable.id],
      relationName: "questionModerator",
    }),
    votes: many(questionVotesTable),
  }),
);

export const questionVotesRelations = relations(questionVotesTable, ({ one }) => ({
  question: one(productQuestionsTable, {
    fields: [questionVotesTable.questionId],
    references: [productQuestionsTable.id],
  }),
  user: one(userTable, {
    fields: [questionVotesTable.userId],
    references: [userTable.id],
  }),
}));

// Announcements
export const shopAnnouncementsRelations = relations(
  shopAnnouncementsTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [shopAnnouncementsTable.shopId],
      references: [shopsTable.id],
    }),
    creator: one(userTable, {
      fields: [shopAnnouncementsTable.createdBy],
      references: [userTable.id],
    }),
    dismissals: many(announcementDismissalsTable),
  }),
);

export const announcementDismissalsRelations = relations(
  announcementDismissalsTable,
  ({ one }) => ({
    announcement: one(shopAnnouncementsTable, {
      fields: [announcementDismissalsTable.announcementId],
      references: [shopAnnouncementsTable.id],
    }),
    user: one(userTable, {
      fields: [announcementDismissalsTable.userId],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 15: STOCK ALERTS ---

export const stockAlertsRelations = relations(stockAlertsTable, ({ one, many }) => ({
  shop: one(shopsTable, {
    fields: [stockAlertsTable.shopId],
    references: [shopsTable.id],
  }),
  product: one(shopProductTable, {
    fields: [stockAlertsTable.shopProductId],
    references: [shopProductTable.id],
  }),
  variant: one(shopProductVariantTable, {
    fields: [stockAlertsTable.shopProductVariantId],
    references: [shopProductVariantTable.id],
  }),
  resolver: one(userTable, {
    fields: [stockAlertsTable.resolvedBy],
    references: [userTable.id],
  }),
  history: many(stockAlertHistoryTable),
}));

export const stockAlertHistoryRelations = relations(
  stockAlertHistoryTable,
  ({ one }) => ({
    alert: one(stockAlertsTable, {
      fields: [stockAlertHistoryTable.alertId],
      references: [stockAlertsTable.id],
    }),
    changer: one(userTable, {
      fields: [stockAlertHistoryTable.changedBy],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 16: SAVED FOR LATER ---

export const savedForLaterRelations = relations(
  savedForLaterTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [savedForLaterTable.userId],
      references: [userTable.id],
    }),
    shop: one(shopsTable, {
      fields: [savedForLaterTable.shopId],
      references: [shopsTable.id],
    }),
    product: one(shopProductTable, {
      fields: [savedForLaterTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [savedForLaterTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
    priceDropAlerts: many(priceDropAlertsTable),
    backInStockAlerts: many(backInStockAlertsTable),
  }),
);

export const priceDropAlertsRelations = relations(
  priceDropAlertsTable,
  ({ one }) => ({
    savedItem: one(savedForLaterTable, {
      fields: [priceDropAlertsTable.savedId],
      references: [savedForLaterTable.id],
    }),
    user: one(userTable, {
      fields: [priceDropAlertsTable.userId],
      references: [userTable.id],
    }),
    product: one(shopProductTable, {
      fields: [priceDropAlertsTable.shopProductId],
      references: [shopProductTable.id],
    }),
  }),
);

export const backInStockAlertsRelations = relations(
  backInStockAlertsTable,
  ({ one }) => ({
    savedItem: one(savedForLaterTable, {
      fields: [backInStockAlertsTable.savedId],
      references: [savedForLaterTable.id],
    }),
    user: one(userTable, {
      fields: [backInStockAlertsTable.userId],
      references: [userTable.id],
    }),
    shop: one(shopsTable, {
      fields: [backInStockAlertsTable.shopId],
      references: [shopsTable.id],
    }),
    product: one(shopProductTable, {
      fields: [backInStockAlertsTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [backInStockAlertsTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
  }),
);

export const savedItemCollectionsRelations = relations(
  savedItemCollectionsTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [savedItemCollectionsTable.userId],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 17: PRICE HISTORY ---

export const productPriceHistoryRelations = relations(
  productPriceHistoryTable,
  ({ one }) => ({
    product: one(shopProductTable, {
      fields: [productPriceHistoryTable.shopProductId],
      references: [shopProductTable.id],
    }),
    variant: one(shopProductVariantTable, {
      fields: [productPriceHistoryTable.shopProductVariantId],
      references: [shopProductVariantTable.id],
    }),
    changer: one(userTable, {
      fields: [productPriceHistoryTable.changedBy],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 18: AI RECOMMENDATIONS ---

export const catalogAiRecommendationsRelations = relations(
  catalogAiRecommendationsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [catalogAiRecommendationsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [catalogAiRecommendationsTable.userId],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 19: MASTER-PRODUCT MATCHING ---

export const masterProductPushSuggestionsRelations = relations(
  masterProductPushSuggestionsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [masterProductPushSuggestionsTable.shopId],
      references: [shopsTable.id],
    }),
    shopProduct: one(shopProductTable, {
      fields: [masterProductPushSuggestionsTable.shopProductId],
      references: [shopProductTable.id],
    }),
    suggestedMasterProduct: one(masterProductTable, {
      fields: [masterProductPushSuggestionsTable.suggestedMasterProductId],
      references: [masterProductTable.id],
    }),
    submitter: one(userTable, {
      fields: [masterProductPushSuggestionsTable.submittedBy],
      references: [userTable.id],
    }),
    reviewer: one(userTable, {
      fields: [masterProductPushSuggestionsTable.reviewedBy],
      references: [userTable.id],
    }),
  }),
);

export const masterProductMatchingQueueRelations = relations(
  masterProductMatchingQueueTable,
  ({ one }) => ({
    shopProduct: one(shopProductTable, {
      fields: [masterProductMatchingQueueTable.shopProductId],
      references: [shopProductTable.id],
    }),
    shop: one(shopsTable, {
      fields: [masterProductMatchingQueueTable.shopId],
      references: [shopsTable.id],
    }),
    suggestion: one(masterProductPushSuggestionsTable, {
      fields: [masterProductMatchingQueueTable.suggestionId],
      references: [masterProductPushSuggestionsTable.id],
    }),
  }),
);

export const duplicateMasterProductReportsRelations = relations(
  duplicateMasterProductReportsTable,
  ({ one }) => ({
    product1: one(masterProductTable, {
      fields: [duplicateMasterProductReportsTable.masterProduct1Id],
      references: [masterProductTable.id],
      relationName: "duplicateProduct1",
    }),
    product2: one(masterProductTable, {
      fields: [duplicateMasterProductReportsTable.masterProduct2Id],
      references: [masterProductTable.id],
      relationName: "duplicateProduct2",
    }),
    reporter: one(userTable, {
      fields: [duplicateMasterProductReportsTable.reportedBy],
      references: [userTable.id],
    }),
    reviewer: one(userTable, {
      fields: [duplicateMasterProductReportsTable.reviewedBy],
      references: [userTable.id],
    }),
    mergedInto: one(masterProductTable, {
      fields: [duplicateMasterProductReportsTable.mergedIntoId],
      references: [masterProductTable.id],
    }),
  }),
);

// --- SECTION 20: COUPONS ---

export const shopCouponsRelations = relations(
  shopCouponsTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [shopCouponsTable.shopId],
      references: [shopsTable.id],
    }),
    products: many(couponProductsTable),
    collections: many(couponCollectionsTable),
    categories: many(couponCategoriesTable),
    usageHistory: many(couponUsageHistoryTable),
    codeInstances: many(couponCodeInstancesTable),
    creator: one(userTable, {
      fields: [shopCouponsTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const couponProductsRelations = relations(
  couponProductsTable,
  ({ one }) => ({
    coupon: one(shopCouponsTable, {
      fields: [couponProductsTable.couponId],
      references: [shopCouponsTable.id],
    }),
    product: one(shopProductTable, {
      fields: [couponProductsTable.productId],
      references: [shopProductTable.id],
    }),
  }),
);

export const couponCollectionsRelations = relations(
  couponCollectionsTable,
  ({ one }) => ({
    coupon: one(shopCouponsTable, {
      fields: [couponCollectionsTable.couponId],
      references: [shopCouponsTable.id],
    }),
    collection: one(shopCollectionsTable, {
      fields: [couponCollectionsTable.collectionId],
      references: [shopCollectionsTable.id],
    }),
  }),
);

export const couponCategoriesRelations = relations(
  couponCategoriesTable,
  ({ one }) => ({
    coupon: one(shopCouponsTable, {
      fields: [couponCategoriesTable.couponId],
      references: [shopCouponsTable.id],
    }),
    category: one(categoriesTable, {
      fields: [couponCategoriesTable.categoryId],
      references: [categoriesTable.id],
    }),
  }),
);

export const couponUsageHistoryRelations = relations(
  couponUsageHistoryTable,
  ({ one }) => ({
    coupon: one(shopCouponsTable, {
      fields: [couponUsageHistoryTable.couponId],
      references: [shopCouponsTable.id],
    }),
    user: one(userTable, {
      fields: [couponUsageHistoryTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const couponCodeBatchesRelations = relations(
  couponCodeBatchesTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [couponCodeBatchesTable.shopId],
      references: [shopsTable.id],
    }),
    codes: many(couponCodeInstancesTable),
    creator: one(userTable, {
      fields: [couponCodeBatchesTable.createdBy],
      references: [userTable.id],
    }),
  }),
);

export const couponCodeInstancesRelations = relations(
  couponCodeInstancesTable,
  ({ one }) => ({
    batch: one(couponCodeBatchesTable, {
      fields: [couponCodeInstancesTable.batchId],
      references: [couponCodeBatchesTable.id],
    }),
    coupon: one(shopCouponsTable, {
      fields: [couponCodeInstancesTable.couponId],
      references: [shopCouponsTable.id],
    }),
    assignedUser: one(userTable, {
      fields: [couponCodeInstancesTable.assignedTo],
      references: [userTable.id],
    }),
  }),
);

export const couponValidationAttemptsRelations = relations(
  couponValidationAttemptsTable,
  ({ one }) => ({
    coupon: one(shopCouponsTable, {
      fields: [couponValidationAttemptsTable.couponId],
      references: [shopCouponsTable.id],
    }),
    user: one(userTable, {
      fields: [couponValidationAttemptsTable.userId],
      references: [userTable.id],
    }),
  }),
);

// --- SECTION 21: COINS / LOYALTY ---

export const shopCoinsConfigRelations = relations(
  shopCoinsConfigTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [shopCoinsConfigTable.shopId],
      references: [shopsTable.id],
    }),
  }),
);

export const customerCoinsBalanceRelations = relations(
  customerCoinsBalanceTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [customerCoinsBalanceTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [customerCoinsBalanceTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const coinsTransactionsRelations = relations(
  coinsTransactionsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [coinsTransactionsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [coinsTransactionsTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const coinsRedemptionCatalogRelations = relations(
  coinsRedemptionCatalogTable,
  ({ one, many }) => ({
    shop: one(shopsTable, {
      fields: [coinsRedemptionCatalogTable.shopId],
      references: [shopsTable.id],
    }),
    redemptions: many(coinsRedemptionsTable),
  }),
);

export const coinsRedemptionsRelations = relations(
  coinsRedemptionsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [coinsRedemptionsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [coinsRedemptionsTable.userId],
      references: [userTable.id],
    }),
    catalogItem: one(coinsRedemptionCatalogTable, {
      fields: [coinsRedemptionsTable.catalogItemId],
      references: [coinsRedemptionCatalogTable.id],
    }),
    transaction: one(coinsTransactionsTable, {
      fields: [coinsRedemptionsTable.transactionId],
      references: [coinsTransactionsTable.id],
    }),
  }),
);

export const coinsExpirationLedgerRelations = relations(
  coinsExpirationLedgerTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [coinsExpirationLedgerTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [coinsExpirationLedgerTable.userId],
      references: [userTable.id],
    }),
    transaction: one(coinsTransactionsTable, {
      fields: [coinsExpirationLedgerTable.transactionId],
      references: [coinsTransactionsTable.id],
    }),
  }),
);

export const coinsDailyCheckinsRelations = relations(
  coinsDailyCheckinsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [coinsDailyCheckinsTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [coinsDailyCheckinsTable.userId],
      references: [userTable.id],
    }),
    transaction: one(coinsTransactionsTable, {
      fields: [coinsDailyCheckinsTable.transactionId],
      references: [coinsTransactionsTable.id],
    }),
  }),
);

export const customerTierHistoryRelations = relations(
  customerTierHistoryTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [customerTierHistoryTable.shopId],
      references: [shopsTable.id],
    }),
    user: one(userTable, {
      fields: [customerTierHistoryTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const coinsReferralsRelations = relations(
  coinsReferralsTable,
  ({ one }) => ({
    shop: one(shopsTable, {
      fields: [coinsReferralsTable.shopId],
      references: [shopsTable.id],
    }),
    referrer: one(userTable, {
      fields: [coinsReferralsTable.referrerId],
      references: [userTable.id],
    }),
    referee: one(userTable, {
      fields: [coinsReferralsTable.refereeId],
      references: [userTable.id],
    }),
  }),
);
