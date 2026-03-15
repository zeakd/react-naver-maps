/**
 * 테스트 유틸리티: 네이버맵 KVO/Event 시스템 Stub
 *
 * 네이버맵 KVO/Event 시스템의 동작을 재현한다.
 *
 * MockKVO 동작:
 * - set(key, value) → 값 저장 + `${key}_changed` 이벤트 발생
 * - get(key) → 저장된 값 반환
 * - 이름 있는 setter (setPosition, setCenter 등) → set() 위임
 *
 * Event 시스템:
 * - addListener(target, eventName, cb) → handle 반환
 * - removeListener(handle) → 해당 리스너 제거
 * - clearInstanceListeners(target) → 대상의 모든 리스너 제거
 */

type EventCallback = (...args: unknown[]) => void;

export interface ListenerHandle {
  target: MockKVO;
  eventName: string;
  cb: EventCallback;
}

export class MockKVO {
  _values: Record<string, unknown> = {};
  _listeners: Record<string, EventCallback[]> = {};

  constructor(options?: Record<string, unknown>) {
    if (options) {
      for (const [key, value] of Object.entries(options)) {
        if (value !== undefined) {
          this._values[key] = value;
        }
      }
    }
  }

  get(key: string): unknown {
    return this._values[key];
  }

  set(key: string, value: unknown): void {
    this._values[key] = value;
    this._trigger(`${key}_changed`);
  }

  _trigger(eventName: string, ...args: unknown[]): void {
    this._listeners[eventName]?.forEach((cb) => cb(...args));
  }

  _addListener(eventName: string, cb: EventCallback): ListenerHandle {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(cb);
    return { target: this, eventName, cb };
  }

  _removeListener(handle: ListenerHandle): void {
    const arr = this._listeners[handle.eventName];
    if (arr) {
      const idx = arr.indexOf(handle.cb);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }

  _clearListeners(): void {
    this._listeners = {};
  }

  // Named setters (overlay 공통)
  setMap(map: unknown): void {
    this.set('map', map);
  }
  setPosition(pos: unknown): void {
    this.set('position', pos);
  }
  setCenter(center: unknown): void {
    this.set('center', center);
  }
  setZoom(zoom: unknown): void {
    this.set('zoom', zoom);
  }
  setBounds(bounds: unknown): void {
    this.set('bounds', bounds);
  }
  setRadius(radius: unknown): void {
    this.set('radius', radius);
  }
  setOpacity(opacity: unknown): void {
    this.set('opacity', opacity);
  }
  setPaths(paths: unknown): void {
    this.set('paths', paths);
  }
  setPath(path: unknown): void {
    this.set('path', path);
  }

  // InfoWindow 전용
  open(..._args: unknown[]): void {}
  close(): void {}
  setContent(_content: unknown): void {}
  setOptions(_options: unknown): void {}

  destroy(): void {
    this._clearListeners();
  }
}

// CustomOverlay 테스트용 OverlayView mock
export class MockOverlayView extends MockKVO {
  _panes: Record<string, HTMLDivElement> = {};

  getPanes() {
    if (!this._panes.floatPane) {
      this._panes.floatPane = document.createElement('div');
      document.body.appendChild(this._panes.floatPane);
    }
    return this._panes;
  }

  getProjection() {
    return {
      fromCoordToOffset: (_coord: unknown) => ({ x: 100, y: 200 }),
    };
  }

  setMap(map: unknown): void {
    this.set('map', map);
    if (map) this.onAdd();
    else this.onRemove();
  }

  onAdd() {}
  draw() {}
  onRemove() {}
}

export interface CreatedInstance {
  type: string;
  instance: MockKVO;
  options: unknown;
}

export function createMockNaverMaps() {
  const instances: CreatedInstance[] = [];

  function createConstructor(type: string) {
    return function (this: unknown, options?: Record<string, unknown>) {
      const instance = new MockKVO(options);
      instances.push({ type, instance, options });
      return instance;
    } as unknown;
  }

  const Event = {
    addListener: (
      target: MockKVO,
      eventName: string,
      cb: EventCallback,
    ): ListenerHandle => {
      return target._addListener(eventName, cb);
    },
    removeListener: (handle: ListenerHandle): void => {
      handle.target._removeListener(handle);
    },
    clearInstanceListeners: (target: MockKVO): void => {
      target._clearListeners();
    },
  };

  const mockNaverMaps = {
    Map: createConstructor('Map'),
    Marker: createConstructor('Marker'),
    InfoWindow: createConstructor('InfoWindow'),
    Circle: createConstructor('Circle'),
    Rectangle: createConstructor('Rectangle'),
    Ellipse: createConstructor('Ellipse'),
    Polygon: createConstructor('Polygon'),
    Polyline: createConstructor('Polyline'),
    GroundOverlay: createConstructor('GroundOverlay'),
    OverlayView: MockOverlayView,
    LatLng: class MockLatLng {
      lat: number;
      lng: number;
      constructor(latOrLiteral: number | unknown, lng?: number) {
        if (typeof latOrLiteral === 'number') {
          this.lat = latOrLiteral;
          this.lng = lng!;
        } else {
          const literal = latOrLiteral as { lat: number; lng: number };
          this.lat = literal.lat;
          this.lng = literal.lng;
        }
      }
    },
    Event,
  };

  (globalThis as Record<string, unknown>).naver = { maps: mockNaverMaps };

  return {
    navermaps: mockNaverMaps,
    instances,
    getLastInstance: (type?: string) => {
      if (type) {
        return instances.toReversed().find((i) => i.type === type);
      }
      return instances[instances.length - 1];
    },
    cleanup: () => {
      delete (globalThis as Record<string, unknown>).naver;
      instances.length = 0;
    },
  };
}
