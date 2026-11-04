import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { LL } from '../types.js';
import { NCP_KEY_ID, toCoord } from './common.js';
import {
  Container,
  InfoWindow,
  loadScript,
  Marker,
  NavermapsProvider,
  Panorama,
} from './target-imports.js';

/**
 * 거리뷰만 올린다. 시나리오 trace 와 따로, panorama.spec.ts 가 쓴다.
 * events 에 'pano_changed:<panoId>', 'pano_status:<status>', 'pov_changed' 를 쌓는다.
 */
export async function mountPanorama(
  host: HTMLElement,
  initial: {
    position: LL;
    pan?: number;
    marker?: LL;
    infoWindow?: boolean;
    /**
     * onPovChanged 로 받은 pan 을 이 단위로 반올림해 pov prop 으로 되돌려준다(지도의 rounded 와 같은
     * 앱). 없으면 pov 는 setPan 으로만 바뀐다.
     */
    roundPanTo?: number;
  },
) {
  const maps = await loadScript({
    ncpKeyId: NCP_KEY_ID,
    submodules: ['panorama'],
  });
  const events: string[] = [];
  let panorama: naver.maps.Panorama | null = null;
  let marker: naver.maps.Marker | null = null;
  let infoWindow: naver.maps.InfoWindow | null = null;
  let pan = initial.pan ?? 0;
  /** 라이브러리가 부른 setPov 의 pan 값들(사용자 드래그는 setPov 를 부르지 않는다). */
  const setPovCalls: number[] = [];
  const root = createRoot(host);
  const render = () =>
    root.render(
      <NavermapsProvider ncpKeyId={NCP_KEY_ID} submodules={['panorama']}>
        <Container style={{ width: '600px', height: '400px' }}>
          <Panorama
            ref={(p: naver.maps.Panorama | null) => {
              if (!p || p === panorama) return;
              panorama = p;
              const original = p.setPov.bind(p);
              p.setPov = (pov) => {
                setPovCalls.push(pov.pan ?? NaN);
                original(pov);
              };
            }}
            position={toCoord(initial.position)}
            pov={{ pan, tilt: 0, fov: 100 }}
            onPanoChanged={(id) => events.push(`pano_changed:${id}`)}
            onPanoStatus={(status) => events.push(`pano_status:${status}`)}
            onPovChanged={(pov) => {
              events.push('pov_changed');
              const unit = initial.roundPanTo;
              if (unit === undefined) return;
              const next = Math.round((pov.pan ?? 0) / unit) * unit;
              if (next === pan) return;
              pan = next;
              queueMicrotask(render);
            }}
            onInit={() => events.push('init')}
          >
            {initial.marker && (
              <Marker
                ref={(m: naver.maps.Marker | null) => {
                  if (m) marker = m;
                }}
                position={toCoord(initial.marker)}
              />
            )}
            {initial.marker && initial.infoWindow && (
              <InfoWindow
                ref={(o: naver.maps.InfoWindow | null) => {
                  if (o) infoWindow = o;
                }}
                open
                content="here"
                anchor={toCoord(initial.marker)}
                onOpen={() => events.push('infoWindowOpen')}
              />
            )}
          </Panorama>
        </Container>
      </NavermapsProvider>,
    );
  render();
  void maps;
  return {
    events: () => events.slice(),
    pan: () => (panorama as naver.maps.Panorama | null)?.getPov().pan ?? null,
    /** 라이브러리가 부른 setPov 의 pan 값들 */
    setPovCalls: () => setPovCalls.slice(),
    /** 튜토리얼처럼 거리뷰 투영으로 Marker 쪽을 바라본다. 화면 확인용. */
    lookAtMarker() {
      if (!panorama || !marker) return;
      const pov = panorama
        .getProjection()
        .fromCoordToPov(marker.getPosition() as naver.maps.LatLng);
      if (pov) panorama.setPov(pov);
    },
    /** Marker 가 거리뷰에 붙었는가 */
    markerOnPano: () =>
      !!marker && (marker.getMap() as unknown) === (panorama as unknown),
    /** InfoWindow 가 거리뷰에 열렸는가 */
    infoWindowOnPano: () =>
      !!infoWindow &&
      (infoWindow.getMap() as unknown) === (panorama as unknown),
    setPan(next: number) {
      pan = next;
      flushSync(render);
    },
  };
}
