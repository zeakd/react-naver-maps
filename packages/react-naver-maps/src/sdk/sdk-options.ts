import type {
  MapTypeControlStyleName,
  PositionName,
  ZoomControlStyleName,
} from './constants.js';

/**
 * SDK 옵션을 prop 으로 받을 때 `@types/navermaps` 의 옵션 타입보다 넓게 받는 타입. SDK 상수 이름과 사용자
 * 지도 유형 id 를 함께 받는다. SDK 에 넘길 때는 상수를 값으로 바꾼다(sdk/constants.ts). 문서에서 기본값이 있는
 * 필드는 선택이다.
 */

/** 지도 유형 id. 기본 유형 enum, 그 문자열, `mapTypes` 에 등록한 사용자 id. */
export type MapTypeIdProp =
  | naver.maps.MapTypeId
  | naver.maps.MapTypeIdLiteral
  | (string & {});

/**
 * 컨트롤 공통. position 기본값은 컨트롤마다 다르다(공식 문서 각 *ControlOptions).
 * SDK 상수 대신 이름(`'TOP_RIGHT'`)도 받는다(sdk/constants.ts).
 */
export type ControlOptionsProp = { position?: PositionName };

export type ZoomControlOptionsProp = ControlOptionsProp & {
  style?: ZoomControlStyleName;
  legendDisabled?: boolean;
};

export type MapTypeControlOptionsProp = ControlOptionsProp & {
  mapTypeIds?: MapTypeIdProp[] | null;
  style?: MapTypeControlStyleName;
  /** 드롭다운이 닫히기까지 시간(ms). */
  hideTime?: number;
};
