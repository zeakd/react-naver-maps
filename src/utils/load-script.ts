function createScript(src: string) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;

  return script;
}

function loadScript(src: string): Promise<HTMLScriptElement> {
  const head = document.getElementsByTagName('head')[0] || document.documentElement;
  const script = createScript(src);

  return new Promise((resolve, reject) => {
    script.onload = () => resolve(script);
    script.onerror = reject;

    head.appendChild(script);
  });
}

export default loadScript;
