
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  Map: NaverMap,
  Circle,
} = require('react-naver-maps')

function App() {
  return (
    <NaverMap 
      mapDivId='maps-examples-circle'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={{x: 126.5343612, y: 33.3590625}}
    >
      <Circle 
        center={{x: 126.5343612, y: 33.3590625}}
        radius={100}
        fillOpacity={0.5}
        fillColor={'#FF0000'}
        strokeColor={'red'}
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