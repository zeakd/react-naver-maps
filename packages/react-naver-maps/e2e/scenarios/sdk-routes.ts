/**
 * 값 동기화가 기대는 SDK 의 경로와 경로마다 다른 뜻. 실제 SDK 에서만 돈다(`sdk-contract.spec.ts`).
 *
 * setOptions 하나로 묶을 수 없는 이유가 여기 있다. 클래스마다 setOptions 의 뜻이 다르다. 전용 setter 를
 * 지우기 전에 이 검사를 먼저 본다. SDK 가 바뀌면 사용자 앱보다 여기가 먼저 깨진다.
 *
 * 공개 메서드만 관찰한다. 다만 `internals` 묶음은 라이브러리가 기대는 비공개 읽기(`src/sdk/internals.ts`)다.
 */
import { syncRoute } from '../../src/binding/use-controlled-kvo.js';
import {
  isGlRendering,
  isMapReady,
  mapOptionsKvo,
} from '../../src/sdk/internals.js';

type Maps = typeof naver.maps;
type Any = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type RouteResult = { name: string; error: string | null };

const SHAPE_SET_X = ['clickable', 'visible', 'zIndex'];
const STYLES = [
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
];
const FILLS = ['fillColor', 'fillOpacity'];

/** 클래스 → 쓰기/읽기 경로 → prop. 라이브러리가 맞추는 prop 만 적는다. */
const ROUTES: Record<string, Record<string, string[]>> = {
  Map: {
    'setX/getX': ['size', 'cursor', 'tilt', 'rotation', 'mapTypeId'],
    'setOptions/getX': ['minZoom', 'maxZoom'],
    'setOptions/getOptions': [
      'background',
      'baseTileOpacity',
      'draggable',
      'scrollWheel',
      'pinchZoom',
      'keyboardShortcuts',
      'disableDoubleClickZoom',
      'disableDoubleTapZoom',
      'disableTwoFingerTapZoom',
      'disableKineticPan',
      'tileTransition',
      'logoControlOptions',
      'mapDataControl',
      'mapDataControlOptions',
      'mapTypeControl',
      'mapTypeControlOptions',
      'scaleControl',
      'scaleControlOptions',
      'zoomControl',
      'zoomControlOptions',
      'maxBounds',
      'padding',
      'resizeOrigin',
      'overlayZoomEffect',
      'tileSpare',
      'zoomOrigin',
      'mapTypes',
    ],
  },
  Marker: {
    'setX/getX': [
      'position',
      'icon',
      'animation',
      'shape',
      'title',
      'cursor',
      'clickable',
      'draggable',
      'visible',
      'zIndex',
    ],
    'setOptions/getOptions': ['collisionBehavior', 'collisionBoxSize'],
  },
  Circle: {
    'setX/getX': ['center', 'radius', ...SHAPE_SET_X],
    'setOptions/getOptions': [...STYLES, ...FILLS],
  },
  Rectangle: {
    'setX/getX': ['bounds', ...SHAPE_SET_X],
    'setOptions/getOptions': [...STYLES, ...FILLS],
  },
  Ellipse: {
    'setX/getX': ['bounds', ...SHAPE_SET_X],
    'setOptions/getOptions': [...STYLES, ...FILLS],
  },
  Polyline: {
    'setX/getX': ['path', ...SHAPE_SET_X],
    'setOptions/getOptions': [
      ...STYLES,
      'startIcon',
      'endIcon',
      'simplifyLevel',
    ],
  },
  Polygon: {
    'setX/getX': ['paths', ...SHAPE_SET_X],
    'setOptions/getOptions': [...STYLES, ...FILLS, 'simplifyLevel'],
  },
  InfoWindow: {
    'setX/getX': ['position', 'zIndex', 'content'],
    'setOptions/getOptions': [
      'maxWidth',
      'backgroundColor',
      'borderColor',
      'borderWidth',
      'disableAutoPan',
      'disableAnchor',
      'anchorSkew',
      'anchorSize',
      'anchorColor',
      'pixelOffset',
      'autoPanPadding',
    ],
  },
  GroundOverlay: {
    'setX/getX': ['opacity'],
    'set/get': ['clickable', 'crossOrigin'],
  },
  CustomControl: { 'setX/getOptions': ['position'] },
};

