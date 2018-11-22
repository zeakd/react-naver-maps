
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  GroundOverlay,
} = require('react-naver-maps')

function App({ navermaps }) {
  return (
    <NaverMap 
      mapDivId='maps-examples-ground-overlay'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultZoom={8}
      defaultCenter={new naver.maps.LatLng(36.634249797, 127.129160067)}
      mapTypeId={"normal"}
    >
      <GroundOverlay 
        bounds={new naver.maps.LatLngBounds(
          new naver.maps.LatLng(36.634249797, 127.129160067),
          new naver.maps.LatLng(36.734249797, 127.410516004)
        )}
        url={'https://navermaps.github.io/maps.js/docs/img/example/naver-satellite.png'}
        clickable={true} // click event를 다루기 위해서는 true로 설정되어야함.
        onClick={() => {
          alert('여기는 한라산 입니다.')
        }}
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