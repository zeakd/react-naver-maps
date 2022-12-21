import { withDocz } from 'next-docz/config';

/** @type {import('next').NextConfig} */
export default withDocz({
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  trailingSlash: true,
  basePath: process.env.WEBSITE_BASE_PATH,
});
