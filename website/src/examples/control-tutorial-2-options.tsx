import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

function ControlOptionsMapContent() {
  const navermaps = useNavermaps();

  return (
    <NaverMap
      zoomControl
      zoomControlOptions={{
        style: navermaps.ZoomControlStyle.SMALL,
        position: navermaps.Position.TOP_RIGHT,
      }}
    />
  );
}

export default function ControlTutorial2OptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <ControlOptionsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
