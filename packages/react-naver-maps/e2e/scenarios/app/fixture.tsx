import { Fragment, type ReactNode } from 'react';
import { Activity } from './activity.js';
import type { AppConfig } from '../types.js';
import type { Observed } from './observe.js';

/**
 * 지도에 올려 검사하는 기능 하나. 설정(C)을 보고 지도 안에 렌더하고, 프레임마다 그 기능의 값(F)을 읽는다.
 * P 는 이 기능만의 관찰 상태(ref 로 받은 인스턴스, 클릭 수 등)이고 앱을 올릴 때마다 새로 만든다.
 * 여러 기능이 함께 쓰는 것(calls, overlays)은 core(Observed)로 받는다.
 */
export interface Fixture<C = AppConfig, P = undefined, F = object> {
  /** 관찰 상태를 만든다. 없으면 상태 없는 픽스처. */
  probe?(): P;
  /** 앱을 올릴 때 한 번. SDK 프로토타입 감싸기처럼 지도보다 먼저 해야 하는 일. */
  setup?(maps: typeof naver.maps, probe: P, core: Observed): void;
  /** 지도 안에 렌더한다. 설정에 이 기능이 없으면 null. */
  render(config: C, probe: P, core: Observed): ReactNode;
  /** 프레임마다 읽는 값. 키 이름·값이 TraceFrame 의 해당 필드다. */
  read?(map: naver.maps.Map, probe: P, core: Observed): F;
}

/** FIXTURES 에 담기 위해 설정·상태 타입을 지운 모양. */
export type AnyFixture = Fixture<AppConfig, unknown, object>;

/** 타입 추론용. 기능 파일이 설정·상태·프레임 타입을 한 번에 묶는다. */
export function defineFixture<C, P = undefined, F = object>(
  fixture: Fixture<C, P, F>,
): Fixture<C, P, F> {
  return fixture;
}

/**
 * 여러 픽스처를 한 Activity 로 감싼다. 설정의 mode 가 hidden 이면 묶음 전체가 숨는다.
 * 묶음 안의 렌더·읽기 순서는 members 순서다.
 */
export function activityGroup(
  modeOf: (config: AppConfig) => 'visible' | 'hidden' | undefined,
  members: AnyFixture[],
): AnyFixture {
  return {
    probe: () => members.map((m) => m.probe?.()),
    setup: (maps, probes, core) =>
      members.forEach((m, i) =>
        m.setup?.(maps, (probes as unknown[])[i], core),
      ),
    render: (config, probes, core) => (
      <Activity mode={modeOf(config) ?? 'visible'}>
        {members.map((m, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <Fragment key={i}>
            {m.render(config, (probes as unknown[])[i], core)}
          </Fragment>
        ))}
      </Activity>
    ),
    read: (map, probes, core) =>
      Object.assign(
        {},
        ...members.map((m, i) => m.read?.(map, (probes as unknown[])[i], core)),
      ),
  };
}
