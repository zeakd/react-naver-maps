/**
 * 인증에 실패하면 SDK 는 지도를 파괴한 뒤 전역 naver.maps 와 내부 네임스페이스를 null 로 만든다.
 * 그 뒤로는 naver.maps 접근뿐 아니라 살아 있는 인스턴스의 메서드도 예외를 던진다.
 * 이벤트 등록·해제와 setter 호출은 이 판단을 거쳐 재렌더와 언마운트가 앱을 내리지 않게 한다.
 */
export function sdkAlive(): boolean {
  return typeof naver !== 'undefined' && naver.maps != null;
}

export type MapListener = naver.maps.MapEventListener | null;

export function addMapListener(
  target: unknown,
  eventName: string,
  listener: Parameters<typeof naver.maps.Event.addListener>[2],
): MapListener {
  if (!sdkAlive()) return null;
  return naver.maps.Event.addListener(target, eventName, listener);
}

export function removeMapListener(listener: MapListener): void {
  if (listener && sdkAlive()) naver.maps.Event.removeListener(listener);
}

export function clearMapListeners(target: unknown): void {
  if (sdkAlive()) naver.maps.Event.clearInstanceListeners(target);
}
