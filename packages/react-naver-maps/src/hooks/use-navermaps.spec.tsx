import React, { Suspense } from 'react';
import { fireEvent } from '@testing-library/react';
import { renderHook, WrapperComponent } from '@testing-library/react-hooks';
import { ClientOptionsContext } from '../contexts/client-options';
import { useNavermaps } from './use-navermaps';

const testId = 'test-naver-cilent-id';
const naverMock = { maps: { jsContentLoaded: true } };

describe('useNavermaps()', () => {
  test('Suspense client fetching', async () => {
    const wrapper: WrapperComponent<unknown> = ({ children }) => (
      <ClientOptionsContext.Provider value={{ ncpClientId: testId }}>
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </ClientOptionsContext.Provider>
    );

    const { result, waitForNextUpdate } = renderHook(() => useNavermaps(), { wrapper });
    expect(document.head.innerHTML).toMatch(new RegExp(`^<script.*=${testId}`));

    // jsdom doesn't excute <script />. Instead of mock & fetch navermaps cdn client,
    // we just fire onload event to await loadNavermapsScript
    // @ts-expect-error mocking navermaps client loader
    window.naver = naverMock;
    fireEvent(
      document.getElementsByTagName('script')[0],
      new Event('load'),
    );

    await waitForNextUpdate();

    expect(result.current).toBe(naverMock.maps);
  });
});
