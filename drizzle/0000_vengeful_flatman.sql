CREATE TYPE "public"."account_status" AS ENUM('active', 'suspended', 'deactivated', 'banned');--> statement-breakpoint
CREATE TYPE "public"."address_label" AS ENUM('home', 'work', 'office', 'hotel', 'other');--> statement-breakpoint
CREATE TYPE "public"."analytics_granularity" AS ENUM('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."answered_by" AS ENUM('shop_owner', 'support_team', 'ai_assistant', 'community', 'verified_buyer');--> statement-breakpoint
CREATE TYPE "public"."assignment_strategy" AS ENUM('auto_nearest', 'auto_least_loaded', 'broadcast_accept', 'manual', 'zone_based');--> statement-breakpoint
CREATE TYPE "public"."audience_member_send_status" AS ENUM('pending', 'sent', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."audience_segment_type" AS ENUM('all_users', 'all_customers', 'all_shop_owners', 'all_delivery_partners', 'city', 'tier', 'last_active_days', 'inactive_days', 'order_count_range', 'spend_range', 'custom_sql', 'manual_upload', 'tag');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('customer', 'shop_owner', 'delivery_partner', 'admin', 'super_admin', 'system', 'api_client', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."audit_operation" AS ENUM('create', 'read', 'update', 'delete', 'soft_delete', 'restore', 'export', 'login', 'logout', 'password_change', 'pin_change', 'permission_grant', 'permission_revoke', 'status_change', 'approve', 'reject', 'bulk_update', 'impersonate');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('otp', 'pin');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('savings', 'current', 'salary');--> statement-breakpoint
CREATE TYPE "public"."banner_event_type" AS ENUM('impression', 'click', 'dismiss', 'conversion');--> statement-breakpoint
CREATE TYPE "public"."banner_media_type" AS ENUM('image', 'gif', 'video', 'lottie', 'html');--> statement-breakpoint
CREATE TYPE "public"."banner_placement" AS ENUM('home_top', 'home_middle', 'category_top', 'search_top', 'cart_bottom', 'checkout_top', 'order_confirmation', 'post_delivery', 'shop_page_top', 'product_page_middle');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('preparing', 'sending', 'completed', 'partially_failed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."bundle_pricing_type" AS ENUM('fixed_price', 'percentage_off', 'fixed_discount', 'buy_x_get_y');--> statement-breakpoint
CREATE TYPE "public"."bundle_type" AS ENUM('flexible', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'archived');--> statement-breakpoint
CREATE TYPE "public"."campaign_type" AS ENUM('push_blast', 'email_blast', 'sms_blast', 'whatsapp_blast', 'multi_channel', 'drip', 'triggered', 'ab_test', 'transactional_promo');--> statement-breakpoint
CREATE TYPE "public"."carrier_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."carrier_tracking_event_type" AS ENUM('shipment_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivery_attempted', 'delivered', 'exception', 'returned', 'lost', 'cancelled', 'customs_hold', 'hub_scan', 'info');--> statement-breakpoint
CREATE TYPE "public"."cart_status" AS ENUM('active', 'checked_out', 'abandoned', 'expired', 'merged');--> statement-breakpoint
CREATE TYPE "public"."catalogue_announcement_type" AS ENUM('general', 'promotion', 'new_arrival', 'restock', 'holiday', 'urgent', 'maintenance', 'policy_update');--> statement-breakpoint
CREATE TYPE "public"."catalogue_recommendation_type" AS ENUM('personalized_homepage', 'similar_products', 'frequently_bought_together', 'complementary_items', 'trending_for_you', 'complete_the_look', 'you_may_also_like', 'recently_viewed', 'abandoned_cart', 'seasonal', 'price_drop_alert', 'restock_alert', 'upsell', 'cross_sell', 'bundle_suggestion');--> statement-breakpoint
CREATE TYPE "public"."coin_earning_source" AS ENUM('purchase', 'signup', 'referral', 'review', 'social_share', 'birthday', 'milestone', 'daily_checkin', 'contest', 'survey', 'promotion', 'admin');--> statement-breakpoint
CREATE TYPE "public"."coin_redemption_type" AS ENUM('order_discount', 'product_discount', 'free_shipping', 'gift_card', 'prize', 'donation');--> statement-breakpoint
CREATE TYPE "public"."coin_transaction_status" AS ENUM('pending', 'completed', 'failed', 'reversed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."coin_transaction_type" AS ENUM('earned', 'redeemed', 'expired', 'refunded', 'admin_credit', 'admin_debit', 'transferred', 'bonus', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."collection_type" AS ENUM('manual', 'smart', 'seasonal', 'trending');--> statement-breakpoint
CREATE TYPE "public"."commission_applied_on" AS ENUM('gross_subtotal', 'net_subtotal');--> statement-breakpoint
CREATE TYPE "public"."commission_scope" AS ENUM('global', 'city', 'shop_type', 'shop');--> statement-breakpoint
CREATE TYPE "public"."comparison_outcome" AS ENUM('purchased', 'abandoned', 'saved_for_later', 'shared', 'unclear');--> statement-breakpoint
CREATE TYPE "public"."config_scope" AS ENUM('global', 'city', 'shop_type');--> statement-breakpoint
CREATE TYPE "public"."config_value_type" AS ENUM('string', 'integer', 'decimal', 'boolean', 'json', 'paise');--> statement-breakpoint
CREATE TYPE "public"."consent_action" AS ENUM('granted', 'revoked', 'updated', 'expired');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('terms_of_service', 'privacy_policy', 'marketing_communications', 'location_tracking', 'data_analytics', 'third_party_sharing', 'push_notifications', 'sms_notifications', 'whatsapp_notifications', 'cookie_analytics', 'cookie_marketing');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'tiered');--> statement-breakpoint
CREATE TYPE "public"."coupon_scope" AS ENUM('order_total', 'shipping', 'specific_items', 'subscription');--> statement-breakpoint
CREATE TYPE "public"."coupon_status" AS ENUM('active', 'inactive', 'expired', 'depleted', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."coupon_target" AS ENUM('all', 'specific_products', 'categories', 'collections', 'brands', 'new_customers', 'first_purchase', 'abandoned_cart');--> statement-breakpoint
CREATE TYPE "public"."customer_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond');--> statement-breakpoint
CREATE TYPE "public"."data_deletion_stage" AS ENUM('requested', 'identity_verified', 'scheduled', 'anonymising', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."delivery_failure_reason" AS ENUM('customer_unavailable', 'wrong_address', 'address_not_found', 'customer_refused', 'access_denied', 'payment_issue', 'damaged_in_transit', 'item_missing', 'partner_issue', 'weather', 'vehicle_breakdown', 'other');--> statement-breakpoint
CREATE TYPE "public"."delivery_incident_type" AS ENUM('damaged_package', 'missing_item', 'wrong_item_delivered', 'theft', 'accident', 'partner_misconduct', 'customer_complaint', 'fraud_attempt', 'vehicle_issue', 'weather_delay', 'address_issue', 'other');--> statement-breakpoint
CREATE TYPE "public"."delivery_partner_status" AS ENUM('offline', 'available', 'on_delivery', 'break', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."delivery_task_status" AS ENUM('pending', 'broadcast', 'assigned', 'partner_enroute_pickup', 'arrived_pickup', 'picked_up', 'partner_enroute_delivery', 'arrived_delivery', 'delivered', 'delivery_failed', 'returned_to_shop', 'cancelled', 'reassigned', 'expired');--> statement-breakpoint
CREATE TYPE "public"."delivery_type" AS ENUM('instant', 'scheduled', 'express', 'standard', 'cod', 'pickup', 'return_pickup', 'inter_city');--> statement-breakpoint
CREATE TYPE "public"."detection_method" AS ENUM('auto_detected', 'user_reported', 'admin_flagged');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('android', 'ios', 'web', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."display_location" AS ENUM('shop_header', 'shop_banner', 'product_page', 'cart_page', 'checkout_page', 'category_page', 'homepage', 'all_pages');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('warning_needs_response', 'warning_under_review', 'needs_response', 'under_review', 'charge_refunded', 'won', 'lost', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."dp_application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'requires_changes', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."dp_onboarding_step" AS ENUM('personal_info', 'vehicle_details', 'driving_licence', 'aadhaar_kyc', 'pan_kyc', 'profile_photo', 'bank_account', 'city_zone_selection', 'orientation', 'background_check', 'final_approval');--> statement-breakpoint
CREATE TYPE "public"."duplicate_report_status" AS ENUM('pending', 'confirmed', 'false_positive', 'merged', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."earnings_entry_type" AS ENUM('delivery_fee', 'surge_bonus', 'tip', 'incentive_bonus', 'referral_bonus', 'correction_credit', 'penalty_debit', 'cod_shortfall', 'adjustment_debit');--> statement-breakpoint
CREATE TYPE "public"."export_status" AS ENUM('queued', 'processing', 'ready', 'downloaded', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."faq_target" AS ENUM('customer', 'shop_owner', 'delivery_partner', 'all');--> statement-breakpoint
CREATE TYPE "public"."fee_deduction_method" AS ENUM('separate_invoice', 'deduct_from_payout');--> statement-breakpoint
CREATE TYPE "public"."filter_display_style" AS ENUM('list', 'grid', 'dropdown', 'slider', 'color_swatches', 'size_buttons');--> statement-breakpoint
CREATE TYPE "public"."filter_scope" AS ENUM('global', 'category', 'shop');--> statement-breakpoint
CREATE TYPE "public"."filter_type" AS ENUM('single_select', 'multi_select', 'range', 'boolean', 'color', 'size');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('unfulfilled', 'partial', 'fulfilled', 'restocked');--> statement-breakpoint
CREATE TYPE "public"."generation_method" AS ENUM('manual', 'auto_generated', 'bulk_generated', 'api_generated');--> statement-breakpoint
CREATE TYPE "public"."gift_card_transaction_type" AS ENUM('redemption', 'refund', 'adjustment', 'activation');--> statement-breakpoint
CREATE TYPE "public"."gst_transaction_type" AS ENUM('intra_state', 'inter_state', 'export');--> statement-breakpoint
CREATE TYPE "public"."http_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD');--> statement-breakpoint
CREATE TYPE "public"."incident_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('open', 'under_investigation', 'resolved', 'closed', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('view', 'click', 'add_to_cart', 'remove_from_cart', 'add_to_wishlist', 'remove_from_wishlist', 'share', 'review_submitted', 'question_asked', 'compare', 'quick_view', 'zoom_image', 'play_video');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('sale', 'return', 'restock', 'adjustment', 'transfer_in', 'transfer_out', 'damage', 'expiry', 'opening_stock');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'running', 'completed', 'failed', 'retrying', 'cancelled', 'stale');--> statement-breakpoint
CREATE TYPE "public"."kyc_document_type" AS ENUM('aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'gst_certificate', 'business_registration', 'bank_statement');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('not_submitted', 'pending', 'under_review', 'verified', 'rejected', 'suspended', 'expired');--> statement-breakpoint
CREATE TYPE "public"."link_source" AS ENUM('manual', 'auto_purchase', 'auto_view', 'auto_cart', 'ai_suggested');--> statement-breakpoint
CREATE TYPE "public"."link_type" AS ENUM('frequently_bought_together', 'customers_also_bought', 'alternative', 'accessory', 'replacement', 'upgrade', 'related', 'similar');--> statement-breakpoint
CREATE TYPE "public"."login_auth_method" AS ENUM('otp', 'pin', 'google_oauth', 'apple_oauth', 'admin_impersonation');--> statement-breakpoint
CREATE TYPE "public"."login_event_type" AS ENUM('login_success', 'login_failed', 'logout', 'session_expired', 'session_revoked', 'token_refreshed', 'mfa_challenge_sent', 'mfa_success', 'mfa_failed', 'password_reset_requested', 'pin_reset_requested', 'account_locked', 'account_unlocked', 'suspicious_activity_flagged');--> statement-breakpoint
CREATE TYPE "public"."login_failure_reason" AS ENUM('invalid_credentials', 'account_locked', 'account_not_found', 'unverified_phone', 'too_many_attempts', 'suspicious_activity');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'extended');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('exact', 'high_confidence', 'medium_confidence', 'low_confidence', 'manual', 'user_reported');--> statement-breakpoint
CREATE TYPE "public"."matching_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."notif_interaction_type" AS ENUM('delivered', 'opened', 'clicked', 'dismissed', 'converted', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."notif_category" AS ENUM('order_update', 'payment_update', 'delivery_update', 'account_security', 'kyc_update', 'payout_update', 'promotional', 'offer_alert', 'restock_alert', 'price_drop_alert', 'abandoned_cart', 'campaign', 'shop_update', 'dispatch_update', 'system_alert', 'recommendation', 'reminder', 'survey');--> statement-breakpoint
CREATE TYPE "public"."notif_channel" AS ENUM('push', 'email', 'sms', 'whatsapp', 'in_app', 'web_push');--> statement-breakpoint
CREATE TYPE "public"."notif_status" AS ENUM('pending', 'scheduled', 'processing', 'sent', 'delivered', 'failed', 'cancelled', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step" AS ENUM('basic_info', 'address_location', 'operating_hours', 'bank_account', 'kyc_personal', 'kyc_business', 'first_product', 'subscription_plan', 'go_live_review');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'payment_pending', 'payment_failed', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refund_requested', 'refund_processing', 'refunded', 'partially_refunded', 'return_requested', 'return_approved', 'return_rejected', 'returned', 'failed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('phone_verification', 'pin_reset', 'two_factor_auth', 'account_deletion');--> statement-breakpoint
CREATE TYPE "public"."partner_payout_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('credit_card', 'debit_card', 'wallet', 'upi', 'net_banking', 'cod', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'buy_now_pay_later', 'gift_card', 'store_credit');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'authorized', 'captured', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded', 'expired', 'requires_action', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."permission_change_operation" AS ENUM('role_granted', 'role_revoked', 'permission_granted', 'permission_revoked', 'shop_access_granted', 'shop_access_revoked');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_target" AS ENUM('all_users', 'all_customers', 'all_shop_owners', 'all_delivery_partners', 'city_customers', 'city_shop_owners', 'city_delivery_partners', 'specific_shops');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_type" AS ENUM('general', 'feature_launch', 'policy_update', 'maintenance', 'promotion', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."platform_fee_payment_status" AS ENUM('pending', 'paid', 'overdue', 'waived', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."platform_search_intent" AS ENUM('find_shop', 'find_product', 'find_category', 'browse');--> statement-breakpoint
CREATE TYPE "public"."pod_type" AS ENUM('photo', 'signature', 'otp', 'qr_scan', 'left_at_door', 'handed_to_neighbour', 'handed_to_security');--> statement-breakpoint
CREATE TYPE "public"."popup_event_type" AS ENUM('shown', 'primary_cta_clicked', 'secondary_cta_clicked', 'dismissed', 'converted');--> statement-breakpoint
CREATE TYPE "public"."popup_trigger" AS ENUM('app_open', 'session_start', 'page_view', 'add_to_cart', 'checkout_start', 'order_placed', 'post_delivery', 'inactivity', 'exit_intent', 'scroll_depth', 'time_on_page', 'first_visit', 'nth_visit', 'custom_event');--> statement-breakpoint
CREATE TYPE "public"."price_alert_status" AS ENUM('pending', 'sent', 'viewed', 'purchased', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."pricing_tier_type" AS ENUM('price_per_unit', 'total_price', 'discount_percent', 'discount_fixed');--> statement-breakpoint
CREATE TYPE "public"."product_condition" AS ENUM('new', 'refurbished', 'used_like_new', 'used_good', 'used_acceptable');--> statement-breakpoint
CREATE TYPE "public"."product_recommendation_badge" AS ENUM('top_pick', 'best_seller', 'budget_best');--> statement-breakpoint
CREATE TYPE "public"."product_source" AS ENUM('master', 'custom');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'pending_review', 'active', 'discontinued', 'archived');--> statement-breakpoint
CREATE TYPE "public"."push_suggestion_type" AS ENUM('create_new', 'match_existing');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('product_feature', 'availability', 'shipping', 'pricing', 'compatibility', 'usage', 'warranty', 'returns', 'general', 'custom');--> statement-breakpoint
CREATE TYPE "public"."rec_queue_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status_v2" AS ENUM('generated', 'shown', 'clicked', 'dismissed', 'purchased', 'expired');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'completed', 'expired', 'fraudulent');--> statement-breakpoint
CREATE TYPE "public"."refund_reason" AS ENUM('customer_request', 'product_defect', 'wrong_item', 'damaged_in_transit', 'not_as_described', 'size_issue', 'quality_issue', 'late_delivery', 'changed_mind', 'duplicate_order', 'fraud_prevention', 'out_of_stock', 'other');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'approved', 'rejected', 'completed', 'failed', 'cancelled', 'partial');--> statement-breakpoint
CREATE TYPE "public"."refund_type" AS ENUM('full', 'partial', 'restocking_fee', 'shipping_refund', 'tax_refund');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('approve_as_is', 'approve_with_edits', 'merge_with_existing', 'create_new_master', 'reject_duplicate', 'reject_low_quality', 'request_more_info');--> statement-breakpoint
CREATE TYPE "public"."reward_status" AS ENUM('no_reward', 'coin_hike', 'free_delivery');--> statement-breakpoint
CREATE TYPE "public"."route_status" AS ENUM('planned', 'active', 'completed', 'partially_completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."route_stop_type" AS ENUM('pickup', 'delivery', 'return');--> statement-breakpoint
CREATE TYPE "public"."saved_item_source" AS ENUM('cart', 'wishlist', 'direct', 'recommendation', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."search_intent" AS ENUM('product_search', 'category_browse', 'price_comparison', 'research', 'unclear');--> statement-breakpoint
CREATE TYPE "public"."search_suggestion_type" AS ENUM('product_name', 'category', 'brand', 'trending', 'popular', 'personalized');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('active', 'expired', 'revoked', 'logged_out');--> statement-breakpoint
CREATE TYPE "public"."shipping_status" AS ENUM('pending', 'label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned_to_sender', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shop_document_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."shop_document_type" AS ENUM('gst_certificate', 'fssai_license', 'trade_license', 'shop_act_license', 'drug_license', 'import_export_code', 'other');--> statement-breakpoint
CREATE TYPE "public"."shop_earnings_entry_type" AS ENUM('order_earning', 'tip_earning', 'correction_credit', 'penalty_debit', 'refund_debit', 'adjustment_debit', 'adjustment_credit');--> statement-breakpoint
CREATE TYPE "public"."shop_payout_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."shop_status" AS ENUM('draft', 'pending_review', 'under_review', 'active', 'temporarily_closed', 'suspended', 'permanently_closed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."shop_subscription_billing_status" AS ENUM('trialing', 'active', 'past_due', 'suspended', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."shop_verification_queue_status" AS ENUM('submitted', 'queued', 'assigned', 'under_review', 'approved', 'rejected', 'requires_changes', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."split_status" AS ENUM('pending', 'calculated', 'settled', 'adjusted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."static_page_target" AS ENUM('all', 'customers', 'shop_owners', 'delivery_partners');--> statement-breakpoint
CREATE TYPE "public"."stock_alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."stock_alert_type" AS ENUM('low_stock', 'out_of_stock', 'critical_stock', 'overstock', 'expiring_soon', 'reorder_point');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('in_stock', 'low_stock', 'out_of_stock', 'pre_order', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_v2" AS ENUM('trialing', 'active', 'paused', 'past_due', 'cancelled', 'expired', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."suggestion_source" AS ENUM('ml_model', 'gtin_match', 'sku_match', 'name_similarity', 'shop_owner', 'admin_curated', 'community', 'bulk_import');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'under_review', 'approved', 'rejected', 'merged', 'auto_rejected', 'requires_changes');--> statement-breakpoint
CREATE TYPE "public"."suggestion_type" AS ENUM('similar_products', 'frequently_bought_together', 'complementary', 'trending', 'personalized', 'recently_viewed', 'bestsellers', 'new_arrivals', 'price_drop', 'seasonal');--> statement-breakpoint
CREATE TYPE "public"."support_actor_type" AS ENUM('customer', 'shop_owner', 'delivery_partner', 'admin', 'system', 'bot');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_priority" AS ENUM('low', 'medium', 'high', 'urgent', 'critical');--> statement-breakpoint
CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'waiting_for_customer', 'waiting_for_shop', 'in_progress', 'escalated', 'resolved', 'closed', 'reopened');--> statement-breakpoint
CREATE TYPE "public"."system_event_category" AS ENUM('auth', 'order', 'payment', 'delivery', 'catalogue', 'notification', 'promotion', 'user_account', 'shop_account', 'kyc', 'payout', 'system', 'integration', 'scheduled_job', 'data_export', 'security');--> statement-breakpoint
CREATE TYPE "public"."system_event_level" AS ENUM('debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('cgst', 'sgst', 'igst', 'utgst', 'cess', 'exempt', 'nil_rated');--> statement-breakpoint
CREATE TYPE "public"."template_engine" AS ENUM('handlebars', 'mjml', 'liquid', 'plain');--> statement-breakpoint
CREATE TYPE "public"."trend_direction" AS ENUM('rising', 'falling', 'stable', 'new_entry', 're_entry');--> statement-breakpoint
CREATE TYPE "public"."trend_period" AS ENUM('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."usage_restriction" AS ENUM('once_per_customer', 'once_per_order', 'unlimited', 'limited_total', 'limited_per_user');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'shopkeeper', 'delivery_partner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('bicycle', 'motorcycle', 'car', 'auto_rickshaw', 'van', 'truck', 'other');--> statement-breakpoint
CREATE TYPE "public"."view_source" AS ENUM('direct', 'search', 'category', 'collection', 'home', 'recommendation', 'related', 'bundle', 'daily_pick', 'notification', 'email', 'social', 'advertisement', 'external');--> statement-breakpoint
CREATE TYPE "public"."order_wallet_transaction_type" AS ENUM('credit_topup', 'credit_refund', 'credit_cashback', 'credit_reward', 'credit_reversal', 'debit_order_payment', 'debit_withdrawal', 'debit_adjustment', 'debit_transfer_out', 'credit_transfer_in');--> statement-breakpoint
CREATE TYPE "public"."webhook_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"phone_attempted" varchar(20),
	"method" "auth_method" NOT NULL,
	"ip_address" "inet" NOT NULL,
	"ip_country" varchar(2),
	"user_agent" text,
	"success" boolean DEFAULT false NOT NULL,
	"failure_reason" "login_failure_reason",
	"session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_role" "user_role",
	"actor_ip" "inet",
	"actor_user_agent" text,
	"request_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"phone" varchar(20),
	"email" varchar(320),
	"purpose" "otp_purpose" NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"max_attempts" smallint DEFAULT 3 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"ip_address" "inet",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "otp_identity_check" CHECK (phone IS NOT NULL OR email IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"window_end" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"max_usage" integer,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referee_id" uuid NOT NULL,
	"referral_code_id" uuid,
	"code_used_at" timestamp with time zone,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"reward_status" "reward_status" DEFAULT 'no_reward' NOT NULL,
	"reward_granted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_refereeid_uq" UNIQUE("referee_id"),
	CONSTRAINT "referrals_pair_uq" UNIQUE("referrer_id","referee_id"),
	CONSTRAINT "referrals_no_self_referral" CHECK ("referrals"."referrer_id" <> "referrals"."referee_id")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_fingerprint" varchar(255) NOT NULL,
	"device_name" varchar(255),
	"device_type" varchar(50),
	"os" varchar(100),
	"browser" varchar(100),
	"first_ip" "inet",
	"last_ip" "inet",
	"last_country" varchar(2),
	"trusted" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_active_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_devices_fingerprint_uq" UNIQUE("user_id","device_fingerprint")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"shop_id" uuid,
	"assigned_by" uuid,
	"expires_at" timestamp with time zone,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(64) NOT NULL,
	"access_token_jti" uuid,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" varchar(100),
	"logged_out_at" timestamp with time zone,
	"device_info" jsonb,
	"user_agent" text,
	"ip_address" "inet" NOT NULL,
	"ip_country" varchar(2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(320),
	"email_verified" boolean DEFAULT false,
	"email_verified_at" timestamp with time zone,
	"phone" varchar(20) NOT NULL,
	"phone_verified_at" timestamp with time zone NOT NULL,
	"pin_hash" varchar(255),
	"password_changed_at" timestamp with time zone,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_secret" varchar(255),
	"status" "account_status" DEFAULT 'active' NOT NULL,
	"locked_until" timestamp with time zone,
	"failed_login_attempts" smallint DEFAULT 0 NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_login_ip" "inet",
	"deleted_at" timestamp with time zone,
	"deleted_by" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"district" varchar(100),
	"state" varchar(100) NOT NULL,
	"state_code" varchar(3),
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"country_code" char(2) DEFAULT 'IN' NOT NULL,
	"centroid_lat" double precision,
	"centroid_lng" double precision,
	"timezone" varchar(60) DEFAULT 'Asia/Kolkata' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"launched_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_centroid_lat_chk" CHECK (centroid_lat IS NULL OR (centroid_lat BETWEEN -90 AND 90)),
	CONSTRAINT "cities_centroid_lng_chk" CHECK (centroid_lng IS NULL OR (centroid_lng BETWEEN -180 AND 180))
);
--> statement-breakpoint
CREATE TABLE "serviceable_pincodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"city_id" uuid NOT NULL,
	"locality_name" varchar(150),
	"boundary" geography(Polygon, 4326),
	"is_active" boolean DEFAULT true NOT NULL,
	"delivery_lead_time_mins" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" "address_label" DEFAULT 'home' NOT NULL,
	"custom_label" varchar(50),
	"line1" varchar(255) NOT NULL,
	"line2" varchar(255),
	"landmark" varchar(150),
	"city_id" uuid NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"state" varchar(100) NOT NULL,
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"location" geography(Point, 4326),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_serviceable" boolean,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "addresses_custom_label_chk" CHECK (label <> 'other' OR custom_label IS NOT NULL),
	CONSTRAINT "addresses_pincode_nonempty_chk" CHECK (length(trim(pincode)) > 0)
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_holder_name" varchar(255) NOT NULL,
	"account_number_encrypted" varchar(512) NOT NULL,
	"account_number_last4" char(4) NOT NULL,
	"ifsc_code" varchar(11) NOT NULL,
	"bank_name" varchar(150) NOT NULL,
	"branch_name" varchar(150),
	"account_type" "bank_account_type" DEFAULT 'savings' NOT NULL,
	"upi_id" varchar(100),
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"penny_drop_ref" varchar(100),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_accounts_ifsc_format_chk" CHECK (ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
	CONSTRAINT "bank_accounts_last4_chk" CHECK (account_number_last4 ~ '^[0-9]{4}$'),
	CONSTRAINT "bank_accounts_verified_at_chk" CHECK ((is_verified = false AND verified_at IS NULL) OR (is_verified = true AND verified_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"referral_code_id" uuid,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spend" bigint DEFAULT 0 NOT NULL,
	"last_order_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "customer_profiles_loyalty_chk" CHECK (loyalty_points >= 0),
	CONSTRAINT "customer_profiles_orders_chk" CHECK (total_orders >= 0 AND total_spend >= 0),
	CONSTRAINT "customer_profiles_last_order_at_chk" CHECK ((total_orders = 0 AND last_order_at IS NULL) OR (total_orders > 0 AND last_order_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "delivery_partner_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'not_submitted' NOT NULL,
	"kyc_verified_at" timestamp with time zone,
	"vehicle_type" "vehicle_type" DEFAULT 'motorcycle' NOT NULL,
	"vehicle_number" varchar(20),
	"vehicle_number_verified" boolean DEFAULT false NOT NULL,
	"license_number" varchar(20) NOT NULL,
	"license_expires_at" timestamp with time zone,
	"license_verified" boolean DEFAULT false NOT NULL,
	"profile_photo_key" varchar(500),
	"primary_bank_account_id" uuid,
	"city_id" uuid,
	"rating_sum" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"total_deliveries" integer DEFAULT 0 NOT NULL,
	"total_earnings" bigint DEFAULT 0 NOT NULL,
	"last_active_at" timestamp with time zone,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspension_reason" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_partner_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "dp_profiles_rating_chk" CHECK (rating_count >= 0 AND rating_sum >= 0),
	CONSTRAINT "dp_profiles_stats_chk" CHECK (total_deliveries >= 0 AND total_earnings >= 0),
	CONSTRAINT "dp_profiles_suspension_chk" CHECK (is_suspended = false OR suspension_reason IS NOT NULL),
	CONSTRAINT "dp_profiles_suspended_at_chk" CHECK (is_suspended = false OR suspended_at IS NOT NULL),
	CONSTRAINT "dp_profiles_kyc_verified_at_chk" CHECK (kyc_status <> 'verified' OR kyc_verified_at IS NOT NULL),
	CONSTRAINT "dp_profiles_rating_consistency_chk" CHECK (rating_count > 0 OR rating_sum = 0)
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"document_type" "kyc_document_type" NOT NULL,
	"document_number_encrypted" varchar(512),
	"document_number_last4" char(4),
	"front_image_key" varchar(500),
	"back_image_key" varchar(500),
	"selfie_image_key" varchar(500),
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" varchar(500),
	"expires_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verification_provider" varchar(100),
	"verification_ref" varchar(255),
	"verification_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kyc_documents_rejection_reason_chk" CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL),
	CONSTRAINT "kyc_documents_reviewed_at_chk" CHECK (status NOT IN ('verified', 'rejected') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
	CONSTRAINT "kyc_documents_verified_at_chk" CHECK (status <> 'verified' OR verified_at IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "shop_owner_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" varchar(255),
	"business_type" varchar(100),
	"trade_name" varchar(255),
	"kyc_status" "kyc_status" DEFAULT 'not_submitted' NOT NULL,
	"kyc_verified_at" timestamp with time zone,
	"primary_bank_account_id" uuid,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspension_reason" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_owner_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "shop_owner_profiles_suspension_chk" CHECK (is_suspended = false OR suspension_reason IS NOT NULL),
	CONSTRAINT "shop_owner_profiles_suspended_at_chk" CHECK (is_suspended = false OR suspended_at IS NOT NULL),
	CONSTRAINT "shop_owner_profiles_kyc_verified_at_chk" CHECK (kyc_status <> 'verified' OR kyc_verified_at IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"image_key" varchar(500),
	"level" smallint DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_level_chk" CHECK (level >= 1 AND level <= 3),
	CONSTRAINT "categories_parent_level_chk" CHECK ((level = 1 AND parent_id IS NULL) OR (level > 1 AND parent_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "pre_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"icon_key" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recommendation_type" varchar(50) NOT NULL,
	"shop_id" uuid,
	"user_id" uuid,
	"input_context" jsonb,
	"recommended_items" jsonb,
	"model_version" varchar(50),
	"confidence_score" numeric(5, 4),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_recommendations_confidence_chk" CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);
--> statement-breakpoint
CREATE TABLE "shop_branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(20),
	"address_id" uuid,
	"location" geography(Point, 4326),
	"is_open" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"holiday_name" varchar(255),
	"message" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_holidays_date_range_chk" CHECK (end_date >= start_date)
);
--> statement-breakpoint
CREATE TABLE "shop_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"open_time" time NOT NULL,
	"close_time" time NOT NULL,
	"is_overnight" boolean DEFAULT false NOT NULL,
	"break_start_time" time,
	"break_end_time" time,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_hours_day_range_chk" CHECK (day_of_week >= 0 AND day_of_week <= 6),
	CONSTRAINT "shop_hours_time_logic_chk" CHECK (is_closed = true
          OR (is_overnight = false AND open_time < close_time)
          OR (is_overnight = true  AND open_time > close_time)),
	CONSTRAINT "shop_hours_break_pair_chk" CHECK ((break_start_time IS NULL AND break_end_time IS NULL)
          OR (break_start_time IS NOT NULL AND break_end_time IS NOT NULL
              AND break_start_time < break_end_time))
);
--> statement-breakpoint
CREATE TABLE "shop_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" smallint NOT NULL,
	"comment" varchar(1000),
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" varchar(255),
	"hidden_by" uuid,
	"ip_address" "inet",
	"device_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_reviews_rating_chk" CHECK (rating >= 1 AND rating <= 5),
	CONSTRAINT "shop_reviews_hidden_reason_chk" CHECK (is_hidden = false OR hidden_reason IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "shop_stats" (
	"shop_id" uuid PRIMARY KEY NOT NULL,
	"rating_sum" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"total_revenue" bigint DEFAULT 0 NOT NULL,
	"avg_preparation_time_mins" double precision,
	"cancellation_rate" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_stats_rating_chk" CHECK (rating_count >= 0 AND rating_sum >= 0),
	CONSTRAINT "shop_stats_revenue_chk" CHECK (total_revenue >= 0),
	CONSTRAINT "shop_stats_cancellation_chk" CHECK (cancellation_rate >= 0 AND cancellation_rate <= 1)
);
--> statement-breakpoint
CREATE TABLE "shop_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" varchar(255),
	"icon_key" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"document_type" "shop_document_type" NOT NULL,
	"document_number" varchar(100),
	"document_key" varchar(500) NOT NULL,
	"status" "shop_document_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"expires_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_verifications_rejection_reason_chk" CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"shop_type_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"username" varchar(100) NOT NULL,
	"tag_line" varchar(200),
	"description" varchar(1000),
	"logo_key" varchar(500),
	"banner_key" varchar(500),
	"phone" varchar(20),
	"email" varchar(320),
	"primary_address_id" uuid,
	"location" geography(Point, 4326),
	"city_id" uuid,
	"status" "shop_status" DEFAULT 'draft' NOT NULL,
	"is_open" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"subscription_plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'active' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"internal_notes" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shops_published_requires_active_chk" CHECK (is_published = false OR status = 'active'),
	CONSTRAINT "shops_open_requires_published_chk" CHECK (is_open = false OR is_published = true)
);
--> statement-breakpoint
CREATE TABLE "announcement_dismissals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "back_in_stock_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_id" uuid,
	"user_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"stock_quantity" integer NOT NULL,
	"restocked_at" timestamp with time zone NOT NULL,
	"price_at_restock" integer NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"purchased_at" timestamp with time zone,
	"order_id" uuid,
	"expires_at" timestamp with time zone,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_name" varchar(150) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"logo_key" varchar(500),
	"logo_thumbnail_key" varchar(500),
	"cover_image_key" varchar(500),
	"parent_brand_id" uuid,
	"brand_level" smallint DEFAULT 0 NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"product_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_no_self_parent_chk" CHECK ("brands"."parent_brand_id" IS NULL OR "brands"."id" <> "brands"."parent_brand_id")
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	"individual_price" integer,
	"display_order" integer DEFAULT 0 NOT NULL,
	"display_label" varchar(200),
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bundle_items_qty_chk" CHECK ("bundle_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "catalog_ai_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"recommendation_type" "catalogue_recommendation_type" NOT NULL,
	"display_location" "display_location" NOT NULL,
	"input_context" jsonb,
	"recommended_items" jsonb NOT NULL,
	"model_version" varchar(50),
	"model_type" varchar(50),
	"algorithm" varchar(100),
	"overall_confidence" numeric(5, 2),
	"status" "recommendation_status_v2" DEFAULT 'generated' NOT NULL,
	"was_shown" boolean DEFAULT false NOT NULL,
	"shown_at" timestamp with time zone,
	"impression_count" integer DEFAULT 0 NOT NULL,
	"clicked_items" jsonb,
	"clicked_at" timestamp with time zone,
	"purchased_items" jsonb,
	"purchased_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"attributed_revenue" integer DEFAULT 0,
	"attributed_orders" integer DEFAULT 0,
	"experiment_id" varchar(50),
	"variant_id" varchar(50),
	"control_group" boolean DEFAULT false,
	"expires_at" timestamp with time zone,
	"is_expired" boolean DEFAULT false NOT NULL,
	"user_feedback" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coins_daily_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid,
	"checkin_date" date NOT NULL,
	"coins_earned" integer NOT NULL,
	"streak_count" integer DEFAULT 1 NOT NULL,
	"streak_bonus_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coins_expiration_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"coins_amount" integer NOT NULL,
	"remaining_amount" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_expired" boolean DEFAULT false NOT NULL,
	"expired_at" timestamp with time zone,
	"warning_notification_sent" boolean DEFAULT false NOT NULL,
	"warning_notification_sent_at" timestamp with time zone,
	"expiry_notification_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coins_redemption_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"reward_name" varchar(255) NOT NULL,
	"description" text,
	"redemption_type" "coin_redemption_type" NOT NULL,
	"coins_cost" integer NOT NULL,
	"discount_value" integer,
	"discount_type" varchar(20),
	"image_key" varchar(500),
	"stock_quantity" integer,
	"is_physical_reward" boolean DEFAULT false NOT NULL,
	"min_tier_required" "customer_tier",
	"max_redemptions_per_customer" integer,
	"max_redemptions_total" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coins_redemption_catalog_cost_chk" CHECK ("coins_redemption_catalog"."coins_cost" > 0),
	CONSTRAINT "coins_redemption_catalog_stock_chk" CHECK ("coins_redemption_catalog"."stock_quantity" IS NULL OR "coins_redemption_catalog"."stock_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coins_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"catalog_item_id" uuid,
	"transaction_id" uuid NOT NULL,
	"redemption_type" "coin_redemption_type" NOT NULL,
	"coins_spent" integer NOT NULL,
	"reward_name" varchar(255) NOT NULL,
	"reward_value" integer,
	"order_id" uuid,
	"discount_applied" integer,
	"requires_shipping" boolean DEFAULT false NOT NULL,
	"shipping_address" jsonb,
	"tracking_number" varchar(100),
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"voucher_code" varchar(50),
	"voucher_expires_at" timestamp with time zone,
	"voucher_used" boolean DEFAULT false NOT NULL,
	"voucher_used_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coins_referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"referrer_id" uuid NOT NULL,
	"referrer_transaction_id" uuid,
	"referee_id" uuid,
	"referee_email" varchar(255),
	"referee_transaction_id" uuid,
	"referral_code" varchar(50) NOT NULL,
	"referrer_reward" integer,
	"referee_reward" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requires_purchase" boolean DEFAULT true NOT NULL,
	"min_purchase_amount" integer,
	"qualifying_order_id" uuid,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signed_up_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coins_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_type" "coin_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"source" "coin_earning_source",
	"redemption_type" "coin_redemption_type",
	"order_id" uuid,
	"referral_id" uuid,
	"expires_at" timestamp with time zone,
	"is_expired" boolean DEFAULT false NOT NULL,
	"expired_at" timestamp with time zone,
	"status" "coin_transaction_status" DEFAULT 'completed' NOT NULL,
	"description" text,
	"internal_note" text,
	"metadata" jsonb,
	"processed_by" uuid,
	"reversed_by" uuid,
	"reversed_at" timestamp with time zone,
	"reversal_reason" text,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coins_transactions_balance_after_chk" CHECK ("coins_transactions"."balance_after" >= 0)
);
--> statement-breakpoint
CREATE TABLE "coupon_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_code_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"batch_name" varchar(255) NOT NULL,
	"prefix" varchar(20),
	"suffix" varchar(20),
	"total_codes" integer NOT NULL,
	"codes_generated" integer DEFAULT 0 NOT NULL,
	"code_length" integer DEFAULT 8 NOT NULL,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"per_code_usage_limit" integer DEFAULT 1,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"purpose" text,
	"created_by" uuid,
	"generation_started_at" timestamp with time zone,
	"generation_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_code_instances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"first_used_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"discount_amount" integer NOT NULL,
	"order_total" integer NOT NULL,
	"order_total_after_discount" integer NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_type" varchar(20),
	"country" varchar(2),
	"is_successful" boolean DEFAULT true NOT NULL,
	"failure_reason" text,
	"was_refunded" boolean DEFAULT false NOT NULL,
	"refunded_at" timestamp with time zone,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_validation_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_code" varchar(50) NOT NULL,
	"coupon_id" uuid,
	"user_id" uuid,
	"session_id" varchar(255),
	"ip_address" varchar(45),
	"is_valid" boolean NOT NULL,
	"validation_result" varchar(50) NOT NULL,
	"error_message" text,
	"order_total" integer,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_coins_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_redeemed" integer DEFAULT 0 NOT NULL,
	"total_expired" integer DEFAULT 0 NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"pending_balance" integer DEFAULT 0 NOT NULL,
	"current_tier" "customer_tier",
	"tier_progress" integer DEFAULT 0,
	"lifetime_spend" bigint DEFAULT 0 NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"last_earned_at" timestamp with time zone,
	"last_redeemed_at" timestamp with time zone,
	"daily_checkin_streak" integer DEFAULT 0 NOT NULL,
	"last_checkin_date" date,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"frozen_reason" text,
	"frozen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_coins_balance_chk" CHECK ("customer_coins_balance"."current_balance" >= 0 AND "customer_coins_balance"."pending_balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customer_tier_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"previous_tier" "customer_tier",
	"new_tier" "customer_tier" NOT NULL,
	"reason" text,
	"achieved_by" varchar(50),
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_pick_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_pick_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"custom_title" varchar(200),
	"product_note" text,
	"highlight_text" varchar(100),
	"special_price" integer,
	"special_price_label" varchar(100),
	"badge_text" varchar(50),
	"badge_color" varchar(20),
	"max_quantity_for_pick" integer,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"add_to_cart_count" integer DEFAULT 0 NOT NULL,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"revenue_generated" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_pick_products_special_price_chk" CHECK ("daily_pick_products"."special_price" IS NULL OR "daily_pick_products"."special_price" > 0),
	CONSTRAINT "daily_pick_products_max_qty_chk" CHECK ("daily_pick_products"."max_quantity_for_pick" IS NULL OR "daily_pick_products"."max_quantity_for_pick" > 0),
	CONSTRAINT "daily_pick_products_qty_sold_chk" CHECK (
        "daily_pick_products"."max_quantity_for_pick" IS NULL OR
        "daily_pick_products"."quantity_sold" <= "daily_pick_products"."max_quantity_for_pick"
      )
);
--> statement-breakpoint
CREATE TABLE "daily_picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"pick_date" date DEFAULT CURRENT_DATE NOT NULL,
	"title" varchar(200),
	"description" text,
	"daily_message" text,
	"banner_image_key" varchar(500),
	"display_style" varchar(50) DEFAULT 'carousel',
	"max_products" integer DEFAULT 10,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"schedule_start_time" time,
	"schedule_end_time" time,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_purchases" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duplicate_master_product_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_product_1_id" uuid NOT NULL,
	"master_product_2_id" uuid NOT NULL,
	"detection_method" "detection_method" NOT NULL,
	"similarity_score" integer NOT NULL,
	"similarities" jsonb,
	"reported_by" uuid,
	"report_reason" text,
	"status" "duplicate_report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"merged_into_id" uuid,
	"merged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "duplicate_reports_different_products_chk" CHECK ("duplicate_master_product_reports"."master_product_1_id" <> "duplicate_master_product_reports"."master_product_2_id")
);
--> statement-breakpoint
CREATE TABLE "filter_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"filter_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"group_name" varchar(100) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_collapsable" boolean DEFAULT true NOT NULL,
	"is_collapsed_by_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "filter_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"category_id" uuid,
	"preset_name" varchar(100) NOT NULL,
	"description" text,
	"filter_config" jsonb NOT NULL,
	"icon" varchar(100),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_product_id" uuid NOT NULL,
	"variant_id" uuid,
	"image_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"alt_text" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"width_px" integer,
	"height_px" integer,
	"file_size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_product_matching_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"status" "matching_status" DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 0,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"matches_found" integer DEFAULT 0 NOT NULL,
	"best_match_id" uuid,
	"best_match_score" integer,
	"suggestion_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"next_retry_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "master_product_push_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"suggestion_type" "push_suggestion_type" NOT NULL,
	"suggested_master_product_id" uuid,
	"alternative_matches" jsonb,
	"match_type" "match_type" NOT NULL,
	"match_score" smallint NOT NULL,
	"confidence_score" numeric(5, 2),
	"match_signals" jsonb,
	"match_reason" text,
	"suggestion_source" "suggestion_source" NOT NULL,
	"submitted_by" uuid,
	"proposed_data" jsonb,
	"data_quality_score" integer,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_action" "review_action",
	"review_notes" text,
	"created_master_product_id" uuid,
	"merged_into_master_product_id" uuid,
	"auto_approval_eligible" boolean DEFAULT false,
	"auto_approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "push_suggestions_match_score_chk" CHECK ("master_product_push_suggestions"."match_score" >= 0 AND "master_product_push_suggestions"."match_score" <= 100),
	CONSTRAINT "push_suggestions_type_chk" CHECK (
        ("master_product_push_suggestions"."suggestion_type" = 'create_new'      AND "master_product_push_suggestions"."suggested_master_product_id" IS NULL) OR
        ("master_product_push_suggestions"."suggestion_type" = 'match_existing'  AND "master_product_push_suggestions"."suggested_master_product_id" IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "master_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"global_sku" varchar(100),
	"gtin" varchar(14),
	"slug" varchar(255) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"leaf_category_id" uuid NOT NULL,
	"brand_id" uuid,
	"base_price" integer,
	"msrp" integer,
	"weight_grams" numeric(10, 2),
	"length_cm" numeric(10, 2),
	"width_cm" numeric(10, 2),
	"height_cm" numeric(10, 2),
	"product_condition" "product_condition" DEFAULT 'new' NOT NULL,
	"manufacturer" varchar(200),
	"country_of_origin" varchar(100),
	"attributes" jsonb,
	"specifications" jsonb,
	"tags" jsonb,
	"keywords" jsonb,
	"search_vector" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"total_shops_using" integer DEFAULT 0 NOT NULL,
	"rating_sum" double precision DEFAULT 0 NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"uploader_admin_id" uuid,
	"last_updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "master_products_prices_chk" CHECK (
        ("master_products"."base_price" IS NULL OR "master_products"."base_price" >= 0) AND
        ("master_products"."msrp" IS NULL OR "master_products"."msrp" >= 0)
      ),
	CONSTRAINT "master_products_dimensions_chk" CHECK (
        ("master_products"."weight_grams" IS NULL OR "master_products"."weight_grams" >= 0) AND
        ("master_products"."length_cm"    IS NULL OR "master_products"."length_cm"    >= 0) AND
        ("master_products"."width_cm"     IS NULL OR "master_products"."width_cm"     >= 0) AND
        ("master_products"."height_cm"    IS NULL OR "master_products"."height_cm"    >= 0)
      ),
	CONSTRAINT "master_products_rating_chk" CHECK ("master_products"."rating_count" >= 0 AND "master_products"."rating_sum" >= 0)
);
--> statement-breakpoint
CREATE TABLE "master_product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_product_id" uuid NOT NULL,
	"variant_sku" varchar(100) NOT NULL,
	"variant_gtin" varchar(14),
	"variant_name" varchar(150) NOT NULL,
	"attributes" jsonb,
	"base_price" integer,
	"msrp" integer,
	"weight_grams" numeric(10, 2),
	"length_cm" numeric(10, 2),
	"width_cm" numeric(10, 2),
	"height_cm" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "master_variants_prices_chk" CHECK (
        ("master_product_variants"."base_price" IS NULL OR "master_product_variants"."base_price" >= 0) AND
        ("master_product_variants"."msrp"      IS NULL OR "master_product_variants"."msrp"      >= 0)
      ),
	CONSTRAINT "master_variants_dimensions_chk" CHECK (
        ("master_product_variants"."weight_grams" IS NULL OR "master_product_variants"."weight_grams" >= 0) AND
        ("master_product_variants"."length_cm"    IS NULL OR "master_product_variants"."length_cm"    >= 0) AND
        ("master_product_variants"."width_cm"     IS NULL OR "master_product_variants"."width_cm"     >= 0) AND
        ("master_product_variants"."height_cm"    IS NULL OR "master_product_variants"."height_cm"    >= 0)
      )
);
--> statement-breakpoint
CREATE TABLE "price_drop_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"saved_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"old_price" integer NOT NULL,
	"new_price" integer NOT NULL,
	"drop_amount" integer NOT NULL,
	"drop_percentage" numeric(5, 2) NOT NULL,
	"is_in_stock" boolean NOT NULL,
	"stock_quantity" integer,
	"status" "price_alert_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"viewed_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"purchased_at" timestamp with time zone,
	"order_id" uuid,
	"expires_at" timestamp with time zone,
	"is_expired" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_drop_alerts_price_chk" CHECK ("price_drop_alerts"."new_price" < "price_drop_alerts"."old_price"),
	CONSTRAINT "price_drop_alerts_amount_chk" CHECK ("price_drop_alerts"."drop_amount" = "price_drop_alerts"."old_price" - "price_drop_alerts"."new_price")
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"bundle_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"bundle_type" "bundle_type" DEFAULT 'flexible' NOT NULL,
	"min_items_required" integer,
	"max_items_allowed" integer,
	"pricing_type" "bundle_pricing_type" NOT NULL,
	"fixed_price" integer,
	"discount_percentage" integer,
	"discount_amount" integer,
	"buy_quantity" integer,
	"get_quantity" integer,
	"original_price" integer,
	"final_price" integer,
	"savings_amount" integer,
	"bundle_image_key" varchar(500),
	"thumbnail_key" varchar(500),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"track_inventory" boolean DEFAULT false NOT NULL,
	"stock_quantity" integer DEFAULT 0,
	"meta_title" varchar(255),
	"meta_description" text,
	"view_count" integer DEFAULT 0 NOT NULL,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_bundles_pricing_chk" CHECK (
        ("product_bundles"."pricing_type" = 'fixed_price'    AND "product_bundles"."fixed_price"          > 0) OR
        ("product_bundles"."pricing_type" = 'percentage_off' AND "product_bundles"."discount_percentage"  BETWEEN 1 AND 100) OR
        ("product_bundles"."pricing_type" = 'fixed_discount' AND "product_bundles"."discount_amount"      > 0) OR
        ("product_bundles"."pricing_type" = 'buy_x_get_y'   AND "product_bundles"."buy_quantity"         > 0
                                               AND "product_bundles"."get_quantity"         > 0)
      ),
	CONSTRAINT "product_bundles_flexible_limits_chk" CHECK (
        "product_bundles"."bundle_type" = 'fixed' OR (
          ("product_bundles"."min_items_required" IS NULL OR "product_bundles"."min_items_required" >= 1) AND
          ("product_bundles"."max_items_allowed"  IS NULL OR "product_bundles"."max_items_allowed"  >= "product_bundles"."min_items_required")
        )
      ),
	CONSTRAINT "product_bundles_validity_period_chk" CHECK (
        "product_bundles"."valid_until" IS NULL OR
        "product_bundles"."valid_from"  IS NULL OR
        "product_bundles"."valid_until" >= "product_bundles"."valid_from"
      )
);
--> statement-breakpoint
CREATE TABLE "product_comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"product_ids" jsonb NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"comparison_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"comparison_ended_at" timestamp with time zone,
	"comparison_duration_seconds" integer,
	"selected_product_id" uuid,
	"outcome" "comparison_outcome" DEFAULT 'unclear' NOT NULL,
	"compared_attributes" jsonb,
	"was_purchase_made" boolean DEFAULT false NOT NULL,
	"purchase_id" uuid,
	"purchase_amount" integer,
	"time_to_purchase_seconds" integer,
	"category_id" uuid,
	"came_from" "view_source",
	"device_type" "device_type",
	"user_agent" text,
	"ip_address" varchar(45),
	"country" varchar(2),
	"city" varchar(100),
	"was_saved" boolean DEFAULT false NOT NULL,
	"was_shared" boolean DEFAULT false NOT NULL,
	"shared_via" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_comparisons_min_products_chk" CHECK (jsonb_array_length("product_comparisons"."product_ids") >= 2),
	CONSTRAINT "product_comparisons_duration_chk" CHECK ("product_comparisons"."comparison_duration_seconds" IS NULL OR "product_comparisons"."comparison_duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "product_filter_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"filter_id" uuid NOT NULL,
	"text_value" varchar(255),
	"numeric_value" numeric(10, 2),
	"boolean_value" boolean,
	"array_value" jsonb,
	"custom_label" varchar(200),
	"sort_order" integer DEFAULT 0,
	"is_verified" boolean DEFAULT true NOT NULL,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_filter_values_has_value_chk" CHECK (
        "product_filter_values"."text_value"    IS NOT NULL OR
        "product_filter_values"."numeric_value" IS NOT NULL OR
        "product_filter_values"."boolean_value" IS NOT NULL OR
        "product_filter_values"."array_value"   IS NOT NULL
      )
);
--> statement-breakpoint
CREATE TABLE "product_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid,
	"filter_scope" "filter_scope" DEFAULT 'category' NOT NULL,
	"category_id" uuid,
	"filter_key" varchar(100) NOT NULL,
	"filter_name" varchar(100) NOT NULL,
	"filter_type" "filter_type" NOT NULL,
	"display_style" "filter_display_style",
	"description" text,
	"help_text" varchar(255),
	"filter_options" jsonb,
	"min_value" numeric(10, 2),
	"max_value" numeric(10, 2),
	"step_value" numeric(10, 2),
	"unit" varchar(20),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_collapsible" boolean DEFAULT true NOT NULL,
	"is_collapsed_by_default" boolean DEFAULT false NOT NULL,
	"show_product_count" boolean DEFAULT true NOT NULL,
	"is_searchable" boolean DEFAULT false NOT NULL,
	"search_placeholder" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_required" boolean DEFAULT false NOT NULL,
	"allow_custom_values" boolean DEFAULT false NOT NULL,
	"depends_on_filter_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_filters_range_chk" CHECK (
        "product_filters"."filter_type" <> 'range' OR (
          "product_filters"."min_value" IS NOT NULL AND
          "product_filters"."max_value" IS NOT NULL AND
          "product_filters"."max_value" > "product_filters"."min_value"
        )
      ),
	CONSTRAINT "product_filters_options_chk" CHECK (
        "product_filters"."filter_type" NOT IN ('single_select', 'multi_select', 'color', 'size') OR
        "product_filters"."filter_options" IS NOT NULL
      ),
	CONSTRAINT "product_filters_scope_anchor_chk" CHECK (
        ("product_filters"."filter_scope" = 'global'   AND "product_filters"."category_id" IS NULL AND "product_filters"."shop_id" IS NULL) OR
        ("product_filters"."filter_scope" = 'category' AND "product_filters"."category_id" IS NOT NULL) OR
        ("product_filters"."filter_scope" = 'shop'     AND "product_filters"."shop_id"     IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "product_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"interaction_value" jsonb,
	"page_url" text,
	"device_type" "device_type",
	"interacted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"source_product_id" uuid NOT NULL,
	"linked_product_id" uuid NOT NULL,
	"link_type" "link_type" DEFAULT 'frequently_bought_together' NOT NULL,
	"link_source" "link_source" DEFAULT 'manual' NOT NULL,
	"link_strength" numeric(5, 2) DEFAULT '0.00',
	"confidence" numeric(5, 2) DEFAULT '0.00',
	"co_purchase_count" integer DEFAULT 0 NOT NULL,
	"co_view_count" integer DEFAULT 0 NOT NULL,
	"co_cart_count" integer DEFAULT 0 NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"custom_label" varchar(200),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"impression_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"add_to_cart_count" integer DEFAULT 0 NOT NULL,
	"purchase_count" integer DEFAULT 0 NOT NULL,
	"revenue_generated" integer DEFAULT 0,
	"last_refreshed_at" timestamp with time zone,
	"next_refresh_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_links_no_self_link_chk" CHECK ("product_links"."source_product_id" <> "product_links"."linked_product_id"),
	CONSTRAINT "product_links_strength_range_chk" CHECK ("product_links"."link_strength" BETWEEN 0 AND 100),
	CONSTRAINT "product_links_confidence_range_chk" CHECK ("product_links"."confidence" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "product_popularity_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"trending_score" numeric(5, 2),
	"velocity_score" numeric(5, 2),
	"engagement_score" numeric(5, 2),
	"views_24h" integer DEFAULT 0,
	"purchases_24h" integer DEFAULT 0,
	"cart_adds_24h" integer DEFAULT 0,
	"views_7d" integer DEFAULT 0,
	"purchases_7d" integer DEFAULT 0,
	"view_velocity" numeric(10, 2),
	"purchase_velocity" numeric(10, 2),
	"shop_rank" integer,
	"category_rank" integer,
	"is_trending" boolean DEFAULT false NOT NULL,
	"trend_direction" "trend_direction",
	"last_calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_calculation_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"price" integer NOT NULL,
	"compare_at_price" integer,
	"previous_price" integer,
	"price_change" integer,
	"change_percentage" numeric(5, 2),
	"change_type" varchar(20),
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"change_reason" varchar(100),
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" DEFAULT 'general' NOT NULL,
	"asked_by_user_id" uuid,
	"asked_by_name" varchar(100),
	"asked_by_email" varchar(255),
	"is_verified_buyer" boolean DEFAULT false NOT NULL,
	"answer_text" text,
	"answered_by" "answered_by",
	"answered_by_user_id" uuid,
	"is_answered" boolean DEFAULT false NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_frequently_asked" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT true NOT NULL,
	"moderated_by" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"asker_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"answered_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_view_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"aggregation_date" date NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_views" integer DEFAULT 0 NOT NULL,
	"avg_view_duration_seconds" numeric(10, 2),
	"avg_scroll_depth" numeric(5, 2),
	"views_to_cart_count" integer DEFAULT 0 NOT NULL,
	"views_to_wishlist_count" integer DEFAULT 0 NOT NULL,
	"views_to_purchase_count" integer DEFAULT 0 NOT NULL,
	"cart_conversion_rate" numeric(5, 2),
	"purchase_conversion_rate" numeric(5, 2),
	"bounce_count" integer DEFAULT 0 NOT NULL,
	"bounce_rate" numeric(5, 2),
	"total_revenue" integer DEFAULT 0,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"user_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"view_date" date DEFAULT CURRENT_DATE NOT NULL,
	"view_duration_seconds" integer,
	"scroll_depth_pct" integer,
	"images_viewed" integer DEFAULT 0,
	"video_watched" boolean DEFAULT false,
	"video_watch_duration_seconds" integer,
	"added_to_cart" boolean DEFAULT false NOT NULL,
	"added_to_wishlist" boolean DEFAULT false NOT NULL,
	"shared" boolean DEFAULT false NOT NULL,
	"compared_with_others" boolean DEFAULT false NOT NULL,
	"came_from" "view_source",
	"referrer_url" text,
	"exited_to" varchar(100),
	"bounced" boolean DEFAULT false NOT NULL,
	"device_type" "device_type",
	"browser" varchar(100),
	"os" varchar(100),
	"user_agent" text,
	"ip_address" varchar(45),
	"country" varchar(2),
	"region" varchar(100),
	"city" varchar(100),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"utm_content" varchar(100),
	"utm_term" varchar(100),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "question_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_helpful" boolean NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"source_product_id" uuid NOT NULL,
	"recommended_product_id" uuid NOT NULL,
	"link_type" "link_type" NOT NULL,
	"confidence_score" numeric(5, 2) NOT NULL,
	"reason" text,
	"supporting_data" jsonb,
	"status" "rec_queue_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_link_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "saved_for_later" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"source" "saved_item_source" DEFAULT 'direct',
	"collection_name" varchar(100),
	"notes" text,
	"priority" integer DEFAULT 0,
	"saved_price" integer NOT NULL,
	"current_price" integer,
	"lowest_price_ever" integer,
	"lowest_price_date" timestamp with time zone,
	"notify_on_price_drop" boolean DEFAULT false NOT NULL,
	"notify_on_back_in_stock" boolean DEFAULT false NOT NULL,
	"notify_on_sale" boolean DEFAULT false NOT NULL,
	"target_price" integer,
	"price_drop_percentage" integer,
	"desired_quantity" integer DEFAULT 1 NOT NULL,
	"was_available_when_saved" boolean NOT NULL,
	"is_currently_available" boolean,
	"last_availability_check" timestamp with time zone,
	"times_viewed" integer DEFAULT 0 NOT NULL,
	"last_viewed_at" timestamp with time zone,
	"reminder_date" timestamp with time zone,
	"reminder_sent" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"was_purchased" boolean DEFAULT false NOT NULL,
	"purchased_at" timestamp with time zone,
	"order_id" uuid,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_for_later_qty_chk" CHECK ("saved_for_later"."desired_quantity" > 0),
	CONSTRAINT "saved_for_later_price_drop_pct_chk" CHECK (
        "saved_for_later"."price_drop_percentage" IS NULL OR (
          "saved_for_later"."price_drop_percentage" > 0 AND "saved_for_later"."price_drop_percentage" <= 100
        )
      )
);
--> statement-breakpoint
CREATE TABLE "saved_item_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"collection_name" varchar(100) NOT NULL,
	"description" text,
	"cover_image_key" varchar(500),
	"is_public" boolean DEFAULT false NOT NULL,
	"share_slug" varchar(100),
	"display_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(20),
	"icon" varchar(50),
	"item_count" integer DEFAULT 0 NOT NULL,
	"total_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"search_term" varchar(500) NOT NULL,
	"normalized_term" varchar(500),
	"search_intent" "search_intent" DEFAULT 'unclear',
	"query_length" integer,
	"has_typos" boolean DEFAULT false,
	"corrected_query" varchar(500),
	"filters_applied" jsonb,
	"sort_order" varchar(50),
	"price_range" jsonb,
	"results_count" integer DEFAULT 0 NOT NULL,
	"has_results" boolean NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"clicked_product_ids" jsonb,
	"added_to_cart_product_ids" jsonb,
	"resulted_in_add_to_cart" boolean DEFAULT false NOT NULL,
	"resulted_in_purchase" boolean DEFAULT false NOT NULL,
	"device_type" "device_type",
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_date" date DEFAULT CURRENT_DATE NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"suggestion_text" varchar(255) NOT NULL,
	"suggestion_type" "search_suggestion_type" NOT NULL,
	"popularity_score" integer DEFAULT 0 NOT NULL,
	"trending_score" numeric(5, 2),
	"display_order" integer DEFAULT 0 NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"click_through_rate" numeric(5, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "shop_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"announcement_type" "catalogue_announcement_type" DEFAULT 'general' NOT NULL,
	"cta_text" varchar(100),
	"cta_url" varchar(500),
	"image_key" varchar(500),
	"display_location" "display_location" DEFAULT 'shop_header' NOT NULL,
	"display_style" varchar(50) DEFAULT 'banner',
	"priority" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"is_dismissible" boolean DEFAULT true NOT NULL,
	"show_once_per_session" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"dismiss_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "shop_announcements_date_range_chk" CHECK ("shop_announcements"."end_date" IS NULL OR "shop_announcements"."end_date" >= "shop_announcements"."start_date")
);
--> statement-breakpoint
CREATE TABLE "shop_coins_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"coin_name" varchar(50) DEFAULT 'Coins' NOT NULL,
	"coin_name_plural" varchar(50) DEFAULT 'Coins' NOT NULL,
	"coin_symbol" varchar(10) DEFAULT '🪙',
	"earning_rate" integer DEFAULT 1 NOT NULL,
	"earning_rate_unit" integer DEFAULT 100 NOT NULL,
	"min_purchase_for_earning" integer DEFAULT 0 NOT NULL,
	"redemption_rate" integer DEFAULT 100 NOT NULL,
	"min_coins_for_redemption" integer DEFAULT 100 NOT NULL,
	"max_redemption_per_order" integer,
	"max_redemption_percentage" integer,
	"coins_expire_after_days" integer,
	"expiration_warning_days" integer DEFAULT 30,
	"earn_on_discounted_amount" boolean DEFAULT true NOT NULL,
	"earn_with_coupon_use" boolean DEFAULT true NOT NULL,
	"signup_bonus_enabled" boolean DEFAULT true NOT NULL,
	"signup_bonus_amount" integer DEFAULT 100 NOT NULL,
	"referral_enabled" boolean DEFAULT true NOT NULL,
	"referral_reward_referrer" integer DEFAULT 500 NOT NULL,
	"referral_reward_referee" integer DEFAULT 200 NOT NULL,
	"referral_min_purchase" integer,
	"birthday_bonus_enabled" boolean DEFAULT false NOT NULL,
	"birthday_bonus_amount" integer DEFAULT 500 NOT NULL,
	"daily_checkin_enabled" boolean DEFAULT false NOT NULL,
	"daily_checkin_amount" integer DEFAULT 10 NOT NULL,
	"daily_checkin_streak_bonus" jsonb,
	"tier_system_enabled" boolean DEFAULT false NOT NULL,
	"tier_benefits" jsonb,
	"excluded_products" jsonb,
	"excluded_categories" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_coins_config_earning_rate_chk" CHECK ("shop_coins_config"."earning_rate" > 0 AND "shop_coins_config"."earning_rate_unit" > 0),
	CONSTRAINT "shop_coins_config_redemption_rate_chk" CHECK ("shop_coins_config"."redemption_rate" > 0),
	CONSTRAINT "shop_coins_config_redemption_pct_chk" CHECK (
        "shop_coins_config"."max_redemption_percentage" IS NULL OR
        ("shop_coins_config"."max_redemption_percentage" > 0 AND "shop_coins_config"."max_redemption_percentage" <= 100)
      )
);
--> statement-breakpoint
CREATE TABLE "shop_collection_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"added_by" uuid
);
--> statement-breakpoint
CREATE TABLE "shop_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"collection_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"cover_image_key" varchar(500),
	"thumbnail_key" varchar(500),
	"collection_type" "collection_type" DEFAULT 'manual' NOT NULL,
	"auto_rules" jsonb,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"product_count" integer DEFAULT 0 NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"internal_name" varchar(255),
	"description" text,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"max_discount_amount" integer,
	"min_purchase_amount" integer,
	"min_quantity" integer,
	"target" "coupon_target" DEFAULT 'all' NOT NULL,
	"scope" "coupon_scope" DEFAULT 'order_total' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"timezone" varchar(50) DEFAULT 'UTC',
	"usage_restriction" "usage_restriction" DEFAULT 'unlimited' NOT NULL,
	"total_usage_limit" integer,
	"per_user_usage_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"is_stackable" boolean DEFAULT false NOT NULL,
	"stackable_with" jsonb,
	"status" "coupon_status" DEFAULT 'active' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"generation_method" "generation_method" DEFAULT 'manual' NOT NULL,
	"campaign_id" varchar(100),
	"is_public" boolean DEFAULT true NOT NULL,
	"requires_authentication" boolean DEFAULT false NOT NULL,
	"conditions" jsonb,
	"buy_x_get_y_config" jsonb,
	"tiered_config" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "shop_coupons_date_range_chk" CHECK ("shop_coupons"."end_date" IS NULL OR "shop_coupons"."end_date" > "shop_coupons"."start_date"),
	CONSTRAINT "shop_coupons_discount_value_chk" CHECK ("shop_coupons"."discount_value" > 0),
	CONSTRAINT "shop_coupons_usage_limit_chk" CHECK ("shop_coupons"."total_usage_limit" IS NULL OR "shop_coupons"."total_usage_limit" > 0),
	CONSTRAINT "shop_coupons_usage_count_chk" CHECK ("shop_coupons"."usage_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shop_product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"image_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"alt_text" varchar(255),
	"is_primary" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"width_px" integer,
	"height_px" integer,
	"file_size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_product_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"currency_code" varchar(3) DEFAULT 'INR' NOT NULL,
	"mrp" integer NOT NULL,
	"selling_price" integer NOT NULL,
	"cost_price" integer,
	"has_discount" boolean DEFAULT false NOT NULL,
	"discount_type" "discount_type",
	"discount_value" integer,
	"discount_start_date" timestamp with time zone,
	"discount_end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_prices_values_chk" CHECK (
        "shop_product_prices"."mrp" > 0 AND
        "shop_product_prices"."selling_price" > 0 AND
        "shop_product_prices"."selling_price" <= "shop_product_prices"."mrp" AND
        ("shop_product_prices"."cost_price" IS NULL OR "shop_product_prices"."cost_price" >= 0)
      ),
	CONSTRAINT "shop_prices_discount_required_chk" CHECK (
        "shop_product_prices"."has_discount" = false OR (
          "shop_product_prices"."discount_type"  IS NOT NULL AND
          "shop_product_prices"."discount_value" IS NOT NULL
        )
      ),
	CONSTRAINT "shop_prices_discount_value_chk" CHECK (
        "shop_product_prices"."discount_value" IS NULL OR
        ("shop_product_prices"."discount_type" = 'percentage'  AND "shop_product_prices"."discount_value" BETWEEN 1 AND 100) OR
        ("shop_product_prices"."discount_type" = 'fixed_amount' AND "shop_product_prices"."discount_value" > 0)
      ),
	CONSTRAINT "shop_prices_discount_dates_chk" CHECK (
        "shop_product_prices"."discount_end_date" IS NULL OR
        "shop_product_prices"."discount_start_date" IS NULL OR
        "shop_product_prices"."discount_end_date" >= "shop_product_prices"."discount_start_date"
      )
);
--> statement-breakpoint
CREATE TABLE "shop_product_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"tier_name" varchar(100),
	"min_quantity" integer NOT NULL,
	"max_quantity" integer,
	"tier_type" "pricing_tier_type" NOT NULL,
	"price_per_unit" integer,
	"total_price" integer,
	"discount_percentage" integer,
	"discount_amount" integer,
	"display_label" varchar(200),
	"badge_text" varchar(50),
	"badge_color" varchar(20),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_pricing_tiers_qty_range_chk" CHECK (
        "shop_product_pricing_tiers"."min_quantity" > 0 AND
        ("shop_product_pricing_tiers"."max_quantity" IS NULL OR "shop_product_pricing_tiers"."max_quantity" >= "shop_product_pricing_tiers"."min_quantity")
      ),
	CONSTRAINT "shop_pricing_tiers_value_chk" CHECK (
        ("shop_product_pricing_tiers"."tier_type" = 'price_per_unit'   AND "shop_product_pricing_tiers"."price_per_unit"       > 0) OR
        ("shop_product_pricing_tiers"."tier_type" = 'total_price'       AND "shop_product_pricing_tiers"."total_price"         > 0) OR
        ("shop_product_pricing_tiers"."tier_type" = 'discount_percent'  AND "shop_product_pricing_tiers"."discount_percentage" BETWEEN 1 AND 100) OR
        ("shop_product_pricing_tiers"."tier_type" = 'discount_fixed'    AND "shop_product_pricing_tiers"."discount_amount"     > 0)
      ),
	CONSTRAINT "shop_pricing_tiers_validity_period_chk" CHECK (
        "shop_product_pricing_tiers"."valid_until" IS NULL OR
        "shop_product_pricing_tiers"."valid_from"  IS NULL OR
        "shop_product_pricing_tiers"."valid_until" >= "shop_product_pricing_tiers"."valid_from"
      )
);
--> statement-breakpoint
CREATE TABLE "shop_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"product_source" "product_source" DEFAULT 'master' NOT NULL,
	"master_product_id" uuid,
	"name" varchar(250),
	"description" text,
	"short_description" varchar(500),
	"track_inventory" boolean DEFAULT true NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"allow_backorder" boolean DEFAULT false NOT NULL,
	"taxable" boolean DEFAULT true NOT NULL,
	"tax_category_id" uuid,
	"requires_shipping" boolean DEFAULT true NOT NULL,
	"shipping_weight_grams" numeric(10, 2),
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"recommendation_badge" "product_recommendation_badge",
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone,
	"slug" varchar(255) NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_products_stock_chk" CHECK ("shop_products"."stock_quantity" >= 0),
	CONSTRAINT "shop_products_threshold_chk" CHECK ("shop_products"."low_stock_threshold" >= 0),
	CONSTRAINT "shop_products_source_chk" CHECK (
        ("shop_products"."product_source" = 'master'  AND "shop_products"."master_product_id" IS NOT NULL) OR
        ("shop_products"."product_source" = 'custom' AND "shop_products"."master_product_id" IS NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "shop_product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"master_product_variant_id" uuid,
	"variant_name" varchar(200),
	"variant_sku" varchar(100),
	"attributes" jsonb,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_variants_stock_chk" CHECK ("shop_product_variants"."stock_quantity" >= 0),
	CONSTRAINT "shop_variants_threshold_chk" CHECK ("shop_product_variants"."low_stock_threshold" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stock_alert_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"previous_stock" integer,
	"new_stock" integer,
	"changed_by" uuid,
	"change_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"alert_type" "stock_alert_type" DEFAULT 'low_stock' NOT NULL,
	"severity" "stock_alert_severity" DEFAULT 'medium' NOT NULL,
	"current_stock" integer NOT NULL,
	"threshold_stock" integer NOT NULL,
	"previous_stock" integer,
	"alert_message" text,
	"recommended_action" text,
	"expiry_date" timestamp with time zone,
	"days_until_expiry" integer,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution_notes" text,
	"auto_resolve_at" timestamp with time zone,
	"first_notified_at" timestamp with time zone,
	"last_notified_at" timestamp with time zone,
	"notification_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_alerts_stock_levels_chk" CHECK ("stock_alerts"."current_stock" >= 0 AND "stock_alerts"."threshold_stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "trending_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"period_type" "trend_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"rankings" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trending_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"period_type" "trend_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"algorithm" varchar(50) DEFAULT 'weighted_score',
	"algorithm_config" jsonb,
	"rankings" jsonb NOT NULL,
	"total_products_analyzed" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trending_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"period_type" "trend_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"rankings" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "abandoned_carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"cart_id" uuid,
	"customer_id" uuid,
	"customer_email" varchar(255),
	"customer_phone" varchar(20),
	"session_id" varchar(255) NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"estimated_total" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"is_recovered" boolean DEFAULT false NOT NULL,
	"recovered_order_id" uuid,
	"recovered_at" timestamp with time zone,
	"recovery_emails_sent" integer DEFAULT 0 NOT NULL,
	"last_email_sent_at" timestamp with time zone,
	"email_opened_at" timestamp with time zone,
	"email_clicked_at" timestamp with time zone,
	"checkout_step" varchar(50),
	"device_type" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"abandoned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "abandoned_carts_subtotal_chk" CHECK ("abandoned_carts"."subtotal" >= 0)
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"quantity" integer NOT NULL,
	"unit_price_snapshot" integer NOT NULL,
	"mrp_snapshot" integer NOT NULL,
	"discount_snapshot" integer DEFAULT 0 NOT NULL,
	"customization" jsonb,
	"is_gift_wrap" boolean DEFAULT false NOT NULL,
	"gift_message" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_qty_chk" CHECK ("cart_items"."quantity" > 0),
	CONSTRAINT "cart_items_price_chk" CHECK ("cart_items"."unit_price_snapshot" >= 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"shipping_estimate" integer,
	"tax_estimate" integer,
	"total_estimate" integer DEFAULT 0 NOT NULL,
	"coupon_code" varchar(50),
	"coupon_discount_amount" integer,
	"checkout_step" varchar(50),
	"shipping_address_id" uuid,
	"billing_address_id" uuid,
	"order_id" uuid,
	"checked_out_at" timestamp with time zone,
	"recovery_token" varchar(255),
	"recovery_token_expires_at" timestamp with time zone,
	"device_type" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_subtotal_chk" CHECK ("carts"."subtotal" >= 0),
	CONSTRAINT "carts_total_chk" CHECK ("carts"."total_estimate" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customer_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"current_balance" integer DEFAULT 0 NOT NULL,
	"pending_balance" integer DEFAULT 0 NOT NULL,
	"blocked_balance" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"total_credited" bigint DEFAULT 0 NOT NULL,
	"total_debited" bigint DEFAULT 0 NOT NULL,
	"total_withdrawn" bigint DEFAULT 0 NOT NULL,
	"daily_spend_limit" integer,
	"daily_spent_today" integer DEFAULT 0 NOT NULL,
	"last_spend_reset_date" date,
	"max_balance" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_frozen" boolean DEFAULT false NOT NULL,
	"frozen_reason" text,
	"frozen_at" timestamp with time zone,
	"can_withdraw" boolean DEFAULT true NOT NULL,
	"auto_top_up_enabled" boolean DEFAULT false NOT NULL,
	"auto_top_up_threshold" integer,
	"auto_top_up_amount" integer,
	"auto_top_up_payment_method_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_wallets_balance_chk" CHECK ("customer_wallets"."current_balance" >= 0),
	CONSTRAINT "customer_wallets_pending_chk" CHECK ("customer_wallets"."pending_balance" >= 0),
	CONSTRAINT "customer_wallets_blocked_chk" CHECK ("customer_wallets"."blocked_balance" >= 0),
	CONSTRAINT "customer_wallets_frozen_reason_chk" CHECK ("customer_wallets"."is_frozen" = false OR "customer_wallets"."frozen_reason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "gift_card_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_card_id" uuid NOT NULL,
	"order_id" uuid,
	"transaction_type" "gift_card_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_card_txns_amount_chk" CHECK ("gift_card_transactions"."amount" > 0),
	CONSTRAINT "gift_card_txns_balance_after_chk" CHECK ("gift_card_transactions"."balance_after" >= 0)
);
--> statement-breakpoint
CREATE TABLE "gift_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"initial_balance" integer NOT NULL,
	"current_balance" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"purchased_by" uuid,
	"purchase_order_id" uuid,
	"recipient_email" varchar(255),
	"recipient_name" varchar(255),
	"sender_name" varchar(255),
	"message" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_fully_redeemed" boolean DEFAULT false NOT NULL,
	"activated_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_cards_balances_chk" CHECK (
        "gift_cards"."initial_balance" > 0 AND
        "gift_cards"."current_balance" >= 0 AND
        "gift_cards"."current_balance" <= "gift_cards"."initial_balance"
      )
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"shop_product_id" uuid NOT NULL,
	"shop_product_variant_id" uuid,
	"sku" varchar(100) NOT NULL,
	"warehouse_id" uuid,
	"bin_location" varchar(100),
	"quantity_on_hand" integer DEFAULT 0 NOT NULL,
	"quantity_reserved" integer DEFAULT 0 NOT NULL,
	"quantity_available" integer DEFAULT 0 NOT NULL,
	"quantity_on_order" integer DEFAULT 0 NOT NULL,
	"quantity_damaged" integer DEFAULT 0 NOT NULL,
	"quantity_in_transit" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"reorder_point" integer,
	"reorder_quantity" integer,
	"unit_cost_paise" integer,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"allow_backorder" boolean DEFAULT false NOT NULL,
	"is_low_stock" boolean DEFAULT false NOT NULL,
	"is_out_of_stock" boolean DEFAULT false NOT NULL,
	"last_stock_check_at" timestamp with time zone,
	"last_restocked_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_quantities_chk" CHECK (
        "inventory_items"."quantity_on_hand"    >= 0 AND
        "inventory_items"."quantity_reserved"  >= 0 AND
        "inventory_items"."quantity_available" >= 0 AND
        "inventory_items"."quantity_on_order"   >= 0 AND
        "inventory_items"."quantity_damaged"   >= 0
      ),
	CONSTRAINT "inventory_items_available_chk" CHECK (
        "inventory_items"."quantity_available" = "inventory_items"."quantity_on_hand" - "inventory_items"."quantity_reserved"
      )
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_before" integer NOT NULL,
	"quantity_after" integer NOT NULL,
	"order_id" uuid,
	"order_item_id" uuid,
	"refund_id" uuid,
	"purchase_order_id" uuid,
	"from_location_id" uuid,
	"to_location_id" uuid,
	"unit_cost_paise" integer,
	"reason" varchar(200),
	"notes" text,
	"processed_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"subtotal" integer NOT NULL,
	"tax_total" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"shipping_total" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"amount_paid" integer DEFAULT 0 NOT NULL,
	"amount_due" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date,
	"paid_date" date,
	"billed_to" jsonb NOT NULL,
	"billed_from" jsonb NOT NULL,
	"tax_breakdown" jsonb,
	"payment_terms" varchar(100),
	"notes" text,
	"terms_and_conditions" text,
	"pdf_key" varchar(500),
	"pdf_generated_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_amounts_chk" CHECK (
        "invoices"."subtotal"      >= 0 AND
        "invoices"."total_amount"   >= 0 AND
        "invoices"."amount_paid"    >= 0 AND
        "invoices"."amount_due"     >= 0
      ),
	CONSTRAINT "invoices_amount_due_chk" CHECK ("invoices"."amount_due" = "invoices"."total_amount" - "invoices"."amount_paid")
);
--> statement-breakpoint
CREATE TABLE "order_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"date" date NOT NULL,
	"day_of_week" smallint NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"paid_orders" integer DEFAULT 0 NOT NULL,
	"cancelled_orders" integer DEFAULT 0 NOT NULL,
	"refunded_orders" integer DEFAULT 0 NOT NULL,
	"cod_orders" integer DEFAULT 0 NOT NULL,
	"gross_revenue" bigint DEFAULT 0 NOT NULL,
	"net_revenue" bigint DEFAULT 0 NOT NULL,
	"average_order_value" integer,
	"total_items_sold" integer DEFAULT 0 NOT NULL,
	"new_customers" integer DEFAULT 0 NOT NULL,
	"returning_customers" integer DEFAULT 0 NOT NULL,
	"guest_checkouts" integer DEFAULT 0 NOT NULL,
	"total_discounts" bigint DEFAULT 0 NOT NULL,
	"orders_with_discounts" integer DEFAULT 0 NOT NULL,
	"total_shipping_revenue" bigint DEFAULT 0 NOT NULL,
	"free_shipping_orders" integer DEFAULT 0 NOT NULL,
	"total_tax_collected" bigint DEFAULT 0 NOT NULL,
	"total_refunded" bigint DEFAULT 0 NOT NULL,
	"full_refunds_count" integer DEFAULT 0 NOT NULL,
	"partial_refunds_count" integer DEFAULT 0 NOT NULL,
	"payment_method_breakdown" jsonb,
	"cart_abandonment_rate" numeric(5, 2),
	"checkout_conversion_rate" numeric(5, 2),
	"mobile_orders" integer DEFAULT 0 NOT NULL,
	"desktop_orders" integer DEFAULT 0 NOT NULL,
	"tablet_orders" integer DEFAULT 0 NOT NULL,
	"hourly_distribution" jsonb,
	"revenue_growth" numeric(10, 2),
	"orders_growth" numeric(10, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"shop_product_id" uuid,
	"shop_product_variant_id" uuid,
	"product_name" varchar(500) NOT NULL,
	"variant_name" varchar(255),
	"sku" varchar(100),
	"barcode" varchar(100),
	"product_image_url" varchar(500),
	"attributes" jsonb,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"mrp" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"tax_rate" numeric(5, 2),
	"taxable" boolean DEFAULT true NOT NULL,
	"line_subtotal" integer NOT NULL,
	"line_total" integer NOT NULL,
	"weight_grams" integer,
	"fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled' NOT NULL,
	"fulfillable_quantity" integer NOT NULL,
	"fulfilled_quantity" integer DEFAULT 0 NOT NULL,
	"refundable_quantity" integer NOT NULL,
	"refunded_quantity" integer DEFAULT 0 NOT NULL,
	"is_gift_wrap" boolean DEFAULT false NOT NULL,
	"gift_message" text,
	"customization" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_qty_chk" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_pricing_chk" CHECK (
        "order_items"."unit_price"    >= 0 AND
        "order_items"."line_subtotal" >= 0 AND
        "order_items"."line_total"    >= 0
      ),
	CONSTRAINT "order_items_fulfillment_chk" CHECK (
        "order_items"."fulfilled_quantity"  <= "order_items"."quantity" AND
        "order_items"."fulfillable_quantity" >= 0
      ),
	CONSTRAINT "order_items_refund_chk" CHECK ("order_items"."refunded_quantity" <= "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"previous_status" "order_status",
	"new_status" "order_status" NOT NULL,
	"comment" text,
	"notify_customer" boolean DEFAULT false NOT NULL,
	"changed_by" uuid,
	"changed_by_type" varchar(20),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"customer_id" uuid,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(20),
	"is_guest_checkout" boolean DEFAULT false NOT NULL,
	"cart_id" uuid,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"exchange_rate" numeric(10, 4),
	"subtotal" integer NOT NULL,
	"discount_total" integer DEFAULT 0 NOT NULL,
	"shipping_total" integer DEFAULT 0 NOT NULL,
	"tax_total" integer DEFAULT 0 NOT NULL,
	"tip_amount" integer DEFAULT 0 NOT NULL,
	"gift_wrap_charge" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"items_count" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"fulfillment_status" "fulfillment_status" DEFAULT 'unfulfilled' NOT NULL,
	"payment_method" "payment_method",
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp with time zone,
	"shipping_method" varchar(100),
	"shipping_rate_id" uuid,
	"estimated_delivery_date" date,
	"actual_delivery_date" date,
	"shipping_address" jsonb NOT NULL,
	"billing_address" jsonb NOT NULL,
	"applied_discounts" jsonb,
	"tax_breakdown" jsonb,
	"source" varchar(50) DEFAULT 'web' NOT NULL,
	"channel" varchar(50),
	"utm_source" varchar(100),
	"utm_medium" varchar(100),
	"utm_campaign" varchar(100),
	"device_type" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"customer_note" text,
	"internal_note" text,
	"is_gift" boolean DEFAULT false NOT NULL,
	"gift_message" text,
	"risk_level" varchar(20),
	"is_fraudulent" boolean DEFAULT false NOT NULL,
	"fraud_score" numeric(5, 2),
	"fraud_check_data" jsonb,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancelled_by" uuid,
	"confirmed_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_amounts_chk" CHECK (
        "orders"."subtotal"      >= 0 AND
        "orders"."discount_total" >= 0 AND
        "orders"."shipping_total" >= 0 AND
        "orders"."tax_total"      >= 0 AND
        "orders"."total_amount"   >= 0
      ),
	CONSTRAINT "orders_items_count_chk" CHECK ("orders"."items_count" > 0),
	CONSTRAINT "orders_fraud_score_chk" CHECK ("orders"."fraud_score" IS NULL OR ("orders"."fraud_score" >= 0 AND "orders"."fraud_score" <= 100))
);
--> statement-breakpoint
CREATE TABLE "payment_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_transaction_id" uuid NOT NULL,
	"external_dispute_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"status" "dispute_status" NOT NULL,
	"disputed_at" timestamp with time zone NOT NULL,
	"respond_by_date" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"evidence_submitted" boolean DEFAULT false NOT NULL,
	"evidence_submitted_at" timestamp with time zone,
	"evidence_documents" jsonb,
	"merchant_response" text,
	"network_reason_code" varchar(100),
	"outcome" varchar(50),
	"outcome_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_disputes_amount_chk" CHECK ("payment_disputes"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid,
	"internal_transaction_id" varchar(255) NOT NULL,
	"external_transaction_id" varchar(255),
	"payment_method" "payment_method" NOT NULL,
	"payment_provider" varchar(100),
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"processing_fee" integer DEFAULT 0 NOT NULL,
	"platform_fee" integer DEFAULT 0 NOT NULL,
	"net_amount" integer,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"card_last4" char(4),
	"card_brand" varchar(20),
	"card_exp_month" smallint,
	"card_exp_year" smallint,
	"card_fingerprint" varchar(255),
	"upi_vpa" varchar(100),
	"bank_account_last4" char(4),
	"bank_name" varchar(100),
	"authorization_code" varchar(100),
	"authorized_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"risk_score" numeric(5, 2),
	"risk_level" varchar(20),
	"fraud_check_data" jsonb,
	"requires_3d_secure" boolean DEFAULT false NOT NULL,
	"three_d_secure_status" varchar(50),
	"failure_code" varchar(100),
	"failure_message" text,
	"refunded_amount" integer DEFAULT 0 NOT NULL,
	"is_fully_refunded" boolean DEFAULT false NOT NULL,
	"is_disputed" boolean DEFAULT false NOT NULL,
	"disputed_at" timestamp with time zone,
	"is_reconciled" boolean DEFAULT false NOT NULL,
	"reconciled_at" timestamp with time zone,
	"webhook_data" jsonb,
	"description" text,
	"metadata" jsonb,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_txns_amount_chk" CHECK ("payment_transactions"."amount" > 0),
	CONSTRAINT "payment_txns_refunded_chk" CHECK ("payment_transactions"."refunded_amount" >= 0 AND "payment_transactions"."refunded_amount" <= "payment_transactions"."amount"),
	CONSTRAINT "payment_txns_risk_score_chk" CHECK ("payment_transactions"."risk_score" IS NULL OR ("payment_transactions"."risk_score" >= 0 AND "payment_transactions"."risk_score" <= 100))
);
--> statement-breakpoint
CREATE TABLE "refund_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refund_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_refund_amount" integer NOT NULL,
	"line_subtotal" integer NOT NULL,
	"tax_refund" integer DEFAULT 0 NOT NULL,
	"line_total" integer NOT NULL,
	"return_condition" varchar(50),
	"condition_notes" text,
	"restock_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_line_items_qty_chk" CHECK ("refund_line_items"."quantity" > 0),
	CONSTRAINT "refund_line_items_amounts_chk" CHECK ("refund_line_items"."unit_refund_amount" >= 0 AND "refund_line_items"."line_total" >= 0),
	CONSTRAINT "refund_line_items_restock_chk" CHECK ("refund_line_items"."restock_quantity" <= "refund_line_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_transaction_id" uuid,
	"refund_number" varchar(50) NOT NULL,
	"refund_type" "refund_type" NOT NULL,
	"refund_reason" "refund_reason" NOT NULL,
	"customer_reason" text,
	"internal_note" text,
	"refund_amount" integer NOT NULL,
	"shipping_refund" integer DEFAULT 0 NOT NULL,
	"tax_refund" integer DEFAULT 0 NOT NULL,
	"restocking_fee" integer DEFAULT 0 NOT NULL,
	"adjustment_amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) NOT NULL,
	"refund_method" "payment_method",
	"refund_to_wallet" boolean DEFAULT false NOT NULL,
	"refund_to_original_method" boolean DEFAULT true NOT NULL,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"requested_by" uuid,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"rejected_by" uuid,
	"rejected_at" timestamp with time zone,
	"rejection_reason" text,
	"requires_return" boolean DEFAULT false NOT NULL,
	"return_shipping_label_url" text,
	"return_tracking_number" varchar(100),
	"return_received_at" timestamp with time zone,
	"external_refund_id" varchar(255),
	"processing_error" text,
	"restock_items" boolean DEFAULT true NOT NULL,
	"restocked_at" timestamp with time zone,
	"notify_customer" boolean DEFAULT true NOT NULL,
	"customer_notified_at" timestamp with time zone,
	"attachments" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refunds_amount_chk" CHECK ("refunds"."refund_amount" > 0),
	CONSTRAINT "refunds_rejection_reason_chk" CHECK ("refunds"."status" <> 'rejected' OR "refunds"."rejection_reason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "saved_payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" "payment_method" NOT NULL,
	"card_last4" char(4),
	"card_brand" varchar(20),
	"card_exp_month" smallint,
	"card_exp_year" smallint,
	"card_fingerprint" varchar(255),
	"upi_vpa" varchar(100),
	"billing_address" jsonb,
	"provider_token" text,
	"provider_customer_id" varchar(255),
	"payment_provider" varchar(100),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"nickname" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipment_items_qty_chk" CHECK ("shipment_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"shipment_number" varchar(50) NOT NULL,
	"carrier" varchar(100),
	"carrier_service" varchar(100),
	"tracking_number" varchar(100),
	"tracking_url" text,
	"shipping_method" varchar(100),
	"shipping_cost" integer NOT NULL,
	"insurance_amount" integer DEFAULT 0 NOT NULL,
	"package_count" integer DEFAULT 1 NOT NULL,
	"total_weight_grams" integer,
	"dimensions" jsonb,
	"from_address" jsonb NOT NULL,
	"to_address" jsonb NOT NULL,
	"status" "shipping_status" DEFAULT 'pending' NOT NULL,
	"estimated_delivery_date" date,
	"actual_delivery_date" date,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"signature_required" boolean DEFAULT false NOT NULL,
	"signature_obtained" boolean DEFAULT false NOT NULL,
	"signed_by" varchar(255),
	"delivery_proof_key" varchar(500),
	"delivery_notes" text,
	"label_key" varchar(500),
	"label_purchased_at" timestamp with time zone,
	"label_cost_paise" integer,
	"customs_declaration" jsonb,
	"delivery_attempts" integer DEFAULT 0 NOT NULL,
	"last_delivery_attempt_at" timestamp with time zone,
	"delivery_failure_reason" text,
	"returned_to_sender" boolean DEFAULT false NOT NULL,
	"return_reason" text,
	"returned_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipments_cost_chk" CHECK ("shipments"."shipping_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"carrier" varchar(100),
	"service_code" varchar(100),
	"base_rate" integer NOT NULL,
	"additional_item_rate" integer DEFAULT 0 NOT NULL,
	"free_shipping_threshold" integer,
	"weight_based_pricing" jsonb,
	"min_delivery_days" smallint,
	"max_delivery_days" smallint,
	"allowed_pincodes" jsonb,
	"excluded_pincodes" jsonb,
	"allowed_states" jsonb,
	"min_order_amount" integer,
	"max_order_amount" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"available_from" timestamp with time zone,
	"available_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shipping_rates_base_rate_chk" CHECK ("shipping_rates"."base_rate" >= 0),
	CONSTRAINT "shipping_rates_delivery_days_chk" CHECK (
        "shipping_rates"."min_delivery_days" IS NULL OR
        "shipping_rates"."max_delivery_days" IS NULL OR
        "shipping_rates"."max_delivery_days" >= "shipping_rates"."min_delivery_days"
      )
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(280) NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"billing_interval" varchar(20) NOT NULL,
	"billing_interval_count" integer DEFAULT 1 NOT NULL,
	"trial_period_days" integer,
	"minimum_term_months" integer,
	"product_ids" jsonb,
	"features" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_amount_chk" CHECK ("subscription_plans"."amount" > 0),
	CONSTRAINT "subscription_plans_interval_count_chk" CHECK ("subscription_plans"."billing_interval_count" > 0)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status_v2" NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"billing_interval" varchar(20) NOT NULL,
	"billing_interval_count" integer NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"payment_method_id" uuid,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"next_billing_date" timestamp with time zone,
	"last_billing_date" timestamp with time zone,
	"billing_failure_count" integer DEFAULT 0 NOT NULL,
	"last_billing_error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_amount_chk" CHECK ("subscriptions"."amount" > 0),
	CONSTRAINT "subscriptions_period_chk" CHECK ("subscriptions"."current_period_end" > "subscriptions"."current_period_start"),
	CONSTRAINT "subscriptions_billing_failure_chk" CHECK ("subscriptions"."billing_failure_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"transaction_type" "order_wallet_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_before" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"order_id" uuid,
	"refund_id" uuid,
	"payment_transaction_id" uuid,
	"idempotency_key" varchar(255),
	"description" text NOT NULL,
	"internal_note" text,
	"processed_by" uuid,
	"reversed_transaction_id" uuid,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_txns_balance_after_chk" CHECK ("wallet_transactions"."balance_after" >= 0)
);
--> statement-breakpoint
CREATE TABLE "carrier_tracking_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "carrier_tracking_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"shipment_id" uuid NOT NULL,
	"carrier_id" uuid NOT NULL,
	"tracking_number" varchar(100) NOT NULL,
	"event_type" "carrier_tracking_event_type" NOT NULL,
	"carrier_status_code" varchar(100),
	"carrier_status_description" text,
	"location_description" varchar(255),
	"lat" double precision,
	"lng" double precision,
	"event_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_payload" jsonb,
	"idempotency_key" varchar(255),
	"is_processed" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"logo_key" varchar(500),
	"tracking_url_template" text,
	"api_base_url" text,
	"supports_real_time_tracking" boolean DEFAULT false NOT NULL,
	"supports_webhooks" boolean DEFAULT false NOT NULL,
	"supports_label_generation" boolean DEFAULT false NOT NULL,
	"supported_services" jsonb,
	"status" "carrier_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_delivery_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"speed_rating" smallint,
	"courtesy_rating" smallint,
	"packaging_rating" smallint,
	"comment" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"tip_amount_paise" integer DEFAULT 0 NOT NULL,
	"tip_given_at" timestamp with time zone,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"hidden_reason" varchar(255),
	"hidden_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_delivery_ratings_rating_chk" CHECK ("customer_delivery_ratings"."rating" >= 1 AND "customer_delivery_ratings"."rating" <= 5),
	CONSTRAINT "customer_delivery_ratings_speed_chk" CHECK ("customer_delivery_ratings"."speed_rating" IS NULL OR ("customer_delivery_ratings"."speed_rating" >= 1 AND "customer_delivery_ratings"."speed_rating" <= 5)),
	CONSTRAINT "customer_delivery_ratings_courtesy_chk" CHECK ("customer_delivery_ratings"."courtesy_rating" IS NULL OR ("customer_delivery_ratings"."courtesy_rating" >= 1 AND "customer_delivery_ratings"."courtesy_rating" <= 5)),
	CONSTRAINT "customer_delivery_ratings_packaging_chk" CHECK ("customer_delivery_ratings"."packaging_rating" IS NULL OR ("customer_delivery_ratings"."packaging_rating" >= 1 AND "customer_delivery_ratings"."packaging_rating" <= 5)),
	CONSTRAINT "customer_delivery_ratings_tip_chk" CHECK ("customer_delivery_ratings"."tip_amount_paise" >= 0),
	CONSTRAINT "customer_delivery_ratings_hidden_reason_chk" CHECK ("customer_delivery_ratings"."is_hidden" = false OR "customer_delivery_ratings"."hidden_reason" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "delivery_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid,
	"city_id" uuid,
	"date" date NOT NULL,
	"day_of_week" smallint NOT NULL,
	"tasks_created" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_failed" integer DEFAULT 0 NOT NULL,
	"tasks_cancelled" integer DEFAULT 0 NOT NULL,
	"tasks_reassigned" integer DEFAULT 0 NOT NULL,
	"active_partners_count" integer DEFAULT 0 NOT NULL,
	"total_online_partner_hours" numeric(10, 2),
	"avg_concurrent_active_partners" numeric(8, 2),
	"avg_pickup_time_mins" numeric(8, 2),
	"avg_delivery_time_mins" numeric(8, 2),
	"avg_total_time_mins" numeric(8, 2),
	"sla_breach_count" integer DEFAULT 0 NOT NULL,
	"on_time_delivery_rate" numeric(5, 2),
	"total_distance_metres" bigint DEFAULT 0 NOT NULL,
	"avg_distance_per_delivery_metres" integer,
	"cod_tasks_count" integer DEFAULT 0 NOT NULL,
	"cod_amount_collected_paise" bigint DEFAULT 0 NOT NULL,
	"total_delivery_fees_paise" bigint DEFAULT 0 NOT NULL,
	"total_partner_earnings_paise" bigint DEFAULT 0 NOT NULL,
	"total_surge_paise" bigint DEFAULT 0 NOT NULL,
	"total_tips_paise" bigint DEFAULT 0 NOT NULL,
	"avg_rating" numeric(4, 2),
	"incidents_count" integer DEFAULT 0 NOT NULL,
	"delivery_success_rate" numeric(5, 2),
	"surge_windows_count" integer DEFAULT 0 NOT NULL,
	"surge_duration_mins" integer DEFAULT 0 NOT NULL,
	"avg_broadcast_accept_time_secs" numeric(8, 2),
	"broadcast_timeout_count" integer DEFAULT 0 NOT NULL,
	"tasks_growth_pct" numeric(10, 2),
	"revenue_growth_pct" numeric(10, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_analytics_scope_chk" CHECK (
        ("delivery_analytics"."zone_id" IS NOT NULL AND "delivery_analytics"."city_id" IS NULL) OR
        ("delivery_analytics"."zone_id" IS NULL     AND "delivery_analytics"."city_id" IS NOT NULL)
      ),
	CONSTRAINT "delivery_analytics_rates_chk" CHECK (
        ("delivery_analytics"."on_time_delivery_rate"  IS NULL OR ("delivery_analytics"."on_time_delivery_rate"  >= 0 AND "delivery_analytics"."on_time_delivery_rate"  <= 1)) AND
        ("delivery_analytics"."delivery_success_rate" IS NULL OR ("delivery_analytics"."delivery_success_rate" >= 0 AND "delivery_analytics"."delivery_success_rate" <= 1))
      ),
	CONSTRAINT "delivery_analytics_day_chk" CHECK ("delivery_analytics"."day_of_week" >= 0 AND "delivery_analytics"."day_of_week" <= 6)
);
--> statement-breakpoint
CREATE TABLE "delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"attempt_number" smallint NOT NULL,
	"failure_reason" "delivery_failure_reason" NOT NULL,
	"failure_note" text,
	"lat" double precision,
	"lng" double precision,
	"evidence_photo_key" varchar(500),
	"customer_called" boolean DEFAULT false NOT NULL,
	"call_duration_seconds" integer,
	"next_attempt_scheduled_at" timestamp with time zone,
	"attempted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_attempts_number_chk" CHECK ("delivery_attempts"."attempt_number" > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_number" varchar(50) NOT NULL,
	"task_id" uuid,
	"partner_id" uuid,
	"customer_id" uuid,
	"shop_id" uuid,
	"incident_type" "delivery_incident_type" NOT NULL,
	"severity" "incident_severity" DEFAULT 'medium' NOT NULL,
	"status" "incident_status" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"location_description" varchar(255),
	"estimated_loss_paise" integer,
	"resolved_amount_paise" integer,
	"attachment_keys" jsonb,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"escalated_to" uuid,
	"escalated_at" timestamp with time zone,
	"escalation_reason" text,
	"reported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_incidents_loss_chk" CHECK (
        ("delivery_incidents"."estimated_loss_paise"  IS NULL OR "delivery_incidents"."estimated_loss_paise"  >= 0) AND
        ("delivery_incidents"."resolved_amount_paise" IS NULL OR "delivery_incidents"."resolved_amount_paise" >= 0)
      ),
	CONSTRAINT "delivery_incidents_resolution_chk" CHECK (
        "delivery_incidents"."status" <> 'resolved' OR (
          "delivery_incidents"."resolved_by"      IS NOT NULL AND
          "delivery_incidents"."resolved_at"      IS NOT NULL AND
          "delivery_incidents"."resolution_notes" IS NOT NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE "delivery_partner_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"shift_id" uuid,
	"status" "delivery_partner_status" DEFAULT 'offline' NOT NULL,
	"current_location" geography(Point, 4326),
	"location_updated_at" timestamp with time zone,
	"active_task_id" uuid,
	"session_start" timestamp with time zone DEFAULT now() NOT NULL,
	"session_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_route_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"sequence" smallint NOT NULL,
	"stop_type" "route_stop_type" NOT NULL,
	"estimated_arrival_at" timestamp with time zone,
	"actual_arrival_at" timestamp with time zone,
	"estimated_leg_distance_metres" integer,
	"estimated_leg_duration_seconds" integer,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "route_stops_sequence_chk" CHECK ("delivery_route_stops"."sequence" > 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_number" varchar(50) NOT NULL,
	"partner_id" uuid NOT NULL,
	"shift_id" uuid,
	"zone_id" uuid,
	"status" "route_status" DEFAULT 'planned' NOT NULL,
	"total_stops" smallint NOT NULL,
	"completed_stops" smallint DEFAULT 0 NOT NULL,
	"estimated_distance_metres" integer,
	"estimated_duration_seconds" integer,
	"actual_distance_metres" integer,
	"actual_duration_seconds" integer,
	"total_earnings_paise" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_routes_stops_chk" CHECK ("delivery_routes"."completed_stops" <= "delivery_routes"."total_stops"),
	CONSTRAINT "delivery_routes_earnings_chk" CHECK ("delivery_routes"."total_earnings_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "delivery_sla_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"city_id" uuid,
	"zone_id" uuid,
	"delivery_type" "delivery_type",
	"max_pickup_wait_seconds" integer,
	"max_preparation_seconds" integer,
	"max_transit_seconds" integer,
	"max_total_seconds" integer,
	"notify_partner_on_breach_risk_pct" smallint DEFAULT 80,
	"notify_dispatcher_on_breach" boolean DEFAULT true NOT NULL,
	"auto_reassign_on_breach" boolean DEFAULT false NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_sla_policies_scope_chk" CHECK ("delivery_sla_policies"."zone_id" IS NULL OR "delivery_sla_policies"."city_id" IS NOT NULL),
	CONSTRAINT "delivery_sla_policies_budgets_chk" CHECK (
        ("delivery_sla_policies"."max_pickup_wait_seconds"  IS NULL OR "delivery_sla_policies"."max_pickup_wait_seconds"  > 0) AND
        ("delivery_sla_policies"."max_preparation_seconds" IS NULL OR "delivery_sla_policies"."max_preparation_seconds" > 0) AND
        ("delivery_sla_policies"."max_transit_seconds"     IS NULL OR "delivery_sla_policies"."max_transit_seconds"     > 0) AND
        ("delivery_sla_policies"."max_total_seconds"       IS NULL OR "delivery_sla_policies"."max_total_seconds"       > 0)
      )
);
--> statement-breakpoint
CREATE TABLE "delivery_task_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"previous_status" "delivery_task_status",
	"new_status" "delivery_task_status" NOT NULL,
	"changed_by" uuid,
	"changed_by_type" varchar(20),
	"lat_at_change" double precision,
	"lng_at_change" double precision,
	"note" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_number" varchar(50) NOT NULL,
	"order_id" uuid NOT NULL,
	"shipment_id" uuid,
	"shop_id" uuid NOT NULL,
	"partner_id" uuid,
	"zone_id" uuid,
	"route_id" uuid,
	"delivery_type" "delivery_type" NOT NULL,
	"assignment_strategy" "assignment_strategy" DEFAULT 'auto_nearest' NOT NULL,
	"status" "delivery_task_status" DEFAULT 'pending' NOT NULL,
	"predecessor_task_id" uuid,
	"pickup_name" varchar(255) NOT NULL,
	"pickup_line1" varchar(255) NOT NULL,
	"pickup_line2" varchar(255),
	"pickup_city" varchar(100) NOT NULL,
	"pickup_state" varchar(100) NOT NULL,
	"pickup_pincode" varchar(10) NOT NULL,
	"pickup_phone" varchar(20),
	"pickup_lat" double precision,
	"pickup_lng" double precision,
	"pickup_instructions" text,
	"delivery_name" varchar(255) NOT NULL,
	"delivery_line1" varchar(255) NOT NULL,
	"delivery_line2" varchar(255),
	"delivery_city" varchar(100) NOT NULL,
	"delivery_state" varchar(100) NOT NULL,
	"delivery_pincode" varchar(10) NOT NULL,
	"delivery_phone" varchar(20) NOT NULL,
	"delivery_lat" double precision,
	"delivery_lng" double precision,
	"delivery_instructions" text,
	"package_count" smallint DEFAULT 1 NOT NULL,
	"total_weight_grams" integer,
	"is_food_order" boolean DEFAULT false NOT NULL,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"requires_refrigeration" boolean DEFAULT false NOT NULL,
	"is_cod" boolean DEFAULT false NOT NULL,
	"cod_amount_paise" integer,
	"cod_collected_paise" integer,
	"cod_collected_at" timestamp with time zone,
	"cod_remitted_at" timestamp with time zone,
	"scheduled_pickup_time" timestamp with time zone,
	"scheduled_delivery_window_start" timestamp with time zone,
	"scheduled_delivery_window_end" timestamp with time zone,
	"sla_policy_id" uuid,
	"sla_deadline" timestamp with time zone,
	"is_sla_breached" boolean DEFAULT false NOT NULL,
	"sla_breached_at" timestamp with time zone,
	"estimated_distance_metres" integer,
	"actual_distance_metres" integer,
	"estimated_duration_seconds" integer,
	"actual_duration_seconds" integer,
	"delivery_fee_paise" integer DEFAULT 0 NOT NULL,
	"partner_earning_paise" integer DEFAULT 0 NOT NULL,
	"surge_paise" integer DEFAULT 0 NOT NULL,
	"tip_paise" integer DEFAULT 0 NOT NULL,
	"penalty_paise" integer DEFAULT 0 NOT NULL,
	"max_attempts" smallint DEFAULT 3 NOT NULL,
	"attempt_count" smallint DEFAULT 0 NOT NULL,
	"broadcast_started_at" timestamp with time zone,
	"broadcast_expires_at" timestamp with time zone,
	"broadcast_radius_metres" integer,
	"assigned_at" timestamp with time zone,
	"partner_enroute_pickup_at" timestamp with time zone,
	"arrived_pickup_at" timestamp with time zone,
	"picked_up_at" timestamp with time zone,
	"partner_enroute_delivery_at" timestamp with time zone,
	"arrived_delivery_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancelled_by" uuid,
	"last_failure_reason" "delivery_failure_reason",
	"last_failure_note" text,
	"delivery_otp_hash" varchar(255),
	"delivery_otp_expires_at" timestamp with time zone,
	"delivery_otp_verified_at" timestamp with time zone,
	"customer_rating_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "delivery_tasks_attempts_chk" CHECK ("delivery_tasks"."attempt_count" <= "delivery_tasks"."max_attempts"),
	CONSTRAINT "delivery_tasks_cod_amount_chk" CHECK ("delivery_tasks"."is_cod" = false OR "delivery_tasks"."cod_amount_paise" IS NOT NULL),
	CONSTRAINT "delivery_tasks_schedule_window_chk" CHECK (
        "delivery_tasks"."scheduled_delivery_window_end" IS NULL OR
        "delivery_tasks"."scheduled_delivery_window_start" IS NULL OR
        "delivery_tasks"."scheduled_delivery_window_end" > "delivery_tasks"."scheduled_delivery_window_start"
      ),
	CONSTRAINT "delivery_tasks_financials_chk" CHECK (
        "delivery_tasks"."delivery_fee_paise"    >= 0 AND
        "delivery_tasks"."partner_earning_paise" >= 0 AND
        "delivery_tasks"."surge_paise"          >= 0 AND
        "delivery_tasks"."tip_paise"            >= 0 AND
        "delivery_tasks"."penalty_paise"        >= 0
      )
);
--> statement-breakpoint
CREATE TABLE "live_location_pings" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "live_location_pings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"partner_id" uuid NOT NULL,
	"task_id" uuid,
	"shift_id" uuid,
	"location" geography(Point, 4326) NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"accuracy_metres" real,
	"bearing_degrees" real,
	"speed_mps" real,
	"altitude_metres" real,
	"battery_pct" smallint,
	"network_type" varchar(20),
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_pings_battery_chk" CHECK ("live_location_pings"."battery_pct" IS NULL OR ("live_location_pings"."battery_pct" >= 0 AND "live_location_pings"."battery_pct" <= 100)),
	CONSTRAINT "live_pings_bearing_chk" CHECK ("live_location_pings"."bearing_degrees" IS NULL OR ("live_location_pings"."bearing_degrees" >= 0 AND "live_location_pings"."bearing_degrees" < 360)),
	CONSTRAINT "live_pings_speed_chk" CHECK ("live_location_pings"."speed_mps" IS NULL OR "live_location_pings"."speed_mps" >= 0)
);
--> statement-breakpoint
CREATE TABLE "location_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"task_id" uuid,
	"shift_id" uuid,
	"location" geography(Point, 4326) NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"snapshot_reason" varchar(50) NOT NULL,
	"snapshot_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_availability_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"zone_id" uuid,
	"day_of_week" smallint NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"max_tasks_per_slot" smallint DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_avail_slots_day_chk" CHECK ("partner_availability_slots"."day_of_week" >= 0 AND "partner_availability_slots"."day_of_week" <= 6),
	CONSTRAINT "partner_avail_slots_time_chk" CHECK ("partner_availability_slots"."end_time" > "partner_availability_slots"."start_time"),
	CONSTRAINT "partner_avail_slots_max_tasks_chk" CHECK ("partner_availability_slots"."max_tasks_per_slot" > 0)
);
--> statement-breakpoint
CREATE TABLE "partner_earnings_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"task_id" uuid,
	"shift_id" uuid,
	"payout_id" uuid,
	"entry_type" "earnings_entry_type" NOT NULL,
	"amount_paise" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_earnings_amount_chk" CHECK ("partner_earnings_ledger"."amount_paise" <> 0)
);
--> statement-breakpoint
CREATE TABLE "partner_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_number" varchar(50) NOT NULL,
	"partner_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "partner_payout_status" DEFAULT 'pending' NOT NULL,
	"gateway_reference" varchar(255),
	"gateway_response" jsonb,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"processed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_payouts_amount_chk" CHECK ("partner_payouts"."amount_paise" > 0),
	CONSTRAINT "partner_payouts_period_chk" CHECK ("partner_payouts"."period_end" >= "partner_payouts"."period_start")
);
--> statement-breakpoint
CREATE TABLE "partner_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"date" date NOT NULL,
	"login_hours" numeric(5, 2),
	"online_hours" numeric(5, 2),
	"tasks_assigned" integer DEFAULT 0 NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_rejected" integer DEFAULT 0 NOT NULL,
	"tasks_cancelled" integer DEFAULT 0 NOT NULL,
	"acceptance_rate" numeric(5, 2),
	"completion_rate" numeric(5, 2),
	"avg_rating" numeric(3, 2),
	"total_distance_metres" integer DEFAULT 0,
	"total_earnings_paise" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"zone_id" uuid,
	"shift_start" timestamp with time zone NOT NULL,
	"shift_end" timestamp with time zone,
	"planned_shift_end" timestamp with time zone,
	"vehicle_type" varchar(50),
	"vehicle_number" varchar(20),
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_cancelled" integer DEFAULT 0 NOT NULL,
	"total_distance_metres" integer DEFAULT 0 NOT NULL,
	"total_earnings_paise" integer DEFAULT 0 NOT NULL,
	"breaks" jsonb,
	"clock_out_lat" double precision,
	"clock_out_lng" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_shifts_window_chk" CHECK ("partner_shifts"."shift_end" IS NULL OR "partner_shifts"."shift_end" > "partner_shifts"."shift_start"),
	CONSTRAINT "partner_shifts_earnings_chk" CHECK ("partner_shifts"."total_earnings_paise" >= 0 AND "partner_shifts"."total_distance_metres" >= 0)
);
--> statement-breakpoint
CREATE TABLE "proof_of_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"pod_type" "pod_type" NOT NULL,
	"photo_key" varchar(500),
	"signature_key" varchar(500),
	"otp_verified" boolean DEFAULT false NOT NULL,
	"otp_verified_at" timestamp with time zone,
	"scanned_code" varchar(255),
	"recipient_name" varchar(255),
	"handed_to" varchar(50),
	"lat" double precision,
	"lng" double precision,
	"location_accuracy_metres" real,
	"notes" text,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"centroid_lat" double precision,
	"centroid_lng" double precision,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_delivery_radius_metres" integer,
	"max_concurrent_tasks" integer,
	"active_surge_pricing_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_carrier_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"carrier_id" uuid NOT NULL,
	"account_identifier" varchar(255),
	"credentials_encrypted" text,
	"pickup_address_id" uuid,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"negotiated_rate_card_key" varchar(500),
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_service_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"zone_id" uuid NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surge_pricing_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"reason" varchar(255),
	"multiplier" numeric(4, 2) NOT NULL,
	"flat_surge_paise" integer DEFAULT 0 NOT NULL,
	"partner_surge_share_rate" numeric(4, 2) DEFAULT '0.80' NOT NULL,
	"activated_at" timestamp with time zone NOT NULL,
	"deactivated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"activated_by" uuid,
	"deactivated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "surge_pricing_multiplier_chk" CHECK ("surge_pricing_windows"."multiplier" >= 1.00),
	CONSTRAINT "surge_pricing_flat_surge_chk" CHECK ("surge_pricing_windows"."flat_surge_paise" >= 0),
	CONSTRAINT "surge_pricing_partner_share_chk" CHECK ("surge_pricing_windows"."partner_surge_share_rate" >= 0 AND "surge_pricing_windows"."partner_surge_share_rate" <= 1),
	CONSTRAINT "surge_pricing_window_chk" CHECK (
        "surge_pricing_windows"."deactivated_at" IS NULL OR
        "surge_pricing_windows"."deactivated_at" > "surge_pricing_windows"."activated_at"
      )
);
--> statement-breakpoint
CREATE TABLE "zone_serviceable_pincodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"serviceable_pincode_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_partner_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_user_id" uuid NOT NULL,
	"city_id" uuid,
	"status" "dp_application_status" DEFAULT 'draft' NOT NULL,
	"vehicle_type" varchar(50),
	"vehicle_number" varchar(20),
	"license_number" varchar(20),
	"license_expiry_date" date,
	"referred_by_partner_id" uuid,
	"assigned_to" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"rejection_reason" varchar(500),
	"changes_requested" text,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"delivery_partner_profile_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dp_onboarding_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_user_id" uuid NOT NULL,
	"step" "dp_onboarding_step" NOT NULL,
	"status" "onboarding_step_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_reason" varchar(500),
	"retry_count" smallint DEFAULT 0 NOT NULL,
	"admin_note" text,
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_slug" varchar(100) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"target" "faq_target" DEFAULT 'all' NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"not_helpful_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_key" varchar(100) NOT NULL,
	"city_id" uuid,
	"shop_id" uuid,
	"user_id" uuid,
	"is_enabled" boolean NOT NULL,
	"reason" text,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_overrides_single_scope_chk" CHECK (
        ("feature_flag_overrides"."city_id" IS NOT NULL)::int +
        ("feature_flag_overrides"."shop_id" IS NOT NULL)::int +
        ("feature_flag_overrides"."user_id" IS NOT NULL)::int = 1
      )
);
--> statement-breakpoint
CREATE TABLE "maintenance_windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"affected_services" jsonb,
	"city_id" uuid,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"status" "maintenance_status" DEFAULT 'scheduled' NOT NULL,
	"customer_message" text,
	"shop_owner_message" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_windows_schedule_chk" CHECK ("maintenance_windows"."scheduled_end" > "maintenance_windows"."scheduled_start")
);
--> statement-breakpoint
CREATE TABLE "nearby_shop_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serviceable_pincode_id" uuid NOT NULL,
	"pincode" varchar(10) NOT NULL,
	"city_id" uuid NOT NULL,
	"shops" jsonb NOT NULL,
	"total_shops_count" integer NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"target" "platform_announcement_target" NOT NULL,
	"city_id" uuid,
	"target_shop_ids" jsonb,
	"image_key" varchar(500),
	"cta_text" varchar(100),
	"cta_url" varchar(500),
	"announcement_type" "platform_announcement_type" DEFAULT 'general' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"send_push_notification" boolean DEFAULT false NOT NULL,
	"push_sent_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_announcements_city_scope_chk" CHECK ("platform_announcements"."target"::text NOT LIKE 'city_%' OR "platform_announcements"."city_id" IS NOT NULL),
	CONSTRAINT "platform_announcements_expiry_chk" CHECK (
        "platform_announcements"."expires_at" IS NULL OR
        "platform_announcements"."published_at" IS NULL OR
        "platform_announcements"."expires_at" > "platform_announcements"."published_at"
      )
);
--> statement-breakpoint
CREATE TABLE "platform_config_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_config_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"config_id" uuid NOT NULL,
	"config_key" varchar(200) NOT NULL,
	"previous_value" text,
	"new_value" text NOT NULL,
	"changed_by" uuid,
	"change_reason" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" varchar(200) NOT NULL,
	"label" varchar(255) NOT NULL,
	"description" text,
	"group" varchar(100) NOT NULL,
	"value_type" "config_value_type" NOT NULL,
	"scope" "config_scope" DEFAULT 'global' NOT NULL,
	"city_id" uuid,
	"shop_type_slug" varchar(120),
	"value" text NOT NULL,
	"min_value" text,
	"max_value" text,
	"allowed_values" jsonb,
	"is_editable" boolean DEFAULT true NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"last_changed_by" uuid,
	"previous_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_config_scope_anchor_chk" CHECK (
        ("platform_config"."scope" = 'global'    AND "platform_config"."city_id" IS NULL  AND "platform_config"."shop_type_slug" IS NULL) OR
        ("platform_config"."scope" = 'city'      AND "platform_config"."city_id" IS NOT NULL) OR
        ("platform_config"."scope" = 'shop_type' AND "platform_config"."shop_type_slug" IS NOT NULL)
      )
);
--> statement-breakpoint
CREATE TABLE "platform_health_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"city_id" uuid,
	"active_shops_count" integer DEFAULT 0 NOT NULL,
	"online_partners_count" integer DEFAULT 0 NOT NULL,
	"avg_partner_online_hours" numeric(6, 2),
	"daily_active_users" integer DEFAULT 0 NOT NULL,
	"new_users_today" integer DEFAULT 0 NOT NULL,
	"new_shops_approved_today" integer DEFAULT 0 NOT NULL,
	"new_partners_approved_today" integer DEFAULT 0 NOT NULL,
	"orders_placed" integer DEFAULT 0 NOT NULL,
	"orders_delivered" integer DEFAULT 0 NOT NULL,
	"orders_cancelled" integer DEFAULT 0 NOT NULL,
	"orders_failed_payment" integer DEFAULT 0 NOT NULL,
	"delivery_success_rate" numeric(5, 2),
	"avg_delivery_time_mins" numeric(8, 2),
	"sla_breach_count" integer DEFAULT 0 NOT NULL,
	"on_time_delivery_rate" numeric(5, 2),
	"gmv_paise" bigint DEFAULT 0 NOT NULL,
	"net_platform_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"open_tickets_count" integer DEFAULT 0 NOT NULL,
	"tickets_opened_today" integer DEFAULT 0 NOT NULL,
	"tickets_resolved_today" integer DEFAULT 0 NOT NULL,
	"avg_first_response_mins" numeric(8, 2),
	"platform_search_count" integer DEFAULT 0 NOT NULL,
	"search_no_result_rate" numeric(5, 2),
	"api_p99_latency_ms" integer,
	"api_error_rate" numeric(5, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_search_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"city_id" uuid,
	"total_searches" integer DEFAULT 0 NOT NULL,
	"unique_searchers" integer DEFAULT 0 NOT NULL,
	"searches_with_results" integer DEFAULT 0 NOT NULL,
	"searches_without_results" integer DEFAULT 0 NOT NULL,
	"find_shop_searches" integer DEFAULT 0 NOT NULL,
	"find_product_searches" integer DEFAULT 0 NOT NULL,
	"searches_to_click" integer DEFAULT 0 NOT NULL,
	"searches_to_order" integer DEFAULT 0 NOT NULL,
	"click_through_rate" numeric(5, 2),
	"search_conversion_rate" numeric(5, 2),
	"top_zero_result_queries" jsonb,
	"top_search_terms" jsonb,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_search_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "platform_search_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" uuid,
	"session_id" varchar(255) NOT NULL,
	"search_term" varchar(500) NOT NULL,
	"normalized_term" varchar(500),
	"intent" "platform_search_intent" DEFAULT 'browse' NOT NULL,
	"user_location" geography(Point, 4326),
	"user_lat" double precision,
	"user_lng" double precision,
	"user_pincode" varchar(10),
	"city_id" uuid,
	"radius_metres" integer,
	"shop_results_count" integer DEFAULT 0 NOT NULL,
	"product_results_count" integer DEFAULT 0 NOT NULL,
	"has_results" boolean NOT NULL,
	"filters_applied" jsonb,
	"clicked_shop_id" uuid,
	"clicked_product_id" uuid,
	"click_position" smallint,
	"resulted_in_order" boolean DEFAULT false NOT NULL,
	"order_id" uuid,
	"device_type" varchar(20),
	"platform" varchar(20),
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_onboarding_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"step" "onboarding_step" NOT NULL,
	"status" "onboarding_step_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_reason" varchar(500),
	"retry_count" smallint DEFAULT 0 NOT NULL,
	"admin_note" text,
	"reference_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_onboarding_checklist_retry_chk" CHECK ("shop_onboarding_checklist"."retry_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shop_verification_history" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shop_verification_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"queue_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"previous_status" "shop_verification_queue_status",
	"new_status" "shop_verification_queue_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_verification_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"status" "shop_verification_queue_status" DEFAULT 'submitted' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"review_checklist" jsonb,
	"reviewer_notes" text,
	"changes_requested" text,
	"rejection_reason" varchar(500),
	"submitted_at" timestamp with time zone NOT NULL,
	"review_started_at" timestamp with time zone,
	"review_completed_at" timestamp with time zone,
	"sla_deadline" timestamp with time zone,
	"is_sla_breached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "static_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(255) NOT NULL,
	"meta_description" varchar(500),
	"content_markdown" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_version" integer,
	"target" "static_page_target" DEFAULT 'all' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"last_updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "static_pages_version_chk" CHECK ("static_pages"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "support_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"applicable_to" jsonb NOT NULL,
	"default_assignee_team" varchar(100),
	"default_priority" "support_ticket_priority" DEFAULT 'medium' NOT NULL,
	"first_response_sla_hours" smallint DEFAULT 4 NOT NULL,
	"resolution_sla_hours" smallint DEFAULT 48 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"author_type" "support_actor_type" NOT NULL,
	"author_name" varchar(255),
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"attachment_keys" jsonb,
	"is_automated" boolean DEFAULT false NOT NULL,
	"status_changed_to" "support_ticket_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" varchar(50) NOT NULL,
	"raised_by_id" uuid,
	"raised_by_type" "support_actor_type" NOT NULL,
	"category_id" uuid,
	"shop_id" uuid,
	"context_type" varchar(50),
	"context_id" uuid,
	"subject" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"status" "support_ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "support_ticket_priority" DEFAULT 'medium' NOT NULL,
	"assigned_to" uuid,
	"assigned_team" varchar(100),
	"assigned_at" timestamp with time zone,
	"first_response_sla_at" timestamp with time zone,
	"resolution_sla_at" timestamp with time zone,
	"first_response_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"is_first_response_breached" boolean DEFAULT false NOT NULL,
	"is_resolution_breached" boolean DEFAULT false NOT NULL,
	"resolution_summary" text,
	"internal_notes" text,
	"csat_score" smallint,
	"csat_comment" text,
	"csat_submitted_at" timestamp with time zone,
	"reopen_count" smallint DEFAULT 0 NOT NULL,
	"last_reopened_at" timestamp with time zone,
	"tags" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_csat_chk" CHECK ("support_tickets"."csat_score" IS NULL OR ("support_tickets"."csat_score" >= 1 AND "support_tickets"."csat_score" <= 5)),
	CONSTRAINT "support_tickets_reopen_chk" CHECK ("support_tickets"."reopen_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "admin_action_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"action" varchar(150) NOT NULL,
	"reason" text,
	"target_user_id" uuid,
	"target_shop_id" uuid,
	"target_record_id" text,
	"metadata" jsonb,
	"request_id" uuid,
	"ip_address" varchar(45),
	"impersonating_user_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_request_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"shop_id" uuid,
	"method" "http_method" NOT NULL,
	"path" text NOT NULL,
	"query" text,
	"status_code" integer,
	"duration_ms" integer,
	"ip_address" varchar(45),
	"user_agent" text,
	"device_fingerprint" varchar(255),
	"request_id" uuid NOT NULL,
	"request_body" jsonb,
	"response_body" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "background_job_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(150) NOT NULL,
	"queue_name" varchar(100) DEFAULT 'default',
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error_message" text,
	"error_stack" text,
	"duration_ms" integer,
	"attempts" integer DEFAULT 0 NOT NULL,
	"enqueued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"processed_by" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "banner_impressions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"banner_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "banner_event_type" NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"placement" "banner_placement" NOT NULL,
	"media_type" "banner_media_type" DEFAULT 'image' NOT NULL,
	"media_url" text NOT NULL,
	"media_url_dark" text,
	"deep_link" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"city_id" uuid,
	"audience_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_audience_members" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"audience_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"variant_id" uuid,
	"status" "audience_member_send_status" DEFAULT 'pending' NOT NULL,
	"notification_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_audiences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "audience_segment_type" NOT NULL,
	"filter_criteria" jsonb,
	"custom_sql" text,
	"is_dynamic" boolean DEFAULT true NOT NULL,
	"last_refreshed_at" timestamp with time zone,
	"estimated_user_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"template_id" uuid NOT NULL,
	"allocation_weight" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comms_audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"actor_type" "audit_actor_type" NOT NULL,
	"operation" "audit_operation" NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"request_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"consent_action" "consent_action" NOT NULL,
	"document_version" varchar(30) NOT NULL,
	"document_url" text,
	"collection_point" varchar(100),
	"platform" varchar(20),
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"campaign_id" uuid,
	"max_uses" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revocation_reason" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_deletion_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"stage" "data_deletion_stage" NOT NULL,
	"requested_by" uuid,
	"requested_by_type" varchar(20),
	"data_categories" jsonb,
	"scheduled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"deadline_at" timestamp with time zone,
	"confirmation_ref" varchar(100),
	"notes" text,
	"ip_address" varchar(45),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_export_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exported_by" uuid NOT NULL,
	"export_type" varchar(100) NOT NULL,
	"format" varchar(10) NOT NULL,
	"status" "export_status" DEFAULT 'queued' NOT NULL,
	"file_key" text,
	"file_size" bigint,
	"expires_at" timestamp with time zone,
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"level" varchar(20) DEFAULT 'error' NOT NULL,
	"error_code" varchar(100),
	"message" text NOT NULL,
	"stack" text,
	"user_id" uuid,
	"shop_id" uuid,
	"url" text,
	"params" jsonb,
	"request_id" uuid,
	"app_version" varchar(50),
	"environment" varchar(20),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_audit" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"phone_attempted" varchar(20),
	"email_attempted" varchar(255),
	"event_type" "login_event_type" NOT NULL,
	"auth_method" "login_auth_method",
	"session_id" uuid,
	"failure_reason" varchar(100),
	"failure_detail" text,
	"ip_address" varchar(45),
	"ip_country" char(2),
	"user_agent" text,
	"device_fingerprint" varchar(255),
	"platform" "device_platform",
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"suspicion_reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"campaign_id" uuid,
	"status" "batch_status" DEFAULT 'preparing' NOT NULL,
	"total_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "device_platform" NOT NULL,
	"device_token" text NOT NULL,
	"device_name" varchar(255),
	"device_model" varchar(255),
	"os_version" varchar(100),
	"app_version" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_interactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"interaction_type" "notif_interaction_type" NOT NULL,
	"platform" "device_platform",
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "notif_category" NOT NULL,
	"channel" "notif_channel" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(150) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "notif_category" NOT NULL,
	"channel" "notif_channel" NOT NULL,
	"engine" "template_engine" DEFAULT 'handlebars' NOT NULL,
	"title_template" varchar(500),
	"body_template" text NOT NULL,
	"deep_link_template" text,
	"image_url_template" text,
	"default_priority" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid,
	"batch_id" uuid,
	"category" "notif_category" NOT NULL,
	"channel" "notif_channel" NOT NULL,
	"title" varchar(500),
	"body" text NOT NULL,
	"deep_link" text,
	"image_url" text,
	"context" jsonb,
	"status" "notif_status" DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 50 NOT NULL,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"read_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"provider_message_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_change_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"target_user_id" uuid NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_by_type" "audit_actor_type" NOT NULL,
	"operation" "permission_change_operation" NOT NULL,
	"role_id" uuid,
	"role_name" varchar(100),
	"permission_id" uuid,
	"permission_name" varchar(200),
	"shop_id" uuid,
	"expires_at" timestamp with time zone,
	"reason" text,
	"request_id" uuid,
	"ip_address" varchar(45),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popup_interactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"popup_id" uuid NOT NULL,
	"user_id" uuid,
	"type" "popup_event_type" NOT NULL,
	"platform" "device_platform",
	"ip_address" varchar(45),
	"user_agent" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "popups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"trigger" "popup_trigger" NOT NULL,
	"trigger_metadata" jsonb,
	"title" varchar(255),
	"body" text,
	"image_url" text,
	"lottie_url" text,
	"primary_cta_label" varchar(50),
	"primary_cta_link" text,
	"secondary_cta_label" varchar(50),
	"secondary_cta_link" text,
	"max_impressions_per_user" integer DEFAULT 1,
	"cooldown_period_minutes" integer DEFAULT 1440,
	"is_active" boolean DEFAULT true NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"city_id" uuid,
	"audience_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"type" "campaign_type" NOT NULL,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"is_priority" boolean DEFAULT false NOT NULL,
	"budget_paise" integer,
	"actual_spend_paise" integer DEFAULT 0,
	"metadata" jsonb,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_campaign_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"referrer_reward_paise" integer DEFAULT 0,
	"referrer_reward_type" varchar(50),
	"referred_reward_paise" integer DEFAULT 0,
	"referred_reward_type" varchar(50),
	"min_first_order_amount_paise" integer DEFAULT 0,
	"max_rewards_per_referrer" integer,
	"scheduled_start" timestamp with time zone,
	"scheduled_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"referral_code_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"referrer_reward_id" uuid,
	"referred_reward_id" uuid,
	"source" varchar(100),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_banner_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"banner_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_event_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"level" "system_event_level" NOT NULL,
	"category" "system_event_category" NOT NULL,
	"message" text NOT NULL,
	"detail" text,
	"user_id" uuid,
	"shop_id" uuid,
	"request_id" uuid,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"direction" "webhook_direction" NOT NULL,
	"provider" varchar(100) NOT NULL,
	"url" text NOT NULL,
	"method" "http_method" DEFAULT 'POST' NOT NULL,
	"payload" jsonb,
	"headers" jsonb,
	"response_status" integer,
	"response_body" text,
	"duration_ms" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_rate_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"scope" "commission_scope" NOT NULL,
	"city_id" uuid,
	"shop_type_slug" varchar(120),
	"commission_rate" numeric(5, 4) NOT NULL,
	"applied_on" "commission_applied_on" DEFAULT 'gross_subtotal' NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_configs_rate_chk" CHECK ("commission_rate_configs"."commission_rate" >= 0 AND "commission_rate_configs"."commission_rate" <= 1),
	CONSTRAINT "commission_configs_scope_anchor_chk" CHECK (
        ("commission_rate_configs"."scope" = 'global'    AND "commission_rate_configs"."city_id" IS NULL AND "commission_rate_configs"."shop_type_slug" IS NULL) OR
        ("commission_rate_configs"."scope" = 'city'      AND "commission_rate_configs"."city_id" IS NOT NULL) OR
        ("commission_rate_configs"."scope" = 'shop_type' AND "commission_rate_configs"."shop_type_slug" IS NOT NULL) OR
        ("commission_rate_configs"."scope" = 'shop')
      ),
	CONSTRAINT "commission_configs_dates_chk" CHECK (
        "commission_rate_configs"."effective_to" IS NULL OR
        "commission_rate_configs"."effective_to" > "commission_rate_configs"."effective_from"
      )
);
--> statement-breakpoint
CREATE TABLE "order_financial_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"payment_transaction_id" uuid,
	"delivery_task_id" uuid,
	"order_total_paise" integer NOT NULL,
	"items_subtotal_paise" integer NOT NULL,
	"discount_total_paise" integer DEFAULT 0 NOT NULL,
	"items_tax_paise" integer DEFAULT 0 NOT NULL,
	"delivery_fee_paise" integer DEFAULT 0 NOT NULL,
	"delivery_tax_paise" integer DEFAULT 0 NOT NULL,
	"tip_paise" integer DEFAULT 0 NOT NULL,
	"commission_rate_applied" numeric(5, 4) NOT NULL,
	"platform_commission_paise" integer NOT NULL,
	"platform_commission_tax_paise" integer DEFAULT 0 NOT NULL,
	"platform_delivery_commission_paise" integer DEFAULT 0 NOT NULL,
	"partner_earning_paise" integer DEFAULT 0 NOT NULL,
	"shop_earning_paise" integer NOT NULL,
	"is_cod" boolean DEFAULT false NOT NULL,
	"cod_amount_paise" integer,
	"cod_remitted_to_shop_paise" integer,
	"status" "split_status" DEFAULT 'pending' NOT NULL,
	"calculated_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"commission_config_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_splits_amounts_chk" CHECK (
        "order_financial_splits"."order_total_paise"                >= 0 AND
        "order_financial_splits"."items_subtotal_paise"             >= 0 AND
        "order_financial_splits"."discount_total_paise"             >= 0 AND
        "order_financial_splits"."items_tax_paise"                  >= 0 AND
        "order_financial_splits"."delivery_fee_paise"               >= 0 AND
        "order_financial_splits"."platform_commission_paise"        >= 0 AND
        "order_financial_splits"."partner_earning_paise"            >= 0 AND
        "order_financial_splits"."shop_earning_paise"               >= 0
      ),
	CONSTRAINT "order_splits_commission_rate_chk" CHECK (
        "order_financial_splits"."commission_rate_applied" >= 0 AND
        "order_financial_splits"."commission_rate_applied" <= 1
      ),
	CONSTRAINT "order_splits_cod_chk" CHECK ("order_financial_splits"."is_cod" = false OR "order_financial_splits"."cod_amount_paise" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "order_split_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"shop_product_id" uuid,
	"item_subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"tax_paise" integer DEFAULT 0 NOT NULL,
	"tax_category_id" uuid,
	"gst_rate_pct" numeric(5, 2),
	"gst_transaction_type" "gst_transaction_type",
	"cgst_paise" integer DEFAULT 0 NOT NULL,
	"sgst_paise" integer DEFAULT 0 NOT NULL,
	"igst_paise" integer DEFAULT 0 NOT NULL,
	"cess_paise" integer DEFAULT 0 NOT NULL,
	"platform_commission_paise" integer NOT NULL,
	"shop_earning_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "split_line_items_amounts_chk" CHECK (
        "order_split_line_items"."item_subtotal_paise"          >= 0 AND
        "order_split_line_items"."discount_paise"              >= 0 AND
        "order_split_line_items"."tax_paise"                   >= 0 AND
        "order_split_line_items"."platform_commission_paise"    >= 0 AND
        "order_split_line_items"."shop_earning_paise"           >= 0
      ),
	CONSTRAINT "split_line_items_tax_type_chk" CHECK (
        ("order_split_line_items"."cgst_paise" > 0 AND "order_split_line_items"."sgst_paise" > 0 AND "order_split_line_items"."igst_paise" = 0) OR
        ("order_split_line_items"."igst_paise" > 0 AND "order_split_line_items"."cgst_paise" = 0 AND "order_split_line_items"."sgst_paise" = 0) OR
        ("order_split_line_items"."cgst_paise" = 0 AND "order_split_line_items"."sgst_paise" = 0 AND "order_split_line_items"."igst_paise" = 0)
      )
);
--> statement-breakpoint
CREATE TABLE "order_tax_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"seller_gstin" varchar(15),
	"seller_state_code" varchar(3),
	"seller_legal_name" varchar(255),
	"buyer_name" varchar(255),
	"buyer_gstin" varchar(15),
	"buyer_state_code" varchar(3),
	"buyer_address" text,
	"transaction_type" "gst_transaction_type" NOT NULL,
	"is_b2b" boolean DEFAULT false NOT NULL,
	"taxable_value_paise" integer NOT NULL,
	"cgst_amount_paise" integer DEFAULT 0 NOT NULL,
	"sgst_amount_paise" integer DEFAULT 0 NOT NULL,
	"igst_amount_paise" integer DEFAULT 0 NOT NULL,
	"utgst_amount_paise" integer DEFAULT 0 NOT NULL,
	"cess_amount_paise" integer DEFAULT 0 NOT NULL,
	"total_tax_amount_paise" integer NOT NULL,
	"delivery_charge_paise" integer DEFAULT 0 NOT NULL,
	"delivery_charge_tax_paise" integer DEFAULT 0 NOT NULL,
	"delivery_sac_code" varchar(20),
	"invoice_number" varchar(50),
	"invoice_date" date,
	"gst_return_month" varchar(7),
	"is_included_in_return" boolean DEFAULT false NOT NULL,
	"return_filed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_tax_ledger_amounts_chk" CHECK (
        "order_tax_ledger"."taxable_value_paise"      >= 0 AND
        "order_tax_ledger"."cgst_amount_paise"        >= 0 AND
        "order_tax_ledger"."sgst_amount_paise"        >= 0 AND
        "order_tax_ledger"."igst_amount_paise"        >= 0 AND
        "order_tax_ledger"."total_tax_amount_paise"    >= 0
      ),
	CONSTRAINT "order_tax_ledger_intra_inter_chk" CHECK (
        ("order_tax_ledger"."transaction_type" = 'intra_state' AND "order_tax_ledger"."igst_amount_paise" = 0) OR
        ("order_tax_ledger"."transaction_type" = 'inter_state' AND "order_tax_ledger"."cgst_amount_paise" = 0
                                                AND "order_tax_ledger"."sgst_amount_paise" = 0) OR
        ("order_tax_ledger"."transaction_type" = 'export')
      )
);
--> statement-breakpoint
CREATE TABLE "platform_fee_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"shop_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"billing_period_start" date NOT NULL,
	"billing_period_end" date NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"gst_rate_pct" numeric(5, 2) NOT NULL,
	"cgst_paise" integer DEFAULT 0 NOT NULL,
	"sgst_paise" integer DEFAULT 0 NOT NULL,
	"igst_paise" integer DEFAULT 0 NOT NULL,
	"total_tax_paise" integer NOT NULL,
	"total_amount_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"credit_applied_paise" integer DEFAULT 0 NOT NULL,
	"amount_due_paise" integer NOT NULL,
	"platform_gstin" varchar(15),
	"shop_gstin" varchar(15),
	"transaction_type" "gst_transaction_type" NOT NULL,
	"status" "platform_fee_payment_status" DEFAULT 'pending' NOT NULL,
	"due_date" date NOT NULL,
	"pdf_key" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_fee_invoices_amounts_chk" CHECK (
        "platform_fee_invoices"."subtotal_paise"       >= 0 AND
        "platform_fee_invoices"."total_amount_paise"    >= 0 AND
        "platform_fee_invoices"."amount_due_paise"      >= 0 AND
        "platform_fee_invoices"."discount_paise"       >= 0 AND
        "platform_fee_invoices"."credit_applied_paise"  >= 0 AND
        "platform_fee_invoices"."total_amount_paise" = "platform_fee_invoices"."subtotal_paise" + "platform_fee_invoices"."total_tax_paise" AND
        "platform_fee_invoices"."amount_due_paise"   = "platform_fee_invoices"."total_amount_paise"
                                - "platform_fee_invoices"."discount_paise"
                                - "platform_fee_invoices"."credit_applied_paise"
      ),
	CONSTRAINT "platform_fee_invoices_period_chk" CHECK ("platform_fee_invoices"."billing_period_end" >= "platform_fee_invoices"."billing_period_start")
);
--> statement-breakpoint
CREATE TABLE "platform_fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"amount_paid_paise" integer NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"external_transaction_id" varchar(255),
	"payment_provider" varchar(100),
	"shop_payout_id" uuid,
	"status" "platform_fee_payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"processed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_fee_payments_amount_chk" CHECK ("platform_fee_payments"."amount_paid_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "platform_fee_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"monthly_amount_paise" integer NOT NULL,
	"annual_amount_paise" integer,
	"setup_fee_paise" integer DEFAULT 0 NOT NULL,
	"max_products" integer,
	"max_categories" integer,
	"max_images" integer,
	"max_monthly_orders" integer,
	"max_branches" integer,
	"features" jsonb,
	"commission_rate_override" numeric(5, 4),
	"trial_days" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_fee_plans_amounts_chk" CHECK (
        "platform_fee_plans"."monthly_amount_paise" >= 0 AND
        ("platform_fee_plans"."annual_amount_paise" IS NULL OR "platform_fee_plans"."annual_amount_paise" >= 0) AND
        "platform_fee_plans"."setup_fee_paise" >= 0
      ),
	CONSTRAINT "platform_fee_plans_commission_chk" CHECK (
        "platform_fee_plans"."commission_rate_override" IS NULL OR
        ("platform_fee_plans"."commission_rate_override" >= 0 AND "platform_fee_plans"."commission_rate_override" <= 1)
      ),
	CONSTRAINT "platform_fee_plans_dates_chk" CHECK (
        "platform_fee_plans"."effective_to" IS NULL OR
        "platform_fee_plans"."effective_to" > "platform_fee_plans"."effective_from"
      )
);
--> statement-breakpoint
CREATE TABLE "platform_revenue_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"city_id" uuid,
	"total_orders_count" integer DEFAULT 0 NOT NULL,
	"delivered_orders_count" integer DEFAULT 0 NOT NULL,
	"cancelled_orders_count" integer DEFAULT 0 NOT NULL,
	"gmv_paise" bigint DEFAULT 0 NOT NULL,
	"commission_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"delivery_commission_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"shop_fee_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"active_shops_on_free_plan" integer DEFAULT 0 NOT NULL,
	"active_shops_on_paid_plan" integer DEFAULT 0 NOT NULL,
	"total_shop_payouts_paise" bigint DEFAULT 0 NOT NULL,
	"total_partner_payouts_paise" bigint DEFAULT 0 NOT NULL,
	"total_refunded_paise" bigint DEFAULT 0 NOT NULL,
	"net_revenue_paise" bigint DEFAULT 0 NOT NULL,
	"gmv_growth_pct" numeric(10, 2),
	"revenue_growth_pct" numeric(10, 2),
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refund_financial_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"refund_id" uuid NOT NULL,
	"shop_earning_reversal_paise" integer DEFAULT 0 NOT NULL,
	"partner_earning_reversal_paise" integer DEFAULT 0 NOT NULL,
	"platform_commission_reversal_paise" integer DEFAULT 0 NOT NULL,
	"tax_reversal_paise" integer DEFAULT 0 NOT NULL,
	"total_refunded_paise" integer NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refund_adjustments_amounts_chk" CHECK (
        "refund_financial_adjustments"."shop_earning_reversal_paise"         >= 0 AND
        "refund_financial_adjustments"."partner_earning_reversal_paise"       >= 0 AND
        "refund_financial_adjustments"."platform_commission_reversal_paise"   >= 0 AND
        "refund_financial_adjustments"."total_refunded_paise"                > 0
      )
);
--> statement-breakpoint
CREATE TABLE "shop_earnings_ledger" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shop_earnings_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"shop_id" uuid NOT NULL,
	"order_id" uuid,
	"split_id" uuid,
	"entry_type" "shop_earnings_entry_type" NOT NULL,
	"amount_paise" integer NOT NULL,
	"balance_before_paise" integer NOT NULL,
	"balance_after_paise" integer NOT NULL,
	"description" text,
	"internal_note" text,
	"payout_id" uuid,
	"processed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_earnings_ledger_balance_chk" CHECK ("shop_earnings_ledger"."balance_after_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "shop_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_number" varchar(50) NOT NULL,
	"shop_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"gross_earnings_paise" integer NOT NULL,
	"deductions_paise" integer DEFAULT 0 NOT NULL,
	"platform_fee_deducted_paise" integer DEFAULT 0 NOT NULL,
	"net_paise_to_be_paid" integer NOT NULL,
	"orders_count" integer DEFAULT 0 NOT NULL,
	"bank_account_id" uuid,
	"bank_account_snapshot" jsonb,
	"status" "shop_payout_status" DEFAULT 'pending' NOT NULL,
	"initiated_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"external_transaction_id" varchar(255),
	"failure_reason" text,
	"processed_by" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_payouts_period_chk" CHECK ("shop_payouts"."period_end" > "shop_payouts"."period_start"),
	CONSTRAINT "shop_payouts_amounts_chk" CHECK (
        "shop_payouts"."gross_earnings_paise"       >= 0 AND
        "shop_payouts"."deductions_paise"          >= 0 AND
        "shop_payouts"."platform_fee_deducted_paise" >= 0 AND
        "shop_payouts"."net_paise_to_be_paid"         >= 0 AND
        "shop_payouts"."net_paise_to_be_paid" = "shop_payouts"."gross_earnings_paise"
                               - "shop_payouts"."deductions_paise"
                               - "shop_payouts"."platform_fee_deducted_paise"
      )
);
--> statement-breakpoint
CREATE TABLE "shop_revenue_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"date" date NOT NULL,
	"orders_placed" integer DEFAULT 0 NOT NULL,
	"orders_delivered" integer DEFAULT 0 NOT NULL,
	"orders_cancelled" integer DEFAULT 0 NOT NULL,
	"orders_refunded" integer DEFAULT 0 NOT NULL,
	"gross_sales_paise" bigint DEFAULT 0 NOT NULL,
	"discount_given_paise" bigint DEFAULT 0 NOT NULL,
	"platform_commission_paid_paise" bigint DEFAULT 0 NOT NULL,
	"net_earnings_paise" bigint DEFAULT 0 NOT NULL,
	"refunds_issued_paise" bigint DEFAULT 0 NOT NULL,
	"average_order_value_paise" integer,
	"top_products_by_revenue" jsonb,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_subscription_billing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_slug" varchar(50) NOT NULL,
	"status" "shop_subscription_billing_status" DEFAULT 'trialing' NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"next_billing_date" timestamp with time zone,
	"last_billed_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"deduction_method" "fee_deduction_method" DEFAULT 'deduct_from_payout' NOT NULL,
	"auto_pay_enabled" boolean DEFAULT false NOT NULL,
	"auto_pay_method_id" uuid,
	"billing_failure_count" smallint DEFAULT 0 NOT NULL,
	"last_billing_error" text,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_subscription_billing_period_chk" CHECK ("shop_subscription_billing"."current_period_end" > "shop_subscription_billing"."current_period_start"),
	CONSTRAINT "shop_subscription_billing_failure_chk" CHECK ("shop_subscription_billing"."billing_failure_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "tax_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"gst_rate_pct" numeric(5, 2) NOT NULL,
	"cess_rate_pct" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"hsn_code" varchar(20),
	"sac_code" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_categories_rate_chk" CHECK (
        "tax_categories"."gst_rate_pct"  >= 0 AND "tax_categories"."gst_rate_pct"  <= 100 AND
        "tax_categories"."cess_rate_pct" >= 0 AND "tax_categories"."cess_rate_pct" <= 100
      ),
	CONSTRAINT "tax_categories_dates_chk" CHECK (
        "tax_categories"."effective_to" IS NULL OR
        "tax_categories"."effective_to" > "tax_categories"."effective_from"
      )
);
--> statement-breakpoint
CREATE TABLE "tax_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"seller_state_code" varchar(3),
	"buyer_state_code" varchar(3),
	"transaction_type" "gst_transaction_type" NOT NULL,
	"reverse_charge" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" smallint DEFAULT 0 NOT NULL,
	"effective_from" date NOT NULL,
	"effective_to" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_attempts" ADD CONSTRAINT "auth_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_attempts" ADD CONSTRAINT "auth_attempts_session_id_user_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."user_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_users_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceable_pincodes" ADD CONSTRAINT "serviceable_pincodes_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_profiles" ADD CONSTRAINT "delivery_partner_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_profiles" ADD CONSTRAINT "delivery_partner_profiles_primary_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("primary_bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_profiles" ADD CONSTRAINT "delivery_partner_profiles_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_owner_profiles" ADD CONSTRAINT "shop_owner_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_owner_profiles" ADD CONSTRAINT "shop_owner_profiles_primary_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("primary_bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_ai_recommendations" ADD CONSTRAINT "shop_ai_recommendations_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_ai_recommendations" ADD CONSTRAINT "shop_ai_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_branches" ADD CONSTRAINT "shop_branches_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_branches" ADD CONSTRAINT "shop_branches_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_holidays" ADD CONSTRAINT "shop_holidays_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_hours" ADD CONSTRAINT "shop_hours_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_reviews" ADD CONSTRAINT "shop_reviews_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_stats" ADD CONSTRAINT "shop_stats_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verifications" ADD CONSTRAINT "shop_verifications_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verifications" ADD CONSTRAINT "shop_verifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_shop_type_id_shop_types_id_fk" FOREIGN KEY ("shop_type_id") REFERENCES "public"."shop_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_primary_address_id_addresses_id_fk" FOREIGN KEY ("primary_address_id") REFERENCES "public"."addresses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_announcement_id_shop_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."shop_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_dismissals" ADD CONSTRAINT "announcement_dismissals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_alerts" ADD CONSTRAINT "back_in_stock_alerts_saved_id_saved_for_later_id_fk" FOREIGN KEY ("saved_id") REFERENCES "public"."saved_for_later"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_alerts" ADD CONSTRAINT "back_in_stock_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_alerts" ADD CONSTRAINT "back_in_stock_alerts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_alerts" ADD CONSTRAINT "back_in_stock_alerts_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "back_in_stock_alerts" ADD CONSTRAINT "back_in_stock_alerts_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_categories" ADD CONSTRAINT "brand_categories_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_categories" ADD CONSTRAINT "brand_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_parent_brand_fk" FOREIGN KEY ("parent_brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_ai_recommendations" ADD CONSTRAINT "catalog_ai_recommendations_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_ai_recommendations" ADD CONSTRAINT "catalog_ai_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_daily_checkins" ADD CONSTRAINT "coins_daily_checkins_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_daily_checkins" ADD CONSTRAINT "coins_daily_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_daily_checkins" ADD CONSTRAINT "coins_daily_checkins_transaction_id_coins_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."coins_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_expiration_ledger" ADD CONSTRAINT "coins_expiration_ledger_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_expiration_ledger" ADD CONSTRAINT "coins_expiration_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_expiration_ledger" ADD CONSTRAINT "coins_expiration_ledger_transaction_id_coins_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."coins_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_redemption_catalog" ADD CONSTRAINT "coins_redemption_catalog_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_redemptions" ADD CONSTRAINT "coins_redemptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_redemptions" ADD CONSTRAINT "coins_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_redemptions" ADD CONSTRAINT "coins_redemptions_catalog_item_id_coins_redemption_catalog_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."coins_redemption_catalog"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_redemptions" ADD CONSTRAINT "coins_redemptions_transaction_id_coins_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."coins_transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_referrals" ADD CONSTRAINT "coins_referrals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_referrals" ADD CONSTRAINT "coins_referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_transactions" ADD CONSTRAINT "coins_transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coins_transactions" ADD CONSTRAINT "coins_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_coupon_id_shop_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_categories" ADD CONSTRAINT "coupon_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_code_batches" ADD CONSTRAINT "coupon_code_batches_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_code_batches" ADD CONSTRAINT "coupon_code_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_code_instances" ADD CONSTRAINT "coupon_code_instances_batch_id_coupon_code_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."coupon_code_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_code_instances" ADD CONSTRAINT "coupon_code_instances_coupon_id_shop_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_collections" ADD CONSTRAINT "coupon_collections_coupon_id_shop_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_collections" ADD CONSTRAINT "coupon_collections_collection_id_shop_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."shop_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_coupon_id_shop_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_products" ADD CONSTRAINT "coupon_products_product_id_shop_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage_history" ADD CONSTRAINT "coupon_usage_history_coupon_id_shop_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."shop_coupons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_coins_balance" ADD CONSTRAINT "customer_coins_balance_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_coins_balance" ADD CONSTRAINT "customer_coins_balance_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tier_history" ADD CONSTRAINT "customer_tier_history_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tier_history" ADD CONSTRAINT "customer_tier_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_pick_products" ADD CONSTRAINT "daily_pick_products_daily_pick_id_daily_picks_id_fk" FOREIGN KEY ("daily_pick_id") REFERENCES "public"."daily_picks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_pick_products" ADD CONSTRAINT "daily_pick_products_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_picks" ADD CONSTRAINT "daily_picks_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_picks" ADD CONSTRAINT "daily_picks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_master_product_reports" ADD CONSTRAINT "duplicate_master_product_reports_master_product_1_id_master_products_id_fk" FOREIGN KEY ("master_product_1_id") REFERENCES "public"."master_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_master_product_reports" ADD CONSTRAINT "duplicate_master_product_reports_master_product_2_id_master_products_id_fk" FOREIGN KEY ("master_product_2_id") REFERENCES "public"."master_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_master_product_reports" ADD CONSTRAINT "duplicate_master_product_reports_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_master_product_reports" ADD CONSTRAINT "duplicate_master_product_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duplicate_master_product_reports" ADD CONSTRAINT "duplicate_master_product_reports_merged_into_id_master_products_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_group_members" ADD CONSTRAINT "filter_group_members_group_id_filter_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."filter_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_group_members" ADD CONSTRAINT "filter_group_members_filter_id_product_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."product_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_groups" ADD CONSTRAINT "filter_groups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_presets" ADD CONSTRAINT "filter_presets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_presets" ADD CONSTRAINT "filter_presets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_images" ADD CONSTRAINT "master_product_images_master_product_id_master_products_id_fk" FOREIGN KEY ("master_product_id") REFERENCES "public"."master_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_images" ADD CONSTRAINT "master_product_images_variant_id_master_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."master_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_matching_queue" ADD CONSTRAINT "master_product_matching_queue_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_matching_queue" ADD CONSTRAINT "master_product_matching_queue_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_matching_queue" ADD CONSTRAINT "master_product_matching_queue_suggestion_id_master_product_push_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."master_product_push_suggestions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_suggested_master_product_id_master_products_id_fk" FOREIGN KEY ("suggested_master_product_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_created_master_product_id_master_products_id_fk" FOREIGN KEY ("created_master_product_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_push_suggestions" ADD CONSTRAINT "master_product_push_suggestions_merged_into_master_product_id_master_products_id_fk" FOREIGN KEY ("merged_into_master_product_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_leaf_category_id_categories_id_fk" FOREIGN KEY ("leaf_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_uploader_admin_id_users_id_fk" FOREIGN KEY ("uploader_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_products" ADD CONSTRAINT "master_products_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_product_variants" ADD CONSTRAINT "master_product_variants_master_product_id_master_products_id_fk" FOREIGN KEY ("master_product_id") REFERENCES "public"."master_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_drop_alerts" ADD CONSTRAINT "price_drop_alerts_saved_id_saved_for_later_id_fk" FOREIGN KEY ("saved_id") REFERENCES "public"."saved_for_later"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_drop_alerts" ADD CONSTRAINT "price_drop_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_drop_alerts" ADD CONSTRAINT "price_drop_alerts_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_selected_product_id_shop_products_id_fk" FOREIGN KEY ("selected_product_id") REFERENCES "public"."shop_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filter_values" ADD CONSTRAINT "product_filter_values_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filter_values" ADD CONSTRAINT "product_filter_values_filter_id_product_filters_id_fk" FOREIGN KEY ("filter_id") REFERENCES "public"."product_filters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filter_values" ADD CONSTRAINT "product_filter_values_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filters" ADD CONSTRAINT "product_filters_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filters" ADD CONSTRAINT "product_filters_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filters" ADD CONSTRAINT "product_filters_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_filters" ADD CONSTRAINT "product_filters_depends_on_fk" FOREIGN KEY ("depends_on_filter_id") REFERENCES "public"."product_filters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_interactions" ADD CONSTRAINT "product_interactions_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_interactions" ADD CONSTRAINT "product_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_source_product_id_shop_products_id_fk" FOREIGN KEY ("source_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_linked_product_id_shop_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_links" ADD CONSTRAINT "product_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_popularity_scores" ADD CONSTRAINT "product_popularity_scores_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_asked_by_user_id_users_id_fk" FOREIGN KEY ("asked_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_answered_by_user_id_users_id_fk" FOREIGN KEY ("answered_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_view_aggregates" ADD CONSTRAINT "product_view_aggregates_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_views" ADD CONSTRAINT "product_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_votes" ADD CONSTRAINT "question_votes_question_id_product_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."product_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_votes" ADD CONSTRAINT "question_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_queue" ADD CONSTRAINT "recommendation_queue_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_queue" ADD CONSTRAINT "recommendation_queue_source_product_id_shop_products_id_fk" FOREIGN KEY ("source_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_queue" ADD CONSTRAINT "recommendation_queue_recommended_product_id_shop_products_id_fk" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_queue" ADD CONSTRAINT "recommendation_queue_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_queue" ADD CONSTRAINT "recommendation_queue_created_link_id_product_links_id_fk" FOREIGN KEY ("created_link_id") REFERENCES "public"."product_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_item_collections" ADD CONSTRAINT "saved_item_collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_suggestions" ADD CONSTRAINT "search_suggestions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_announcements" ADD CONSTRAINT "shop_announcements_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_announcements" ADD CONSTRAINT "shop_announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_coins_config" ADD CONSTRAINT "shop_coins_config_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_collection_products" ADD CONSTRAINT "shop_collection_products_collection_id_shop_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."shop_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_collection_products" ADD CONSTRAINT "shop_collection_products_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_collection_products" ADD CONSTRAINT "shop_collection_products_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_collections" ADD CONSTRAINT "shop_collections_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_collections" ADD CONSTRAINT "shop_collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_coupons" ADD CONSTRAINT "shop_coupons_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_coupons" ADD CONSTRAINT "shop_coupons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_images" ADD CONSTRAINT "shop_product_images_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_images" ADD CONSTRAINT "shop_product_images_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_prices" ADD CONSTRAINT "shop_product_prices_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_prices" ADD CONSTRAINT "shop_product_prices_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_pricing_tiers" ADD CONSTRAINT "shop_product_pricing_tiers_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_pricing_tiers" ADD CONSTRAINT "shop_product_pricing_tiers_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_master_product_id_master_products_id_fk" FOREIGN KEY ("master_product_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_variants" ADD CONSTRAINT "shop_product_variants_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_product_variants" ADD CONSTRAINT "shop_product_variants_master_product_variant_id_master_product_variants_id_fk" FOREIGN KEY ("master_product_variant_id") REFERENCES "public"."master_product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alert_history" ADD CONSTRAINT "stock_alert_history_alert_id_stock_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."stock_alerts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alert_history" ADD CONSTRAINT "stock_alert_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trending_categories" ADD CONSTRAINT "trending_categories_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trending_products" ADD CONSTRAINT "trending_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trending_searches" ADD CONSTRAINT "trending_searches_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "abandoned_carts" ADD CONSTRAINT "abandoned_carts_recovered_order_id_orders_id_fk" FOREIGN KEY ("recovered_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_auto_top_up_payment_method_id_saved_payment_methods_id_fk" FOREIGN KEY ("auto_top_up_payment_method_id") REFERENCES "public"."saved_payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_gift_cards_id_fk" FOREIGN KEY ("gift_card_id") REFERENCES "public"."gift_cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchased_by_users_id_fk" FOREIGN KEY ("purchased_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchase_order_id_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_analytics" ADD CONSTRAINT "order_analytics_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_shop_product_variant_id_shop_product_variants_id_fk" FOREIGN KEY ("shop_product_variant_id") REFERENCES "public"."shop_product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_disputes" ADD CONSTRAINT "payment_disputes_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_line_items" ADD CONSTRAINT "refund_line_items_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_line_items" ADD CONSTRAINT "refund_line_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_payment_methods" ADD CONSTRAINT "saved_payment_methods_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_saved_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."saved_payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_customer_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."customer_wallets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_tracking_events" ADD CONSTRAINT "carrier_tracking_events_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_tracking_events" ADD CONSTRAINT "carrier_tracking_events_carrier_id_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_delivery_ratings" ADD CONSTRAINT "customer_delivery_ratings_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_delivery_ratings" ADD CONSTRAINT "customer_delivery_ratings_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_delivery_ratings" ADD CONSTRAINT "customer_delivery_ratings_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_delivery_ratings" ADD CONSTRAINT "customer_delivery_ratings_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_analytics" ADD CONSTRAINT "delivery_analytics_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_analytics" ADD CONSTRAINT "delivery_analytics_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_attempts" ADD CONSTRAINT "delivery_attempts_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_incidents" ADD CONSTRAINT "delivery_incidents_escalated_to_users_id_fk" FOREIGN KEY ("escalated_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_sessions" ADD CONSTRAINT "delivery_partner_sessions_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_sessions" ADD CONSTRAINT "delivery_partner_sessions_shift_id_partner_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."partner_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_route_stops" ADD CONSTRAINT "delivery_route_stops_route_id_delivery_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."delivery_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_route_stops" ADD CONSTRAINT "delivery_route_stops_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_shift_id_partner_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."partner_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_sla_policies" ADD CONSTRAINT "delivery_sla_policies_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_sla_policies" ADD CONSTRAINT "delivery_sla_policies_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_task_status_history" ADD CONSTRAINT "delivery_task_status_history_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_tasks" ADD CONSTRAINT "delivery_tasks_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_pings" ADD CONSTRAINT "live_location_pings_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_pings" ADD CONSTRAINT "live_location_pings_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_location_pings" ADD CONSTRAINT "live_location_pings_shift_id_partner_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."partner_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_snapshots" ADD CONSTRAINT "location_snapshots_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_snapshots" ADD CONSTRAINT "location_snapshots_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_snapshots" ADD CONSTRAINT "location_snapshots_shift_id_partner_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."partner_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_availability_slots" ADD CONSTRAINT "partner_availability_slots_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_availability_slots" ADD CONSTRAINT "partner_availability_slots_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_earnings_ledger" ADD CONSTRAINT "partner_earnings_ledger_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_earnings_ledger" ADD CONSTRAINT "partner_earnings_ledger_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_earnings_ledger" ADD CONSTRAINT "partner_earnings_ledger_shift_id_partner_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."partner_shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_payouts" ADD CONSTRAINT "partner_payouts_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_performance" ADD CONSTRAINT "partner_performance_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_shifts" ADD CONSTRAINT "partner_shifts_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_shifts" ADD CONSTRAINT "partner_shifts_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_task_id_delivery_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_partner_id_delivery_partner_profiles_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."delivery_partner_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_zones" ADD CONSTRAINT "service_zones_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_carrier_accounts" ADD CONSTRAINT "shop_carrier_accounts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_carrier_accounts" ADD CONSTRAINT "shop_carrier_accounts_carrier_id_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_service_zones" ADD CONSTRAINT "shop_service_zones_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_service_zones" ADD CONSTRAINT "shop_service_zones_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surge_pricing_windows" ADD CONSTRAINT "surge_pricing_windows_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surge_pricing_windows" ADD CONSTRAINT "surge_pricing_windows_activated_by_users_id_fk" FOREIGN KEY ("activated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surge_pricing_windows" ADD CONSTRAINT "surge_pricing_windows_deactivated_by_users_id_fk" FOREIGN KEY ("deactivated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_serviceable_pincodes" ADD CONSTRAINT "zone_serviceable_pincodes_zone_id_service_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."service_zones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zone_serviceable_pincodes" ADD CONSTRAINT "zone_serviceable_pincodes_serviceable_pincode_id_serviceable_pincodes_id_fk" FOREIGN KEY ("serviceable_pincode_id") REFERENCES "public"."serviceable_pincodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_applications" ADD CONSTRAINT "delivery_partner_applications_applicant_user_id_users_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_applications" ADD CONSTRAINT "delivery_partner_applications_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_partner_applications" ADD CONSTRAINT "delivery_partner_applications_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dp_onboarding_checklist" ADD CONSTRAINT "dp_onboarding_checklist_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_shop_cache" ADD CONSTRAINT "nearby_shop_cache_serviceable_pincode_id_serviceable_pincodes_id_fk" FOREIGN KEY ("serviceable_pincode_id") REFERENCES "public"."serviceable_pincodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nearby_shop_cache" ADD CONSTRAINT "nearby_shop_cache_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcements" ADD CONSTRAINT "platform_announcements_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcements" ADD CONSTRAINT "platform_announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config_history" ADD CONSTRAINT "platform_config_history_config_id_platform_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."platform_config"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config_history" ADD CONSTRAINT "platform_config_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_config" ADD CONSTRAINT "platform_config_last_changed_by_users_id_fk" FOREIGN KEY ("last_changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_health_metrics" ADD CONSTRAINT "platform_health_metrics_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_analytics" ADD CONSTRAINT "platform_search_analytics_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_log" ADD CONSTRAINT "platform_search_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_log" ADD CONSTRAINT "platform_search_log_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_log" ADD CONSTRAINT "platform_search_log_clicked_shop_id_shops_id_fk" FOREIGN KEY ("clicked_shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_log" ADD CONSTRAINT "platform_search_log_clicked_product_id_master_products_id_fk" FOREIGN KEY ("clicked_product_id") REFERENCES "public"."master_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_search_log" ADD CONSTRAINT "platform_search_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_onboarding_checklist" ADD CONSTRAINT "shop_onboarding_checklist_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verification_history" ADD CONSTRAINT "shop_verification_history_queue_id_shop_verification_queue_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."shop_verification_queue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verification_history" ADD CONSTRAINT "shop_verification_history_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verification_history" ADD CONSTRAINT "shop_verification_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verification_queue" ADD CONSTRAINT "shop_verification_queue_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_verification_queue" ADD CONSTRAINT "shop_verification_queue_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "static_pages" ADD CONSTRAINT "static_pages_last_updated_by_users_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_categories" ADD CONSTRAINT "support_categories_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."support_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_raised_by_id_users_id_fk" FOREIGN KEY ("raised_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_category_id_support_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."support_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_log" ADD CONSTRAINT "admin_action_log_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_impressions" ADD CONSTRAINT "banner_impressions_banner_id_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banner_impressions" ADD CONSTRAINT "banner_impressions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_audience_id_campaign_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."campaign_audiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience_members" ADD CONSTRAINT "campaign_audience_members_campaign_id_promotion_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience_members" ADD CONSTRAINT "campaign_audience_members_audience_id_campaign_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."campaign_audiences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience_members" ADD CONSTRAINT "campaign_audience_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_audience_members" ADD CONSTRAINT "campaign_audience_members_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_variants" ADD CONSTRAINT "campaign_variants_campaign_id_promotion_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_variants" ADD CONSTRAINT "campaign_variants_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_log" ADD CONSTRAINT "consent_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignments" ADD CONSTRAINT "coupon_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_assignments" ADD CONSTRAINT "coupon_assignments_campaign_id_promotion_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promotion_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_deletion_log" ADD CONSTRAINT "data_deletion_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_deletion_log" ADD CONSTRAINT "data_deletion_log_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_deletion_log" ADD CONSTRAINT "data_deletion_log_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_log" ADD CONSTRAINT "data_export_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_log" ADD CONSTRAINT "data_export_log_exported_by_users_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_audit" ADD CONSTRAINT "login_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_devices" ADD CONSTRAINT "notification_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_interactions" ADD CONSTRAINT "notification_interactions_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_interactions" ADD CONSTRAINT "notification_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_template_id_notification_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_batch_id_notification_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."notification_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_change_log" ADD CONSTRAINT "permission_change_log_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_change_log" ADD CONSTRAINT "permission_change_log_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_change_log" ADD CONSTRAINT "permission_change_log_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_interactions" ADD CONSTRAINT "popup_interactions_popup_id_popups_id_fk" FOREIGN KEY ("popup_id") REFERENCES "public"."popups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popup_interactions" ADD CONSTRAINT "popup_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popups" ADD CONSTRAINT "popups_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "popups" ADD CONSTRAINT "popups_audience_id_campaign_audiences_id_fk" FOREIGN KEY ("audience_id") REFERENCES "public"."campaign_audiences"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_campaigns" ADD CONSTRAINT "promotion_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_logs" ADD CONSTRAINT "referral_logs_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_logs" ADD CONSTRAINT "referral_logs_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_banner_assignments" ADD CONSTRAINT "shop_banner_assignments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_banner_assignments" ADD CONSTRAINT "shop_banner_assignments_banner_id_banners_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rate_configs" ADD CONSTRAINT "commission_rate_configs_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_rate_configs" ADD CONSTRAINT "commission_rate_configs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_financial_splits" ADD CONSTRAINT "order_financial_splits_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_financial_splits" ADD CONSTRAINT "order_financial_splits_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_financial_splits" ADD CONSTRAINT "order_financial_splits_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_financial_splits" ADD CONSTRAINT "order_financial_splits_delivery_task_id_delivery_tasks_id_fk" FOREIGN KEY ("delivery_task_id") REFERENCES "public"."delivery_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_split_line_items" ADD CONSTRAINT "order_split_line_items_split_id_order_financial_splits_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."order_financial_splits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_split_line_items" ADD CONSTRAINT "order_split_line_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_split_line_items" ADD CONSTRAINT "order_split_line_items_shop_product_id_shop_products_id_fk" FOREIGN KEY ("shop_product_id") REFERENCES "public"."shop_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tax_ledger" ADD CONSTRAINT "order_tax_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_tax_ledger" ADD CONSTRAINT "order_tax_ledger_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_invoices" ADD CONSTRAINT "platform_fee_invoices_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_invoices" ADD CONSTRAINT "platform_fee_invoices_subscription_id_shop_subscription_billing_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."shop_subscription_billing"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_invoices" ADD CONSTRAINT "platform_fee_invoices_plan_id_platform_fee_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."platform_fee_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_payments" ADD CONSTRAINT "platform_fee_payments_invoice_id_platform_fee_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."platform_fee_invoices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_payments" ADD CONSTRAINT "platform_fee_payments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_payments" ADD CONSTRAINT "platform_fee_payments_shop_payout_id_shop_payouts_id_fk" FOREIGN KEY ("shop_payout_id") REFERENCES "public"."shop_payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fee_payments" ADD CONSTRAINT "platform_fee_payments_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_revenue_analytics" ADD CONSTRAINT "platform_revenue_analytics_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_financial_adjustments" ADD CONSTRAINT "refund_financial_adjustments_split_id_order_financial_splits_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."order_financial_splits"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_financial_adjustments" ADD CONSTRAINT "refund_financial_adjustments_refund_id_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."refunds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_earnings_ledger" ADD CONSTRAINT "shop_earnings_ledger_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_earnings_ledger" ADD CONSTRAINT "shop_earnings_ledger_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_earnings_ledger" ADD CONSTRAINT "shop_earnings_ledger_split_id_order_financial_splits_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."order_financial_splits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_earnings_ledger" ADD CONSTRAINT "shop_earnings_ledger_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_payouts" ADD CONSTRAINT "shop_payouts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_payouts" ADD CONSTRAINT "shop_payouts_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_revenue_analytics" ADD CONSTRAINT "shop_revenue_analytics_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_subscription_billing" ADD CONSTRAINT "shop_subscription_billing_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_subscription_billing" ADD CONSTRAINT "shop_subscription_billing_plan_id_platform_fee_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."platform_fee_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_attempts_user_created_idx" ON "auth_attempts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_created_idx" ON "auth_attempts" USING btree ("ip_address","created_at");--> statement-breakpoint
CREATE INDEX "auth_attempts_phone_idx" ON "auth_attempts" USING btree ("phone_attempted");--> statement-breakpoint
CREATE INDEX "auth_attempts_ip_fail_idx" ON "auth_attempts" USING btree ("ip_address","created_at") WHERE success = false;--> statement-breakpoint
CREATE INDEX "auth_audit_log_actorid_idx" ON "auth_audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "auth_audit_log_resource_idx" ON "auth_audit_log" USING btree ("resource","resource_id");--> statement-breakpoint
CREATE INDEX "auth_audit_log_createdat_idx" ON "auth_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_audit_log_action_idx" ON "auth_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "auth_audit_log_requestid_idx" ON "auth_audit_log" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "otp_phone_idx" ON "otp_verifications" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "otp_email_idx" ON "otp_verifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX "otp_userid_idx" ON "otp_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "otp_expiresat_idx" ON "otp_verifications" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_active_phone_idx" ON "otp_verifications" USING btree ("phone","purpose") WHERE 
    phone IS NOT NULL
    AND verified = false
    AND consumed_at IS NULL
    ;--> statement-breakpoint
CREATE UNIQUE INDEX "otp_active_email_idx" ON "otp_verifications" USING btree ("email","purpose") WHERE 
    email IS NOT NULL
    AND verified = false
    AND consumed_at IS NULL
    ;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_action_resource_uq" ON "permissions" USING btree ("action","resource");--> statement-breakpoint
CREATE INDEX "permissions_resource_idx" ON "permissions" USING btree ("resource");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limits_key_action_uq" ON "rate_limits" USING btree ("key","action");--> statement-breakpoint
CREATE INDEX "rate_limits_window_idx" ON "rate_limits" USING btree ("window_end");--> statement-breakpoint
CREATE INDEX "rate_limits_blocked_idx" ON "rate_limits" USING btree ("blocked_until");--> statement-breakpoint
CREATE INDEX "rate_limits_active_block_idx" ON "rate_limits" USING btree ("blocked_until") WHERE blocked_until IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "referral_codes_code_uq_idx" ON "referral_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "referral_codes_userid_idx" ON "referral_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "referrals_referrerid_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "referrals_refereeid_idx" ON "referrals" USING btree ("referee_id");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "role_permissions_role_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_devices_userid_idx" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_devices_last_active_idx" ON "user_devices" USING btree ("last_active_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_global_uq" ON "user_roles" USING btree ("user_id","role_id") WHERE shop_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_shop_uq" ON "user_roles" USING btree ("user_id","role_id","shop_id") WHERE shop_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "user_roles_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_roles_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_roles_shop_idx" ON "user_roles" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "sessions_userid_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiresat_idx" ON "user_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "user_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_refresh_token_idx" ON "user_sessions" USING btree ("refresh_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_active_idx" ON "user_sessions" USING btree ("user_id","expires_at") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_unique_idx" ON "users" USING btree ("phone") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique_idx" ON "users" USING btree ("email") WHERE email IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("id") WHERE deleted_at IS NULL AND status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_uq_idx" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_state_idx" ON "cities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "cities_active_idx" ON "cities" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "serviceable_pincodes_pincode_uq_idx" ON "serviceable_pincodes" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "serviceable_pincodes_city_idx" ON "serviceable_pincodes" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "serviceable_pincodes_active_idx" ON "serviceable_pincodes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "addresses_city_idx" ON "addresses" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "addresses_pincode_idx" ON "addresses" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "addresses_active_idx" ON "addresses" USING btree ("user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_default_uq_idx" ON "addresses" USING btree ("user_id") WHERE is_default = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "bank_accounts_user_idx" ON "bank_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_active_idx" ON "bank_accounts" USING btree ("user_id") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_primary_uq_idx" ON "bank_accounts" USING btree ("user_id") WHERE is_primary = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "customer_profiles_last_order_idx" ON "customer_profiles" USING btree ("last_order_at");--> statement-breakpoint
CREATE INDEX "dp_profiles_kyc_status_idx" ON "delivery_partner_profiles" USING btree ("kyc_status");--> statement-breakpoint
CREATE UNIQUE INDEX "dp_profiles_license_uq_idx" ON "delivery_partner_profiles" USING btree ("license_number");--> statement-breakpoint
CREATE INDEX "kyc_documents_user_idx" ON "kyc_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kyc_documents_type_idx" ON "kyc_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "kyc_documents_user_type_idx" ON "kyc_documents" USING btree ("user_id","document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_documents_active_type_uq_idx" ON "kyc_documents" USING btree ("user_id","document_type") WHERE status NOT IN ('rejected', 'expired');--> statement-breakpoint
CREATE INDEX "shop_owner_profiles_kyc_status_idx" ON "shop_owner_profiles" USING btree ("kyc_status");--> statement-breakpoint
CREATE INDEX "shop_owner_profiles_is_verified_idx" ON "shop_owner_profiles" USING btree ("is_verified");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_shop_slug_uq_idx" ON "categories" USING btree ("shop_id","slug");--> statement-breakpoint
CREATE INDEX "categories_shop_idx" ON "categories" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pre_categories_slug_uq_idx" ON "pre_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "pre_categories_active_idx" ON "pre_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shop_ai_recommendations_shop_idx" ON "shop_ai_recommendations" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shop_ai_recommendations_user_idx" ON "shop_ai_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shop_ai_recommendations_type_idx" ON "shop_ai_recommendations" USING btree ("recommendation_type");--> statement-breakpoint
CREATE INDEX "shop_ai_recommendations_expires_idx" ON "shop_ai_recommendations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "shop_branches_shop_idx" ON "shop_branches" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_branches_name_uq_idx" ON "shop_branches" USING btree ("shop_id","name");--> statement-breakpoint
CREATE INDEX "shop_branches_active_idx" ON "shop_branches" USING btree ("shop_id") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "shop_holidays_shop_date_idx" ON "shop_holidays" USING btree ("shop_id","start_date");--> statement-breakpoint
CREATE INDEX "shop_hours_shop_idx" ON "shop_hours" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_hours_shop_day_uq_idx" ON "shop_hours" USING btree ("shop_id","day_of_week");--> statement-breakpoint
CREATE INDEX "shop_reviews_shop_idx" ON "shop_reviews" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shop_reviews_user_idx" ON "shop_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shop_reviews_shop_created_idx" ON "shop_reviews" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_reviews_shop_user_uq_idx" ON "shop_reviews" USING btree ("shop_id","user_id");--> statement-breakpoint
CREATE INDEX "shop_reviews_visible_idx" ON "shop_reviews" USING btree ("shop_id","rating") WHERE is_hidden = false;--> statement-breakpoint
CREATE INDEX "shop_stats_rating_idx" ON "shop_stats" USING btree ("rating_sum","rating_count");--> statement-breakpoint
CREATE INDEX "shop_stats_orders_idx" ON "shop_stats" USING btree ("total_orders");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_types_slug_uq_idx" ON "shop_types" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_types_name_uq_idx" ON "shop_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX "shop_types_active_idx" ON "shop_types" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shop_verifications_shop_idx" ON "shop_verifications" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shop_verifications_status_idx" ON "shop_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shop_verifications_type_idx" ON "shop_verifications" USING btree ("document_type");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_verifications_active_type_uq_idx" ON "shop_verifications" USING btree ("shop_id","document_type") WHERE status NOT IN ('rejected', 'expired');--> statement-breakpoint
CREATE INDEX "shops_owner_idx" ON "shops" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "shops_status_idx" ON "shops" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shops_city_idx" ON "shops" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "shops_shop_type_idx" ON "shops" USING btree ("shop_type_id");--> statement-breakpoint
CREATE INDEX "shops_published_city_idx" ON "shops" USING btree ("city_id","is_published") WHERE is_published = true AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shops_username_uq_idx" ON "shops" USING btree ("username") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shops_type_slug_uq_idx" ON "shops" USING btree ("shop_type_id","slug") WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shops_phone_uq_idx" ON "shops" USING btree ("phone") WHERE phone IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shops_email_uq_idx" ON "shops" USING btree ("email") WHERE email IS NOT NULL AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "announcement_dismissals_announcement_idx" ON "announcement_dismissals" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "announcement_dismissals_user_idx" ON "announcement_dismissals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "back_in_stock_alerts_user_idx" ON "back_in_stock_alerts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "back_in_stock_alerts_product_idx" ON "back_in_stock_alerts" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "back_in_stock_alerts_pending_idx" ON "back_in_stock_alerts" USING btree ("notification_sent","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_categories_brand_cat_uq_idx" ON "brand_categories" USING btree ("brand_id","category_id");--> statement-breakpoint
CREATE INDEX "brand_categories_brand_idx" ON "brand_categories" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_categories_category_idx" ON "brand_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_slug_uq_idx" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "brands_active_verified_idx" ON "brands" USING btree ("is_active","is_verified");--> statement-breakpoint
CREATE INDEX "brands_parent_idx" ON "brands" USING btree ("parent_brand_id","is_active");--> statement-breakpoint
CREATE INDEX "brands_featured_idx" ON "brands" USING btree ("is_featured","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "bundle_items_uq_idx" ON "bundle_items" USING btree ("bundle_id","shop_product_id","shop_product_variant_id");--> statement-breakpoint
CREATE INDEX "bundle_items_bundle_idx" ON "bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "bundle_items_product_idx" ON "bundle_items" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_type_location_idx" ON "catalog_ai_recommendations" USING btree ("recommendation_type","display_location");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_user_idx" ON "catalog_ai_recommendations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_session_idx" ON "catalog_ai_recommendations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_shop_idx" ON "catalog_ai_recommendations" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_performance_idx" ON "catalog_ai_recommendations" USING btree ("status","was_shown","created_at");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_experiment_idx" ON "catalog_ai_recommendations" USING btree ("experiment_id","variant_id");--> statement-breakpoint
CREATE INDEX "catalog_recommendations_items_gin_idx" ON "catalog_ai_recommendations" USING gin ("recommended_items");--> statement-breakpoint
CREATE UNIQUE INDEX "coins_daily_checkins_user_date_uq_idx" ON "coins_daily_checkins" USING btree ("user_id","checkin_date");--> statement-breakpoint
CREATE INDEX "coins_daily_checkins_user_idx" ON "coins_daily_checkins" USING btree ("user_id","checkin_date");--> statement-breakpoint
CREATE INDEX "coins_expiration_user_idx" ON "coins_expiration_ledger" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "coins_expiration_upcoming_idx" ON "coins_expiration_ledger" USING btree ("expires_at") WHERE is_expired = false;--> statement-breakpoint
CREATE INDEX "coins_expiration_warning_idx" ON "coins_expiration_ledger" USING btree ("expires_at","warning_notification_sent") WHERE is_expired = false AND warning_notification_sent = false;--> statement-breakpoint
CREATE INDEX "coins_redemption_catalog_shop_idx" ON "coins_redemption_catalog" USING btree ("shop_id","is_active","display_order");--> statement-breakpoint
CREATE INDEX "coins_redemption_catalog_type_idx" ON "coins_redemption_catalog" USING btree ("redemption_type","shop_id");--> statement-breakpoint
CREATE INDEX "coins_redemptions_user_idx" ON "coins_redemptions" USING btree ("user_id","redeemed_at");--> statement-breakpoint
CREATE INDEX "coins_redemptions_shop_idx" ON "coins_redemptions" USING btree ("shop_id","redeemed_at");--> statement-breakpoint
CREATE INDEX "coins_redemptions_order_idx" ON "coins_redemptions" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "coins_redemptions_status_idx" ON "coins_redemptions" USING btree ("status","shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coins_referrals_code_uq_idx" ON "coins_referrals" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "coins_referrals_referrer_idx" ON "coins_referrals" USING btree ("referrer_id","status");--> statement-breakpoint
CREATE INDEX "coins_referrals_referee_idx" ON "coins_referrals" USING btree ("referee_id") WHERE referee_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "coins_referrals_status_idx" ON "coins_referrals" USING btree ("status","shop_id");--> statement-breakpoint
CREATE INDEX "coins_transactions_user_idx" ON "coins_transactions" USING btree ("user_id","transaction_date");--> statement-breakpoint
CREATE INDEX "coins_transactions_shop_idx" ON "coins_transactions" USING btree ("shop_id","transaction_date");--> statement-breakpoint
CREATE INDEX "coins_transactions_type_idx" ON "coins_transactions" USING btree ("transaction_type","shop_id");--> statement-breakpoint
CREATE INDEX "coins_transactions_order_idx" ON "coins_transactions" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "coins_transactions_expiring_idx" ON "coins_transactions" USING btree ("expires_at") WHERE expires_at IS NOT NULL AND is_expired = false;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_categories_uq_idx" ON "coupon_categories" USING btree ("coupon_id","category_id");--> statement-breakpoint
CREATE INDEX "coupon_categories_coupon_idx" ON "coupon_categories" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_code_batches_shop_status_idx" ON "coupon_code_batches" USING btree ("shop_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_instances_code_uq_idx" ON "coupon_code_instances" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_code_instances_batch_idx" ON "coupon_code_instances" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "coupon_code_instances_unused_idx" ON "coupon_code_instances" USING btree ("batch_id","is_used") WHERE is_used = false;--> statement-breakpoint
CREATE INDEX "coupon_code_instances_assigned_idx" ON "coupon_code_instances" USING btree ("assigned_to") WHERE assigned_to IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_collections_uq_idx" ON "coupon_collections" USING btree ("coupon_id","collection_id");--> statement-breakpoint
CREATE INDEX "coupon_collections_coupon_idx" ON "coupon_collections" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_products_uq_idx" ON "coupon_products" USING btree ("coupon_id","product_id");--> statement-breakpoint
CREATE INDEX "coupon_products_coupon_idx" ON "coupon_products" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_products_product_idx" ON "coupon_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_idx" ON "coupon_usage_history" USING btree ("coupon_id","used_at");--> statement-breakpoint
CREATE INDEX "coupon_usage_order_idx" ON "coupon_usage_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_user_idx" ON "coupon_usage_history" USING btree ("user_id","coupon_id") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "coupon_usage_session_idx" ON "coupon_usage_history" USING btree ("session_id","used_at");--> statement-breakpoint
CREATE INDEX "coupon_validation_code_idx" ON "coupon_validation_attempts" USING btree ("coupon_code","attempted_at");--> statement-breakpoint
CREATE INDEX "coupon_validation_user_idx" ON "coupon_validation_attempts" USING btree ("user_id","attempted_at") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "coupon_validation_ip_idx" ON "coupon_validation_attempts" USING btree ("ip_address","attempted_at");--> statement-breakpoint
CREATE INDEX "coupon_validation_failed_idx" ON "coupon_validation_attempts" USING btree ("is_valid","ip_address","attempted_at") WHERE is_valid = false;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_coins_balance_shop_user_uq_idx" ON "customer_coins_balance" USING btree ("shop_id","user_id");--> statement-breakpoint
CREATE INDEX "customer_coins_balance_tier_idx" ON "customer_coins_balance" USING btree ("current_tier","shop_id");--> statement-breakpoint
CREATE INDEX "customer_coins_balance_active_idx" ON "customer_coins_balance" USING btree ("is_active","shop_id");--> statement-breakpoint
CREATE INDEX "customer_tier_history_user_idx" ON "customer_tier_history" USING btree ("user_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_pick_products_uq_idx" ON "daily_pick_products" USING btree ("daily_pick_id","shop_product_id");--> statement-breakpoint
CREATE INDEX "daily_pick_products_pick_order_idx" ON "daily_pick_products" USING btree ("daily_pick_id","display_order");--> statement-breakpoint
CREATE INDEX "daily_pick_products_product_idx" ON "daily_pick_products" USING btree ("shop_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_picks_shop_date_uq_idx" ON "daily_picks" USING btree ("shop_id","pick_date");--> statement-breakpoint
CREATE INDEX "daily_picks_shop_date_idx" ON "daily_picks" USING btree ("shop_id","pick_date");--> statement-breakpoint
CREATE INDEX "daily_picks_active_idx" ON "daily_picks" USING btree ("shop_id","is_active","is_published");--> statement-breakpoint
CREATE INDEX "duplicate_reports_status_idx" ON "duplicate_master_product_reports" USING btree ("status","similarity_score");--> statement-breakpoint
CREATE INDEX "duplicate_reports_products_idx" ON "duplicate_master_product_reports" USING btree ("master_product_1_id","master_product_2_id");--> statement-breakpoint
CREATE UNIQUE INDEX "duplicate_reports_canonical_pair_uq_idx" ON "duplicate_master_product_reports" USING btree (LEAST("master_product_1_id"::text, "master_product_2_id"::text),GREATEST("master_product_1_id"::text, "master_product_2_id"::text));--> statement-breakpoint
CREATE UNIQUE INDEX "filter_group_members_uq_idx" ON "filter_group_members" USING btree ("group_id","filter_id");--> statement-breakpoint
CREATE INDEX "filter_group_members_group_idx" ON "filter_group_members" USING btree ("group_id","display_order");--> statement-breakpoint
CREATE INDEX "filter_groups_category_idx" ON "filter_groups" USING btree ("category_id","is_active");--> statement-breakpoint
CREATE INDEX "filter_presets_shop_idx" ON "filter_presets" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "filter_presets_category_idx" ON "filter_presets" USING btree ("category_id","is_active");--> statement-breakpoint
CREATE INDEX "master_product_images_product_idx" ON "master_product_images" USING btree ("master_product_id","is_primary");--> statement-breakpoint
CREATE INDEX "master_product_images_variant_idx" ON "master_product_images" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "matching_queue_status_idx" ON "master_product_matching_queue" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "matching_queue_retry_idx" ON "master_product_matching_queue" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "matching_queue_product_idx" ON "master_product_matching_queue" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "push_suggestions_shop_idx" ON "master_product_push_suggestions" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "push_suggestions_product_idx" ON "master_product_push_suggestions" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "push_suggestions_master_idx" ON "master_product_push_suggestions" USING btree ("suggested_master_product_id");--> statement-breakpoint
CREATE INDEX "push_suggestions_status_priority_idx" ON "master_product_push_suggestions" USING btree ("status","priority","created_at");--> statement-breakpoint
CREATE INDEX "push_suggestions_pending_score_idx" ON "master_product_push_suggestions" USING btree ("status","match_score") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "push_suggestions_auto_approval_idx" ON "master_product_push_suggestions" USING btree ("auto_approval_eligible","status");--> statement-breakpoint
CREATE UNIQUE INDEX "master_products_slug_uq_idx" ON "master_products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "master_products_global_sku_uq_idx" ON "master_products" USING btree ("global_sku") WHERE global_sku IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "master_products_gtin_uq_idx" ON "master_products" USING btree ("gtin") WHERE gtin IS NOT NULL;--> statement-breakpoint
CREATE INDEX "master_products_category_idx" ON "master_products" USING btree ("leaf_category_id","is_active");--> statement-breakpoint
CREATE INDEX "master_products_brand_idx" ON "master_products" USING btree ("brand_id","is_active");--> statement-breakpoint
CREATE INDEX "master_products_status_idx" ON "master_products" USING btree ("status","is_active");--> statement-breakpoint
CREATE INDEX "master_products_tags_gin_idx" ON "master_products" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "master_products_keywords_gin_idx" ON "master_products" USING gin ("keywords");--> statement-breakpoint
CREATE UNIQUE INDEX "master_variants_sku_uq_idx" ON "master_product_variants" USING btree ("variant_sku");--> statement-breakpoint
CREATE UNIQUE INDEX "master_variants_gtin_uq_idx" ON "master_product_variants" USING btree ("variant_gtin") WHERE variant_gtin IS NOT NULL;--> statement-breakpoint
CREATE INDEX "master_variants_product_idx" ON "master_product_variants" USING btree ("master_product_id","is_active");--> statement-breakpoint
CREATE INDEX "price_drop_alerts_saved_idx" ON "price_drop_alerts" USING btree ("saved_id");--> statement-breakpoint
CREATE INDEX "price_drop_alerts_user_idx" ON "price_drop_alerts" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "price_drop_alerts_status_idx" ON "price_drop_alerts" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "price_drop_alerts_pending_idx" ON "price_drop_alerts" USING btree ("created_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "price_drop_alerts_expiration_idx" ON "price_drop_alerts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_bundles_slug_uq_idx" ON "product_bundles" USING btree ("shop_id","slug");--> statement-breakpoint
CREATE INDEX "product_bundles_shop_idx" ON "product_bundles" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "product_bundles_type_idx" ON "product_bundles" USING btree ("shop_id","bundle_type");--> statement-breakpoint
CREATE INDEX "product_bundles_featured_idx" ON "product_bundles" USING btree ("shop_id","is_featured","is_active");--> statement-breakpoint
CREATE INDEX "product_bundles_validity_idx" ON "product_bundles" USING btree ("valid_from","valid_until","is_active");--> statement-breakpoint
CREATE INDEX "product_comparisons_shop_idx" ON "product_comparisons" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "product_comparisons_user_idx" ON "product_comparisons" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "product_comparisons_session_idx" ON "product_comparisons" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "product_comparisons_outcome_idx" ON "product_comparisons" USING btree ("outcome","was_purchase_made");--> statement-breakpoint
CREATE INDEX "product_comparisons_category_idx" ON "product_comparisons" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_comparisons_products_gin_idx" ON "product_comparisons" USING gin ("product_ids");--> statement-breakpoint
CREATE INDEX "product_filter_values_product_idx" ON "product_filter_values" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "product_filter_values_filter_text_idx" ON "product_filter_values" USING btree ("filter_id","text_value");--> statement-breakpoint
CREATE INDEX "product_filter_values_filter_numeric_idx" ON "product_filter_values" USING btree ("filter_id","numeric_value");--> statement-breakpoint
CREATE INDEX "product_filter_values_filter_bool_idx" ON "product_filter_values" USING btree ("filter_id","boolean_value");--> statement-breakpoint
CREATE UNIQUE INDEX "product_filters_category_key_uq_idx" ON "product_filters" USING btree ("category_id","filter_key") WHERE category_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "product_filters_shop_key_uq_idx" ON "product_filters" USING btree ("shop_id","filter_key") WHERE shop_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "product_filters_category_idx" ON "product_filters" USING btree ("category_id","is_active","display_order");--> statement-breakpoint
CREATE INDEX "product_filters_shop_idx" ON "product_filters" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "product_filters_scope_idx" ON "product_filters" USING btree ("filter_scope","is_active");--> statement-breakpoint
CREATE INDEX "product_interactions_product_idx" ON "product_interactions" USING btree ("shop_product_id","interaction_type","interacted_at");--> statement-breakpoint
CREATE INDEX "product_interactions_user_idx" ON "product_interactions" USING btree ("user_id","interacted_at");--> statement-breakpoint
CREATE INDEX "product_interactions_session_idx" ON "product_interactions" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_links_direction_type_uq_idx" ON "product_links" USING btree ("source_product_id","linked_product_id","link_type");--> statement-breakpoint
CREATE INDEX "product_links_source_idx" ON "product_links" USING btree ("source_product_id","link_type","is_active");--> statement-breakpoint
CREATE INDEX "product_links_shop_idx" ON "product_links" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "product_links_strength_idx" ON "product_links" USING btree ("link_strength","is_active");--> statement-breakpoint
CREATE INDEX "product_links_source_approval_idx" ON "product_links" USING btree ("link_source","is_approved");--> statement-breakpoint
CREATE INDEX "product_links_refresh_idx" ON "product_links" USING btree ("next_refresh_at","link_source");--> statement-breakpoint
CREATE INDEX "product_popularity_product_idx" ON "product_popularity_scores" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "product_popularity_trending_idx" ON "product_popularity_scores" USING btree ("is_trending","overall_score");--> statement-breakpoint
CREATE INDEX "product_popularity_calc_idx" ON "product_popularity_scores" USING btree ("next_calculation_at");--> statement-breakpoint
CREATE INDEX "product_price_history_product_idx" ON "product_price_history" USING btree ("shop_product_id","effective_from");--> statement-breakpoint
CREATE INDEX "product_price_history_current_idx" ON "product_price_history" USING btree ("shop_product_id") WHERE effective_to IS NULL;--> statement-breakpoint
CREATE INDEX "product_questions_product_idx" ON "product_questions" USING btree ("shop_product_id","is_visible","is_answered");--> statement-breakpoint
CREATE INDEX "product_questions_shop_idx" ON "product_questions" USING btree ("shop_id","is_answered");--> statement-breakpoint
CREATE INDEX "product_questions_faq_idx" ON "product_questions" USING btree ("shop_product_id","is_frequently_asked","is_pinned");--> statement-breakpoint
CREATE INDEX "product_questions_user_idx" ON "product_questions" USING btree ("asked_by_user_id","created_at");--> statement-breakpoint
CREATE INDEX "product_questions_unanswered_idx" ON "product_questions" USING btree ("shop_id","is_answered") WHERE is_answered = false;--> statement-breakpoint
CREATE UNIQUE INDEX "product_view_agg_date_uq_idx" ON "product_view_aggregates" USING btree ("shop_product_id","aggregation_date");--> statement-breakpoint
CREATE INDEX "product_view_agg_date_idx" ON "product_view_aggregates" USING btree ("aggregation_date");--> statement-breakpoint
CREATE INDEX "product_view_agg_product_idx" ON "product_view_aggregates" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "product_views_product_date_idx" ON "product_views" USING btree ("shop_product_id","view_date");--> statement-breakpoint
CREATE INDEX "product_views_user_idx" ON "product_views" USING btree ("user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "product_views_session_idx" ON "product_views" USING btree ("session_id","viewed_at");--> statement-breakpoint
CREATE INDEX "product_views_shop_date_idx" ON "product_views" USING btree ("shop_id","view_date");--> statement-breakpoint
CREATE INDEX "product_views_engagement_idx" ON "product_views" USING btree ("added_to_cart","added_to_wishlist");--> statement-breakpoint
CREATE UNIQUE INDEX "question_votes_uq_idx" ON "question_votes" USING btree ("question_id","user_id");--> statement-breakpoint
CREATE INDEX "question_votes_question_idx" ON "question_votes" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "recommendation_queue_shop_idx" ON "recommendation_queue" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "recommendation_queue_expires_idx" ON "recommendation_queue" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_for_later_uq_idx" ON "saved_for_later" USING btree ("user_id","shop_product_id","shop_product_variant_id");--> statement-breakpoint
CREATE INDEX "saved_for_later_user_idx" ON "saved_for_later" USING btree ("user_id","saved_at");--> statement-breakpoint
CREATE INDEX "saved_for_later_shop_idx" ON "saved_for_later" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "saved_for_later_product_idx" ON "saved_for_later" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "saved_for_later_notifications_idx" ON "saved_for_later" USING btree ("user_id","notify_on_price_drop","notify_on_back_in_stock");--> statement-breakpoint
CREATE INDEX "saved_for_later_reminders_idx" ON "saved_for_later" USING btree ("reminder_date") WHERE reminder_sent = false AND reminder_date IS NOT NULL;--> statement-breakpoint
CREATE INDEX "saved_for_later_expiration_idx" ON "saved_for_later" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_item_collections_user_name_uq_idx" ON "saved_item_collections" USING btree ("user_id","collection_name");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_item_collections_share_slug_uq_idx" ON "saved_item_collections" USING btree ("share_slug") WHERE share_slug IS NOT NULL;--> statement-breakpoint
CREATE INDEX "saved_item_collections_user_idx" ON "saved_item_collections" USING btree ("user_id","display_order");--> statement-breakpoint
CREATE INDEX "search_queries_shop_idx" ON "search_queries" USING btree ("shop_id","searched_at");--> statement-breakpoint
CREATE INDEX "search_queries_term_idx" ON "search_queries" USING btree ("normalized_term","shop_id");--> statement-breakpoint
CREATE INDEX "search_queries_user_idx" ON "search_queries" USING btree ("user_id","searched_at");--> statement-breakpoint
CREATE INDEX "search_queries_session_idx" ON "search_queries" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "search_queries_no_results_idx" ON "search_queries" USING btree ("shop_id","has_results") WHERE has_results = false;--> statement-breakpoint
CREATE INDEX "search_queries_date_idx" ON "search_queries" USING btree ("search_date","shop_id");--> statement-breakpoint
CREATE INDEX "search_queries_conversion_idx" ON "search_queries" USING btree ("shop_id","resulted_in_purchase","searched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "search_suggestions_shop_text_uq_idx" ON "search_suggestions" USING btree ("shop_id","suggestion_text");--> statement-breakpoint
CREATE INDEX "search_suggestions_shop_idx" ON "search_suggestions" USING btree ("shop_id","is_active","display_order");--> statement-breakpoint
CREATE INDEX "search_suggestions_text_idx" ON "search_suggestions" USING btree ("suggestion_text");--> statement-breakpoint
CREATE INDEX "shop_announcements_shop_idx" ON "shop_announcements" USING btree ("shop_id","is_active","is_published");--> statement-breakpoint
CREATE INDEX "shop_announcements_schedule_idx" ON "shop_announcements" USING btree ("shop_id","start_date","end_date","is_active");--> statement-breakpoint
CREATE INDEX "shop_announcements_location_idx" ON "shop_announcements" USING btree ("display_location","is_active");--> statement-breakpoint
CREATE INDEX "shop_announcements_priority_idx" ON "shop_announcements" USING btree ("shop_id","priority","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_coins_config_shop_uq_idx" ON "shop_coins_config" USING btree ("shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_collection_products_uq_idx" ON "shop_collection_products" USING btree ("collection_id","shop_product_id");--> statement-breakpoint
CREATE INDEX "shop_collection_products_collection_idx" ON "shop_collection_products" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "shop_collection_products_product_idx" ON "shop_collection_products" USING btree ("shop_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_collections_slug_uq_idx" ON "shop_collections" USING btree ("shop_id","slug");--> statement-breakpoint
CREATE INDEX "shop_collections_shop_idx" ON "shop_collections" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "shop_collections_type_idx" ON "shop_collections" USING btree ("shop_id","collection_type");--> statement-breakpoint
CREATE INDEX "shop_collections_featured_idx" ON "shop_collections" USING btree ("shop_id","is_featured","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_coupons_code_uq_idx" ON "shop_coupons" USING btree ("shop_id","code");--> statement-breakpoint
CREATE INDEX "shop_coupons_shop_status_idx" ON "shop_coupons" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "shop_coupons_code_lookup_idx" ON "shop_coupons" USING btree ("code","shop_id","status");--> statement-breakpoint
CREATE INDEX "shop_coupons_validity_idx" ON "shop_coupons" USING btree ("start_date","end_date","status") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "shop_coupons_conditions_gin_idx" ON "shop_coupons" USING gin ("conditions");--> statement-breakpoint
CREATE INDEX "shop_product_images_product_idx" ON "shop_product_images" USING btree ("shop_product_id","is_primary");--> statement-breakpoint
CREATE INDEX "shop_product_images_variant_idx" ON "shop_product_images" USING btree ("shop_product_variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_prices_active_uq_idx" ON "shop_product_prices" USING btree ("shop_product_id","shop_product_variant_id","currency_code") WHERE is_active = true;--> statement-breakpoint
CREATE INDEX "shop_prices_product_idx" ON "shop_product_prices" USING btree ("shop_product_id","is_active");--> statement-breakpoint
CREATE INDEX "shop_prices_variant_idx" ON "shop_product_prices" USING btree ("shop_product_variant_id");--> statement-breakpoint
CREATE INDEX "shop_prices_discount_period_idx" ON "shop_product_prices" USING btree ("discount_start_date","discount_end_date","is_active");--> statement-breakpoint
CREATE INDEX "shop_pricing_tiers_product_idx" ON "shop_product_pricing_tiers" USING btree ("shop_product_id","min_quantity","is_active");--> statement-breakpoint
CREATE INDEX "shop_pricing_tiers_variant_idx" ON "shop_product_pricing_tiers" USING btree ("shop_product_variant_id");--> statement-breakpoint
CREATE INDEX "shop_pricing_tiers_validity_idx" ON "shop_product_pricing_tiers" USING btree ("valid_from","valid_until","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_products_slug_uq_idx" ON "shop_products" USING btree ("shop_id","slug");--> statement-breakpoint
CREATE INDEX "shop_products_shop_status_idx" ON "shop_products" USING btree ("shop_id","status","is_available");--> statement-breakpoint
CREATE INDEX "shop_products_master_idx" ON "shop_products" USING btree ("master_product_id");--> statement-breakpoint
CREATE INDEX "shop_products_featured_idx" ON "shop_products" USING btree ("shop_id","is_featured","is_available");--> statement-breakpoint
CREATE INDEX "shop_products_inventory_idx" ON "shop_products" USING btree ("shop_id","stock_quantity","track_inventory");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_variants_sku_uq_idx" ON "shop_product_variants" USING btree ("shop_product_id","variant_sku") WHERE variant_sku IS NOT NULL;--> statement-breakpoint
CREATE INDEX "shop_variants_product_idx" ON "shop_product_variants" USING btree ("shop_product_id","is_active");--> statement-breakpoint
CREATE INDEX "shop_variants_master_idx" ON "shop_product_variants" USING btree ("master_product_variant_id");--> statement-breakpoint
CREATE INDEX "stock_alert_history_alert_idx" ON "stock_alert_history" USING btree ("alert_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_alerts_shop_idx" ON "stock_alerts" USING btree ("shop_id","is_resolved","severity");--> statement-breakpoint
CREATE INDEX "stock_alerts_product_idx" ON "stock_alerts" USING btree ("shop_product_id","is_resolved");--> statement-breakpoint
CREATE INDEX "stock_alerts_unresolved_idx" ON "stock_alerts" USING btree ("shop_id","created_at") WHERE is_resolved = false;--> statement-breakpoint
CREATE INDEX "stock_alerts_auto_resolve_idx" ON "stock_alerts" USING btree ("auto_resolve_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_categories_period_uq_idx" ON "trending_categories" USING btree ("shop_id","period_type","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_products_period_uq_idx" ON "trending_products" USING btree ("shop_id","period_type","period_start");--> statement-breakpoint
CREATE INDEX "trending_products_shop_idx" ON "trending_products" USING btree ("shop_id","period_type","period_start");--> statement-breakpoint
CREATE UNIQUE INDEX "trending_searches_period_uq_idx" ON "trending_searches" USING btree ("shop_id","period_type","period_start");--> statement-breakpoint
CREATE INDEX "abandoned_carts_shop_idx" ON "abandoned_carts" USING btree ("shop_id","abandoned_at");--> statement-breakpoint
CREATE INDEX "abandoned_carts_email_idx" ON "abandoned_carts" USING btree ("customer_email","shop_id") WHERE customer_email IS NOT NULL;--> statement-breakpoint
CREATE INDEX "abandoned_carts_recovery_idx" ON "abandoned_carts" USING btree ("is_recovered","shop_id") WHERE is_recovered = false;--> statement-breakpoint
CREATE INDEX "abandoned_carts_next_email_idx" ON "abandoned_carts" USING btree ("last_email_sent_at","recovery_emails_sent") WHERE is_recovered = false AND expires_at IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_product_variant_uq_idx" ON "cart_items" USING btree ("cart_id","shop_product_id","shop_product_variant_id");--> statement-breakpoint
CREATE INDEX "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "cart_items_product_idx" ON "cart_items" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "carts_shop_status_idx" ON "carts" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "carts_customer_idx" ON "carts" USING btree ("customer_id","status");--> statement-breakpoint
CREATE INDEX "carts_session_idx" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "carts_recovery_token_idx" ON "carts" USING btree ("recovery_token") WHERE recovery_token IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_wallets_shop_customer_uq_idx" ON "customer_wallets" USING btree ("shop_id","customer_id");--> statement-breakpoint
CREATE INDEX "customer_wallets_shop_idx" ON "customer_wallets" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "customer_wallets_customer_idx" ON "customer_wallets" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "gift_card_txns_card_idx" ON "gift_card_transactions" USING btree ("gift_card_id","created_at");--> statement-breakpoint
CREATE INDEX "gift_card_txns_order_idx" ON "gift_card_transactions" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "gift_cards_code_shop_uq_idx" ON "gift_cards" USING btree ("shop_id","code");--> statement-breakpoint
CREATE INDEX "gift_cards_shop_idx" ON "gift_cards" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "gift_cards_recipient_idx" ON "gift_cards" USING btree ("recipient_email") WHERE recipient_email IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_product_location_uq_idx" ON "inventory_items" USING btree ("shop_product_id","shop_product_variant_id","warehouse_id");--> statement-breakpoint
CREATE INDEX "inventory_items_shop_idx" ON "inventory_items" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "inventory_items_product_idx" ON "inventory_items" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "inventory_items_low_stock_idx" ON "inventory_items" USING btree ("is_low_stock","shop_id") WHERE is_low_stock = true;--> statement-breakpoint
CREATE INDEX "inventory_items_out_of_stock_idx" ON "inventory_items" USING btree ("is_out_of_stock","shop_id") WHERE is_out_of_stock = true;--> statement-breakpoint
CREATE INDEX "inventory_movements_item_idx" ON "inventory_movements" USING btree ("inventory_item_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "inventory_movements_order_idx" ON "inventory_movements" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_order_uq_idx" ON "invoices" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_number_shop_uq_idx" ON "invoices" USING btree ("shop_id","invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_shop_idx" ON "invoices" USING btree ("shop_id","invoice_date");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status","shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_analytics_shop_date_uq_idx" ON "order_analytics" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "order_analytics_shop_idx" ON "order_analytics" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("shop_product_id");--> statement-breakpoint
CREATE INDEX "order_items_sku_idx" ON "order_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "order_status_history_order_idx" ON "order_status_history" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_shop_uq_idx" ON "orders" USING btree ("shop_id","order_number");--> statement-breakpoint
CREATE INDEX "orders_shop_created_idx" ON "orders" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_email_idx" ON "orders" USING btree ("customer_email","shop_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status","shop_id");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status","shop_id");--> statement-breakpoint
CREATE INDEX "orders_paid_idx" ON "orders" USING btree ("is_paid","shop_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_active_idx" ON "orders" USING btree ("shop_id","status") WHERE status NOT IN ('completed', 'cancelled', 'refunded', 'failed');--> statement-breakpoint
CREATE UNIQUE INDEX "payment_disputes_external_id_uq_idx" ON "payment_disputes" USING btree ("external_dispute_id");--> statement-breakpoint
CREATE INDEX "payment_disputes_shop_idx" ON "payment_disputes" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "payment_disputes_order_idx" ON "payment_disputes" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_disputes_respond_by_idx" ON "payment_disputes" USING btree ("respond_by_date") WHERE status IN ('needs_response', 'warning_needs_response');--> statement-breakpoint
CREATE UNIQUE INDEX "payment_txns_internal_id_uq_idx" ON "payment_transactions" USING btree ("internal_transaction_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_txns_external_id_uq_idx" ON "payment_transactions" USING btree ("external_transaction_id") WHERE external_transaction_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "payment_txns_order_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_txns_customer_idx" ON "payment_transactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payment_txns_shop_idx" ON "payment_transactions" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_txns_status_idx" ON "payment_transactions" USING btree ("status","shop_id");--> statement-breakpoint
CREATE INDEX "refund_line_items_refund_idx" ON "refund_line_items" USING btree ("refund_id");--> statement-breakpoint
CREATE INDEX "refund_line_items_order_item_idx" ON "refund_line_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "refunds_number_shop_uq_idx" ON "refunds" USING btree ("shop_id","refund_number");--> statement-breakpoint
CREATE INDEX "refunds_order_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refunds_shop_idx" ON "refunds" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status","shop_id");--> statement-breakpoint
CREATE INDEX "saved_payment_methods_customer_idx" ON "saved_payment_methods" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_payment_methods_default_uq_idx" ON "saved_payment_methods" USING btree ("customer_id","shop_id") WHERE is_default = true AND is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_payment_methods_card_fingerprint_uq_idx" ON "saved_payment_methods" USING btree ("customer_id","shop_id","card_fingerprint") WHERE card_fingerprint IS NOT NULL AND is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "shipment_items_uq_idx" ON "shipment_items" USING btree ("shipment_id","order_item_id");--> statement-breakpoint
CREATE INDEX "shipment_items_shipment_idx" ON "shipment_items" USING btree ("shipment_id");--> statement-breakpoint
CREATE INDEX "shipment_items_order_item_idx" ON "shipment_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shipments_number_shop_uq_idx" ON "shipments" USING btree ("shop_id","shipment_number");--> statement-breakpoint
CREATE INDEX "shipments_order_idx" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipments_tracking_idx" ON "shipments" USING btree ("tracking_number") WHERE tracking_number IS NOT NULL;--> statement-breakpoint
CREATE INDEX "shipments_shop_idx" ON "shipments" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "shipments_status_idx" ON "shipments" USING btree ("status","shop_id");--> statement-breakpoint
CREATE INDEX "shipping_rates_shop_idx" ON "shipping_rates" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plans_shop_slug_uq_idx" ON "subscription_plans" USING btree ("shop_id","slug");--> statement-breakpoint
CREATE INDEX "subscription_plans_shop_idx" ON "subscription_plans" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "subscriptions_customer_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_shop_status_idx" ON "subscriptions" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_next_billing_idx" ON "subscriptions" USING btree ("next_billing_date") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_txns_idempotency_uq_idx" ON "wallet_transactions" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "wallet_txns_wallet_idx" ON "wallet_transactions" USING btree ("wallet_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_txns_customer_idx" ON "wallet_transactions" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "wallet_txns_type_idx" ON "wallet_transactions" USING btree ("transaction_type","shop_id");--> statement-breakpoint
CREATE INDEX "wallet_txns_order_idx" ON "wallet_transactions" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "carrier_tracking_events_idempotency_uq_idx" ON "carrier_tracking_events" USING btree ("idempotency_key") WHERE idempotency_key IS NOT NULL;--> statement-breakpoint
CREATE INDEX "carrier_tracking_events_shipment_idx" ON "carrier_tracking_events" USING btree ("shipment_id","event_at");--> statement-breakpoint
CREATE INDEX "carrier_tracking_events_tracking_number_idx" ON "carrier_tracking_events" USING btree ("tracking_number","event_at");--> statement-breakpoint
CREATE INDEX "carrier_tracking_events_unprocessed_idx" ON "carrier_tracking_events" USING btree ("is_processed","received_at") WHERE is_processed = false;--> statement-breakpoint
CREATE UNIQUE INDEX "carriers_slug_uq_idx" ON "carriers" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "carriers_status_idx" ON "carriers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_delivery_ratings_task_uq_idx" ON "customer_delivery_ratings" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "customer_delivery_ratings_partner_idx" ON "customer_delivery_ratings" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_delivery_ratings_customer_idx" ON "customer_delivery_ratings" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_analytics_zone_date_uq_idx" ON "delivery_analytics" USING btree ("zone_id","date") WHERE zone_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_analytics_city_date_uq_idx" ON "delivery_analytics" USING btree ("city_id","date") WHERE city_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "delivery_analytics_date_idx" ON "delivery_analytics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_attempts_task_number_uq_idx" ON "delivery_attempts" USING btree ("task_id","attempt_number");--> statement-breakpoint
CREATE INDEX "delivery_attempts_task_idx" ON "delivery_attempts" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "delivery_attempts_partner_idx" ON "delivery_attempts" USING btree ("partner_id","attempted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_incidents_number_uq_idx" ON "delivery_incidents" USING btree ("incident_number");--> statement-breakpoint
CREATE INDEX "delivery_incidents_task_idx" ON "delivery_incidents" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "delivery_incidents_partner_idx" ON "delivery_incidents" USING btree ("partner_id","reported_at");--> statement-breakpoint
CREATE INDEX "delivery_incidents_status_idx" ON "delivery_incidents" USING btree ("status","severity");--> statement-breakpoint
CREATE INDEX "delivery_incidents_open_idx" ON "delivery_incidents" USING btree ("severity","reported_at") WHERE status IN ('open', 'under_investigation', 'escalated');--> statement-breakpoint
CREATE INDEX "dp_sessions_partner_idx" ON "delivery_partner_sessions" USING btree ("partner_id","session_start");--> statement-breakpoint
CREATE INDEX "dp_sessions_status_idx" ON "delivery_partner_sessions" USING btree ("status") WHERE status = 'available';--> statement-breakpoint
CREATE INDEX "dp_sessions_active_idx" ON "delivery_partner_sessions" USING btree ("partner_id") WHERE session_end IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "route_stops_route_task_uq_idx" ON "delivery_route_stops" USING btree ("route_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "route_stops_sequence_uq_idx" ON "delivery_route_stops" USING btree ("route_id","sequence");--> statement-breakpoint
CREATE INDEX "route_stops_route_idx" ON "delivery_route_stops" USING btree ("route_id","sequence");--> statement-breakpoint
CREATE INDEX "route_stops_task_idx" ON "delivery_route_stops" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_routes_number_uq_idx" ON "delivery_routes" USING btree ("route_number");--> statement-breakpoint
CREATE INDEX "delivery_routes_partner_idx" ON "delivery_routes" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "delivery_routes_shift_idx" ON "delivery_routes" USING btree ("shift_id");--> statement-breakpoint
CREATE INDEX "delivery_routes_zone_status_idx" ON "delivery_routes" USING btree ("zone_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_sla_policies_slug_uq_idx" ON "delivery_sla_policies" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "delivery_sla_policies_zone_idx" ON "delivery_sla_policies" USING btree ("zone_id","is_active");--> statement-breakpoint
CREATE INDEX "delivery_sla_policies_city_idx" ON "delivery_sla_policies" USING btree ("city_id","is_active");--> statement-breakpoint
CREATE INDEX "delivery_task_history_task_idx" ON "delivery_task_status_history" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_tasks_number_uq_idx" ON "delivery_tasks" USING btree ("task_number");--> statement-breakpoint
CREATE INDEX "delivery_tasks_order_idx" ON "delivery_tasks" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "delivery_tasks_partner_status_idx" ON "delivery_tasks" USING btree ("partner_id","status");--> statement-breakpoint
CREATE INDEX "delivery_tasks_shop_idx" ON "delivery_tasks" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "delivery_tasks_zone_idx" ON "delivery_tasks" USING btree ("zone_id","status");--> statement-breakpoint
CREATE INDEX "delivery_tasks_status_idx" ON "delivery_tasks" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "delivery_tasks_route_idx" ON "delivery_tasks" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "delivery_tasks_dispatch_idx" ON "delivery_tasks" USING btree ("zone_id","status","created_at") WHERE status IN ('pending', 'broadcast');--> statement-breakpoint
CREATE INDEX "delivery_tasks_sla_idx" ON "delivery_tasks" USING btree ("sla_deadline","is_sla_breached") WHERE is_sla_breached = false AND sla_deadline IS NOT NULL;--> statement-breakpoint
CREATE INDEX "delivery_tasks_cod_unremitted_idx" ON "delivery_tasks" USING btree ("is_cod","cod_remitted_at") WHERE is_cod = true AND cod_remitted_at IS NULL;--> statement-breakpoint
CREATE INDEX "live_pings_partner_captured_idx" ON "live_location_pings" USING btree ("partner_id","captured_at");--> statement-breakpoint
CREATE INDEX "live_pings_task_idx" ON "live_location_pings" USING btree ("task_id") WHERE task_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "live_pings_shift_idx" ON "live_location_pings" USING btree ("shift_id") WHERE shift_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "location_snapshots_partner_idx" ON "location_snapshots" USING btree ("partner_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "location_snapshots_task_idx" ON "location_snapshots" USING btree ("task_id") WHERE task_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "partner_avail_slots_partner_idx" ON "partner_availability_slots" USING btree ("partner_id","day_of_week");--> statement-breakpoint
CREATE INDEX "partner_earnings_partner_idx" ON "partner_earnings_ledger" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_earnings_task_idx" ON "partner_earnings_ledger" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "partner_earnings_payout_idx" ON "partner_earnings_ledger" USING btree ("payout_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_payouts_number_uq_idx" ON "partner_payouts" USING btree ("payout_number");--> statement-breakpoint
CREATE INDEX "partner_payouts_partner_idx" ON "partner_payouts" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "partner_performance_uq_idx" ON "partner_performance" USING btree ("partner_id","date");--> statement-breakpoint
CREATE INDEX "partner_performance_date_idx" ON "partner_performance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "partner_shifts_partner_idx" ON "partner_shifts" USING btree ("partner_id","shift_start");--> statement-breakpoint
CREATE INDEX "partner_shifts_zone_idx" ON "partner_shifts" USING btree ("zone_id","shift_start");--> statement-breakpoint
CREATE INDEX "partner_shifts_open_idx" ON "partner_shifts" USING btree ("partner_id") WHERE shift_end IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pod_task_uq_idx" ON "proof_of_delivery" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "pod_partner_idx" ON "proof_of_delivery" USING btree ("partner_id","captured_at");--> statement-breakpoint
CREATE UNIQUE INDEX "service_zones_city_slug_uq_idx" ON "service_zones" USING btree ("city_id","slug");--> statement-breakpoint
CREATE INDEX "service_zones_city_idx" ON "service_zones" USING btree ("city_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_carrier_accounts_shop_carrier_uq_idx" ON "shop_carrier_accounts" USING btree ("shop_id","carrier_id");--> statement-breakpoint
CREATE INDEX "shop_carrier_accounts_shop_idx" ON "shop_carrier_accounts" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_carrier_accounts_default_uq_idx" ON "shop_carrier_accounts" USING btree ("shop_id") WHERE is_default = true AND is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "shop_service_zones_uq_idx" ON "shop_service_zones" USING btree ("shop_id","zone_id");--> statement-breakpoint
CREATE INDEX "shop_service_zones_shop_idx" ON "shop_service_zones" USING btree ("shop_id","is_active");--> statement-breakpoint
CREATE INDEX "shop_service_zones_zone_idx" ON "shop_service_zones" USING btree ("zone_id","is_active");--> statement-breakpoint
CREATE INDEX "surge_pricing_zone_active_idx" ON "surge_pricing_windows" USING btree ("zone_id","is_active");--> statement-breakpoint
CREATE INDEX "surge_pricing_active_only_idx" ON "surge_pricing_windows" USING btree ("is_active","activated_at") WHERE is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "zone_pincodes_uq_idx" ON "zone_serviceable_pincodes" USING btree ("zone_id","serviceable_pincode_id");--> statement-breakpoint
CREATE INDEX "zone_pincodes_zone_idx" ON "zone_serviceable_pincodes" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "zone_pincodes_pincode_idx" ON "zone_serviceable_pincodes" USING btree ("serviceable_pincode_id");--> statement-breakpoint
CREATE INDEX "dp_applications_applicant_idx" ON "delivery_partner_applications" USING btree ("applicant_user_id","created_at");--> statement-breakpoint
CREATE INDEX "dp_applications_status_idx" ON "delivery_partner_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "dp_applications_city_idx" ON "delivery_partner_applications" USING btree ("city_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "dp_applications_applicant_active_uq_idx" ON "delivery_partner_applications" USING btree ("applicant_user_id") WHERE status NOT IN ('approved', 'rejected');--> statement-breakpoint
CREATE UNIQUE INDEX "dp_onboarding_checklist_partner_step_uq_idx" ON "dp_onboarding_checklist" USING btree ("partner_user_id","step");--> statement-breakpoint
CREATE INDEX "dp_onboarding_checklist_partner_idx" ON "dp_onboarding_checklist" USING btree ("partner_user_id","status");--> statement-breakpoint
CREATE INDEX "faqs_category_target_idx" ON "faqs" USING btree ("category_slug","target","is_published");--> statement-breakpoint
CREATE INDEX "faqs_featured_idx" ON "faqs" USING btree ("is_featured","target");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_city_uq_idx" ON "feature_flag_overrides" USING btree ("flag_key","city_id") WHERE city_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_shop_uq_idx" ON "feature_flag_overrides" USING btree ("flag_key","shop_id") WHERE shop_id IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_user_uq_idx" ON "feature_flag_overrides" USING btree ("flag_key","user_id") WHERE user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "feature_flag_overrides_flag_idx" ON "feature_flag_overrides" USING btree ("flag_key");--> statement-breakpoint
CREATE INDEX "feature_flag_overrides_expiry_idx" ON "feature_flag_overrides" USING btree ("expires_at") WHERE expires_at IS NOT NULL;--> statement-breakpoint
CREATE INDEX "maintenance_windows_schedule_idx" ON "maintenance_windows" USING btree ("scheduled_start","status");--> statement-breakpoint
CREATE INDEX "maintenance_windows_active_idx" ON "maintenance_windows" USING btree ("status") WHERE status IN ('scheduled', 'in_progress');--> statement-breakpoint
CREATE UNIQUE INDEX "nearby_shop_cache_pincode_uq_idx" ON "nearby_shop_cache" USING btree ("serviceable_pincode_id");--> statement-breakpoint
CREATE INDEX "nearby_shop_cache_city_idx" ON "nearby_shop_cache" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "nearby_shop_cache_expired_idx" ON "nearby_shop_cache" USING btree ("expires_at") WHERE expires_at IS NOT NULL;--> statement-breakpoint
CREATE INDEX "platform_announcements_target_idx" ON "platform_announcements" USING btree ("target","is_published");--> statement-breakpoint
CREATE INDEX "platform_announcements_city_idx" ON "platform_announcements" USING btree ("city_id","is_published");--> statement-breakpoint
CREATE INDEX "platform_announcements_active_idx" ON "platform_announcements" USING btree ("is_published","expires_at") WHERE is_published = true;--> statement-breakpoint
CREATE INDEX "platform_config_history_config_idx" ON "platform_config_history" USING btree ("config_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_config_key_scope_uq_idx" ON "platform_config" USING btree ("config_key","city_id","shop_type_slug") WHERE scope = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX "platform_config_key_city_uq_idx" ON "platform_config" USING btree ("config_key","city_id") WHERE scope = 'city' AND city_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "platform_config_group_idx" ON "platform_config" USING btree ("group","scope");--> statement-breakpoint
CREATE INDEX "platform_config_city_idx" ON "platform_config" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_health_metrics_date_city_uq_idx" ON "platform_health_metrics" USING btree ("date","city_id");--> statement-breakpoint
CREATE INDEX "platform_health_metrics_date_idx" ON "platform_health_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_search_analytics_date_city_uq_idx" ON "platform_search_analytics" USING btree ("date","city_id");--> statement-breakpoint
CREATE INDEX "platform_search_analytics_date_idx" ON "platform_search_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "platform_search_log_user_idx" ON "platform_search_log" USING btree ("user_id","searched_at");--> statement-breakpoint
CREATE INDEX "platform_search_log_city_idx" ON "platform_search_log" USING btree ("city_id","searched_at");--> statement-breakpoint
CREATE INDEX "platform_search_log_term_idx" ON "platform_search_log" USING btree ("normalized_term","searched_at");--> statement-breakpoint
CREATE INDEX "platform_search_log_no_results_idx" ON "platform_search_log" USING btree ("city_id","normalized_term") WHERE has_results = false;--> statement-breakpoint
CREATE INDEX "platform_search_log_intent_idx" ON "platform_search_log" USING btree ("intent","searched_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_onboarding_checklist_shop_step_uq_idx" ON "shop_onboarding_checklist" USING btree ("shop_id","step");--> statement-breakpoint
CREATE INDEX "shop_onboarding_checklist_shop_idx" ON "shop_onboarding_checklist" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "shop_onboarding_checklist_incomplete_idx" ON "shop_onboarding_checklist" USING btree ("step","status") WHERE status NOT IN ('completed', 'skipped');--> statement-breakpoint
CREATE INDEX "shop_verification_history_queue_idx" ON "shop_verification_history" USING btree ("queue_id","changed_at");--> statement-breakpoint
CREATE INDEX "shop_verification_history_shop_idx" ON "shop_verification_history" USING btree ("shop_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_verification_queue_shop_active_uq_idx" ON "shop_verification_queue" USING btree ("shop_id") WHERE status NOT IN ('approved', 'rejected');--> statement-breakpoint
CREATE INDEX "shop_verification_queue_status_idx" ON "shop_verification_queue" USING btree ("status","priority","submitted_at");--> statement-breakpoint
CREATE INDEX "shop_verification_queue_assigned_idx" ON "shop_verification_queue" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "shop_verification_queue_sla_idx" ON "shop_verification_queue" USING btree ("sla_deadline") WHERE is_sla_breached = false AND sla_deadline IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "static_pages_slug_uq_idx" ON "static_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "static_pages_published_idx" ON "static_pages" USING btree ("is_published","target");--> statement-breakpoint
CREATE UNIQUE INDEX "support_categories_slug_uq_idx" ON "support_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "support_categories_parent_idx" ON "support_categories" USING btree ("parent_id","is_active");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_ticket_idx" ON "support_ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "support_ticket_messages_author_idx" ON "support_ticket_messages" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "support_tickets_number_uq_idx" ON "support_tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "support_tickets_raised_by_idx" ON "support_tickets" USING btree ("raised_by_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "support_tickets_assigned_idx" ON "support_tickets" USING btree ("assigned_to","status");--> statement-breakpoint
CREATE INDEX "support_tickets_shop_idx" ON "support_tickets" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "support_tickets_context_idx" ON "support_tickets" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE INDEX "support_tickets_sla_breach_idx" ON "support_tickets" USING btree ("resolution_sla_at","status") WHERE status NOT IN ('resolved', 'closed') AND resolution_sla_at IS NOT NULL;--> statement-breakpoint
CREATE INDEX "admin_action_log_admin_idx" ON "admin_action_log" USING btree ("admin_id","occurred_at");--> statement-breakpoint
CREATE INDEX "admin_action_log_target_user_idx" ON "admin_action_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "admin_action_log_target_shop_idx" ON "admin_action_log" USING btree ("target_shop_id");--> statement-breakpoint
CREATE INDEX "admin_action_log_impersonation_idx" ON "admin_action_log" USING btree ("impersonating_user_id") WHERE impersonating_user_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "api_request_log_user_idx" ON "api_request_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "api_request_log_path_idx" ON "api_request_log" USING btree ("path","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_request_log_request_uq_idx" ON "api_request_log" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "bg_job_name_idx" ON "background_job_log" USING btree ("job_name","status");--> statement-breakpoint
CREATE INDEX "bg_job_status_idx" ON "background_job_log" USING btree ("status","enqueued_at");--> statement-breakpoint
CREATE INDEX "banner_impression_banner_idx" ON "banner_impressions" USING btree ("banner_id","occurred_at");--> statement-breakpoint
CREATE INDEX "banner_impression_user_idx" ON "banner_impressions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "banners_placement_idx" ON "banners" USING btree ("placement","priority");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" USING btree ("is_active","scheduled_start");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_audience_user_uq_idx" ON "campaign_audience_members" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "cam_campaign_idx" ON "campaign_audience_members" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "cam_user_idx" ON "campaign_audience_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_audiences_type_idx" ON "campaign_audiences" USING btree ("type");--> statement-breakpoint
CREATE INDEX "campaign_variants_campaign_idx" ON "campaign_variants" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "comms_audit_log_record_idx" ON "comms_audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "comms_audit_log_actor_idx" ON "comms_audit_log" USING btree ("actor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "comms_audit_log_request_idx" ON "comms_audit_log" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "consent_log_user_idx" ON "consent_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "consent_log_type_idx" ON "consent_log" USING btree ("consent_type","occurred_at");--> statement-breakpoint
CREATE INDEX "consent_log_latest_idx" ON "consent_log" USING btree ("user_id","consent_type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_assign_user_coupon_uq_idx" ON "coupon_assignments" USING btree ("user_id","coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_assign_user_idx" ON "coupon_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_assign_coupon_idx" ON "coupon_assignments" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "data_deletion_log_user_idx" ON "data_deletion_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "data_deletion_log_stage_idx" ON "data_deletion_log" USING btree ("stage","occurred_at");--> statement-breakpoint
CREATE INDEX "data_deletion_log_deadline_idx" ON "data_deletion_log" USING btree ("deadline_at") WHERE stage NOT IN ('completed', 'cancelled', 'failed');--> statement-breakpoint
CREATE INDEX "data_export_log_user_idx" ON "data_export_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "data_export_log_actor_idx" ON "data_export_log" USING btree ("exported_by","occurred_at");--> statement-breakpoint
CREATE INDEX "error_log_code_idx" ON "error_log" USING btree ("error_code","occurred_at");--> statement-breakpoint
CREATE INDEX "error_log_user_idx" ON "error_log" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "login_audit_user_idx" ON "login_audit" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "login_audit_event_idx" ON "login_audit" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "login_audit_ip_idx" ON "login_audit" USING btree ("ip_address","occurred_at");--> statement-breakpoint
CREATE INDEX "login_audit_suspicious_idx" ON "login_audit" USING btree ("is_suspicious","occurred_at") WHERE is_suspicious = true;--> statement-breakpoint
CREATE INDEX "login_audit_failed_ip_idx" ON "login_audit" USING btree ("ip_address","occurred_at") WHERE event_type = 'login_failed';--> statement-breakpoint
CREATE INDEX "notif_batches_campaign_idx" ON "notification_batches" USING btree ("campaign_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notif_device_token_uq_idx" ON "notification_devices" USING btree ("device_token");--> statement-breakpoint
CREATE INDEX "notif_device_user_idx" ON "notification_devices" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "notif_interaction_notif_idx" ON "notification_interactions" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notif_interaction_user_idx" ON "notification_interactions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "notif_interaction_type_idx" ON "notification_interactions" USING btree ("interaction_type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notif_pref_user_cat_chan_uq_idx" ON "notification_preferences" USING btree ("user_id","category","channel");--> statement-breakpoint
CREATE INDEX "notif_pref_user_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notif_templates_slug_uq_idx" ON "notification_templates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "notif_templates_category_idx" ON "notification_templates" USING btree ("category","channel");--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id","status","scheduled_at");--> statement-breakpoint
CREATE INDEX "notif_template_idx" ON "notifications" USING btree ("template_id","status");--> statement-breakpoint
CREATE INDEX "notif_batch_idx" ON "notifications" USING btree ("batch_id","status");--> statement-breakpoint
CREATE INDEX "notif_status_idx" ON "notifications" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "notif_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "perm_change_log_target_idx" ON "permission_change_log" USING btree ("target_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "perm_change_log_changed_by_idx" ON "permission_change_log" USING btree ("changed_by","occurred_at");--> statement-breakpoint
CREATE INDEX "perm_change_log_operation_idx" ON "permission_change_log" USING btree ("operation","occurred_at");--> statement-breakpoint
CREATE INDEX "perm_change_log_shop_idx" ON "permission_change_log" USING btree ("shop_id","occurred_at") WHERE shop_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "popup_interaction_popup_idx" ON "popup_interactions" USING btree ("popup_id","occurred_at");--> statement-breakpoint
CREATE INDEX "popup_interaction_user_idx" ON "popup_interactions" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "popups_trigger_idx" ON "popups" USING btree ("trigger","is_active");--> statement-breakpoint
CREATE INDEX "popups_scheduled_idx" ON "popups" USING btree ("is_active","scheduled_start");--> statement-breakpoint
CREATE INDEX "promotion_campaigns_status_idx" ON "promotion_campaigns" USING btree ("status","scheduled_start");--> statement-breakpoint
CREATE INDEX "promotion_campaigns_type_idx" ON "promotion_campaigns" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "referral_config_active_idx" ON "referral_campaign_configs" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_logs_referred_uq_idx" ON "referral_logs" USING btree ("referred_user_id");--> statement-breakpoint
CREATE INDEX "referral_logs_referrer_idx" ON "referral_logs" USING btree ("referrer_user_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_banner_uq_idx" ON "shop_banner_assignments" USING btree ("shop_id","banner_id");--> statement-breakpoint
CREATE INDEX "shop_banner_shop_idx" ON "shop_banner_assignments" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "system_event_log_level_idx" ON "system_event_log" USING btree ("level","occurred_at");--> statement-breakpoint
CREATE INDEX "system_event_log_cat_idx" ON "system_event_log" USING btree ("category","occurred_at");--> statement-breakpoint
CREATE INDEX "system_event_log_request_idx" ON "system_event_log" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "webhook_log_provider_idx" ON "webhook_log" USING btree ("provider","direction");--> statement-breakpoint
CREATE INDEX "webhook_log_occurred_idx" ON "webhook_log" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "commission_configs_scope_idx" ON "commission_rate_configs" USING btree ("scope","is_active");--> statement-breakpoint
CREATE INDEX "commission_configs_city_idx" ON "commission_rate_configs" USING btree ("city_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_configs_global_uq_idx" ON "commission_rate_configs" USING btree ("scope") WHERE scope = 'global' AND is_active = true;--> statement-breakpoint
CREATE UNIQUE INDEX "order_financial_splits_order_uq_idx" ON "order_financial_splits" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_financial_splits_shop_idx" ON "order_financial_splits" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "order_financial_splits_status_idx" ON "order_financial_splits" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "order_financial_splits_unsettled_idx" ON "order_financial_splits" USING btree ("shop_id","calculated_at") WHERE status = 'calculated';--> statement-breakpoint
CREATE UNIQUE INDEX "split_line_items_split_item_uq_idx" ON "order_split_line_items" USING btree ("split_id","order_item_id");--> statement-breakpoint
CREATE INDEX "split_line_items_split_idx" ON "order_split_line_items" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "split_line_items_order_item_idx" ON "order_split_line_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_tax_ledger_order_uq_idx" ON "order_tax_ledger" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_tax_ledger_shop_idx" ON "order_tax_ledger" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "order_tax_ledger_return_month_idx" ON "order_tax_ledger" USING btree ("gst_return_month","shop_id");--> statement-breakpoint
CREATE INDEX "order_tax_ledger_unfiled_idx" ON "order_tax_ledger" USING btree ("shop_id","gst_return_month") WHERE is_included_in_return = false;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_fee_invoices_number_uq_idx" ON "platform_fee_invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "platform_fee_invoices_shop_idx" ON "platform_fee_invoices" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_fee_invoices_status_idx" ON "platform_fee_invoices" USING btree ("status","due_date");--> statement-breakpoint
CREATE INDEX "platform_fee_invoices_overdue_idx" ON "platform_fee_invoices" USING btree ("due_date") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "platform_fee_payments_invoice_idx" ON "platform_fee_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "platform_fee_payments_shop_idx" ON "platform_fee_payments" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_fee_plans_slug_uq_idx" ON "platform_fee_plans" USING btree ("plan_slug");--> statement-breakpoint
CREATE INDEX "platform_fee_plans_active_idx" ON "platform_fee_plans" USING btree ("is_active","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_revenue_analytics_date_city_uq_idx" ON "platform_revenue_analytics" USING btree ("date","city_id");--> statement-breakpoint
CREATE INDEX "platform_revenue_analytics_date_idx" ON "platform_revenue_analytics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "refund_financial_adjustments_refund_uq_idx" ON "refund_financial_adjustments" USING btree ("refund_id");--> statement-breakpoint
CREATE INDEX "refund_financial_adjustments_split_idx" ON "refund_financial_adjustments" USING btree ("split_id");--> statement-breakpoint
CREATE INDEX "shop_earnings_ledger_shop_idx" ON "shop_earnings_ledger" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "shop_earnings_ledger_order_idx" ON "shop_earnings_ledger" USING btree ("order_id") WHERE order_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX "shop_earnings_ledger_unpaid_idx" ON "shop_earnings_ledger" USING btree ("shop_id","payout_id") WHERE payout_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "shop_payouts_number_uq_idx" ON "shop_payouts" USING btree ("payout_number");--> statement-breakpoint
CREATE INDEX "shop_payouts_shop_idx" ON "shop_payouts" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "shop_payouts_status_idx" ON "shop_payouts" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_revenue_analytics_shop_date_uq_idx" ON "shop_revenue_analytics" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "shop_revenue_analytics_shop_idx" ON "shop_revenue_analytics" USING btree ("shop_id","date");--> statement-breakpoint
CREATE INDEX "shop_revenue_analytics_date_idx" ON "shop_revenue_analytics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_subscription_billing_shop_uq_idx" ON "shop_subscription_billing" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "shop_subscription_billing_status_idx" ON "shop_subscription_billing" USING btree ("status","next_billing_date");--> statement-breakpoint
CREATE INDEX "shop_subscription_billing_due_idx" ON "shop_subscription_billing" USING btree ("next_billing_date") WHERE status IN ('active', 'past_due');--> statement-breakpoint
CREATE UNIQUE INDEX "tax_categories_slug_uq_idx" ON "tax_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tax_categories_active_idx" ON "tax_categories" USING btree ("is_active","gst_rate_pct");--> statement-breakpoint
CREATE INDEX "tax_rules_state_pair_idx" ON "tax_rules" USING btree ("seller_state_code","buyer_state_code","is_active");--> statement-breakpoint
CREATE INDEX "tax_rules_type_idx" ON "tax_rules" USING btree ("transaction_type","is_active");