import { defineFixture } from '../fixture.js';
import { GeoJson, Gpx, Kml } from '../target-imports.js';

export type DataLayerConfig = {
  /** 지도 중앙을 덮는 다각형 하나를 GeoJson 으로 올린다. 값은 fillColor. */
  geoJsonFill?: string;
  /** 이 이름의 작은 KML 문서(KML_TEXT)를 Kml 로 올린다. 렌더마다 같은 Document 다. */
  kml?: 'point' | 'line';
  /** 작은 GPX 문서(트랙 하나)를 Gpx 로 올린다. */
  gpx?: boolean;
};

export type DataLayerFrame = {
  /** 데이터 레이어의 feature 수 */
  dataFeatures: number;
  /** 첫 feature 의 첫 overlay fillColor */
  dataFillColor: string | null;
  /** 이 프레임까지 GeoJson onClick 이 feature 와 함께 받은 수 */
  geoJsonClicks: number;
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
  { geoJsonClicks: number },
  DataLayerFrame
>({
  probe: () => ({ geoJsonClicks: 0 }),
  render: (config, probe) => (
    <>
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
      {config.kml && <Kml data={xml(KML_TEXT[config.kml])} />}
      {config.gpx && <Gpx data={xml(GPX_TEXT)} />}
    </>
  ),
  read: (map, probe) => ({
    dataFeatures: map.data.getAllFeature().length,
    dataFillColor: (() => {
      const overlay = map.data.getAllFeature()[0]?.getOverlays()[0] as
        | { getOptions?: (k: string) => unknown }
        | undefined;
      return (overlay?.getOptions?.('fillColor') as string | undefined) ?? null;
    })(),
    geoJsonClicks: probe.geoJsonClicks,
  }),
});
