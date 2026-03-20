import type { ComponentType } from 'react';

interface Props {
  of: ComponentType;
}

/**
 * Thin React wrapper for rendering example components inside Astro islands.
 * Used when you need to pass a component reference through props.
 *
 * In most cases the rehype plugin injects the component directly as a child
 * of <Example>, so this renderer is not needed. It exists for programmatic use.
 */
export default function ExampleRenderer({ of: Component }: Props) {
  return <Component />;
}
