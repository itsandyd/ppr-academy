import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Migration: Ableton Racks → Effect Chains
 * 
 * Updates existing products with:
 * - productCategory: "ableton-rack" → "effect-chain"
 * - productType: "abletonRack" → "effectChain"
 * - Adds dawType: "ableton" for all migrated products
 * 
 * Run this from Convex dashboard or via scheduled function
 */
export const migrateAbletonRacksToEffectChains = internalMutation({
  args: {},
  returns: v.object({
    total: v.number(),
    migrated: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log("🔄 Starting migration: Ableton Racks → Effect Chains");
    
    let total = 0;
    let migrated = 0;
    let errors = 0;

    // Find all products with ableton-rack category or abletonRack type
    const abletonProducts = await ctx.db
      .query("digitalProducts")
      .collect();

    const productsToMigrate = abletonProducts.filter(
      (p) => 
        p.productCategory === "ableton-rack" || 
        p.productType === "abletonRack"
    );

    total = productsToMigrate.length;
    console.log(`Found ${total} Ableton rack products to migrate`);

    for (const product of productsToMigrate) {
      try {
        const updates: any = {};

        // Update product category
        if (product.productCategory === "ableton-rack") {
          updates.productCategory = "effect-chain";
        }

        // Update product type
        if (product.productType === "abletonRack") {
          updates.productType = "effectChain";
        }

        // Add DAW type (all existing racks are Ableton)
        updates.dawType = "ableton";

        // Migrate dawVersion from abletonVersion if exists
        if (product.abletonVersion && !product.dawVersion) {
          updates.dawVersion = product.abletonVersion;
        }

        await ctx.db.patch(product._id, updates);
        
        migrated++;
        console.log(`✅ Migrated: ${product.title} (${product._id})`);
      } catch (error) {
        errors++;
        console.error(`❌ Failed to migrate ${product.title}:`, error);
      }
    }

    console.log(`✅ Migration complete: ${migrated}/${total} migrated, ${errors} errors`);

    return {
      total,
      migrated,
      errors,
    };
  },
});

/**
 * Rollback migration (if needed)
 * Reverts effect-chain → ableton-rack
 */
export const rollbackEffectChainMigration = internalMutation({
  args: {},
  returns: v.object({
    total: v.number(),
    reverted: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    console.log("🔄 Rolling back: Effect Chains → Ableton Racks");
    
    let total = 0;
    let reverted = 0;
    let errors = 0;

    const allProducts = await ctx.db
      .query("digitalProducts")
      .collect();

    const productsToRevert = allProducts.filter(
      (p) => 
        (p.productCategory === "effect-chain" && p.dawType === "ableton") ||
        p.productType === "effectChain"
    );

    total = productsToRevert.length;

    for (const product of productsToRevert) {
      try {
        const updates: any = {};

        if (product.productCategory === "effect-chain" && product.dawType === "ableton") {
          updates.productCategory = "ableton-rack";
        }

        if (product.productType === "effectChain") {
          updates.productType = "abletonRack";
        }

        await ctx.db.patch(product._id, updates);
        reverted++;
      } catch (error) {
        errors++;
        console.error(`❌ Failed to revert ${product.title}:`, error);
      }
    }

    console.log(`✅ Rollback complete: ${reverted}/${total} reverted`);

    return {
      total,
      reverted,
      errors,
    };
  },
});

