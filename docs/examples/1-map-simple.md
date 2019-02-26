
``` js 

import { RenderAfterNavermapsLoaded, NaverMap } from 'react-naver-maps'

function App() {
  return (
    <NaverMap 
      id='maps-examples-map-simple'
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