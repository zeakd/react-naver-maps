import { useMDXComponents } from '@mdx-js/react';
import React from 'react';

type Props = {
  children?: React.ReactNode | React.ComponentType;
  __code?: string;
  codeHeader?: string;
  codeClassName?: string;
};

export function Playground(props: Props) {
  const components = useMDXComponents();
  const Code = components.code ?? 'code';

  return (
    <>
      {typeof props.children === 'function' ? React.createElement(props.children as React.FC) : props.children}
      <Code className={`language-tsx ${props.codeClassName}`}>
        {`${props.codeHeader || ''}\n${props.__code}`}
      </Code>
    </>
  );
}
