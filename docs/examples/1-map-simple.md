
``` js 

const { 
  RenderAfterNavermapsLoaded, 
  Map: NaverMap,
} = require('react-naver-maps')

class App extends React.Component {
  render () {
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
}

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```