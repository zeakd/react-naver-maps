import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import { Prism } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const targets = [
  {
    name: 'tutorial-1-map-simple',
    filepath: 'examples/tutorial-1-map-simple.mdx',
  },
  {
    name: 'tutorial-2-map-options',
    filepath: 'examples/tutorial-2-map-options.mdx',
  },
  {
    name: 'tutorial-3-map-types',
    filepath: 'examples/tutorial-3-map-types.mdx',
  },
  {
    name: 'tutorial-4-map-bounds',
    filepath: 'examples/tutorial-4-map-bounds.mdx',
  },
];

const pages = targets.reduce<Record<string, ComponentType>>(
  (acc, target) => {
    return {
      ...acc,
      [target.name]: dynamic(() => import(`../../docs/${target.filepath}`), { ssr: false }),
    };
  },
  {},
);

function code(props: any) {
  const match = /language-(\w+)/.exec(props.className || '');

  return match
    ? <Prism {...props} language={match[1]} PreTag="div" style={dracula} />
    : <code {...props} />;
}

export default function Page({ name }: any) {
  const PageComponent = pages[name as string] as ComponentType<{ components: any }>;

  return (
    <PageComponent components={{ code }} />
  );
}

export async function getStaticPaths() {
  return {
    paths: targets.map(target => {
      return { params: { name: target.name } };
    }),
    fallback: false,
  };
}

export async function getStaticProps({ params }: any) {
  return { props: { name: params.name } };
}
