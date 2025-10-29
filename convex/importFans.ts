import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Import fans/customers from ActiveCampaign CSV
 * Maps all ActiveCampaign fields to the customers table
 */
export const importFansFromCSV = mutation({
  args: {
    storeId: v.string(),
    adminUserId: v.string(),
    fans: v.array(v.object({
      // Required
      email: v.string(),
      
      // Basic Info
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      
      // ActiveCampaign Fields
      activeCampaignId: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      score: v.optional(v.number()),
      
      // Producer Profile
      daw: v.optional(v.string()),
      typeOfMusic: v.optional(v.string()),
      goals: v.optional(v.string()),
      musicAlias: v.optional(v.string()),
      studentLevel: v.optional(v.string()),
      howLongProducing: v.optional(v.string()),
      whySignedUp: v.optional(v.string()),
      genreSpecialty: v.optional(v.string()),
      
      // Engagement
      opensEmail: v.optional(v.boolean()),
      clicksLinks: v.optional(v.boolean()),
      
      // Location
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      stateCode: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
    })),
  },
  returns: v.object({
    imported: v.number(),
    updated: v.number(),
    skipped: v.number(),
    errors: v.array(v.object({
      email: v.string(),
      error: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors: Array<{ email: string; error: string }> = [];

    for (const fan of args.fans) {
      try {
        // Check if customer already exists
        const existing = await ctx.db
          .query("customers")
          .withIndex("by_email_and_store", (q) =>
            q.eq("email", fan.email).eq("storeId", args.storeId)
          )
          .first();

        const fullName = [fan.firstName, fan.lastName].filter(Boolean).join(" ") || fan.email;

        if (existing) {
          // Update existing customer with new fields
          await ctx.db.patch(existing._id, {
            phone: fan.phone || existing.phone,
            tags: fan.tags || existing.tags,
            score: fan.score !== undefined ? fan.score : existing.score,
            daw: fan.daw || existing.daw,
            typeOfMusic: fan.typeOfMusic || existing.typeOfMusic,
            goals: fan.goals || existing.goals,
            musicAlias: fan.musicAlias || existing.musicAlias,
            studentLevel: fan.studentLevel || existing.studentLevel,
            howLongProducing: fan.howLongProducing || existing.howLongProducing,
            whySignedUp: fan.whySignedUp || existing.whySignedUp,
            genreSpecialty: fan.genreSpecialty || existing.genreSpecialty,
            opensEmail: fan.opensEmail !== undefined ? fan.opensEmail : existing.opensEmail,
            clicksLinks: fan.clicksLinks !== undefined ? fan.clicksLinks : existing.clicksLinks,
            city: fan.city || existing.city,
            state: fan.state || existing.state,
            stateCode: fan.stateCode || existing.stateCode,
            zipCode: fan.zipCode || existing.zipCode,
            country: fan.country || existing.country,
            countryCode: fan.countryCode || existing.countryCode,
            activeCampaignId: fan.activeCampaignId || existing.activeCampaignId,
            lastActivity: Date.now(),
          });
          updated++;
        } else {
          // Create new customer/fan
          await ctx.db.insert("customers", {
            name: fullName,
            email: fan.email,
            storeId: args.storeId,
            adminUserId: args.adminUserId,
            type: "lead", // Default to lead, can be updated when they purchase
            status: "active",
            totalSpent: 0,
            lastActivity: Date.now(),
            source: "activecampaign_import",
            
            // ActiveCampaign fields
            phone: fan.phone,
            tags: fan.tags,
            score: fan.score,
            daw: fan.daw,
            typeOfMusic: fan.typeOfMusic,
            goals: fan.goals,
            musicAlias: fan.musicAlias,
            studentLevel: fan.studentLevel,
            howLongProducing: fan.howLongProducing,
            whySignedUp: fan.whySignedUp,
            genreSpecialty: fan.genreSpecialty,
            opensEmail: fan.opensEmail,
            clicksLinks: fan.clicksLinks,
            city: fan.city,
            state: fan.state,
            stateCode: fan.stateCode,
            zipCode: fan.zipCode,
            country: fan.country,
            countryCode: fan.countryCode,
            activeCampaignId: fan.activeCampaignId,
          });
          imported++;
        }
      } catch (error: any) {
        errors.push({
          email: fan.email,
          error: error.message,
        });
      }
    }

    return {
      imported,
      updated,
      skipped,
      errors,
    };
  },
});

