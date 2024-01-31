import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  ActionCtx,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";

export const listPrompts = query({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query("prompts")
      // Ordered by _creationTime, return most recent
      .order("desc")
      .take(args.count);
    return prompts;
  },
});

export const addPrompt = mutation({
  args: {
    sessionId: v.string(),
    prompt: v.string(),
    outputType: v.union(v.literal("text"), v.literal("image")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("prompts", {
      sessionId: args.sessionId,
      prompt: args.prompt,
      result: null,
    });
    await ctx.scheduler.runAfter(0, internal.ai.generate, {
      prompt: args.prompt,
      outputType: args.outputType,
      id,
    });
  },
});

export const generate = internalAction({
  args: {
    prompt: v.string(),
    outputType: v.union(v.literal("text"), v.literal("image")),
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    await generateText(ctx, args.prompt, args.id);
  },
});

async function generateText(ctx: ActionCtx, prompt: string, id: Id<"prompts">) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getOpenAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Try to come up with the most hilarious answer to what the user says.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    await generateFailed(ctx, id, response, `OpenAI API error`);
  }
  const json = await response.json();
  const result = json.choices[0].message.content;
  await ctx.runMutation(internal.ai.setTextResult, { id, result });
}

async function generateFailed(
  ctx: ActionCtx,
  id: Id<"prompts">,
  response: Response,
  error: string
) {
  await ctx.runMutation(internal.ai.deletePrompt, { id });
  console.error(response);
  throw new Error(error);
}

export const deletePrompt = internalMutation({
  args: {
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const setTextResult = internalMutation({
  args: {
    id: v.id("prompts"),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      result: { type: "text", value: args.result },
    });
  },
});

export const setImageResult = internalMutation({
  args: {
    id: v.id("prompts"),
    result: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      result: { type: "image", value: args.result },
    });
  },
});

async function getOpenAIKey() {
  if (process.env.OPENAI_API_KEY !== undefined) {
    return process.env.OPENAI_API_KEY;
  }
  const response = await fetch("https://brazen-platypus-69.convex.site/key");
  if (!response.ok) {
    throw new Error(
      `You need to setup \`OPENAI_API_KEY\` environment variable, follow Step 8 `
    );
  }
  return await response.text();
}
