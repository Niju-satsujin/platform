import { z } from "zod";

export const ProofRulesSchema = z.object({
  mode: z.enum(["manual_or_regex", "regex", "manual"]).default("manual_or_regex"),
  input: z.enum(["paste_or_upload", "paste", "upload"]).default("paste_or_upload"),
  regexPatterns: z.array(z.string()).default([]),
  instructions: z.string().default("Submit proof for review."),
});

export const LessonFrontmatterSchema = z.object({
  id: z.string().min(1),
  part: z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1),
  duration_minutes: z.coerce.number().int().min(1).default(10),
  proof: z
    .object({
      type: z.string().optional(),
      status: z.string().optional(),
      instructions: z.string().optional(),
      regex_patterns: z.array(z.string()).optional(),
      patterns: z.array(z.string()).optional(),
    })
    .default({}),
  review_schedule_days: z.array(z.coerce.number().int().positive()).default([1, 3, 7, 14]),
});

export const PartFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1),
  description: z.string().default(""),
  arc: z.string().optional(),
});

export const QuestFrontmatterSchema = z.object({
  id: z.string().min(1),
  part: z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1).optional(),
  duration_minutes: z.coerce.number().int().positive().optional(),
  proof: z
    .object({
      type: z.string().optional(),
      status: z.string().optional(),
      instructions: z.string().optional(),
      regex_patterns: z.array(z.string()).optional(),
      patterns: z.array(z.string()).optional(),
    })
    .default({}),
});

export const ManifestPartSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1),
  files: z.object({
    part: z.string().min(1),
    quest: z.string().min(1),
    lessons: z.array(z.string().min(1)).min(1),
  }),
});

export const ContentManifestSchema = z.object({
  parts: z.array(ManifestPartSchema).min(1),
});

export type ProofRules = z.infer<typeof ProofRulesSchema>;
export type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;
export type PartFrontmatter = z.infer<typeof PartFrontmatterSchema>;
export type QuestFrontmatter = z.infer<typeof QuestFrontmatterSchema>;
export type ManifestPart = z.infer<typeof ManifestPartSchema>;
export type ContentManifest = z.infer<typeof ContentManifestSchema>;
