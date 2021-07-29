// import { NaverMap } from '../naver-map';
// import { render, fireEvent, waitFor, screen } from '@testing-library/react';

import { renderHook, act } from '@testing-library/react-hooks';
import { useState, useCallback } from 'react';

function useCounter() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount((x) => x + 1), []);

  return { count, increment };
}

// window.naver.maps.Map = jest.fn().mockImplementation(() => {
//   return { getCenter: () => { console.log('hi'); } };
// });

test('should increment counter', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
