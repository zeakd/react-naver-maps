import { describe, it, expect } from 'bun:test';
import { extractAllProps } from './extractor.js';
import type { PackageConfig } from './types.js';
import { resolve } from 'node:path';

const REACT_NAVER_MAPS_CONFIG: PackageConfig = {
  name: 'react-naver-maps',
  tsconfig: resolve(
    import.meta.dirname,
    '../../../react-naver-maps/tsconfig.json',
  ),
};

describe('extractAllProps', () => {
  const docs = extractAllProps(REACT_NAVER_MAPS_CONFIG);
  const docMap = new Map(docs.map((d) => [d.displayName, d]));

  it('.d.ts 파일에서 컴포넌트를 감지한다', () => {
    expect(docs.length).toBeGreaterThan(0);
  });

  it('주요 컴포넌트가 모두 포함된다', () => {
    const expected = [
      'NaverMap',
      'Marker',
      'Container',
      'Circle',
      'Polygon',
      'Polyline',
      'InfoWindow',
    ];
    for (const name of expected) {
      expect(docMap.has(name)).toBe(true);
    }
  });

  describe('NaverMap', () => {
    const naverMap = docMap.get('NaverMap')!;

    it('컴포넌트 문서가 존재한다', () => {
      expect(naverMap).toBeDefined();
    });

    it('Props가 추출된다', () => {
      expect(naverMap.props.length).toBeGreaterThan(10);
    });

    it('center prop의 타입이 정확하다', () => {
      const center = naverMap.props.find((p) => p.name === 'center');
      expect(center).toBeDefined();
      expect(center!.required).toBe(false);
      expect(center!.type).toContain('Coord');
    });

    it('onClick 이벤트 핸들러가 추출된다', () => {
      const onClick = naverMap.props.find((p) => p.name === 'onClick');
      expect(onClick).toBeDefined();
      expect(onClick!.required).toBe(false);
      expect(onClick!.type).toContain('PointerEvent');
    });

    it('ref, key는 제외된다', () => {
      const names = naverMap.props.map((p) => p.name);
      expect(names).not.toContain('ref');
      expect(names).not.toContain('key');
    });
  });

  describe('Marker', () => {
    const marker = docMap.get('Marker')!;

    it('position prop이 있다', () => {
      const position = marker.props.find((p) => p.name === 'position');
      expect(position).toBeDefined();
      expect(position!.type).toContain('Coord');
    });
  });

  describe('propsOverrides', () => {
    it('hidden override가 적용된다', () => {
      const config: PackageConfig = {
        ...REACT_NAVER_MAPS_CONFIG,
        propsOverrides: {
          NaverMap: {
            center: { hidden: true },
          },
        },
      };
      const result = extractAllProps(config);
      const naverMap = result.find((d) => d.displayName === 'NaverMap')!;
      const names = naverMap.props.map((p) => p.name);
      expect(names).not.toContain('center');
    });

    it('description override가 적용된다', () => {
      const config: PackageConfig = {
        ...REACT_NAVER_MAPS_CONFIG,
        propsOverrides: {
          NaverMap: {
            zoom: { description: '커스텀 설명' },
          },
        },
      };
      const result = extractAllProps(config);
      const naverMap = result.find((d) => d.displayName === 'NaverMap')!;
      const zoom = naverMap.props.find((p) => p.name === 'zoom');
      expect(zoom!.description).toBe('커스텀 설명');
    });
  });

  describe('에러 처리', () => {
    it('잘못된 tsconfig 경로에서 예외를 던진다', () => {
      expect(() =>
        extractAllProps({
          name: 'nonexistent',
          tsconfig: '/nonexistent/tsconfig.json',
        }),
      ).toThrow();
    });
  });
});
