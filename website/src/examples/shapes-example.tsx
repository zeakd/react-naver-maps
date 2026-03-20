import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  Polygon,
  Polyline,
  useNavermaps,
} from 'react-naver-maps';

const rectBounds = {
  south: 37.56,
  west: 126.97,
  north: 37.57,
  east: 126.98,
};

const polygonPaths = [
  [
    { lat: 37.57, lng: 126.975 },
    { lat: 37.575, lng: 126.985 },
    { lat: 37.565, lng: 126.985 },
  ],
];

const polylinePath = [
  { lat: 37.555, lng: 126.97 },
  { lat: 37.56, lng: 126.975 },
  { lat: 37.555, lng: 126.98 },
  { lat: 37.56, lng: 126.985 },
];

function ShapesMapContent() {
  const navermaps = useNavermaps();

  return (
    <NaverMap
      defaultCenter={new navermaps.LatLng(37.565, 126.98)}
      defaultZoom={13}
    >
      <Rectangle
        bounds={rectBounds}
        strokeColor="#FF0000"
        strokeWeight={2}
        fillColor="#FF0000"
        fillOpacity={0.15}
      />
      <Polygon
        paths={polygonPaths}
        strokeColor="#00AA00"
        strokeWeight={2}
        fillColor="#00FF00"
        fillOpacity={0.15}
      />
      <Polyline path={polylinePath} strokeColor="#0000FF" strokeWeight={3} />
    </NaverMap>
  );
}

function ShapesMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <ShapesMapContent />
    </MapDiv>
  );
}

export default function ShapesExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <ShapesMap />
    </NavermapsProvider>
  );
}
