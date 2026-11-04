'use client';

// SDK visualization 서브모듈(naver.maps.visualization)의 HeatMap, DotMap.
// <NavermapsProvider submodules={['visualization']}> 로 불러야 한다.
import type { Ref } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { defineOverlay } from '../overlays/overlay-spec.js';
import { requireSubmodule } from '../sdk/submodule.js';

/**
 * 가중치가 있는 좌표 리터럴. 공식 튜토리얼의 `{ weight, location: [경도, 위도] }` 다.
 * SDK 는 location 으로 LatLng, `[경도, 위도]`, `{ lat, lng }` 를 받아 WeightedLocation 으로 바꾼다(3.10.5).
 */
export type WeightedLiteral = {
  weight?: number;
  location:
    | naver.maps.LatLng
    | naver.maps.PointArrayLiteral
    | naver.maps.LatLngObjectLiteral;
};

/** HeatMap, DotMap 의 좌표 목록. */
export type VisualizationData =
  | naver.maps.LatLng[]
  | naver.maps.PointArrayLiteral[]
  | naver.maps.visualization.WeightedLocation[]
  | WeightedLiteral[];

/** 좌표의 밀도를 색으로 칠한다. SDK 의 `naver.maps.visualization.HeatMap` 이다. */
export interface HeatMapProps {
  ref?: Ref<naver.maps.visualization.HeatMap>;
  /** 좌표 목록. `LatLng`, `[경도, 위도]`, `WeightedLocation`. 값으로 비교해 바뀌면 다시 그린다. */
  data: VisualizationData;
  opacity?: number;
  radius?: number;
  /** 색 이름. `navermaps.visualization.SpectrumStyle.JET` 같은 값. */
  colorMap?: naver.maps.visualization.SpectrumStyle;
  /** 색을 거꾸로 칠한다. SDK `setColorMap(colorMap, inReverse)` 의 둘째 인자. */
  colorMapInReverse?: boolean;
}

/** 좌표마다 점을 찍는다. SDK 의 `naver.maps.visualization.DotMap` 이다. */
export interface DotMapProps {
  ref?: Ref<naver.maps.visualization.DotMap>;
  /** 좌표 목록. `LatLng`, `[경도, 위도]`, `WeightedLocation`. 값으로 비교해 바뀌면 다시 그린다. */
  data: VisualizationData;
  opacity?: number;
  radius?: number;
  strokeWeight?: number;
  strokeColor?: string;
  strokeLineCap?: naver.maps.StrokeLineCapType;
  strokeLineJoin?: naver.maps.StrokeLineJoinType;
  fillColor?: string;
}

const HeatMapOverlay = defineOverlay<
  HeatMapProps,
  naver.maps.visualization.HeatMap
>('HeatMap', {
  create: (navermaps, options, props) =>
    new navermaps.visualization.HeatMap({
      ...options,
      ...(props.colorMap !== undefined ? { colorMap: props.colorMap } : {}),
    } as unknown as naver.maps.visualization.HeatMapOptions),
  options: ['data', 'opacity', 'radius'],
  // colorMap 과 거꾸로 칠하기는 SDK 메서드 하나(setColorMap(name, inReverse))라 함께 맞춘다.
  sync: useColorMap,
  events: [],
  // 지도 init 전에 붙이면 붙기는 하지만 그리지 않는다(3.10.5 실측).
  waitForReadyMap: true,
});

const DotMapOverlay = defineOverlay<
  DotMapProps,
  naver.maps.visualization.DotMap
>('DotMap', {
  create: (navermaps, options) =>
    new navermaps.visualization.DotMap(
      options as unknown as naver.maps.visualization.DotMapOptions,
    ),
  options: [
    'data',
    'opacity',
    'radius',
    'strokeWeight',
    'strokeColor',
    'strokeLineCap',
    'strokeLineJoin',
    'fillColor',
  ],
  events: [],
  waitForReadyMap: true,
});

function useColorMap(
  heatMap: naver.maps.visualization.HeatMap,
  { colorMap, colorMapInReverse }: HeatMapProps,
) {
  const prev = useRef<[unknown, unknown] | null>(null);
  useLayoutEffect(() => {
    const last = prev.current;
    prev.current = [colorMap, colorMapInReverse];
    // 처음에는 생성자가 colorMap 을 받았다. 거꾸로 칠하기만 마운트 때 맞춘다.
    if (!last && !colorMapInReverse) return;
    if (last && last[0] === colorMap && last[1] === colorMapInReverse) return;
    (
      heatMap as unknown as {
        setColorMap(name: unknown, inReverse: boolean): void;
        getColorMap(): unknown;
      }
    ).setColorMap(colorMap ?? heatMap.getColorMap(), !!colorMapInReverse);
  });
}

export function HeatMap(props: HeatMapProps) {
  requireSubmodule(useNavermaps(), 'visualization', 'HeatMap');
  return <HeatMapOverlay {...props} />;
}

export function DotMap(props: DotMapProps) {
  requireSubmodule(useNavermaps(), 'visualization', 'DotMap');
  return <DotMapOverlay {...props} />;
}
