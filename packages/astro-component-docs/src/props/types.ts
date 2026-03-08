export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  hidden?: boolean;
}

export interface ComponentDoc {
  displayName: string;
  description?: string;
  props: PropInfo[];
}

export interface PropsOverride {
  description?: string;
  defaultValue?: string;
  hidden?: boolean;
  type?: string;
}

export interface PackageConfig {
  name: string;
  tsconfig?: string;
  entrypoint?: string;
  propsOverrides?: Record<string, Record<string, PropsOverride>>;
}

export interface AstroComponentDocsConfig {
  packages?: PackageConfig[];
}
