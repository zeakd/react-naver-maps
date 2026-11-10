import { useEffect, useRef, useState } from 'react';
import { NavermapsProvider, Container as PanoDiv } from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

type Size = { width: number; height: number };
const SIZES: Size[] = [
  { width: 200, height: 200 },
  { width: 400, height: 300 },
  { width: 600, height: 400 },
  { width: 800, height: 500 },
];

/** 크기를 500ms 동안 부드럽게 바꿉니다. 공식 예제의 jQuery animate에 해당합니다. */
function useAnimatedSize(target: Size): Size {
  const [size, setSize] = useState(target);
  const sizeRef = useRef(size);
  sizeRef.current = size;

  useEffect(() => {
    const from = sizeRef.current;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min((now - start) / 500, 1);
      setSize({
        width: Math.round(from.width + (target.width - from.width) * t),
        height: Math.round(from.height + (target.height - from.height) * t),
      });
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return size;
}

function PanoramaResize() {
  const [target, setTarget] = useState(SIZES[1]);
  const size = useAnimatedSize(target);

  return (
    <>
      <PanoDiv
        style={{
          position: 'relative',
          width: size.width,
          height: size.height,
          maxWidth: '100%',
          // 화면이 거리뷰보다 좁으면 넘치지 않고 잘리게 합니다.
          overflow: 'hidden',
        }}
      >
        {/* Container 크기가 바뀌어도 거리뷰에 반영되지 않아 size도 함께 변경합니다. */}
        <Panorama
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={{ pan: -135, tilt: 29, fov: 100 }}
          size={size}
        />
        {/* 크기가 바뀔 때 거리뷰 중심을 보는 십자선 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            height: '100%',
            borderRight: 'solid 1px red',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '100%',
            borderBottom: 'solid 1px red',
            pointerEvents: 'none',
            zIndex: 100,
          }}
        />
      </PanoDiv>
      <div style={{ marginTop: 5 }}>
        {SIZES.map((s) => (
          <input
            key={s.width}
            type="button"
            style={{ marginRight: 10 }}
            value={`${s.width} x ${s.height}`}
            onClick={() => setTarget(s)}
          />
        ))}
      </div>
    </>
  );
}

export default function PanoramaTutorial2ResizeExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaResize />
    </NavermapsProvider>
  );
}