export async function sdkRoutes(
  maps: Maps,
  makeElement: () => HTMLElement,
): Promise<RouteResult[]> {
  const results: RouteResult[] = [];
  const check = (name: string, fn: () => string | null) => {
    try {
      results.push({ name, error: fn() });
    } catch (e) {
      results.push({ name, error: `던짐: ${(e as Error).message}` });
    }
  };
  const center = new maps.LatLng(37.5, 127);
  const options = { center, zoom: 14 };
  const m = maps as unknown as Any;
  const newMap = async (extra: object = {}): Promise<Any> => {
    const map = new m.Map(makeElement(), { ...options, ...extra });
    if (!isMapReady(map)) {
      await new Promise<void>((resolve) => {
        maps.Event.once(map, 'init', () => resolve());
      });
    }
    return map;
  };
  const bounds = new maps.LatLngBounds(center, center);
  const instances: Record<string, () => Any> = {
    Marker: () => new m.Marker({ position: center }),
    Circle: () => new m.Circle({ center, radius: 10 }),
    Rectangle: () => new m.Rectangle({ bounds }),
    Ellipse: () => new m.Ellipse({ bounds }),
    Polyline: () => new m.Polyline({ path: [center, center] }),
    Polygon: () => new m.Polygon({ paths: [[center, center, center]] }),
    InfoWindow: () => new m.InfoWindow({ content: 'a' }),
    GroundOverlay: () => new m.GroundOverlay('about:blank', bounds),
    CustomControl: () =>
      new m.CustomControl('<i></i>', { position: maps.Position.TOP_LEFT }),
  };

  const routeMap = await newMap();
  for (const [cls, routes] of Object.entries(ROUTES)) {
    check(`${cls} 의 prop 별 경로`, () => {
      const target = cls === 'Map' ? routeMap : instances[cls]!();
      const wrong: string[] = [];
      for (const [route, props] of Object.entries(routes)) {
        for (const prop of props) {
          const r = syncRoute(target, prop);
          const got = `${r.write}/${r.read}`;
          if (got !== route) wrong.push(`${prop}: ${route} → ${got}`);
        }
      }
      return wrong.length ? wrong.join(', ') : null;
    });
  }

  const same = (got: unknown, want: unknown, what: string) =>
    JSON.stringify(got) === JSON.stringify(want)
      ? null
      : `${what}: ${JSON.stringify(got)} (기대 ${JSON.stringify(want)})`;

  const a = await newMap();
  check(
    'Map.mapTypeId: setOptions 는 고른 유형을 바꾸지 않아 둘이 갈라진다',
    () => {
      a.setOptions('mapTypeId', 'satellite');
      return same(
        [a.getMapTypeId(), a.getOptions('mapTypeId')],
        ['normal', 'satellite'],
        '[getMapTypeId, getOptions]',
      );
    },
  );
  const b = await newMap();
  check('Map.mapTypeId: setMapTypeId 는 둘 다 바꾼다', () => {
    b.setMapTypeId('satellite');
    return same(
      [b.getMapTypeId(), b.getOptions('mapTypeId')],
      ['satellite', 'satellite'],
      '[getMapTypeId, getOptions]',
    );
  });
  const c = await newMap();
  check(
    'Map.cursor: setOptions 와 setCursor 는 서로의 읽기를 바꾸지 않는다',
    () => {
      const before = c.getCursor();
      c.setOptions('cursor', 'wait');
      const afterOptions = c.getCursor();
      c.setCursor('help');
      return same(
        [afterOptions === before, c.getOptions('cursor'), c.getCursor()],
        [true, 'wait', 'help'],
        '[getCursor 그대로, getOptions, getCursor]',
      );
    },
  );
  const d = await newMap();
  check(
    'Map.tilt: setTilt 는 getOptions 를 바꾸지 않아 getTilt 로 읽는다',
    () => {
      const before = d.getOptions('tilt');
      d.setTilt(30);
      return same(
        [d.getTilt(), d.getOptions('tilt') === before],
        [30, true],
        '[getTilt, getOptions 그대로]',
      );
    },
  );
  const e = await newMap();
  check('Map 옵션은 raw set 으로 바뀌지 않는다', () => {
    e.set('draggable', false);
    return same(e.getOptions('draggable'), true, 'getOptions(draggable)');
  });
  const f = await newMap({ padding: { top: 10, left: 5 } });
  check('Map.padding: setOptions 는 지금 값에 합친다', () => {
    f.setOptions('padding', { top: 20 });
    const p = f.getOptions('padding');
    return same([p.top, p.left], [20, 5], '[top, left]');
  });

  const fresh = new m.Map(makeElement(), options);
  const readyAtStart = isMapReady(fresh);
  if (!readyAtStart) {
    check('Map: init 전 setOptions 는 큐에 쌓여 바로 읽히지 않는다', () => {
      fresh.setOptions('draggable', false);
      return same(fresh.getOptions('draggable'), true, 'init 전 읽기');
    });
    await new Promise<void>((resolve) => {
      maps.Event.once(fresh, 'init', () => resolve());
    });
    check('Map: init 뒤 쌓인 setOptions 가 적용되고 isReady 가 켜진다', () =>
      same(
        [isMapReady(fresh), fresh.getOptions('draggable')],
        [true, false],
        '[isReady, draggable]',
      ),
    );
  }

  check(
    'Marker: setOptions 는 좌표를 SDK 값으로 바꾸고 raw set 은 그대로 둔다',
    () => {
      const viaOptions = instances.Marker!();
      viaOptions.setOptions('position', { lat: 1, lng: 2 });
      const raw = instances.Marker!();
      raw.set('position', { lat: 1, lng: 2 });
      return same(
        [
          viaOptions.getPosition() instanceof maps.LatLng,
          raw.getPosition() instanceof maps.LatLng,
        ],
        [true, false],
        '[setOptions 변환, raw 변환]',
      );
    },
  );

  check(
    'InfoWindow: setOptions 는 크기를 SDK 값으로 바꾸고 raw set 은 그대로 둔다',
    () => {
      const viaOptions = instances.InfoWindow!();
      viaOptions.setOptions('anchorSize', { width: 1, height: 2 });
      const raw = instances.InfoWindow!();
      raw.set('anchorSize', { width: 1, height: 2 });
      return same(
        [
          viaOptions.get('anchorSize') instanceof maps.Size,
          raw.get('anchorSize') instanceof maps.Size,
        ],
        [true, false],
        '[setOptions 변환, raw 변환]',
      );
    },
  );
  check('InfoWindow.zIndex: setZIndex 만 숫자로 바꾼다', () => {
    const w = instances.InfoWindow!();
    w.setZIndex('7');
    const viaSetter = w.getZIndex();
    w.setOptions('zIndex', '9');
    return same(
      [viaSetter, w.getZIndex()],
      [7, '9'],
      '[setZIndex, setOptions]',
    );
  });
  check('InfoWindow.open 은 position 이나 anchor 없이 던진다', () => {
    const w = instances.InfoWindow!();
    try {
      w.open(routeMap);
    } catch {
      return null;
    }
    return 'open 이 던지지 않았다';
  });
  check('InfoWindow.position: setPosition(null) 만 던진다', () => {
    const w = instances.InfoWindow!();
    w.setOptions('position', null);
    try {
      w.setPosition(null);
    } catch {
      return null;
    }
    return 'setPosition(null) 이 던지지 않았다';
  });
  check('InfoWindow: 객체 setOptions 는 같은 값에도 _changed 를 낸다', () => {
    const w = new m.InfoWindow({ content: 'x', maxWidth: 10 });
    let fired = 0;
    maps.Event.addListener(w, 'maxWidth_changed', () => fired++);
    w.setOptions({ maxWidth: 10 });
    return same(fired, 1, 'maxWidth_changed 횟수');
  });

  check('GroundOverlay 에는 공개 setOptions 가 없다', () => {
    const g = instances.GroundOverlay!();
    return same(
      [typeof g.setOptions, typeof g.getOptions],
      ['undefined', 'undefined'],
      '[setOptions, getOptions]',
    );
  });

  const controlMap = await newMap();
  const place = () => {
    const control = instances.CustomControl!();
    control.setMap(controlMap);
    return control;
  };
  const top = (control: Any): number =>
    (control.getElement() as HTMLElement).getBoundingClientRect().top;
  check(
    'CustomControl.position: raw set 은 자리를 옮기지 않고 setOptions 는 옮긴다',
    () => {
      const control = place();
      const start = top(control);
      control.set('position', maps.Position.BOTTOM_LEFT);
      const afterRaw = top(control);
      control.set('position', maps.Position.TOP_LEFT);
      control.setOptions('position', maps.Position.BOTTOM_LEFT);
      return same(
        [afterRaw === start, top(control) > start],
        [true, true],
        '[raw 뒤 그대로, setOptions 뒤 아래로]',
      );
    },
  );

  // 목록에 없는 옵션(`src/binding/extra-sdk-options.ts`)이 기대는 것: 생성자와 객체 setOptions 가 모르는
  // 키도 받아 저장한다. 이름은 SDK 에 없는 가상 옵션이다.
  for (const [cls, read] of [
    ['Marker', (t: Any) => t.get('rnmFuture')],
    ['Circle', (t: Any) => t.get('rnmFuture')],
    ['Rectangle', (t: Any) => t.get('rnmFuture')],
    ['Ellipse', (t: Any) => t.get('rnmFuture')],
    ['Polyline', (t: Any) => t.get('rnmFuture')],
    ['Polygon', (t: Any) => t.get('rnmFuture')],
    ['InfoWindow', (t: Any) => t.get('rnmFuture')],
  ] as const) {
    check(`${cls}: 객체 setOptions 는 모르는 옵션도 받는다`, () => {
      const target = instances[cls]!();
      target.setOptions({ rnmFuture: 2 });
      return same(read(target), 2, 'rnmFuture');
    });
  }
  const extraMap = await newMap({ rnmFuture: 1 });
  check('Map: 생성자와 객체 setOptions 는 모르는 옵션도 받는다', () => {
    const atCreate = extraMap.getOptions('rnmFuture');
    extraMap.setOptions({ rnmFuture: 2 });
    return same(
      [atCreate, extraMap.getOptions('rnmFuture')],
      [1, 2],
      '[생성, 변경]',
    );
  });

  check('KVO.setValues 는 키 사이에 통지한다(원자적이지 않다)', () => {
    const kvo = new m.KVO();
    const seen: unknown[] = [];
    kvo.addListener('a_changed', () => seen.push(kvo.get('b') ?? null));
    kvo.setValues({ a: 1, b: 2 });
    return same(seen, [null], 'a_changed 때의 b');
  });

  const g = await newMap();
  check('internals: Map 의 옵션 KVO 에서 옵션 변경 이벤트가 난다', () => {
    const kvo = mapOptionsKvo(g) as unknown as Any | null;
    if (!kvo) return '옵션 KVO 가 없다';
    let fired = 0;
    maps.Event.addListener(kvo, 'draggable_changed', () => fired++);
    g.setOptions('draggable', false);
    return same(fired, 1, 'draggable_changed 횟수');
  });
  check('internals: Marker 에는 옵션 KVO 가 없다', () =>
    same(mapOptionsKvo(instances.Marker!()), null, 'mapOptionsKvo'),
  );
  check('internals: 래스터 지도의 renderMode 는 GL 이 아니다', () =>
    same(isGlRendering(g), false, 'isGlRendering'),
  );
  return results;
}
