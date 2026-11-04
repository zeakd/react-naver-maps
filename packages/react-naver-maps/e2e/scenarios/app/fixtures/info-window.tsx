import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import type { OverlayAnchor } from '../observe.js';
import { InfoWindow } from '../target-imports.js';

export type InfoWindowConfig = {
  /** 값이 그대로인 인라인 anchor 로 열린 InfoWindow 를 함께 올린다. */
  infoWindow?: boolean;
  /** 두 번째 InfoWindow 를 다른 자리에 인라인 anchor 로 함께 연다. SDK 는 지도마다 하나만 연다. */
  infoWindow2?: boolean;
};

/**
 * overlayDrift 의 InfoWindow 기준점: 말풍선 element 의 아래 가운데. 말풍선 꼬리 끝은 이보다 조금
 * 아래일 수 있고 pixelOffset 도 있을 수 있어(추정, 실측 전) approximate 로 두고 첫 측정과의 차이만 본다.
 * element 는 content element 에서 위로 올라가 floatPane 의 자식까지 간 것이다.
 */
function infoWindowAnchor(o: naver.maps.InfoWindow): OverlayAnchor {
  return {
    approximate: true,
    coord: () => (o.getMap() ? new naver.maps.LatLng(...INITIAL_CENTER) : null),
    screen: () => {
      const map = o.getMap() as naver.maps.Map | null;
      const pane = map?.getPanes().floatPane;
      let el = o.getContentElement() as HTMLElement | null;
      while (el && el.parentElement !== pane) el = el.parentElement;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return [rect.left + rect.width / 2, rect.bottom];
    },
  };
}

export const infoWindow = defineFixture<InfoWindowConfig>({
  render: (config, _probe, core) => (
    <>
      {config.infoWindow && (
        <InfoWindow
          ref={(o: naver.maps.InfoWindow | null) => {
            core.recordOverlay('infoWindow', o);
            core.recordAnchor('infoWindow', o && infoWindowAnchor(o));
          }}
          open
          content="info"
          anchor={toCoord(INITIAL_CENTER)}
          onOpen={() => core.calls.push('infoWindowOpen')}
          onClose={() => core.calls.push('infoWindowClose')}
        />
      )}
      {config.infoWindow2 && (
        <InfoWindow
          open
          content="info2"
          anchor={toCoord([INITIAL_CENTER[0] + 0.002, INITIAL_CENTER[1]])}
          onOpen={() => core.calls.push('infoWindow2Open')}
          onClose={() => core.calls.push('infoWindow2Close')}
        />
      )}
    </>
  ),
});
