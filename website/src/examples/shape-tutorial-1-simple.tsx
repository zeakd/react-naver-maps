import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  Circle,
  Ellipse,
} from 'react-naver-maps';

const GREEN_FACTORY = { lat: 37.3595953, lng: 127.1053971 };

function ShapeSimpleMapContent() {
  return (
    <NaverMap defaultCenter={GREEN_FACTORY} defaultZoom={8}>
      <Rectangle
        bounds={{
          south: 37.1793196,
          west: 125.8795594,
          north: 37.5398662,
          east: 126.3312422,
        }}
      />
      <Circle
        center={GREEN_FACTORY}
        radius={20000}
        fillColor="crimson"
        fillOpacity={0.8}
      />
      <Ellipse
        bounds={{
          south: 37.1793196,
          west: 127.6795594,
          north: 37.5398662,
          east: 128.4312422,
        }}
        strokeColor="yellowgreen"
        strokeOpacity={1}
        strokeWeight={3}
        fillColor="yellowgreen"
        fillOpacity={0.3}
      />
    </NaverMap>
  );
}

export default function ShapeSimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <ShapeSimpleMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
