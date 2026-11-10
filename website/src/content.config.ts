import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { docsSchema } from 'astro-component-docs/schema';

// 예제 페이지는 같은 자리에 공식 예제 링크와 "React 로 옮기며 바꾼 점"을 그린다([...slug].astro).
const exampleFields = {
  /** 대응하는 네이버 공식 예제 주소. 있으면 공식 예제를 옮긴 예제다. */
  official: z.string().url().optional(),
  /** 공식 예제에서 React 로 옮기며 바꾼 점. official 은 공식 예제의 방식, react 는 이 예제의 방식. */
  changes: z
    .array(z.object({ official: z.string(), react: z.string() }))
    .optional(),
  /** 그대로 옮기지 못했거나 다르게 동작하는 점. */
  limits: z.array(z.string()).optional(),
  /** 공식 예제에는 없는, 이 예제에서 더한 것. */
  additions: z.array(z.string()).optional(),
};

const docs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/docs' }),
  schema: docsSchema.extend(exampleFields),
});

export const collections = { docs };
