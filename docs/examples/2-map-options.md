
``` js 

import { RenderAfterNavermapsLoaded, NaverMap } from 'react-naver-maps'

class App extends React.Component {
  constructor (props) {
    super(props)

    const navermaps = window.naver.maps;

    this.state = {
      // defaults
      zoomControl: true, //줌 컨트롤의 표시 여부
      zoomControlOptions: { //줌 컨트롤의 옵션
          position: navermaps.Position.TOP_RIGHT
      },

      // min max zoom
      minZoom: 1,
      maxZoom: 14,

      // interaction
      draggable: true,
      pinchZoom: true,
      scrollWheel: true,
      keyboardShortcuts: true,
      disableDoubleTapZoom: false,
      disableDoubleClickZoom: false,
      disableTwoFingerTapZoom: false,

      // kinetic
      disableKineticPan: true,

      // tile transition
      tileTransition: true,

      // controls
      scaleControl: true,
      logoControl: true,
      mapDataControl: true,
      zoomControl: true,
      mapTypeControl: true,
    }

    this.toggleInteraction = this.toggleInteraction.bind(this)
    this.toggleKinetic = this.toggleKinetic.bind(this)
    this.toggleTileTransition = this.toggleTileTransition.bind(this)
    this.toggleControl = this.toggleControl.bind(this)
    this.toggleMinMaxZoom = this.toggleMinMaxZoom.bind(this)
  }

  toggleInteraction() {
    if (this.state.draggable) {
      this.setState({
        draggable: false,
        pinchZoom: false,
        scrollWheel: false,
        keyboardShortcuts: false,
        disableDoubleTapZoom: true,
        disableDoubleClickZoom: true,
        disableTwoFingerTapZoom: true,
      })
    } else {
      this.setState({
        draggable: true,
        pinchZoom: true,
        scrollWheel: true,
        keyboardShortcuts: true,
        disableDoubleTapZoom: false,
        disableDoubleClickZoom: false,
        disableTwoFingerTapZoom: false,
      })
    }
  }

  toggleKinetic() {
    this.setState({
      disableKineticPan: !this.state.disableKineticPan,
    })
  }

  toggleTileTransition() {
    this.setState({
      tileTransition: !this.state.tileTransition,
    })
  }

  toggleControl() {
    if (this.state.scaleControl) {
      this.setState({
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false,
        mapTypeControl: false
      })
    } else {
      this.setState({
        scaleControl: true,
        logoControl: true,
        mapDataControl: true,
        zoomControl: true,
        mapTypeControl: true
      })
    }
  }

  toggleMinMaxZoom() {
    if (this.state.minZoom === 10) {
      this.setState({
        minZoom: 1,
        maxZoom: 14,
      })
    } else {
      this.setState({
        minZoom: 10,
        maxZoom: 12,
      })
    }
  }

  render () {
    const navermaps = window.naver.maps;

    return (
      <NaverMap 
        id='maps-examples-map-options'
        style={{
          width: '100%',
          height: '600px',
        }}
        defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)} //지도의 초기 중심 좌표
        defaultZoom={8} //지도의 초기 줌 레벨
        {...this.state}
      >
        <Buttons>
          <ControlBtn 
            controlOn={this.state.draggable}
            onClick={this.toggleInteraction}
          >지도 인터렉션</ControlBtn>
          <ControlBtn 
            controlOn={!this.state.disableKineticPan}
            onClick={this.toggleKinetic}
          >관성 드래깅</ControlBtn>
          <ControlBtn 
            controlOn={this.state.tileTransition}
            onClick={this.toggleTileTransition}
          >타일 fadeIn 효과</ControlBtn>
          <ControlBtn 
            controlOn={this.state.scaleControl}
            onClick={this.toggleControl}
          >모든 지도 컨트롤</ControlBtn>
          <ControlBtn
            onClick={this.toggleMinMaxZoom}
          >
            {'최소/최대 줌 레벨' + (this.state.minZoom === 10 ? ': 10 ~ 12' : ': 1 ~ 14')}
          </ControlBtn>
        </Buttons>
      </NaverMap>
    )
  }
}

// render
<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```