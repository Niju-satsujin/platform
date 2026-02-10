import { z } from "zod";

export const ProofRulesSchema = z.object({
  mode: z.enum(["manual_or_regex", "regex", "manual"]).default("manual_or_regex"),
  input: z.enum(["paste_or_upload", "paste", "upload"]).default("paste_or_upload"),
  regexPatterns: z.array(z.string()).default([]),
  instructions: z.string().default("Submit proof for review."),
});

export const LessonFrontmatterSchema = z.object({
  id: z.string().min(1),
  part: z.string().optional(),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1),
  type: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(1).optional(),
  duration_min: z.coerce.number().int().min(1).optional(),
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
}).transform((data) => ({
  ...data,
  duration_minutes: data.duration_minutes ?? data.duration_min ?? 10,
}));

export const PartFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1),
  type: z.string().optional(),
  description: z.string().default(""),
  arc: z.string().optional(),
});

export const QuestFrontmatterSchema = z.object({
  id: z.string().min(1),
  part: z.string().optional(),
  title: z.string().min(1),
  order: z.coerce.number().int().min(1).optional(),
  type: z.string().optional(),
  duration_minutes: z.coerce.number().int().positive().optional(),
  duration_min: z.coerce.number().int().positive().optional(),
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
  arc: z.string().optional(),
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
