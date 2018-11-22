
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  Ellipse,
} = require('react-naver-maps')

const min = {x: 126.5315, y: 33.3572421};
const max = {x: 126.537, y: 33.3608829};
const bounds = {
  north: max.y,
  east: max.x,
  south: min.y,
  west: min.x
};

function App() {
  return (
    <NaverMap 
      mapDivId='maps-examples-ellipse'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={{ 
        x: (min.x + max.x) / 2,
        y: (min.y + max.y) / 2,
      }}
    >
      <Ellipse 
        bounds={bounds}
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