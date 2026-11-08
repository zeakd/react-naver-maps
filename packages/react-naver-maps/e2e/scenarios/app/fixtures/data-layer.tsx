import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Activity } from '../activity.js';
import { defineFixture } from '../fixture.js';
import { GeoJson, Gpx, Kml, useMap } from '../target-imports.js';

export type DataLayerConfig = {
  /** 지도 중앙을 덮는 다각형 하나를 GeoJson 으로 올린다. 값은 fillColor. */
  geoJsonFill?: string;
  /** 이 이름의 작은 KML 문서(KML_TEXT)를 Kml 로 올린다. 렌더마다 같은 Document 다. */
  kml?: 'point' | 'line';
  /** 작은 GPX 문서(트랙 하나)를 Gpx 로 올린다. */
  gpx?: boolean;
  /**
   * 데이터 레이어를 함께 쓰는 GeoJson 둘(A: a0·a1, B: b0·b1·b2)을 올린다. 두 style 함수는 불릴 때마다
   * calls 에 `styleA`, `styleB` 를 남긴다. B 의 style 은 `hot` 속성이 있으면 주황, b2 에는 undefined 를
   * 돌려준다(SDK 가 그 feature 의 스타일을 그대로 둔다).
   */
  dataStyleProbe?: boolean;
  /** A 의 fillColor. 없으면 A 에 style 을 주지 않는다. */
  dataStyleA?: string;
  /** B 의 fillColor. */
  dataStyleB?: string;
  /**
   * 바뀌면 한 번 실행하는 바깥 조작.
   * `b-imperative`: b0 에 `feature.setStyle`, b1 에 `map.data.overrideStyle`.
   * `b-hot`: b1 에 `setProperty('hot', true)`.
   * `external`: `map.data.setStyle({ fillColor: '#000000' })`.
   */
  dataAction?: 'b-imperative' | 'b-hot' | 'external';
  /** B 를 감싼 Activity 의 mode. */
  dataBActivity?: 'visible' | 'hidden';
  /**
   * 성능: GeoJson 을 이 수만큼 올린다. 각각 작은 사각형 DATA_CROWD_FEATURES 개다. 첫 GeoJson 의 style
   * 함수는 불릴 때 `crowdFirst`, 나머지는 `crowdOther` 를 calls 에 남긴다.
   */
  dataCrowd?: number;
  /** 첫 GeoJson 의 fillColor. 나머지는 늘 같은 style 함수를 쓴다. */
  dataCrowdFirstFill?: string;
};

/** dataCrowd 의 GeoJson 하나가 올리는 feature 수. */
export const DATA_CROWD_FEATURES = 20;

export type DataLayerFrame = {
  /** 데이터 레이어의 feature 수 */
  dataFeatures: number;
  /** 첫 feature 의 첫 overlay fillColor */
  dataFillColor: string | null;
  /** 이 프레임까지 GeoJson onClick 이 feature 와 함께 받은 수 */
  geoJsonClicks: number;
  /** feature id 마다 첫 overlay 의 fillColor. `a0:#ff0000 a1:...` 처럼 id 순서로 이어 붙인다. */
  dataFills: string;
  /** 데이터 레이어 공용 override 슬롯(`overriden_style`)의 fillColor. 없으면 null */
  dataOverride: string | null;
};

// 지도 중앙(INITIAL_CENTER)을 덮는 사각형.
const CENTER_SQUARE: naver.maps.GeoJSON = {
  type: 'Feature',
  properties: { id: 'center' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [126.97, 37.56],
        [126.99, 37.56],
        [126.99, 37.575],
        [126.97, 37.575],
        [126.97, 37.56],
      ],
    ],
  },
} as naver.maps.GeoJSON;

// 지도 중앙 근처의 작은 KML·GPX. 문서는 한 번만 만든다(렌더마다 같은 Document).
const KML_TEXT = {
  point:
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>a</name><Point><coordinates>126.9784,37.5666</coordinates></Point></Placemark></Document></kml>',
  line: '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>b</name><LineString><coordinates>126.97,37.56 126.98,37.57</coordinates></LineString></Placemark><Placemark><name>c</name><Point><coordinates>126.975,37.565</coordinates></Point></Placemark></Document></kml>',
};
const GPX_TEXT =
  '<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>t</name><trkseg><trkpt lat="37.56" lon="126.97"></trkpt><trkpt lat="37.565" lon="126.975"></trkpt><trkpt lat="37.57" lon="126.98"></trkpt></trkseg></trk></gpx>';
function square(id: string, west: number, south: number) {
  return {
    type: 'Feature',
    properties: { id },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [west + 0.004, south],
          [west + 0.004, south + 0.003],
          [west, south + 0.003],
          [west, south],
        ],
      ],
    },
  };
}
const collection = (...features: object[]) =>
  ({ type: 'FeatureCollection', features }) as unknown as naver.maps.GeoJSON;
const PROBE_A = collection(
  square('a0', 126.97, 37.56),
  square('a1', 126.975, 37.56),
);
const PROBE_B = collection(
  square('b0', 126.97, 37.565),
  square('b1', 126.975, 37.565),
  square('b2', 126.98, 37.565),
);

function fillOf(feature: naver.maps.Feature): string | null {
  const overlay = feature.getOverlays()[0] as
    | { getOptions?: (k: string) => unknown }
    | undefined;
  return (overlay?.getOptions?.('fillColor') as string | undefined) ?? null;
}

