
https://navermaps.github.io/maps.js/docs/tutorial-4-map-bounds.example.html

``` js 

const { 
  RenderAfterNavermapsLoaded, 
  Map: NaverMap,
} = require('react-naver-maps')

class App extends React.Component {
  render () {
    return (
      <NaverMap 
        mapDivId='maps-examples-map-bounds'
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