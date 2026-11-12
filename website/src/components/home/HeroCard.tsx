// 홈 첫 화면의 지도 카드. 지도 ↔ 코드를 오가고, 지도를 누르면 그 일을 한 코드 줄을 아래 띠와 코드 화면에 표시한다.
// 코드는 Astro 가 빌드 때 그린 HTML(children)이고, 이 컴포넌트는 줄에 표시만 붙인다.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NavermapsProvider } from 'react-naver-maps';
import { WalkMap } from './WalkMap';

type Lines = { select: number[]; toggle: number[] };

export default function HeroCard({
  children,
  lines,
  lineCount,
}: {
  children: ReactNode;
  lines: Lines;
  lineCount: number;
}) {
  const [view, setView] = useState<'map' | 'code'>('map');
  const [hl, setHl] = useState<number[]>([]);
  const [tick, setTick] = useState<string | null>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = codeRef.current;
    if (!box) return;
    const rows = box.querySelectorAll('.line');
    rows.forEach((l, i) => l.classList.toggle('hl', hl.includes(i + 1)));
    const first = rows[hl[0] - 1] as HTMLElement | undefined;
    if (first && view === 'code')
      box.scrollTo({ top: first.offsetTop - 72, behavior: 'smooth' });
  }, [hl, view]);

  function onDemoClick(e: React.MouseEvent) {
    const b = (e.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.classList.contains('walk-toggle')) {
      setHl(lines.toggle);
      setTick(`<Activity mode={visible ? 'visible' : 'hidden'}>`);
    } else {
      setHl(lines.select);
      setTick(`select('${b.textContent}')  →  setSelected · panTo`);
    }
  }
  const range = (ls: number[]) => (ls.length ? `${ls[0]}줄` : '');

  return (
    <div className="hero-card">
      <div className="hero-card-bar">
        <span className="hero-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="hero-seg" role="tablist" aria-label="보기">
          <button
            role="tab"
            aria-selected={view === 'map'}
            onClick={() => setView('map')}
          >
            지도
          </button>
          <button
            role="tab"
            aria-selected={view === 'code'}
            onClick={() => setView('code')}
          >
            코드
          </button>
        </div>
        <span className="hero-file">WalkMap.tsx · {lineCount}줄</span>
      </div>
      <div className="hero-card-body">
        <div className="hero-map" onClick={onDemoClick} hidden={view !== 'map'}>
          <NavermapsProvider ncpKeyId="aluya4ff04">
            <WalkMap height={0} />
          </NavermapsProvider>
        </div>
        <div className="hero-code" ref={codeRef} hidden={view !== 'code'}>
          {children}
        </div>
      </div>
      <button
        type="button"
        className="hero-tick"
        onClick={() => setView(view === 'map' ? 'code' : 'map')}
      >
        {tick ? <code>{tick}</code> : <em>장소나 마커를 눌러 보세요</em>}
        <span>
          {tick ? `${range(hl)} · ` : ''}
          {view === 'map' ? '코드 보기' : '지도 보기'}
        </span>
      </button>
    </div>
  );
}
