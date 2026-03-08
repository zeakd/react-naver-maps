// naver.maps 생성자에 undefined 값을 명시적으로 전달하면 내부 초기화가 실패한다.
// (예: mapTypeId: undefined → 기본 mapType 설정을 건너뛰어 타일 로드 불가)
// undefined 키를 제거하여 naver maps가 기본값을 사용하도록 한다.
export function omitUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result as Partial<T>;
}