function DataStyleProbe({
  a,
  b,
  action,
  activityB,
  log,
}: {
  a?: string;
  b?: string;
  action?: DataLayerConfig['dataAction'];
  activityB: 'visible' | 'hidden';
  log: (call: string) => void;
}) {
  const map = useMap();
  const bFeatures = useRef<naver.maps.Feature[] | null>(null);
  // 앱은 props 단계마다 다시 렌더된다. B 의 style 은 b 가 바뀔 때만 새 함수로 만든다. 그러지 않으면
  // 렌더마다 B 자신의 style 이 바뀐 것이 되어, A 만 바꾼 단계에서도 B 가 자기 feature 를 다시 칠한다.
  const logRef = useRef(log);
  useLayoutEffect(() => {
    logRef.current = log;
  });
  const styleB = useMemo(
    () => (f: naver.maps.Feature) => {
      logRef.current('styleB');
      if (f.getProperty('id') === 'b2') return undefined;
      if (f.getProperty('hot')) return { fillColor: '#ffa500' };
      return { fillColor: b ?? '#00ff00', fillOpacity: 0.3 };
    },
    [b],
  );
  useEffect(() => {
    const [b0, b1] = bFeatures.current ?? [];
    if (!b0 || !b1) return;
    if (action === 'b-imperative') {
      b0.setStyle({ fillColor: '#123456' });
      map.data.overrideStyle(b1, { fillColor: '#ff00ff' });
    } else if (action === 'b-hot') {
      b1.setProperty('hot', true);
    } else if (action === 'external') {
      map.data.setStyle({ fillColor: '#000000' });
    }
  }, [action, map]);
  return (
    <>
      <GeoJson
        data={PROBE_A}
        style={
          a === undefined
            ? undefined
            : () => {
                log('styleA');
                return { fillColor: a, fillOpacity: 0.3 };
              }
        }
      />
      <Activity mode={activityB}>
        <GeoJson ref={bFeatures} data={PROBE_B} style={styleB} />
      </Activity>
    </>
  );
}

const crowdDocs: naver.maps.GeoJSON[] = [];
function crowdDoc(i: number): naver.maps.GeoJSON {
  crowdDocs[i] ??= collection(
    ...Array.from({ length: DATA_CROWD_FEATURES }, (_, j) =>
      square(
        `c${i}-${j}`,
        126.9 + (j % 10) * 0.005,
        37.5 + i * 0.004 + Math.floor(j / 10) * 0.002,
      ),
    ),
  );
  return crowdDocs[i];
}

type DataProbe = { geoJsonClicks: number };

function DataCrowd({
  count,
  firstFill,
  log,
}: {
  count: number;
  firstFill: string;
  log: (call: string) => void;
}) {
  const logRef = useRef(log);
  useLayoutEffect(() => {
    logRef.current = log;
  });
  const first = useMemo(
    () => () => {
      logRef.current('crowdFirst');
      return { fillColor: firstFill, fillOpacity: 0.3 };
    },
    [firstFill],
  );
  const other = useMemo(
    () => () => {
      logRef.current('crowdOther');
      return { fillColor: '#888888', fillOpacity: 0.3 };
    },
    [],
  );
  return Array.from({ length: count }, (_, i) => (
    <GeoJson key={i} data={crowdDoc(i)} style={i === 0 ? first : other} />
  ));
}

const xmlDocs = new Map<string, Document>();
function xml(text: string): Document {
  let doc = xmlDocs.get(text);
  if (!doc) {
    doc = new DOMParser().parseFromString(text, 'text/xml');
    xmlDocs.set(text, doc);
  }
  return doc;
}

export const dataLayer = defineFixture<
  DataLayerConfig,
  DataProbe,
  DataLayerFrame
>({
  probe: () => ({ geoJsonClicks: 0 }),
  render: (config, probe, core) => (
    <>
      {config.dataStyleProbe && (
        <DataStyleProbe
          a={config.dataStyleA}
          b={config.dataStyleB}
          action={config.dataAction}
          activityB={config.dataBActivity ?? 'visible'}
          log={(call) => core.calls.push(call)}
        />
      )}
      {config.geoJsonFill && (
        <GeoJson
          data={CENTER_SQUARE}
          style={{
            fillColor: config.geoJsonFill,
            fillOpacity: 0.3,
            clickable: true,
          }}
          onClick={(e) => {
            if (e.feature?.getProperty('id') === 'center')
              probe.geoJsonClicks += 1;
          }}
        />
      )}
      {config.dataCrowd !== undefined && (
        <DataCrowd
          count={config.dataCrowd}
          firstFill={config.dataCrowdFirstFill ?? '#ff0000'}
          log={(call) => core.calls.push(call)}
        />
      )}
      {config.kml && <Kml data={xml(KML_TEXT[config.kml])} />}
      {config.gpx && <Gpx data={xml(GPX_TEXT)} />}
    </>
  ),
  fields: {
    dataFeatures: 'behavior',
    dataFillColor: 'behavior',
    geoJsonClicks: 'behavior',
    dataFills: 'behavior',
    dataOverride: 'behavior',
  },
  read: (map, probe) => ({
    dataFeatures: map.data.getAllFeature().length,
    dataFillColor: (() => {
      const overlay = map.data.getAllFeature()[0]?.getOverlays()[0] as
        | { getOptions?: (k: string) => unknown }
        | undefined;
      return (overlay?.getOptions?.('fillColor') as string | undefined) ?? null;
    })(),
    geoJsonClicks: probe.geoJsonClicks,
    dataFills: map.data
      .getAllFeature()
      .map((f) => [String(f.getProperty('id')), fillOf(f)] as const)
      .toSorted(([x], [y]) => x.localeCompare(y))
      .map(([id, fill]) => `${id}:${fill}`)
      .join(' '),
    dataOverride:
      ((map.data.get('overriden_style') as { fillColor?: string } | null)
        ?.fillColor as string | undefined) ?? null,
  }),
});
