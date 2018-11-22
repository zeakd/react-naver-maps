
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  Polyline,
} = require('react-naver-maps')

function App({ navermaps }) {
  return (
    <NaverMap 
      mapDivId='maps-examples-polyline'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={new naver.maps.LatLng(37.3646656, 127.108828)}
      defaultZoom={10}
    >
      <Polyline 
        path={[
          new naver.maps.LatLng(37.365620929135716, 127.1036195755005),
          new naver.maps.LatLng(37.365620929135716, 127.11353302001953),
          new naver.maps.LatLng(37.3606921307849, 127.10452079772949),
          new naver.maps.LatLng(37.36821310838941, 127.10814714431763),
          new naver.maps.LatLng(37.360760351656545, 127.11299657821654),
          new naver.maps.LatLng(37.365620929135716, 127.1036195755005)
        ]}
        // clickable // 사용자 인터랙션을 받기 위해 clickable을 true로 설정합니다.
        strokeColor={'#5347AA'}
        strokeStyle={'longdash'}
        strokeOpacity={0.5}
        strokeWeight={5}        
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