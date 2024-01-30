import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    prompts: defineTable({
      sessionId: v.string(),
      prompt: v.string(),
      result: v.union(
        v.null(),
        v.object({
          type: v.literal("text"),
          value: v.string(),
        }),
        v.object({
          type: v.literal("image"),
          value: v.id("_storage"),
        })
      ),
    }),
  },
  // If you ever get an error about schema mismatch
  // between your data and your schema, and you cannot
  // change the schema to match the current data in your database,
  // you can:
  //  1. Use the dashboard to delete tables or individual documents
  //     that are causing the error.
  //  2. Change this option to `false` and make changes to the data
  //     freely, ignoring the schema. Don't forget to change back to `true`!
  { schemaValidation: true }
);
