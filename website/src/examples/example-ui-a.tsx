import type { CSSProperties, ReactNode } from 'react';

// 공식 예제의 `.buttons` / `.control-btn` 모양. 예제 쪽들이 함께 쓴다.
export function buttonStyle(active = false): CSSProperties {
  return {
    backgroundColor: active ? '#2780E3' : '#fff',
    color: active ? '#fff' : '#555',
    border: 'solid 1px #333',
    outline: '0 none',
    borderRadius: '5px',
    boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
    fontSize: '16px',
    lineHeight: '1.15',
    padding: '1px 6px',
    margin: '0 5px 5px 0',
    cursor: 'pointer',
  };
}

/** 지도 위 왼쪽 위에 버튼을 놓는 줄. `Container` 안에 둔다. */
export function ButtonBar({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1000,
        padding: '5px',
      }}
    >
      {children}
    </div>
  );
}

/** 켜짐 여부에 따라 모양이 바뀌는 토글 버튼. */
export function ToggleButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" style={buttonStyle(on)} onClick={onClick}>
      {children}
    </button>
  );
}

/**
 * 기본 지도 유형 넷(normal, terrain, satellite, hybrid). 사용자 유형을 더한 `mapTypes`
 * 레지스트리를 만들 때 바탕으로 쓴다. `useMemo` 로 한 번만 만든다.
 */
export function defaultMapTypes(navermaps: typeof naver.maps) {
  const { NaverStyleMapTypeOptions: Style } = navermaps;
  return {
    normal: Style.getNormalMap(),
    terrain: Style.getTerrainMap(),
    satellite: Style.getSatelliteMap(),
    hybrid: Style.getHybridMap(),
  };
}
