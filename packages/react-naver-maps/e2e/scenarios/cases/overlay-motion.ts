import {
  infoWindowsOpenOnBothMaps,
  overlaysMoveWithMarker,
  overlaysStayPut,
  secondMapStaysPut,
  secondSettlesAt,
  settlesAt,
} from '../assertions.js';
import type { AppConfig, Scenario } from '../types.js';
import {
  A,
  dragLeftAndRelease,
  everyFrame,
  rerender,
  wheels,
} from './steps.js';

/**
 * 지도가 움직이는 동안 오버레이가 자기 좌표의 화면 자리에 있는가(overlayDrift), 그리고 지도 두 개.
 * 오버레이 셋(Marker, CustomOverlay, 열린 InfoWindow 의 anchor 는 좌표)을 지도 가운데에 함께 올리고
 * 프레임마다 각각 잰다. 위반 메시지가 어느 오버레이인지 알려 준다.
 */

/**
 * 허용 거리(px). 첫 실행 전 추정치다 — 실행 뒤 조정한다.
 * 근거: 한 프레임 늦게 그리면 끌기 중 프레임당 7px, 관성·줌 중에는 더 벌어지므로 2px 은 "같은 프레임에
 * 그렸다"를 가르고, 투영·반올림 오차(1px 미만)는 넘긴다.
 */
// 래스터는 타일과 오버레이를 한 pane 에 넣고 pane 을 옮겨 fromCoordToOffset 기준 위치가 끈 거리만큼
// 어긋나게 잰다(측정 기준 차이, 2026-11-05). 그래서 래스터는 SDK 가 그리는 Marker 와의 간격으로 본다.
// GL 은 pane 을 옮기지 않아 지도 점과 직접 비교한다.
// 휠은 지도 가운데(x=300)에서 굴린다. 가장자리에서 세 번 줌하면 HOME 의 오버레이가 화면 밖으로 나가
// 위치를 잴 수 없었다(2026-11-05 화면 확인).
const MAX_PX = 2;

const OVERLAYS: Partial<AppConfig> = {
  marker: true,
  customOverlay: true,
  infoWindow: true,
};

const GL = { submodules: ['gl'], gl: true } satisfies Partial<AppConfig>;
const GL_UNSTABLE: Scenario['unstable'] = {
  fields: ['events'],
  reason:
    'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
};

export const overlayMotion: Scenario[] = [
  {
    name: '지도를 끌고 놓는 동안 CustomOverlay 가 Marker 와 함께 움직인다',
    app: { mode: 'props', ...OVERLAYS },
    steps: dragLeftAndRelease,
    expect: [overlaysMoveWithMarker(MAX_PX, 'all', ['customOverlay'])],
    since: '0.4',
  },
  {
    name: 'GL 지도를 끌고 놓는 동안 오버레이가 자기 좌표 자리에 머문다',
    unstable: GL_UNSTABLE,
    app: { mode: 'props', ...OVERLAYS, ...GL },
    steps: dragLeftAndRelease,
    expect: [overlaysStayPut(MAX_PX)],
    since: '0.4',
  },
  {
    // 줌 중심을 가운데에서 떼어 줌하는 동안 center 도 움직이게 한다.
    // 래스터 줌은 애니메이션 동안 pane 에 확대 변환을 건다. 멈추면 pane 을 다시 놓아 지도 점과 바로
    // 비교할 수 있다(멈춘 뒤 0px 실측). 그래서 마지막 프레임만 본다. Marker 기준점(element 아래 가운데,
    // 추정)은 줌 전후로 10px 달라져 간격 비교에 못 쓰고, InfoWindow 기준점(말풍선 아래 가운데, 근사)은 줌 뒤
    // 46px 달라졌지만 화면에서는 제자리였다(2026-11-05 캡처). 둘 다 측정 문제라 InfoWindow 는 빼고 본다.
    name: '휠로 줌한 뒤 Marker 와 CustomOverlay 가 자기 좌표 자리에 있다',
    app: { mode: 'props', ...OVERLAYS },
    steps: wheels(3, 300, -100),
    expect: [
      overlaysStayPut(MAX_PX, -1, undefined, ['marker', 'customOverlay']),
    ],
    since: '0.4',
  },
  {
    name: 'GL 지도에서 휠로 줌하는 동안 오버레이가 자기 좌표 자리에 머문다',
    unstable: GL_UNSTABLE,
    app: { mode: 'props', ...OVERLAYS, ...GL },
    steps: wheels(3, 300, -100),
    expect: [overlaysStayPut(MAX_PX)],
    since: '0.4',
  },
  {
    // center 되먹임으로 매 프레임 재렌더되고 CustomOverlay 의 내용도 렌더마다 바뀐다.
    name: 'center 를 되먹이는 앱에서 끌 때 렌더마다 내용이 바뀌는 CustomOverlay 도 Marker 와 함께 움직인다',
    app: { mode: 'controlled', ...OVERLAYS, customOverlayTick: true },
    steps: dragLeftAndRelease,
    expect: [overlaysMoveWithMarker(MAX_PX, 'all', ['customOverlay'])],
    since: '0.4',
  },
  // 래스터에서 매 프레임 center·zoom 을 바꾸는 경우는 재지 않는다. center 만 바꾸는 panTo 가 pane 을
  // 평행 이동해 지도 점 비교가 틀리고, Marker 기준점은 줌 전후로 달라 간격 비교도 못 쓴다(2026-11-05).
  // 같은 경로를 래스터 끌기(간격), 래스터 줌(멈춘 뒤), GL 매 프레임(직접)이 덮는다.

  {
    name: 'GL 지도에서 center 와 zoom 을 매 프레임 바꾸는 동안 오버레이가 자기 좌표 자리에 머문다',
    unstable: GL_UNSTABLE,
    app: { mode: 'props', ...OVERLAYS, ...GL },
    steps: [{ t: 'frames', n: 2 }, ...everyFrame, { t: 'frames', n: 90 }],
    expect: [overlaysStayPut(MAX_PX)],
    since: '0.4',
  },

  // 지도 두 개(secondMap): 첫 지도 옆에 두 번째 지도와 그 지도의 InfoWindow 하나.
  {
    name: '첫 지도를 끄는 동안 두 번째 지도의 center 는 바뀌지 않는다',
    app: { mode: 'controlled', secondMap: true },
    steps: dragLeftAndRelease,
    expect: [secondMapStaysPut()],
    since: '0.4',
  },
  {
    // SDK 는 지도마다 InfoWindow 를 하나만 연다. 그 규칙이 지도 사이에 번지면 한쪽이 닫힌다.
    name: '두 지도에 각각 열린 InfoWindow 는 다시 렌더해도 둘 다 열려 있다',
    app: { mode: 'props', infoWindow: true, secondMap: true },
    steps: [{ t: 'frames', n: 2 }, ...rerender(5), { t: 'frames', n: 5 }],
    expect: [infoWindowsOpenOnBothMaps()],
    since: '0.4',
  },
  {
    // 되울림 기록이 라이브러리 전체에서 하나면, 첫 지도가 보낸 좌표(A)와 같은 prop 을 받은 두 번째 지도가
    // 그것을 되울림으로 보고 무시한다.
    name: '첫 지도의 center 를 늦게 되돌려주는 동안 두 번째 지도에 같은 좌표를 줘도 그 좌표로 간다',
    app: { mode: 'delayed', secondMap: true },
    steps: [
      { t: 'frames', n: 5 },
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'props', props: { secondMapCenter: A } },
      { t: 'frames', n: 90 },
    ],
    expect: [settlesAt(A), secondSettlesAt(A)],
    since: '0.4',
  },
];
