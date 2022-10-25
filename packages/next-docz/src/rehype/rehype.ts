import { source } from 'unist-util-source';
import { visit } from 'unist-util-visit';
import { visit as estreeVisit } from 'estree-util-visit';
import { strip } from './strip-indent';
import { format } from './format';
import { inspect } from 'util';

import docgen from 'react-docgen-typescript';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { fromJs } from 'esast-util-from-js';

const require = createRequire(pathToFileURL(path.resolve(process.cwd(), './next.config.mjs')));

function isPlayground(name: string) {
  return name.includes('Playground');
}

function isProps(name: string) {
  return name.includes('Props');
}

function walk(children: any[], cb: (node: any) => void) {
  for (const node of children) {
    cb(node);
    node.children && walk(node.children, cb);
  }
}

const addComponentsProps = (vfile: any) => async (node: any, idx: number) => {
  if (isPlayground(node.name)) {
    const codes = await Promise.all(node.children
      .map((child: any) => format(source(child, vfile)!))
      .map(async (promise: Promise<string>) => {
        const str = await promise;
        if (str.startsWith(';')) return str.slice(1, Infinity);
        return str;
      }));
    const code = strip(codes.join(''));
    const attrType = node.attributes.find((attr: any) => attr.name === 'type');
    node.attributes.push(
      { type: 'mdxJsxAttribute', name: '__position', value: idx },
      { type: 'mdxJsxAttribute', name: '__code', value: code },
    );

    walk(node.children, (node) => {
      if (node.type === 'mdxJsxFlowElement') {
        node.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'client:only',
          value: attrType?.value ?? 'react',
        });
      }
    });
  }
};

export interface PluginOpts {
  root: string;
}

export function rehypeDocz() {
  return async (tree: any, vfile: any) => {
    // console.log(JSON.stringify(tree.children[0], null, 2));
    const nodes = tree.children
      .filter((node: any) => node.type.toLowerCase().includes('jsx'))
      .map(addComponentsProps(vfile));

    await Promise.all(nodes);

    visit(tree, (node: any) => {
      return node.type === 'mdxJsxFlowElement' && isProps(node.name);
    }, (targetNode) => {
      const ofAttr = targetNode.attributes?.find((attr: any) => attr.name === 'of');
      const componentName = ofAttr.value.value;

      let sourceModuleName = '';
      visit(tree, (node: any) => {
        return node.type === 'mdxjsEsm';
      }, (node: any) => {
        estreeVisit(node.data.estree, (node: any) => {
          if (!node.specifiers) return;
          for (const specifier of node.specifiers) {
            if (specifier.imported.name === componentName) {
              sourceModuleName = node.source.value;
            }
          }
        });
      });

      const filepath = require.resolve(sourceModuleName);
      const sourcemap = JSON.parse(fs.readFileSync(`${filepath}.map`, 'utf8'));

      const parsed = docgen.parse(path.resolve(path.dirname(filepath), sourcemap.sources[0]));
      const doc = parsed.filter(comp => comp.displayName === componentName)[0];

      targetNode.attributes.push({
        type: 'mdxJsxAttribute',
        name: '__docgen',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: `(${JSON.stringify(doc)})`,
          data: { estree: fromJs(`(${JSON.stringify(doc)})`, { module: true }) },
        },
      });
    });

    return tree;
  };
}