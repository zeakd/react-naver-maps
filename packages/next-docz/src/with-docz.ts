import withMDX from '@next/mdx';
import type { NextConfig } from 'next';

import { rehypeDocz } from './rehype';

export function withDocz(config: NextConfig) {
  return withMDX({ options: { rehypePlugins: [rehypeDocz] } })(config);
}
