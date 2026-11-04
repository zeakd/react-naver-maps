// @vitest-environment node
import { Suspense } from 'react';
// React 19.0·19.1 의 react-dom/server(Node 빌드)에는 renderToReadableStream 이 없다. edge 빌드는 19.x 모두에 있다.
import { renderToReadableStream } from 'react-dom/server.edge';
import { describe, expect, test } from 'vitest';
import { NavermapsProvider } from '../../sdk/provider.js';
import { useNavermaps } from '../use-navermaps.js';

function UsesSdk() {
  const navermaps = useNavermaps();
  return <p>{String(navermaps.Position.TOP_RIGHT)}</p>;
}

async function render(node: React.ReactNode) {
  const errors: unknown[] = [];
  const stream = await renderToReadableStream(node, {
    onError: (e) => {
      errors.push(e);
    },
  });
  await stream.allReady;
  const html = await new Response(stream).text();
  return { html, errors };
}

describe('서버 렌더의 useNavermaps', () => {
  test('Suspense 경계 안이면 멈추지 않고 fallback 을 내보낸다', async () => {
    const { html, errors } = await render(
      <NavermapsProvider ncpKeyId="test">
        <Suspense fallback={<span>loading</span>}>
          <UsesSdk />
        </Suspense>
      </NavermapsProvider>,
    );
    expect(html).toContain('loading');
    expect(String(errors[0])).toContain('브라우저에서만');
  });

  test('경계가 없으면 원인이 적힌 오류로 실패한다', async () => {
    await expect(
      render(
        <NavermapsProvider ncpKeyId="test">
          <UsesSdk />
        </NavermapsProvider>,
      ),
    ).rejects.toThrow(/브라우저에서만/);
  });
});
