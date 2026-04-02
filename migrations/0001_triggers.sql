-- ============================================================
-- Trigger 1: master_product_images
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_master_product_image_variant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.variant_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM master_product_variants
      WHERE id = NEW.variant_id
        AND master_product_id = NEW.master_product_id
    ) THEN
      RAISE EXCEPTION
        'variant % does not belong to master_product %',
        NEW.variant_id, NEW.master_product_id
      USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_master_product_images_variant_check
  BEFORE INSERT OR UPDATE ON master_product_images
  FOR EACH ROW EXECUTE FUNCTION fn_check_master_product_image_variant();

-- ============================================================
-- Trigger 2: shop_product_prices
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_shop_price_variant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.shop_product_variant_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM shop_product_variants
      WHERE id = NEW.shop_product_variant_id
        AND shop_product_id = NEW.shop_product_id
    ) THEN
      RAISE EXCEPTION
        'variant % does not belong to shop_product %',
        NEW.shop_product_variant_id, NEW.shop_product_id
      USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shop_product_prices_variant_check
  BEFORE INSERT OR UPDATE ON shop_product_prices
  FOR EACH ROW EXECUTE FUNCTION fn_check_shop_price_variant();

-- ============================================================
-- Trigger 3: shop_product_pricing_tiers
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_shop_pricing_tier_variant()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.shop_product_variant_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM shop_product_variants
      WHERE id = NEW.shop_product_variant_id
        AND shop_product_id = NEW.shop_product_id
    ) THEN
      RAISE EXCEPTION
        'variant % does not belong to shop_product %',
        NEW.shop_product_variant_id, NEW.shop_product_id
      USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shop_product_pricing_tiers_variant_check
  BEFORE INSERT OR UPDATE ON shop_product_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION fn_check_shop_pricing_tier_variant();