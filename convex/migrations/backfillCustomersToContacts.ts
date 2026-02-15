import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Backfill emailContacts from existing customers (paginated version)
 * This syncs customers to the emailContacts table for email marketing
 * 
 * Run multiple times until isDone is true
 * Each run processes up to 100 customers to avoid hitting document read limits
 */
export const backfillCustomersToContacts = internalMutation({
  args: {
    storeId: v.string(),
    batchSize: v.optional(v.number()), // Default 100
    cursor: v.optional(v.string()), // For pagination
  },
  returns: v.object({
    success: v.boolean(),
    contactsCreated: v.number(),
    contactsUpdated: v.number(),
    customersProcessed: v.number(),
    alreadyExisted: v.number(),
    errors: v.number(),
    errorDetails: v.array(v.string()),
    isDone: v.boolean(),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let contactsCreated = 0;
    let contactsUpdated = 0;
    let customersProcessed = 0;
    let alreadyExisted = 0;
    let errors = 0;
    const errorDetails: string[] = [];
    const batchSize = args.batchSize || 100;

    try {
      // Get customers with pagination
      const paginationOpts = {
        numItems: batchSize,
        cursor: args.cursor || null,
      };
      
      const customersResult = await ctx.db
        .query("customers")
        .withIndex("by_storeId", (q) => q.eq("storeId", args.storeId))
        .paginate(paginationOpts);
      
      const customers = customersResult.page;

      console.log(`Found ${customers.length} customers to process for store ${args.storeId}`);

      for (const customer of customers) {
        customersProcessed++;

        try {
          if (!customer.email) {
            console.log(`Skipping customer ${customer._id} - no email`);
            continue;
          }

          // Check if contact already exists
          const existingContact = await ctx.db
            .query("emailContacts")
            .withIndex("by_storeId_and_email", (q) =>
              q.eq("storeId", args.storeId).eq("email", customer.email.toLowerCase())
            )
            .first();

          const now = Date.now();

          // Parse name into first/last
          const nameParts = customer.name?.split(" ") || [];
          const firstName = nameParts[0] || undefined;
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

          if (existingContact) {
            // Update existing contact with customer data if needed
            const updates: Record<string, any> = {
              updatedAt: now,
            };

            // Only update if the contact doesn't have these fields
            if (!existingContact.firstName && firstName) {
              updates.firstName = firstName;
            }
            if (!existingContact.lastName && lastName) {
              updates.lastName = lastName;
            }

            // Add customer tag if not present
            const customerTagId = await getOrCreateCustomerTag(ctx, args.storeId);
            if (customerTagId && !existingContact.tagIds.includes(customerTagId)) {
              updates.tagIds = [...existingContact.tagIds, customerTagId];
            }

            // Update customFields with customer data
            const currentCustomFields = existingContact.customFields || {};
            if (customer.type === "paying" || customer.totalSpent && customer.totalSpent > 0) {
              updates.customFields = {
                ...currentCustomFields,
                isCustomer: true,
                totalSpent: customer.totalSpent || 0,
                customerType: customer.type,
                lastActivity: customer.lastActivity,
              };
            }

            await ctx.db.patch(existingContact._id, updates);
            contactsUpdated++;
            alreadyExisted++;
          } else {
            // Create new contact
            const customerTagId = await getOrCreateCustomerTag(ctx, args.storeId);

            await ctx.db.insert("emailContacts", {
              storeId: args.storeId,
              email: customer.email.toLowerCase(),
              firstName,
              lastName,
              status: "subscribed",
              subscribedAt: customer._creationTime || now,
              tagIds: customerTagId ? [customerTagId] : [],
              source: customer.source || "customer_backfill",
              emailsSent: 0,
              emailsOpened: 0,
              emailsClicked: 0,
              customFields: {
                isCustomer: true,
                totalSpent: customer.totalSpent || 0,
                customerType: customer.type,
                lastActivity: customer.lastActivity,
              },
              createdAt: customer._creationTime || now,
              updatedAt: now,
            });
            contactsCreated++;
          }
        } catch (error) {
          console.error(`Error processing customer ${customer._id}:`, error);
          errorDetails.push(`Customer ${customer._id}: ${error}`);
          errors++;
        }
      }

      const isDone = customersResult.isDone;
      console.log(`Backfill batch complete: ${contactsCreated} created, ${contactsUpdated} updated, ${alreadyExisted} already existed, ${errors} errors. Done: ${isDone}`);

      return {
        success: true,
        contactsCreated,
        contactsUpdated,
        customersProcessed,
        alreadyExisted,
        errors,
        errorDetails: errorDetails.slice(0, 10),
        isDone,
        nextCursor: isDone ? undefined : customersResult.continueCursor,
      };
    } catch (error) {
      console.error("Backfill failed:", error);
      return {
        success: false,
        contactsCreated,
        contactsUpdated,
        customersProcessed,
        alreadyExisted,
        errors: errors + 1,
        errorDetails: [...errorDetails, `Fatal: ${error}`].slice(0, 10),
        isDone: false,
        nextCursor: undefined,
      };
    }
  },
});

// Helper to get or create the "customer" tag
async function getOrCreateCustomerTag(ctx: any, storeId: string) {
  const existingTag = await ctx.db
    .query("emailTags")
    .withIndex("by_storeId_and_name", (q: any) =>
      q.eq("storeId", storeId).eq("name", "customer")
    )
    .first();

  if (existingTag) {
    return existingTag._id;
  }

  const now = Date.now();
  return await ctx.db.insert("emailTags", {
    storeId,
    name: "customer",
    color: "#F59E0B",
    description: "Customers who have made a purchase",
    contactCount: 0,
    createdAt: now,
    updatedAt: now,
  });
}
