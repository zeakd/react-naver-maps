export interface StrokeStyle {
  /** 선 두께(px). */
  strokeWeight?: number;
  /** 선 불투명도(0~1). */
  strokeOpacity?: number;
  /** 선 색(CSS 색 값). */
  strokeColor?: string;
  /** 선 모양. `'solid'`, `'shortdash'`, `'dot'` 같은 SDK 의 `StrokeStyleType` 값. */
  strokeStyle?: naver.maps.StrokeStyleType;
  /** 선 끝 모양(`'butt'`, `'round'`, `'square'`). */
  strokeLineCap?: naver.maps.StrokeLineCapType;
  /** 선이 꺾이는 곳의 모양(`'miter'`, `'round'`, `'bevel'`). */
  strokeLineJoin?: naver.maps.StrokeLineJoinType;
}

export interface FillStyle {
  /** 면 색(CSS 색 값). */
  fillColor?: string;
  /** 면 불투명도(0~1). */
  fillOpacity?: number;
}
