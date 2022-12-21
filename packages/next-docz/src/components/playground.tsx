import React from 'react';
import type { ReactNode } from 'react';
import { useMDXComponents } from '@mdx-js/react';

type Props = {
  children?: ReactNode;
  __code?: string;
  codeClassName?: string;
};

export function Playground(props: Props) {
  const components = useMDXComponents();
  const Code = components.code ?? 'code';

  return (
    <>
      {props.children}
      <Code className={props.codeClassName}>
        {props.__code}
      </Code>
    </>
  );
}
