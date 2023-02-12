// import { prettier } from 'prettier/esm';

export const formatter = async (code: string) => {

  const { default: prettier } = await import('prettier');
  return prettier.format(code, {
    parser: 'babel',
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
  });
};

export const format = async (code: string): Promise<string> => {
  try {
    const result = await formatter(code);
    return result;
  } catch (error) {
    console.error(error);
    return code;
  }
};
