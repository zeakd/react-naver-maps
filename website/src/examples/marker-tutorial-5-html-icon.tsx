import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';

// 공식 예제는 문서 사이트의 CSS 클래스(cs_mapbridge)로 스프라이트를 자릅니다.
// 여기서는 같은 스타일을 인라인으로 사용합니다.
function pinHtml(iconPosition: string, shadowPosition: string) {
  const sprite = `background:url(${IMG}/sp_mapbridge5.png) no-repeat;background-size:400px 450px;`;
  return [
    '<div style="position:absolute;width:20px;height:20px;">',
    `<span style="position:absolute;width:38px;height:58px;${sprite}background-position:${iconPosition};z-index:10;"></span>`,
    `<span style="position:absolute;top:24px;left:8px;width:38px;height:34px;${sprite}background-position:${shadowPosition};"></span>`,
    '</div>',
  ].join('');
}

const defaultIcon = {
  content: `<img src="${IMG}/pin_default.png" alt="" style="margin:0;padding:0;border:0;display:block;max-width:none;max-height:none;position:absolute;width:22px;height:35px;left:0;top:0;">`,
  size: { width: 22, height: 35 },
  anchor: { x: 11, y: 35 },
};

const greenIcon = {
  content: pinHtml('-160px -215px', '-50px -270px'),
  size: { width: 38, height: 58 },
  anchor: { x: 19, y: 58 },
};

const pinkIcon = {
  content: pinHtml('-220px -45px', '-220px -105px'),
  size: { width: 38, height: 58 },
  anchor: { x: 19, y: 58 },
};

function MarkerHtmlIconMapContent() {
  return (
    <NaverMap
      defaultBounds={{
        south: 37.3585229,
        west: 127.1010728,
        north: 37.3658036,
        east: 127.1222656,
      }}
    >
      <Marker
        position={{ lat: 37.3606904, lng: 127.1061625 }}
        icon={defaultIcon}
      />
      <Marker
        defaultPosition={{ lat: 37.3613962, lng: 127.1112487 }}
        title="Green"
        icon={greenIcon}
        draggable
      />
      <Marker
        defaultPosition={{ lat: 37.363777, lng: 127.1174332 }}
        title="Pink Hot"
        icon={pinkIcon}
        draggable
      />
    </NaverMap>
  );
}

export default function MarkerHtmlIconExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerHtmlIconMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
