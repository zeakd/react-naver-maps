import { useMDXComponents } from '@mdx-js/react';
import type { NextPage } from 'next';
import Intro from '../docs/introduction.mdx';

const Home: NextPage = () => {
  return (
    <Intro />
  );
};

export default Home;
