import { defineCollection } from 'astro:content';
import { docsSchema } from 'astro-component-docs/schema';

const docs = defineCollection({
  type: 'content',
  schema: docsSchema,
});

export const collections = { docs };
