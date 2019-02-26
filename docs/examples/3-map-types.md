
https://navermaps.github.io/maps.js/docs/tutorial-3-map-types.example.html

``` js 

import { RenderAfterNavermapsLoaded, NaverMap } from 'react-naver-maps'
import { withNavermaps } from 'react-naver-maps/hocs'

class App extends React.Component {
  constructor(props) {
    super(props)

    const { navermaps }= this.props;

    this.state = {
      mapTypeId: navermaps.MapTypeId['NORMAL'],
    }

    this.changeMapType = this.changeMapType.bind(this)
  }

  changeMapType(mapTypeId) {
    const { navermaps } = this.props;

    return () => {
      this.setState({
        mapTypeId: navermaps.MapTypeId[mapTypeId],
      })
    }
  }

  render () {
    const { navermaps } = this.props;

    return (
      <NaverMap 
        id='maps-examples-map-types'
        style={{
          width: '100%',
          height: '600px',
        }}
        defaultCenter={new naver.maps.LatLng(37.3595704, 127.105399)}
        defaultZoom={10}
        mapTypeId={this.state.mapTypeId}
      >
        <Buttons>
          <ControlBtn 
            controlOn={this.state.mapTypeId === navermaps.MapTypeId['NORMAL']} 
            onClick={this.changeMapType('NORMAL')}
          >일반지도</ControlBtn>
          <ControlBtn 
            controlOn={this.state.mapTypeId === navermaps.MapTypeId['TERRAIN']} 
            onClick={this.changeMapType('TERRAIN')}
          >지형도</ControlBtn>
          <ControlBtn 
            controlOn={this.state.mapTypeId === navermaps.MapTypeId['SATELLITE']} 
            onClick={this.changeMapType('SATELLITE')}
          >위성지도</ControlBtn>
          <ControlBtn 
            controlOn={this.state.mapTypeId === navermaps.MapTypeId['HYBRID']} 
            onClick={this.changeMapType('HYBRID')}
          >겹쳐보기</ControlBtn>
        </Buttons>
      </NaverMap>
    )
  }
}

const EnhancedApp = withNavermaps(App);


<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <EnhancedApp />
</RenderAfterNavermapsLoaded>
```