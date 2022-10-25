import type { NextConfig } from 'next';
import withMDX from '@next/mdx';
import { rehypeDocz } from './rehype';

export function withDocz(config: NextConfig) {
  return withMDX({ options: { rehypePlugins: [rehypeDocz] } })(config);
}
