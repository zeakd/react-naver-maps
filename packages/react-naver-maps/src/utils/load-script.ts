import _loadScript from 'load-script';

export function loadScript(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    _loadScript(src, (err, script) => {
      if (err) reject(err);
      else resolve(script);
    });
  });
}
