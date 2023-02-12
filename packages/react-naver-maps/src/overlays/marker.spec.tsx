import { render, waitFor } from '@testing-library/react';
import omit from 'lodash.omit';
import { ReactElement, Suspense } from 'react';

import { NaverMapContext } from '../contexts/naver-map';
import { Marker } from './marker';

const map = {} as naver.maps.Map;
function renderOverlay(overlay: ReactElement) {
  return render(overlay, {
    wrapper: ({ children }) => (<NaverMapContext.Provider value={map}>
      <Suspense fallback={null}>
        {children}
      </Suspense>
    </NaverMapContext.Provider>),
  });
}
const mockPosition = { equals: jest.fn(() => false) };
let options = {} as naver.maps.MarkerOptions;
const mockMethods = {
  getMap: jest.fn(),
  setMap: jest.fn(),
  getOptions: jest.fn((key: keyof naver.maps.MarkerOptions) => Object.assign({ [key]: options[key] })),
  setOptions: jest.fn((opt: any) => {
    Object.assign(options, opt, { position: mockPosition });
  }),
  getPosition: jest.fn(() => mockPosition),
  setPosition: jest.fn(),
};
const mockMarker = jest.fn().mockImplementation((opt) => {
  Object.assign(options, opt, { position: mockPosition });
  return mockMethods;
});

describe('<Marker />', () => {
  beforeEach(() => {
    options = {};
    mockMarker.mockClear();
    Object.values(mockMethods).forEach(mock => mock.mockClear());
    // @ts-expect-error mocking navermaps client loader
    window.naver = { maps: { Marker: mockMarker } };
  });

  it('should currectly handle options without props', async () => {
    const { rerender, unmount } = renderOverlay(<Marker />);
    await waitFor(() => expect(window.naver.maps).toBeTruthy());

    expect(mockMethods.setMap).toBeCalledWith(map);
    expect(mockMethods.setPosition).not.toBeCalled();
    expect(mockMethods.setOptions).not.toBeCalled();

    const position = {} as naver.maps.Point;
    rerender(<Marker position={position} />);
    expect(mockMethods.setPosition).toBeCalledWith(position);

    unmount();
    expect(mockMethods.setMap).toBeCalledWith(null);
  });

  it('should currectly handle options with props', () => {
    const position = {} as naver.maps.Point;
    const animation = 0;
    const icon = '';
    const shape = {} as naver.maps.MarkerShape;
    const title = 'title';
    const cursor = '';
    const clickable = true;
    const draggable = true;
    const visible = true;
    const zIndex = 0;

    const { rerender } = renderOverlay(<Marker
      position={position}
      animation={animation}
      icon={icon}
      shape={shape}
      title={title}
      cursor={cursor}
      clickable={clickable}
      draggable={draggable}
      visible={visible}
      zIndex={zIndex}
    />);

    expect(mockMethods.setMap).toBeCalledWith(map);
    expect(omit(options, ['position'])).toEqual({
      animation,
      icon,
      shape,
      title,
      cursor,
      clickable,
      draggable,
      visible,
      zIndex,
    });

    const diffPosition1 = {} as naver.maps.Coord;
    const diffTitle1 = 'title1';
    const sameClickable1 = true;

    rerender(<Marker position={diffPosition1} title={diffTitle1} clickable={sameClickable1} />);
    expect(mockMethods.setPosition).toBeCalledWith(diffPosition1);
    expect(mockMethods.setOptions).toBeCalledWith({ title: diffTitle1 });
  });

  it('should ignore change when uncontrolled props is set', () => {
    const position = {} as naver.maps.Point;
    const title = 'title';

    const { rerender } = renderOverlay(<Marker
      defaultPosition={position}
      title={title}
    />);

    const position1 = {} as naver.maps.Coord;
    const title1 = 'title1';

    // position, defaultPosition 어느것이 변경되더라도 position이 변경되지 않아야한다.
    const prevCallCount = mockMethods.setPosition.mock.calls.length;
    rerender(<Marker defaultPosition={position1} position={position1} title={title1} />);
    expect(prevCallCount).toBe(mockMethods.setPosition.mock.calls.length);
    expect(mockMethods.setOptions).toBeCalledWith({ title: title1 });
  });

  it('should ignore position change when position is equal', () => {
    const position = {} as naver.maps.Point;

    const { rerender } = renderOverlay(<Marker
      position={position}
    />);

    const prevCallCount = mockMethods.setPosition.mock.calls.length;
    mockPosition.equals.mockImplementationOnce(() => true);
    rerender(<Marker position={{} as naver.maps.Point} />);
    expect(prevCallCount).toBe(mockMethods.setPosition.mock.calls.length);
  });
});
