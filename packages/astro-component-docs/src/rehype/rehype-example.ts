import { fromJs } from 'esast-util-from-js';
import { visit as estreeVisit } from 'estree-util-visit';
import { visit } from 'unist-util-visit';

function isExample(name: string | null | undefined): boolean {
  return name != null && /\bExample\b/.test(name);
}

/**
 * Rehype plugin that transforms `<Example of={Component} />` in MDX.
 *
 * 1. Finds the import source of the referenced component
 * 2. Adds a `?raw` import to get the source code as a string
 * 3. Injects `__code` prop with the raw source
 * 4. Inserts the component as a child with `client:only="react"`
 */
export function rehypeExample() {
  return (tree: any) => {
    let sourceCounter = 0;
    const rawImports: Array<{ varName: string; sourcePath: string }> = [];

    visit(
      tree,
      (node: any) =>
        node.type === 'mdxJsxFlowElement' && isExample(node.name),
      (exampleNode: any) => {
        const ofAttr = exampleNode.attributes?.find(
          (a: any) => a.name === 'of',
        );
        if (!ofAttr?.value) return;

        // Extract identifier name from the `of` expression
        let componentName = '';
        if (typeof ofAttr.value === 'string') {
          componentName = ofAttr.value;
        } else if (ofAttr.value?.data?.estree) {
          estreeVisit(ofAttr.value.data.estree, (node: any) => {
            if (node.type === 'Identifier' && !componentName) {
              componentName = node.name;
            }
          });
        }
        if (!componentName) return;

        // Find the import source for this component
        let sourcePath = '';
        visit(
          tree,
          (node: any) => node.type === 'mdxjsEsm',
          (esmNode: any) => {
            estreeVisit(esmNode.data.estree, (estreeNode: any) => {
              if (estreeNode.type !== 'ImportDeclaration') return;
              for (const spec of estreeNode.specifiers ?? []) {
                if (spec.local?.name === componentName) {
                  sourcePath = estreeNode.source.value;
                }
              }
            });
          },
        );
        if (!sourcePath) return;

        const varName = `__exSource${sourceCounter++}`;
        rawImports.push({ varName, sourcePath });

        // Remove the `of` attribute
        exampleNode.attributes = exampleNode.attributes.filter(
          (a: any) => a !== ofAttr,
        );

        // Add __code attribute (references the raw import variable)
        exampleNode.attributes.push({
          type: 'mdxJsxAttribute',
          name: '__code',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: varName,
            data: { estree: fromJs(varName, { module: true }) },
          },
        });

        // Insert the component as a child with client:only="react"
        exampleNode.children = [
          {
            type: 'mdxJsxFlowElement',
            name: componentName,
            attributes: [
              {
                type: 'mdxJsxAttribute',
                name: 'client:only',
                value: 'react',
              },
            ],
            children: [],
            data: { _mdxExplicitJsx: true },
          },
        ];
      },
    );

    // Add raw imports at the top of the tree (after existing imports)
    if (rawImports.length > 0) {
      const importStatements = rawImports
        .map(
          ({ varName, sourcePath }) =>
            `import ${varName} from '${sourcePath}?raw'`,
        )
        .join('\n');

      const importNode = {
        type: 'mdxjsEsm',
        value: importStatements,
        data: {
          estree: fromJs(importStatements, { module: true }),
        },
      };

      const lastImportIdx = findLastIndex(
        tree.children,
        (node: any) => node.type === 'mdxjsEsm',
      );
      tree.children.splice(lastImportIdx + 1, 0, importNode);
    }

    return tree;
  };
}

function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}
