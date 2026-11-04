import { Component, type ReactNode } from 'react';
import { defineFixture } from '../fixture.js';
import { INITIAL_CENTER, toCoord } from '../common.js';
import { Marker } from '../target-imports.js';

export type ErrorBoundaryConfig = {
  /** 지도 안에 에러 경계를 두고 그 안에 Marker 와 던지는 자식을 올린다. */
  errorBoundary?: boolean;
  /** 1 이상이면 경계 안의 자식이 렌더 중에 던진다(메시지에 THROW_MARK). */
  throwKey?: number;
  /** 경계의 key. 바꾸면 경계를 리셋(새로 만듦)한다. */
  boundaryKey?: number;
};

export type ErrorBoundaryFrame = {
  /** 경계 안 Marker 중 지금 지도에 붙은 수. 경계를 쓰지 않았으면 null */
  boundaryMarkers: number | null;
  /** 경계가 대체 UI 를 보이고 있는가. 경계를 쓰지 않았으면 null */
  boundaryFallback: boolean | null;
};

/** 시나리오가 이 에러만 허용하도록 메시지에 넣는 표지 */
export const THROW_MARK = 'E2E_BOUNDARY_THROW';

type Probe = { markers: Set<naver.maps.Marker>; fallback: boolean };

class Boundary extends Component<
  { children: ReactNode; probe: Probe },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const { probe } = this.props;
    return (
      <span
        ref={(el) => {
          probe.fallback = el !== null;
        }}
      />
    );
  }
}

function Thrower({ on }: { on: boolean }) {
  if (on) throw new Error(THROW_MARK);
  return null;
}

export const errorBoundary = defineFixture<
  ErrorBoundaryConfig,
  Probe,
  ErrorBoundaryFrame
>({
  probe: () => ({ markers: new Set(), fallback: false }),
  render: (config, probe) =>
    config.errorBoundary && (
      <Boundary key={config.boundaryKey} probe={probe}>
        <Marker
          ref={(m: naver.maps.Marker | null) => {
            if (m) probe.markers.add(m);
          }}
          position={toCoord(INITIAL_CENTER)}
        />
        <Thrower on={(config.throwKey ?? 0) >= 1} />
      </Boundary>
    ),
  read: (map, probe) => ({
    boundaryMarkers:
      probe.markers.size === 0
        ? null
        : [...probe.markers].filter((m) => m.getMap() === map).length,
    boundaryFallback: probe.markers.size === 0 ? null : probe.fallback,
  }),
});
