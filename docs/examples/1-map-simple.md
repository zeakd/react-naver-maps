
``` js 

const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
} = require('react-naver-maps')

function App() {
  return (
    <NaverMap 
      mapDivId='maps-examples-map-simple'
      style={{
        width: '100%',
        height: '600px',
      }}
    />
  )
}

// render
<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```