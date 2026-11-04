'use client';

// @types/navermaps 보강 선언(타입만). 패키지를 쓰면 함께 들어간다.
// 이름 없이 모듈만 끌어온다(보강은 declare global). JS 에는 남지 않는다.
// oxlint-disable-next-line unicorn/require-module-specifiers
export type {} from './sdk/navermaps-augment.js';

// Components
export { NavermapsProvider } from './sdk/provider.js';
export type { NavermapsProviderProps } from './sdk/provider.js';
export { Container } from './map/container.js';
export type { ContainerProps } from './map/container.js';
export { NaverMap } from './map/naver-map.js';
export type { NaverMapProps, MapKeyboardEvent } from './map/naver-map.js';
export type {
  MapTypeIdProp,
  ControlOptionsProp,
  ZoomControlOptionsProp,
  MapTypeControlOptionsProp,
} from './sdk/sdk-options.js';
export { Marker } from './overlays/marker.js';
export type { MarkerProps, MarkerIcon } from './overlays/marker.js';
export { InfoWindow } from './overlays/info-window.js';
export type { InfoWindowProps } from './overlays/info-window.js';
export { GroundOverlay } from './overlays/ground-overlay.js';
export type { GroundOverlayProps } from './overlays/ground-overlay.js';
export { CustomOverlay } from './overlays/custom-overlay.js';
export { CustomControl } from './overlays/custom-control.js';
export { GeoJson } from './data/geo-json.js';
export type {
  GeoJsonProps,
  GeoJsonStyle,
  DataPointerEvent,
  DataPropertyEvent,
  DataEvent,
} from './data/geo-json.js';
export { Kml } from './data/kml.js';
export type { KmlProps } from './data/kml.js';
export { Gpx } from './data/gpx.js';
export type { GpxProps } from './data/gpx.js';
export type { CustomControlProps } from './overlays/custom-control.js';
export type {
  CustomOverlayProps,
  OverlayPosition,
} from './overlays/custom-overlay.js';
export { Circle } from './shapes/circle.js';
export type { CircleProps } from './shapes/circle.js';
export { Rectangle } from './shapes/rectangle.js';
export type { RectangleProps } from './shapes/rectangle.js';
export { Ellipse } from './shapes/ellipse.js';
export type { EllipseProps } from './shapes/ellipse.js';
export { Polygon } from './shapes/polygon.js';
export type { PolygonProps } from './shapes/polygon.js';
export { Polyline } from './shapes/polyline.js';
export type { PolylineProps } from './shapes/polyline.js';
export { CadastralLayer } from './layers/cadastral-layer.js';
export type { CadastralLayerProps } from './layers/cadastral-layer.js';
export { BicycleLayer } from './layers/bicycle-layer.js';
export type { BicycleLayerProps } from './layers/bicycle-layer.js';
export { LabelLayer } from './layers/label-layer.js';
export type { LabelLayerProps } from './layers/label-layer.js';
export { Layer } from './layers/layer.js';
export type { LayerProps } from './layers/layer.js';
export { StreetLayer } from './layers/street-layer.js';
export type { StreetLayerProps } from './layers/street-layer.js';
export { TrafficLayer } from './layers/traffic-layer.js';
export type { TrafficLayerProps } from './layers/traffic-layer.js';

// Types
export type { StrokeStyle, FillStyle } from './shapes/shape-style.js';
export type {
  ShapeEvent,
  MarkerEvent,
  GroundOverlayEvent,
  PointerEventHandler,
  EventHandlerProps,
} from './overlays/overlay-events.js';

// Hooks
export { useNavermaps, preloadNavermaps } from './hooks/use-navermaps.js';
export { useMap } from './hooks/use-map.js';
export { useOverlay } from './hooks/use-overlay.js';
export { useListener } from './hooks/use-listener.js';
export { useKVO } from './hooks/use-kvo.js';
export { useControlledKVO } from './binding/use-controlled-kvo.js';

export type { LoadOptions, Submodule, Language } from './sdk/load-script.js';
export type {
  Named,
  PositionName,
  AnimationName,
  ZoomControlStyleName,
  MapTypeControlStyleName,
  DrawingModeName,
  DrawingStyleName,
} from './sdk/constants.js';
