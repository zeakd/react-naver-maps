import { useRef, useState } from 'react';
import { NavermapsProvider, Container as PanoDiv } from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

type Info = Record<string, string | number | undefined>;

const buttonStyle = (on: boolean): React.CSSProperties => ({
  marginRight: 6,
  padding: '2px 10px',
  cursor: 'pointer',
  background: on ? '#2780E3' : '#fff',
  color: on ? '#fff' : '#555',
  border: 'solid 1px #333',
  borderRadius: 4,
});

function PanoramaEvents() {
  const panoRef = useRef<naver.maps.Panorama>(null);
  const [info, setInfo] = useState<Info>({});

  // 이벤트가 올 때마다 거리뷰에서 읽은 값을 표에 보인다.
  const readLocation = (p: naver.maps.Panorama) => {
    const location = p.getLocation();
    setInfo((prev) => ({
      ...prev,
      'Pano ID': p.getPanoId(),
      Title: location.title,
      Address: location.address,
      Photodate: location.photodate,
    }));
  };
  const readPov = (p: naver.maps.Panorama) => {
    const pov = p.getPov();
    setInfo((prev) => ({
      ...prev,
      'POV Pan': pov.pan,
      'POV Tilt': pov.tilt,
      'POV Fov': pov.fov,
      Zoom: p.getZoom(),
      'Min Zoom': p.getMinZoom(),
      'Max Zoom': p.getMaxZoom(),
      Scale: p.getScale(),
      'Min Scale': p.getMinScale(),
      'Max Scale': p.getMaxScale(),
    }));
  };

  const pano = panoRef.current;
  const canZoomIn = pano ? pano.getScale() !== pano.getMaxScale() : true;
  const canZoomOut = pano ? pano.getScale() !== pano.getMinScale() : true;

  return (
    <>
      <PanoDiv style={{ width: '100%', height: '500px' }}>
        <Panorama
          ref={panoRef}
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={{ pan: -135, tilt: 29, fov: 100 }}
          minScale={0}
          maxScale={5}
          onPanoChanged={() => panoRef.current && readLocation(panoRef.current)}
          onPovChanged={() => panoRef.current && readPov(panoRef.current)}
          onPanoStatus={(status) =>
            setInfo((prev) => ({
              ...prev,
              'Pano Status': `${status}, ${panoRef.current?.getPanoId() ?? ''}`,
            }))
          }
        />
      </PanoDiv>
      <div style={{ margin: '8px 0' }}>
        <button
          style={buttonStyle(canZoomIn)}
          onClick={() => panoRef.current?.zoomIn()}
        >
          zoomIn
        </button>
        <button
          style={buttonStyle(canZoomOut)}
          onClick={() => panoRef.current?.zoomOut()}
        >
          zoomOut
        </button>
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {Object.entries(info).map(([name, value]) => (
            <tr key={name}>
              <th style={{ textAlign: 'left', padding: '2px 12px 2px 0' }}>
                {name}
              </th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default function PanoramaTutorial3EventExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaEvents />
    </NavermapsProvider>
  );
}
