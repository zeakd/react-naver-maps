import mapKeys from 'lodash.mapkeys';
import pick from 'lodash.pick';
import { forwardRef, useLayoutEffect, useImperativeHandle, useRef, useState } from 'react';
import { useFirstMountState } from 'react-use';

import { HandleEvents } from '../helpers/event';
import { Overlay } from '../overlay';
import type { UIEventHandlers } from '../types/event';
import { useNavermaps } from '../use-navermaps';
import { getKeys } from '../utils/get-keys';
import { omitUndefined } from '../utils/omit-undefined';
import { getUncontrolledKey, makeUncontrolledKeyMap, UncontrolledKey } from '../utils/uncontrolled';

const primitiveKeys = [
  'animation',
  'icon',
  'shape',
  'title',
  'cursor',
  'clickable',
  'draggable',
  'visible',
  'zIndex',
] as const;
const locationalKeys = ['position'] as const;
const uncontrolledKeyMap = makeUncontrolledKeyMap(locationalKeys);
const kvoKeys = [
  ...primitiveKeys,
  ...locationalKeys,
] as const;
const kvoEvents = kvoKeys.map(key => `${key}_changed`);
const uiEvents = [
  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'rightclick',
  'mouseover',
  'mouseout',
  'dragstart',
  'drag',
  'dragend',
] as const;
const events = [...uiEvents, ...kvoEvents];

type MarkerKVO = {
  /** Animation??? */
  animation: naver.maps.Animation;
  position: naver.maps.Coord | naver.maps.CoordLiteral;
  icon: string | naver.maps.ImageIcon | naver.maps.SymbolIcon | naver.maps.HtmlIcon;
  shape: naver.maps.MarkerShape;
  title: string;
  cursor: string;
  clickable: boolean;
  draggable: boolean;
  visible: boolean;
  zIndex: number;
};

type UncontrolledProps = {
  [key in typeof locationalKeys[number] as UncontrolledKey<key>]: MarkerKVO[key];
};

// TODO: Fix DefinitelyTyped
type MarkerOptions = Partial<MarkerKVO>;

export type Props = MarkerOptions & Partial<UncontrolledProps> & UIEventHandlers<typeof uiEvents> & {
  onAnimationChanged?: (value: naver.maps.Animation) => void;
  onPositionChanged?: (value: naver.maps.Coord) => void;
  onIconChanged?: (value: string | naver.maps.ImageIcon | naver.maps.HtmlIcon | naver.maps.SymbolIcon) => void;
  onShapeChanged?: (event: naver.maps.MarkerShape) => void;
  onTitleChanged?: (event: string) => void;
  onCursorChanged?: (event: string) => void;
  onClickableChanged?: (event: boolean) => void;
  onDraggableChanged?: (event: boolean) => void;
  onVisibleChanged?: (event: boolean) => void;
  /**
   * hello yeah
   * @param event helo?
   * @returns
   */
  onZIndexChanged?: (event: number) => void;
};

function makeInitialOption(props: Props) {
  const uncontrolledProps = pick(props, getKeys(uncontrolledKeyMap));
  const prefixCleared = mapKeys(uncontrolledProps, (_, key) => uncontrolledKeyMap[key as keyof typeof uncontrolledKeyMap]);
  const kvoProps = pick(props, kvoKeys);

  return omitUndefined({ ...kvoProps, ...prefixCleared });
}

function isLocationalKey(key: string): key is typeof locationalKeys[number] {
  return locationalKeys.includes(key as typeof locationalKeys[number]);
}

function isEqualKvo(kvo: any, target: any) {
  if (kvo === undefined) {
    return false;
  }

  if (kvo === target) {
    return true;
  }

  try {
    return kvo.equals(target);
  } catch {
    return kvo === target;
  }
}

export const Marker = forwardRef<naver.maps.Marker, Props>(function Marker(props, ref) {
  const navermaps = useNavermaps();
  const [marker] = useState(() => new navermaps.Marker(makeInitialOption(props)));
  useImperativeHandle<naver.maps.Marker | undefined, naver.maps.Marker | undefined>(ref, () => marker);

  // make dirties
  const isFirst = useFirstMountState();
  const dirtiesRef = useRef<Pick<Props, typeof kvoKeys[number]>>({});
  dirtiesRef.current = getDirties();

  function getDirties() {
    // initialize의 option과 중복되지 않도록 첫 렌더시 제외한다.
    if (isFirst) {
      return {};
    }

    return kvoKeys.reduce((acc, key) => {
      if (props[key] === undefined) {
        return acc;
      }

      if (isLocationalKey(key) && props[getUncontrolledKey(key)] !== undefined) {
        return acc;
      }

      const kvos = marker.getOptions(key);
      if (isEqualKvo(kvos[key], props[key])) {
        return acc;
      }

      return {
        ...acc,
        [key]: props[key],
      };
    }, {});
  }

  function pickDirties(keys: readonly string[]) {
    return pick(dirtiesRef.current, keys);
  }

  // side effects
  useLayoutEffect(() => {
    const { position } = pickDirties(['position']);
    if (position) {
      marker.setPosition(position);
    }
  }, [dirtiesRef.current['position']]);

  useLayoutEffect(() => {
    const dirties = pickDirties(primitiveKeys);
    if (Object.values(dirties).length < 1) {
      return;
    }

    marker.setOptions(dirties);
  }, primitiveKeys.map(key => dirtiesRef.current[key]));

  return (
    <Overlay element={marker}>
      <HandleEvents events={events} listeners={props as any} />
    </Overlay>
  );
});
