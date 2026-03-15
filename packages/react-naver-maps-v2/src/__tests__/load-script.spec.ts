import { describe, test, expect } from 'vitest';
import { getClientParam } from '../load-script.js';

describe('getClientParam', () => {
  test('ncpKeyId 전달 시 ["ncpKeyId", value] 반환', () => {
    expect(getClientParam({ ncpKeyId: 'test-key' })).toEqual([
      'ncpKeyId',
      'test-key',
    ]);
  });

  test('ncpClientId 전달 시 ["ncpClientId", value] 반환', () => {
    expect(getClientParam({ ncpClientId: 'test-client' })).toEqual([
      'ncpClientId',
      'test-client',
    ]);
  });

  test('govClientId 전달 시 ["govClientId", value] 반환', () => {
    expect(getClientParam({ govClientId: 'gov-id' })).toEqual([
      'govClientId',
      'gov-id',
    ]);
  });

  test('finClientId 전달 시 ["finClientId", value] 반환', () => {
    expect(getClientParam({ finClientId: 'fin-id' })).toEqual([
      'finClientId',
      'fin-id',
    ]);
  });

  test('키 없으면 에러', () => {
    expect(() => getClientParam({} as any)).toThrow('인증 키가 필요합니다');
  });
});
