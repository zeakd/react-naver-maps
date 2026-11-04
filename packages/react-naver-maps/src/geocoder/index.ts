// SDK geocoder 서브모듈(naver.maps.Service)을 Promise 로 쓴다.
// <NavermapsProvider submodules={['geocoder']}> 로 불러야 한다.
import { requireSubmodule } from '../sdk/submodule.js';

export type GeocodeOptions = naver.maps.Service.GeocodeServiceOptions;
export type ReverseGeocodeOptions = naver.maps.Service.ReverseServiceOptions;
type SdkGeocodeV2 = naver.maps.Service.GeocodeResponse['v2'];
type SdkAddressElement =
  SdkGeocodeV2['addresses'][number]['addressElements'][number];

/** 주소 구성 요소. 실제 응답의 `types` 는 배열이다(공식 문서 "Geocoding" 응답 예). @types 3.9.2 는 하나로 적었다. */
export type AddressElement = Omit<SdkAddressElement, 'types'> & {
  types: SdkAddressElement['types'][];
};
export type AddressItem = Omit<
  SdkGeocodeV2['addresses'][number],
  'addressElements'
> & { addressElements: AddressElement[] };
export type GeocodeResult = Omit<SdkGeocodeV2, 'addresses'> & {
  addresses: AddressItem[];
};
export type ReverseGeocodeResult =
  naver.maps.Service.ReverseGeocodeResponse['v2'];

/** 서비스가 OK 가 아닌 상태로 답했다. `status` 는 `naver.maps.Service.Status` 값이다. */
export class GeocoderError extends Error {
  constructor(
    readonly status: naver.maps.Service.Status,
    readonly response: unknown,
  ) {
    super(`[react-naver-maps] geocoder 가 상태 ${status} 로 답했다`);
    this.name = 'GeocoderError';
  }
}

/**
 * 주소로 좌표를 찾는다. SDK 의 `naver.maps.Service.geocode` 이고 응답의 `v2` 를 돌려준다
 * (SDK 문서는 `result` 를 deprecated 로 둔다).
 *
 * ```ts
 * const navermaps = useNavermaps();
 * const { addresses } = await geocode(navermaps, { query: '불정로 6' });
 * ```
 */
export function geocode(
  navermaps: typeof naver.maps,
  options: GeocodeOptions,
): Promise<GeocodeResult> {
  requireSubmodule(navermaps, 'geocoder', 'geocode');
  return new Promise((resolve, reject) => {
    navermaps.Service.geocode(options, (status, response) => {
      if (status === navermaps.Service.Status.OK)
        resolve(response.v2 as unknown as GeocodeResult);
      else reject(new GeocoderError(status, response));
    });
  });
}

/** 좌표로 주소를 찾는다. SDK 의 `naver.maps.Service.reverseGeocode` 이고 응답의 `v2` 를 돌려준다. */
export function reverseGeocode(
  navermaps: typeof naver.maps,
  options: ReverseGeocodeOptions,
): Promise<ReverseGeocodeResult> {
  requireSubmodule(navermaps, 'geocoder', 'reverseGeocode');
  // 타입은 리터럴({ lat, lng })을 받지만 SDK 는 "Please check coords." 로 거절한다(3.10.5 실측).
  // LatLng 로 바꿔 넘긴다.
  const coords = toCoords(navermaps, options.coords);
  return new Promise((resolve, reject) => {
    navermaps.Service.reverseGeocode(
      { ...options, coords },
      (status, response) => {
        if (status === navermaps.Service.Status.OK) resolve(response.v2);
        else reject(new GeocoderError(status, response));
      },
    );
  });
}

function toCoords(
  navermaps: typeof naver.maps,
  coords: ReverseGeocodeOptions['coords'],
): ReverseGeocodeOptions['coords'] {
  if (typeof coords === 'string') return coords;
  if (coords instanceof navermaps.LatLng || coords instanceof navermaps.Point)
    return coords;
  // 배열 리터럴은 [경도, 위도] 순서다(PointArrayLiteral).
  if (Array.isArray(coords)) return new navermaps.LatLng(coords[1], coords[0]);
  const { lat, lng } = coords as { lat: number; lng: number };
  return new navermaps.LatLng(lat, lng);
}
