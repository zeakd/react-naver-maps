import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Project, Node, type Type, type Symbol as TsSymbol } from 'ts-morph';
import type {
  ComponentDoc,
  PropInfo,
  PackageConfig,
  PropsOverride,
} from './types.js';

/**
 * Extract props from a React component's .d.ts declarations using ts-morph.
 *
 * Strategy:
 * 1. Read the package's tsconfig to find outDir and compiler options
 * 2. Load .d.ts files from outDir (not source files)
 * 3. Find the component's exported function declaration
 * 4. Extract the first parameter's type (Props)
 * 5. For each property, extract name, type, required, description, defaultValue
 * 6. Apply user overrides
 */
export function extractAllProps(pkg: PackageConfig): ComponentDoc[] {
  const tsconfigPath = resolve(pkg.tsconfig!);
  const tsconfigDir = dirname(tsconfigPath);
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
  const outDir = tsconfig.compilerOptions?.outDir ?? 'dist';
  const dtsDir = resolve(tsconfigDir, outDir);

  const project = new Project({
    tsConfigFilePath: tsconfigPath,
    skipAddingFilesFromTsConfig: true,
  });

  const added = project.addSourceFilesAtPaths(`${dtsDir}/**/*.d.ts`);
  if (added.length === 0) {
    console.warn(
      `[astro-component-docs] No .d.ts files found in "${dtsDir}". ` +
        `Build the package first (e.g. tsc -b).`,
    );
    return [];
  }

  const docs: ComponentDoc[] = [];

  // Find exported components across all source files
  for (const sourceFile of project.getSourceFiles()) {
    for (const exportedDecl of sourceFile.getExportedDeclarations()) {
      const [name, declarations] = exportedDecl;

      for (const decl of declarations) {
        if (
          !Node.isFunctionDeclaration(decl) &&
          !Node.isVariableDeclaration(decl)
        ) {
          continue;
        }

        const propsType = getComponentPropsType(decl);
        if (!propsType) continue;

        const props = extractPropsFromType(propsType, decl);
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
    // .d.ts 의 `declare const X: { (props: P): ... }` 처럼 초기값이 없으면 타입의 호출 시그니처에서
    // 첫 매개변수 타입을 읽는다. 컴포넌트를 만드는 함수(defineOverlay 등)의 결과가 이렇게 나온다.
    if (!initializer) return firstParamOfCallSignature(decl);

    // Arrow function or function expression
    if (
      Node.isArrowFunction(initializer) ||
      Node.isFunctionExpression(initializer)
    ) {
      const params = initializer.getParameters();
      if (params.length === 0) return undefined;
      return params[0].getType();
    }

    // Call expression: forwardRef<Ref, Props>(...), defineOverlay<Props, Instance>(...) 등.
    // 만들어진 컴포넌트의 호출 시그니처에서 첫 매개변수 타입을 읽는다. 타입 인자 순서는
    // 감싸는 함수마다 달라서 기대지 않는다.
    if (Node.isCallExpression(initializer)) {
      const fromSignature = firstParamOfCallSignature(decl);
      if (fromSignature) return fromSignature;
      const typeArgs = initializer.getTypeArguments();
      if (typeArgs.length >= 2) {
        return typeArgs[1].getType();
      }
      // Fallback: check the inner function's first param
      const args = initializer.getArguments();
      if (args.length > 0) {
        const firstArg = args[0];
        if (
          Node.isArrowFunction(firstArg) ||
          Node.isFunctionExpression(firstArg)
        ) {
          const params = firstArg.getParameters();
          if (params.length === 0) return undefined;
          return params[0].getType();
        }
      }
    }
  }

  return undefined;
}

function firstParamOfCallSignature(decl: any): Type | undefined {
  const signature = decl.getType().getCallSignatures()[0];
  const param = signature?.getParameters()[0];
  return param ? param.getTypeAtLocation(decl) : undefined;
}

function extractPropsFromType(type: Type, location: Node): PropInfo[] {
  const props: PropInfo[] = [];

  for (const prop of type.getProperties()) {
    const name = prop.getName();

    // Skip internal React props
    if (name === 'key' || name === 'ref' || name.startsWith('__')) continue;

    // 매핑 타입(EventHandlerProps<…> 처럼 이름 목록에서 만든 prop)은 값 선언이 없다. 그때는 컴포넌트
    // 선언 위치에서 타입을 읽는다. 건너뛰면 onClick 같은 이벤트가 표에서 빠진다.
    const at = prop.getValueDeclaration() ?? location;
    const propType = prop.getTypeAtLocation(at);
    const isOptional = prop.isOptional();

    props.push({
      name,
      type: simplifyType(propType.getText()),
      required: !isOptional,
      description: getSymbolDescription(prop) ?? eventDescription(name),
      defaultValue: undefined,
    });
  }

  return props;
}

/**
 * 설명이 없는 on* prop 은 대응하는 SDK 이벤트 이름을 적는다. 라이브러리 규칙: onClick → click,
 * onPositionChanged → position_changed(KVO 변경 이벤트).
 */
function eventDescription(name: string): string | undefined {
  const m = /^on([A-Z]\w*)$/.exec(name);
  if (!m) return undefined;
  const base = m[1]!;
  const event = base.endsWith('Changed')
    ? `${base[0]!.toLowerCase()}${base.slice(1, -'Changed'.length)}_changed`
    : base.toLowerCase();
  return `SDK의 \`${event}\` 이벤트.`;
}

function getSymbolDescription(symbol: TsSymbol): string | undefined {
  const docs = symbol.getJsDocTags();
  const descTag = docs.find((t) => t.getName() === 'description');
  if (descTag) {
    return descTag
      .getText()
      .map((t) => t.text)
      .join('');
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
  return typeStr.replace(/import\("[^"]*"\)\./g, '').replace(/readonly /g, '');
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
