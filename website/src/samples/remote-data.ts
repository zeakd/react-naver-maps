import { useEffect, useState } from 'react';

/** 공식 예제 문서 사이트. 데이터·이미지는 저장소에 복사하지 않고 이 주소에서 받는다. */
export const DOCS_URL = 'https://navermaps.github.io/maps.js.ncp/docs';

/** JSON 을 받아 온다. 받는 동안은 undefined. */
export function useJson<T>(path: string): T | undefined {
  const [data, setData] = useState<T>();
  useEffect(() => {
    let alive = true;
    fetch(`${DOCS_URL}/${path}`)
      .then((r) => r.json())
      .then((json: T) => alive && setData(json));
    return () => {
      alive = false;
    };
  }, [path]);
  return data;
}

/** 여러 JSON 을 한꺼번에 받는다. 모두 도착해야 값이 생긴다. */
export function useJsonAll<T>(paths: string[]): T[] | undefined {
  const [data, setData] = useState<T[]>();
  const key = paths.join('|');
  useEffect(() => {
    let alive = true;
    Promise.all(
      key
        .split('|')
        .map((p) =>
          fetch(`${DOCS_URL}/${p}`).then((r) => r.json() as Promise<T>),
        ),
    ).then((all) => alive && setData(all));
    return () => {
      alive = false;
    };
  }, [key]);
  return data;
}

/** XML(KML, GPX)을 받아 Document 로 만든다. 한 번만 파싱해 같은 참조를 유지한다. */
export function useXml(path: string): Document | undefined {
  const [doc, setDoc] = useState<Document>();
  useEffect(() => {
    let alive = true;
    fetch(`${DOCS_URL}/${path}`)
      .then((r) => r.text())
      .then(
        (text) =>
          alive && setDoc(new DOMParser().parseFromString(text, 'text/xml')),
      );
    return () => {
      alive = false;
    };
  }, [path]);
  return doc;
}
