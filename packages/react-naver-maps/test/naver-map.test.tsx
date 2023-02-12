// import { render, fireEvent, waitFor } from '@testing-library/react';
// import { renderHook, act } from '@testing-library/react-hooks';
// import { MapDiv } from '../map-div';
// import { NaverMap } from '../naver-map';

// window.naver = {} as any;
// window.naver.maps = {} as any;
// window.naver.maps.Map = jest.fn().mockImplementation(() => {
//   return {
//     destroy: () => { console.log('naver.maps.Map destroyed'); },
//     getSize: () => new ObjectValue(),
//     getCenter: () => new ObjectValue(),
//     getBounds: () => new ObjectValue(),
//     getZoom: () => 10,
//     getMapTypeId: () => 'test',
//     getCenterPoint: () => new ObjectValue(),
//     setSize: mockSetSize,
//     panToBounds: mockPanToBounds,
//     setCenter: mockSetCenter,
//     setMapTypeId: mockSetMapTypeId,
//     setOptions: mockSetOptions,
//   };
// });

// const ObjectValue = jest.fn().mockImplementation(() => {
//   return { equals: (obj: any) => false };
// });
// const mockSetSize = jest.fn();
// const mockPanToBounds = jest.fn();
// const mockSetCenter = jest.fn();
// const mockSetMapTypeId = jest.fn();
// const mockSetOptions = jest.fn();

// const mockMethods = [
//   mockSetSize,
//   mockSetMapTypeId,
//   mockPanToBounds,
//   mockSetCenter,
// ];

// beforeEach(() => {
//   (window.naver.maps.Map as any).mockClear();
//   mockMethods.forEach(f => f.mockClear());
// });

// async function waitMapRendered() {
//   await waitFor(() => {
//     expect(window.naver.maps.Map).toHaveBeenCalledTimes(1);
//   });
// }

// describe('Map', () => {
//   test('size', async () => {
//     const { rerender } = render(<MapDiv>
//       <NaverMap />
//     </MapDiv>);

//     await waitMapRendered();

//     rerender(<MapDiv>
//       <NaverMap size={{ height: 100, width: 100 }} />
//     </MapDiv>);

//     expect(mockSetSize).toBeCalledTimes(1);
//   });

//   test('mapTypeId', async () => {
//     const { rerender } = render(<MapDiv>
//       <NaverMap />
//     </MapDiv>);

//     await waitMapRendered();

//     rerender(<MapDiv>
//       <NaverMap mapTypeId={'test1'} />
//     </MapDiv>);

//     rerender(<MapDiv>
//       <NaverMap mapTypeId={'test1'} />
//     </MapDiv>);

//     rerender(<MapDiv>
//       <NaverMap mapTypeId={'test2'} />
//     </MapDiv>);

//     expect(mockSetMapTypeId).toBeCalledTimes(2);
//   });

//   test('bounds', async () => {
//     const { rerender } = render(<MapDiv>
//       <NaverMap />
//     </MapDiv>);

//     await waitMapRendered();

//     rerender(<MapDiv>
//       <NaverMap
//         bounds={[1, 2, 3, 4]}
//         center={{ x: 1, y: 2 }}
//       />
//     </MapDiv>);

//     expect(mockPanToBounds).toBeCalledTimes(1);
//     expect(mockSetCenter).toBeCalledTimes(0);
//   });
// });

describe('useNavermaps()', () => {
  test('hello', () => {
    expect(1).toBe(1);
  });
});
