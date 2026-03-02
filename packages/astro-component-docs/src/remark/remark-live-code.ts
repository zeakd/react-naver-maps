import { fromJs } from 'esast-util-from-js';
import { visit } from 'unist-util-visit';

interface ImportSpec {
  module: string;
  names: Array<{ name: string; alias?: string }>;
}

/**
 * Remark plugin that transforms fenced code blocks with `live` meta
 * into `<LiveCode>` components.
 *
 * Input:
 * ```tsx live imports="react-naver-maps:NaverMap,Container as MapDiv"
 * <MapDiv style={{ width: '100%', height: '600px' }}>
 *   <NaverMap />
 * </MapDiv>
 * ```
 *
 * Output (MDX JSX):
 * <LiveCode
 *   code="..."
 *   lang="tsx"
 *   imports={[{ module: 'react-naver-maps', names: [...] }]}
 * />
 */
export function remarkLiveCode() {
  return (tree: any) => {
    visit(tree, 'code', (node: any, index, parent) => {
      if (index == null || !parent) return;
      if (!node.meta?.includes('live')) return;

      const lang = node.lang || 'tsx';
      const code = node.value;
      const imports = parseImportsMeta(node.meta);

      // Replace the code node with an mdxJsxFlowElement
      const liveCodeNode: any = {
        type: 'mdxJsxFlowElement',
        name: 'LiveCode',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'code',
            value: code,
          },
          {
            type: 'mdxJsxAttribute',
            name: 'lang',
            value: lang,
          },
        ],
        children: [],
        data: { _mdxExplicitJsx: true },
      };

      // Add imports attribute if present
      if (imports.length > 0) {
        const importsJson = JSON.stringify(imports);
        liveCodeNode.attributes.push({
          type: 'mdxJsxAttribute',
          name: 'imports',
          value: {
            type: 'mdxJsxAttributeValueExpression',
            value: importsJson,
            data: { estree: fromJs(`(${importsJson})`, { module: true }) },
          },
        });
      }

      parent.children[index] = liveCodeNode;
    });
  };
}

/**
 * Parse the `imports` meta from the code fence.
 *
 * Format: `imports="module1:Name1,Name2 as Alias;module2:Name3"`
 *
 * - Modules separated by `;`
 * - Module name and specifiers separated by `:`
 * - Specifiers separated by `,`
 * - Aliases with `as`
 */
function parseImportsMeta(meta: string): ImportSpec[] {
  const match = meta.match(/imports="([^"]*)"/);
  if (!match) return [];

  const raw = match[1];
  return raw.split(';').map((segment) => {
    const [moduleName, specifiersStr] = segment.split(':');
    const names = (specifiersStr || '').split(',').map((s) => {
      const parts = s.trim().split(/\s+as\s+/);
      return parts.length === 2
        ? { name: parts[0], alias: parts[1] }
        : { name: parts[0] };
    });
    return { module: moduleName.trim(), names };
  });
}
