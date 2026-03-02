import { Project, Node, type Type, type Symbol as TsSymbol } from 'ts-morph';
import type { ComponentDoc, PropInfo, PackageConfig, PropsOverride } from './types.js';

/**
 * Extract props from a React component's type declarations using ts-morph.
 *
 * Strategy:
 * 1. Load the project from the package's tsconfig
 * 2. Find the component's exported function declaration
 * 3. Extract the first parameter's type (Props)
 * 4. For each property, extract name, type, required, description, defaultValue
 * 5. Apply user overrides
 */
export function extractAllProps(pkg: PackageConfig): ComponentDoc[] {
  const project = new Project({
    tsConfigFilePath: pkg.tsconfig,
    skipAddingFilesFromTsConfig: false,
  });

  const docs: ComponentDoc[] = [];

  // Find exported components across all source files
  for (const sourceFile of project.getSourceFiles()) {
    for (const exportedDecl of sourceFile.getExportedDeclarations()) {
      const [name, declarations] = exportedDecl;

      for (const decl of declarations) {
        if (!Node.isFunctionDeclaration(decl) && !Node.isVariableDeclaration(decl)) {
          continue;
        }

        const propsType = getComponentPropsType(decl);
        if (!propsType) continue;

        const props = extractPropsFromType(propsType);
        const overrides = pkg.propsOverrides?.[name] ?? {};
        const mergedProps = applyOverrides(props, overrides);

        docs.push({
          displayName: name,
          description: getJsDocDescription(decl),
          props: mergedProps.filter((p) => !p.hidden),
        });
      }
    }
  }

  return docs;
}

function getComponentPropsType(decl: any): Type | undefined {
  // Function declaration: function MyComponent(props: Props) { ... }
  if (Node.isFunctionDeclaration(decl)) {
    const params = decl.getParameters();
    if (params.length === 0) return undefined;
    return params[0].getType();
  }

  // Variable declaration: const MyComponent = (props: Props) => { ... }
  // or const MyComponent = forwardRef<Ref, Props>(...)
  if (Node.isVariableDeclaration(decl)) {
    const initializer = decl.getInitializer();
    if (!initializer) return undefined;

    // Arrow function or function expression
    if (Node.isArrowFunction(initializer) || Node.isFunctionExpression(initializer)) {
      const params = initializer.getParameters();
      if (params.length === 0) return undefined;
      return params[0].getType();
    }

    // Call expression: forwardRef<Ref, Props>(...)
    if (Node.isCallExpression(initializer)) {
      const typeArgs = initializer.getTypeArguments();
      if (typeArgs.length >= 2) {
        return typeArgs[1].getType();
      }
      // Fallback: check the inner function's first param
      const args = initializer.getArguments();
      if (args.length > 0) {
        const firstArg = args[0];
        if (Node.isArrowFunction(firstArg) || Node.isFunctionExpression(firstArg)) {
          const params = firstArg.getParameters();
          if (params.length === 0) return undefined;
          return params[0].getType();
        }
      }
    }
  }

  return undefined;
}

function extractPropsFromType(type: Type): PropInfo[] {
  const props: PropInfo[] = [];

  for (const prop of type.getProperties()) {
    const name = prop.getName();

    // Skip internal React props
    if (name === 'key' || name === 'ref' || name.startsWith('__')) continue;

    const valueDecl = prop.getValueDeclaration();
    if (!valueDecl) continue;

    const propType = prop.getTypeAtLocation(valueDecl);
    const isOptional = prop.isOptional();

    props.push({
      name,
      type: simplifyType(propType.getText()),
      required: !isOptional,
      description: getSymbolDescription(prop),
      defaultValue: undefined,
    });
  }

  return props;
}

function getSymbolDescription(symbol: TsSymbol): string | undefined {
  const docs = symbol.getJsDocTags();
  const descTag = docs.find((t) => t.getName() === 'description');
  if (descTag) {
    return descTag.getText().map((t) => t.text).join('');
  }

  // Fall back to JSDoc comment
  const declarations = symbol.getDeclarations();
  for (const decl of declarations) {
    if (Node.isJSDocable(decl)) {
      const jsDocs = decl.getJsDocs();
      if (jsDocs.length > 0) {
        return jsDocs[0].getDescription().trim();
      }
    }
  }

  return undefined;
}

function getJsDocDescription(decl: any): string | undefined {
  if (Node.isJSDocable(decl)) {
    const jsDocs = decl.getJsDocs();
    if (jsDocs.length > 0) {
      return jsDocs[0].getDescription().trim();
    }
  }
  return undefined;
}

/**
 * Simplify verbose TypeScript type strings for display.
 * e.g., `import("react").ReactNode` → `ReactNode`
 */
function simplifyType(typeStr: string): string {
  return typeStr
    .replace(/import\("[^"]*"\)\./g, '')
    .replace(/readonly /g, '');
}

function applyOverrides(
  props: PropInfo[],
  overrides: Record<string, PropsOverride>,
): PropInfo[] {
  return props.map((prop) => {
    const override = overrides[prop.name];
    if (!override) return prop;

    return {
      ...prop,
      description: override.description ?? prop.description,
      defaultValue: override.defaultValue ?? prop.defaultValue,
      type: override.type ?? prop.type,
      hidden: override.hidden ?? false,
    };
  });
}
