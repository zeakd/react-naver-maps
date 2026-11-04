// 기능 하나를 검사하려면 (1) 이 폴더에 픽스처 파일을 만든다: 설정 타입, 프레임 타입, 렌더, 프레임마다 읽을 값
//   (defineFixture, 기존 파일을 본뜬다). (2) 아래 FIXTURES 에 한 줄을 더하고 FixtureConfig·FixtureFrame 에
//   그 타입을 더한다. 렌더 순서가 곧 effect 순서라 SDK 호출 순서(calls)를 정하므로 순서를 바꾸지 않는다.
// (3) cases/ 에 시나리오를 더한다. 설정 키와 프레임 키 이름은 비교 실행기와 compare-expected 가 보므로
//   한 번 정하면 바꾸지 않는다. 여러 기능이 쓰는 것(calls, overlays)은 픽스처가 아니라 app/observe.ts 에 있다.
import { activityGroup, type AnyFixture } from '../fixture.js';
import { autoResize, type AutoResizeConfig } from './auto-resize.js';
import { bicycleLayer, type BicycleLayerConfig } from './bicycle-layer.js';
import { circle, type CircleConfig, type CircleFrame } from './circle.js';
import {
  customControl,
  type CustomControlConfig,
  type CustomControlFrame,
} from './custom-control.js';
import {
  dataLayer,
  type DataLayerConfig,
  type DataLayerFrame,
} from './data-layer.js';
import { drawing, type DrawingConfig, type DrawingFrame } from './drawing.js';
import {
  editablePolygon,
  type EditablePolygonConfig,
  type EditablePolygonFrame,
} from './editable-polygon.js';
import { flightSpot, type FlightSpotConfig } from './flight-spot.js';
import {
  groundOverlay,
  type GroundOverlayConfig,
  type GroundOverlayFrame,
} from './ground-overlay.js';
import { infoWindow, type InfoWindowConfig } from './info-window.js';
import { labelLayer, type LabelLayerConfig } from './label-layer.js';
import { marker, type MarkerConfig, type MarkerFrame } from './marker.js';
import { polyline, type PolylineConfig } from './polyline.js';
import { suspend, type SuspendConfig } from './suspend.js';
import {
  tileGridLayer,
  type TileGridLayerConfig,
  type TileGridLayerFrame,
} from './tile-grid-layer.js';
import {
  visualization,
  type VisualizationConfig,
  type VisualizationFrame,
} from './visualization.js';

/** Polyline, Circle, InfoWindow 를 함께 감싸는 Activity 의 설정. */
export type OverlaysActivityConfig = {
  /** Polyline, Circle, InfoWindow 를 함께 Activity 로 감싼다. */
  overlaysActivity?: 'visible' | 'hidden';
};

/** AppConfig 의 기능별 부분. */
export type FixtureConfig = AutoResizeConfig &
  SuspendConfig &
  MarkerConfig &
  DrawingConfig &
  VisualizationConfig &
  DataLayerConfig &
  EditablePolygonConfig &
  CustomControlConfig &
  LabelLayerConfig &
  TileGridLayerConfig &
  FlightSpotConfig &
  BicycleLayerConfig &
  GroundOverlayConfig &
  OverlaysActivityConfig &
  PolylineConfig &
  CircleConfig &
  InfoWindowConfig;

/** TraceFrame 의 기능별 부분. */
export type FixtureFrame = MarkerFrame &
  DrawingFrame &
  VisualizationFrame &
  DataLayerFrame &
  EditablePolygonFrame &
  CustomControlFrame &
  TileGridLayerFrame &
  GroundOverlayFrame &
  CircleFrame;

/** 지도의 자식으로 렌더하는 순서대로. */
export const FIXTURES: AnyFixture[] = [
  autoResize,
  suspend,
  marker,
  drawing,
  visualization,
  dataLayer,
  editablePolygon,
  customControl,
  labelLayer,
  tileGridLayer,
  flightSpot,
  bicycleLayer,
  groundOverlay,
  activityGroup(
    (config) => config.overlaysActivity,
    [polyline, circle, infoWindow],
  ),
];
