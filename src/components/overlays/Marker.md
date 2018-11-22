
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  Marker,
} = require('react-naver-maps')

function App() {
  const navermaps = window.naver.maps; // 혹은 withNavermaps hoc을 사용

  return (
    <NaverMap 
      id='maps-examples-marker'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
      defaultZoom={10}
    >
      <Marker 
        position={new navermaps.LatLng(37.3595704, 127.105399)}
        animation={navermaps.Animation.BOUNCE}
        onClick={() => {
          alert('여기는 네이버 입니다.')
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