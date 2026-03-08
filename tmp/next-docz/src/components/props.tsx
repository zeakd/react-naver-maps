import { css } from '@emotion/react';
import type { ReactNode, ComponentType } from 'react';
import { Fragment } from 'react';

type Props = {
  of?: ComponentType;
  children?: ReactNode;
  attrs?: string[];
  __docgen?: any;
};

export function Props({ __docgen: docgen, attrs: attrNames }: Props) {
  const attrs = Object.entries(docgen.props).filter(([key]) => {
    if (attrNames) {
      return attrNames.includes(key);
    }

    return !['key', 'ref'].includes(key);
  }).map(([, value]) => value);

  return (
    <div
      css={css({
        display: 'grid',
        gridTemplateColumns: 'max-content fit-content(200px) 100px 1fr',
        gridGap: '5px',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        background: 'rgb(250, 250, 250)',
        padding: '5px',
      })}
    >
      <div
        css={css({
          padding: '5px',
          fontWeight: 'bold',
          color: 'black',
        })}
      >Name</div>
      <div
        css={css({
          padding: '5px',
          fontWeight: 'bold',
          color: 'black',
        })}
      >Type</div>
      <div
        css={css({
          padding: '5px',
          fontWeight: 'bold',
          color: 'black',
        })}
      >Default</div>
      <div
        css={css({
          padding: '5px',
          fontWeight: 'bold',
          color: 'black',
        })}
      >Description</div>
      {attrs.map((attr: any) => {
        return (
          <Fragment
            key={attr.name}
          >
            <div
              css={css({
                padding: '5px',

                color: 'rgb(124, 77, 255)',
              })}
            >
              {attr.name}
            </div>
            <div
              css={css({
                padding: '5px',
                color: 'rgb(57, 173, 181)',
              })}
            >
              {attr.type?.name}
            </div>
            <div
              css={css({ padding: '5px' })}
            >
              {attr.required ? (
                <span css={css({ color: 'rgb(247, 109, 71)' })}>Required</span>
              ) : (
                <span
                  css={css({ color: 'rgb(246, 164, 52)' })}
                >
                  {attr.defaultValue != null ? attr.defaultValue.value : '-'}
                </span>
              )}
            </div>
            <div
              css={css({
                padding: '5px',
                color: 'rgb(144, 164, 174)',
              })}
            >
              {attr.description}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
