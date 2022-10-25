import type { ReactNode, ComponentType } from 'react';

type Props = {
  of?: ComponentType;
  children?: ReactNode;
};

export function Props(props: Props) {
  console.log(props);
  return null;
}
