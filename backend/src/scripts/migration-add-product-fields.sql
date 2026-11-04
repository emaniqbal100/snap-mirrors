-- Migration: Add product tags, sort_order, and variant color_name
-- Run this against the database before deploying the updated backend.

-- New product-level columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new_arrival BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_shop_now BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_shop_collection BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- New variant-level column for human-readable color names
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS color_name VARCHAR(100);

-- Index for sort_order to speed up ordered queries
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products (sort_order ASC, created_at DESC);
