/**
 * 지도가 최근에 보고한 카메라 값(되울림 기록).
 *
 * 지도가 움직이면 onCenterChanged·onZoomChanged 로 앱에 값이 간다. 앱이 그 값을 늦게 되돌려주면
 * (setTimeout, 비동기 store, transition) 지도가 이미 지나온 자리다. 그것을 새 목표로 따라가면 지도가
 * 뒤로 당겨지고, 그 이동이 다시 보고되어 늦게 돌아오며 멈추지 않고 흔들렸다(e2e "center 를 늦게
 * 되돌려줘도"). 그래서 최근 보고값과 같은 자리인 prop 은 되울림으로 보고 따르지 않는다. 앱이 일부러
 * 그 자리로 보내려면 WINDOW_MS 뒤에 같은 값을 주거나 map.panTo() 를 쓴다.
 *
 * zoom 은 실수만 기록한다(GL 의 휠·핀치 줌). 정수 zoom 은 "15 로 되돌리기" 같은 앱 의도와 구별할 수
 * 없고, 래스터는 늘 정수다.
 *
 * 시각은 부르는 쪽이 준다(performance.now). 그래서 시간에 따른 판정을 단위 테스트로 고정할 수 있다.
 */
export class EchoLog<C> {
  /** 되울림으로 볼 보고값의 시간 범위(ms)와 개수. */
  static readonly WINDOW_MS = 2000;
  static readonly MAX = 240;

  private centers: { at: number; coord: C }[] = [];
  private zooms: { at: number; zoom: number }[] = [];

  rememberCenter(coord: C, now: number): void {
    push(this.centers, { at: now, coord }, now);
  }

  rememberZoom(zoom: number, now: number): void {
    if (Number.isInteger(zoom)) return;
    push(this.zooms, { at: now, zoom }, now);
  }

  /** 최근 보고한 center 가운데 `same` 으로 같은 자리인 것이 있는가. */
  isCenterEcho(now: number, same: (reported: C) => boolean): boolean {
    return this.centers.some(
      (r) => now - r.at <= EchoLog.WINDOW_MS && same(r.coord),
    );
  }

  /** 최근 보고한 실수 zoom 과 같은가. 정수는 되울림으로 보지 않는다. */
  isZoomEcho(zoom: number, now: number): boolean {
    if (Number.isInteger(zoom)) return false;
    return this.zooms.some(
      (r) => now - r.at <= EchoLog.WINDOW_MS && Math.abs(r.zoom - zoom) < 1e-9,
    );
  }
}

function push<T extends { at: number }>(list: T[], item: T, now: number) {
  list.push(item);
  while (list.length > EchoLog.MAX || now - list[0]!.at > EchoLog.WINDOW_MS) {
    list.shift();
  }
}
