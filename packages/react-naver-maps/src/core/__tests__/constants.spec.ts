import { describe, expect, test } from 'vitest';
import { resolveConstant, resolveConstants } from '../constants.js';

// TypeScript 숫자 enum 과 같은 모양(이름 → 값, 값 → 이름).
const Position = { CENTER: 0, TOP_RIGHT: 3, 0: 'CENTER', 3: 'TOP_RIGHT' };
const Style = { SMALL: 2, 2: 'SMALL' };
const maps = {
  Position,
  ZoomControlStyle: Style,
} as unknown as typeof naver.maps;

describe('resolveConstant', () => {
  test('이름은 SDK 표의 값으로, 숫자는 그대로', () => {
    expect(resolveConstant(Position, 'TOP_RIGHT', 'x')).toBe(3);
    expect(resolveConstant(Position, 3, 'x')).toBe(3);
    expect(resolveConstant(Position, undefined, 'x')).toBe(undefined);
  });

  test('SDK 에 없는 이름은 쓸 수 있는 이름과 함께 던진다', () => {
    expect(() => resolveConstant(Position, 'TOP', '<NaverMap x>')).toThrow(
      /<NaverMap x>.*'TOP'.*CENTER, TOP_RIGHT/,
    );
  });

  test('enum 의 역방향 키(숫자 문자열)와 Object 의 키는 이름으로 받지 않는다', () => {
    expect(() => resolveConstant(Position, '3', 'x')).toThrow(/'3'/);
    expect(() => resolveConstant(Position, 'toString', 'x')).toThrow(
      /'toString'/,
    );
  });
});

describe('resolveConstants', () => {
  const paths = {
    'zoomControlOptions.position': (m: typeof naver.maps) => m.Position,
    'zoomControlOptions.style': (m: typeof naver.maps) => m.ZoomControlStyle,
    'list[]': (m: typeof naver.maps) => m.Position,
    top: (m: typeof naver.maps) => m.Position,
  };

  test('중첩, 배열, 최상위 자리를 바꾸고 원본은 그대로 둔다', () => {
    const props = {
      zoomControlOptions: {
        position: 'TOP_RIGHT',
        style: 'SMALL',
        legendDisabled: true,
      },
      list: ['CENTER', 3],
      top: 'TOP_RIGHT',
    };
    const out = resolveConstants(maps, props, paths, 'NaverMap');
    expect(out).toEqual({
      zoomControlOptions: { position: 3, style: 2, legendDisabled: true },
      list: [0, 3],
      top: 3,
    });
    expect(props.zoomControlOptions.position).toBe('TOP_RIGHT');
  });

  test('바꿀 이름이 없으면 같은 객체를 돌려준다', () => {
    const props = { zoomControlOptions: { position: 3 }, list: [0], other: 1 };
    expect(resolveConstants(maps, props, paths, 'NaverMap')).toBe(props);
  });
});
