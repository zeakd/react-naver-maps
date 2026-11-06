import { describe, expect, test } from 'vitest';
import { compareRows } from '../../e2e/compare-rows.js';
import type { CompareBase, Outcome } from '../../e2e/compare-rows.js';

const release: CompareBase = { kind: 'release', version: '0.3.0' };
const git: CompareBase = { kind: 'git' };
const outcome = (status: Outcome['status'], zoom = 1): Outcome => ({
  status,
  trace: [{ zoom }] as unknown as Outcome['trace'],
  unstable: [],
  fields: { zoom: 'behavior' },
});
const judge = (
  a: Outcome | undefined,
  b: Outcome | undefined,
  base: CompareBase = release,
  fields: string[] = ['status', 'zoom'],
) =>
  compareRows(
    new Map(a ? [['s', a]] : []),
    new Map(b ? [['s', b]] : []),
    base,
    { s: { fields, reason: '이유' } },
  )[0]!;

describe('판정이 바뀌는 방향', () => {
  test('기준선 실패 → 소스 통과는 허용 목록에 있으면 예상한 차이다', () => {
    expect(judge(outcome('failed'), outcome('passed')).kind).toBe(
      '예상한 차이',
    );
  });

  test('기준선 통과 → 소스 실패는 허용 목록에 status 가 있어도 예상 밖이다', () => {
    const row = judge(outcome('passed'), outcome('failed'));
    expect(row.kind).toBe('예상 밖 차이');
    expect(row.detail).toContain('판정 passed → failed');
  });

  test('허용 목록에 없으면 어느 방향이든 예상 밖이다', () => {
    expect(
      judge(outcome('failed'), outcome('passed'), release, ['zoom']).kind,
    ).toBe('예상 밖 차이');
  });

  test('git 기준선에는 허용 목록을 쓰지 않는다', () => {
    expect(judge(outcome('failed'), outcome('passed'), git).kind).toBe(
      '예상 밖 차이',
    );
  });
});

describe('궤적과 실행', () => {
  test('양쪽이 같은 궤적으로 실패하면 같음이다', () => {
    expect(judge(outcome('failed'), outcome('failed')).kind).toBe('같음');
  });

  test('궤적 없이 끝난 쪽이 있으면 같은 상태여도 예상 밖이다', () => {
    const unrun: Outcome = { status: 'failed', unstable: [], fields: {} };
    expect(judge(unrun, unrun).kind).toBe('예상 밖 차이');
  });

  test('허용한 필드 밖의 차이는 예상 밖이다', () => {
    expect(
      judge(outcome('passed', 1), outcome('passed', 2), release, ['status'])
        .kind,
    ).toBe('예상 밖 차이');
  });

  test('한쪽에 없는 시나리오는 예상 밖이다', () => {
    expect(judge(outcome('passed'), undefined).kind).toBe('예상 밖 차이');
  });
});
