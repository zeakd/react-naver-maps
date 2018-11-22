
``` js 
const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
  Rectagle,
} = require('react-naver-maps')

const min = {x: 126.5322317, y: 33.3572421};
const max = {x: 126.5364907, y: 33.3608829};
const bounds = {
  north: max.y,
  east: max.x,
  south: min.y,
  west: min.x
};

function App() {
  return (
    <NaverMap 
      id='maps-examples-rectangle'
      style={{
        width: '100%',
        height: '400px',
      }}
      defaultCenter={{ 
        x: (min.x + max.x) / 2,
        y: (min.y + max.y) / 2,
      }}
    >
      <Rectangle 
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