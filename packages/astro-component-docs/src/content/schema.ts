import { z } from 'astro/zod';

export const docsSchema = z.object({
  title: z.string(),
  category: z.string(),
  order: z.number().optional(),
  menuName: z.string().optional(),
  hidden: z.boolean().optional().default(false),
});

export type DocsFrontmatter = z.infer<typeof docsSchema>;
