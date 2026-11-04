import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

function ControlPositioningMapContent() {
  const navermaps = useNavermaps();
  const { Position } = navermaps;

  return (
    <NaverMap
      mapTypeControl
      mapTypeControlOptions={{
        style: navermaps.MapTypeControlStyle.BUTTON,
        position: Position.TOP_RIGHT,
      }}
      zoomControl
      zoomControlOptions={{
        style: navermaps.ZoomControlStyle.SMALL,
        position: Position.TOP_RIGHT,
      }}
      scaleControl
      scaleControlOptions={{ position: Position.RIGHT_CENTER }}
      logoControl
      logoControlOptions={{ position: Position.TOP_LEFT }}
      mapDataControl
      mapDataControlOptions={{ position: Position.BOTTOM_LEFT }}
    />
  );
}

export default function ControlTutorial3PositioningExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <ControlPositioningMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
