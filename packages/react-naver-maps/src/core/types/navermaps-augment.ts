/**
 * `@types/navermaps` 3.9.2 에 없지만 공식 문서(SDK 3.10.5)에 있는 멤버를 더한다.
 *
 * ref 나 useMap 으로 받은 SDK 객체를 TS 에서 문서대로 쓰게 하려는 것이다. 인터페이스 병합으로 더할 수
 * 있는 멤버만 둔다(클래스·enum 을 새로 선언하면 @types 가 나중에 더했을 때 겹쳐 오류가 난다).
 * 선언이 틀린 것(필수 필드, 생성자 인자 등)은 병합으로 고칠 수 없어 컴포넌트 prop 타입에서 넓혀 받는다
 * (`types/sdk-options.ts`).
 *
 * 각 항목의 근거는 공식 문서의 클래스 쪽이다. 문서 목록과 @types 를 맞춘 결과(2026-11-04)로 골랐다.
 */
// declare global 을 쓰려면 모듈이어야 한다.
// oxlint-disable-next-line unicorn/require-module-specifiers
export {};

declare global {
  namespace naver.maps {
    interface PointerEvent {
      /** 원래 DOM 이벤트. */
      originalEvent?: Event;
      /** 이벤트가 난 오버레이(겹친 마커 판정 등). */
      overlay?: OverlayView;
    }

    interface MarkerOptions {
      /** GL 에서 다른 마커와 겹치면 숨긴다. */
      collisionBehavior?: boolean;
      collisionBoxSize?: Size | SizeLiteral;
    }

    interface InfoWindowOptions {
      /** 자동 이동 때 지도 가장자리와 띄울 여백. */
      autoPanPadding?: Point | PointLiteral;
    }

    interface GroundOverlayOptions {
      crossOrigin?: string;
    }

    interface ImageMapTypeOptions {
      /** 타일이 나타나는 시간(ms). */
      tileDuration?: number;
    }

    interface CanvasMapTypeOptions {
      tileDuration?: number;
    }

    interface Map {
      /** 이름 붙인 오버레이 창을 더한다. element 를 주거나 zIndex 로 새로 만든다. */
      addOverlayPane(name: string, elementOrZIndex: HTMLElement | number): void;
      removeOverlayPane(name: string): void;
    }

    interface Marker {
      /** 거리뷰(Panorama)에도 붙는다(공식 튜토리얼 "파노라마에 마커"). */
      setMap(map: Map | Panorama | null): void;
    }

    interface InfoWindow {
      /** 거리뷰(Panorama)에서도 연다(공식 튜토리얼 "파노라마에 정보 창"). */
      open(map: Map | Panorama, anchor?: Marker | Coord | CoordLiteral): void;
    }

    interface GroundOverlay {
      /** 이미지를 바꾼다. SDK 는 url 값을 갱신하지 않아 getUrl 과 어긋난다(3.10.5). */
      setUrl(url: string): void;
    }

    interface Tile {
      setDuration(duration: number): void;
    }

    interface Data {
      /** 인자 없이 부르면 모든 feature 의 overrideStyle 을 되돌린다. */
      revertStyle(feature?: Feature): void;
    }

    namespace Event {
      /** 돌려받은 값으로 removeDOMListener 한다. */
      function addDOMListener(
        element: HTMLElement,
        eventName: string,
        // @types 의 기존 선언과 같은 리스너 타입이어야 호출이 이 선언으로 풀린다.
        // oxlint-disable-next-line typescript/no-explicit-any
        listener: (event: any) => any,
      ): DOMEventListener;
    }

    namespace drawing {
      interface DrawingManager {
        removeDrawing(overlayOrId: DrawingOverlay | string): void;
      }
    }
  }
}
