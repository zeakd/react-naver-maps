/**
 * 공식 문서(3.10.5)보다 좁게 선언된 `@types/navermaps` 3.9.2 의 옵션 타입을 prop 으로 받을 때 쓰는 타입.
 * SDK 에 넘길 때는 그대로 넘긴다. 문서에서 기본값이 있는 필드는 선택이다.
 */

/** 지도 유형 id. 기본 유형 enum, 그 문자열, `mapTypes` 에 등록한 사용자 id. */
export type MapTypeIdProp =
  | naver.maps.MapTypeId
  | naver.maps.MapTypeIdLiteral
  | (string & {});

/** 컨트롤 공통. position 기본값은 컨트롤마다 다르다(공식 문서 각 *ControlOptions). */
export type ControlOptionsProp = { position?: naver.maps.Position };

export type ZoomControlOptionsProp = ControlOptionsProp & {
  style?: naver.maps.ZoomControlStyle;
  legendDisabled?: boolean;
};

export type MapTypeControlOptionsProp = ControlOptionsProp & {
  mapTypeIds?: MapTypeIdProp[] | null;
  style?: naver.maps.MapTypeControlStyle;
  /** 드롭다운이 닫히기까지 시간(ms). @types 3.9.2 에 없다. */
  hideTime?: number;
};
