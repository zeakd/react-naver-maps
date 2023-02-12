import { render } from '@testing-library/react';

import { NaverMapContext } from './contexts/naver-map';
import { Overlay } from './overlay';

describe('<Overlay />', () => {
  it('should currectly handle contexted map on render', () => {
    let m: any;
    const element = {
      setMap: jest.fn((map: any) => m = map),
      getMap: jest.fn(() => m),
    };
    const map = {} as naver.maps.Map;

    const { unmount, rerender } = render(<NaverMapContext.Provider value={undefined}>
      <Overlay element={element} />
    </NaverMapContext.Provider>);

    expect(element.setMap).not.toBeCalled();
    rerender(<NaverMapContext.Provider value={map}>
      <Overlay element={element} />
    </NaverMapContext.Provider>);

    expect(element.setMap).toHaveBeenLastCalledWith(map);

    unmount();
    expect(element.setMap).toHaveBeenLastCalledWith(null);
  });

});
