
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  Polygon,
} = require('react-naver-maps')

function App({ navermaps }) {
  return (
    <NaverMap 
      mapDivId='maps-examples-polygon'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={new naver.maps.LatLng(37.3674001, 127.1181196)}
      defaultZoom={9}
    >
      <Polygon 
        paths={[
          [
            new naver.maps.LatLng(37.37544345085402, 127.11224555969238),
            new naver.maps.LatLng(37.37230584065902, 127.10791110992432),
            new naver.maps.LatLng(37.35975408751081, 127.10795402526855),
            new naver.maps.LatLng(37.359924641705476, 127.11576461791992),
            new naver.maps.LatLng(37.35931064479073, 127.12211608886719),
            new naver.maps.LatLng(37.36043630196386, 127.12293148040771),
            new naver.maps.LatLng(37.36354029942161, 127.12310314178465),
            new naver.maps.LatLng(37.365211629488016, 127.12456226348876),
            new naver.maps.LatLng(37.37544345085402, 127.11224555969238)
          ]
        ]}
        fillColor={'#ff0000'}
        fillOpacity={0.3}
        strokeColor={'#ff0000'}
        strokeOpacity={0.6}
        strokeWeight={3}
      />
    </NaverMap>
  )
}

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```