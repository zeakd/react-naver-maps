import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsSchema } from 'astro-component-docs/schema';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema,
});

export const collections = { docs };
