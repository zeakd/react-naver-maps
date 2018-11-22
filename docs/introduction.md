
[react-naver-maps](https://github.com/zeakd/react-naver-maps)는 [NAVER 지도 API v3](https://navermaps.github.io/maps.js/docs/index.html)의 React Component입니다. 최대한 **naver maps** 의 기본동작을 유지하되, 편의를 위해 React에 맞춰 몇가지 기능을 제공합니다.

### Event Handler 제어

`onCamelCasedEvent`로 event handling이 가능합니다.

``` js static 
//
// Naver Maps v3 방식
//

// listener를 추가할 때
map.addListener('zoom_changed', zoomListener); // 또는 
window.naver.maps.Event.addListener(map, 'zoom_changed', zoomListener)

// listener를 제거할 때
map.removeListener(zoomListener); // 또는
window.naver.maps.Event.removeListener(zoomListener)

//
// React Naver Maps 방식
// 

// camelCased된 props로 전달됩니다.
<NaverMap 
  onZoomChanged={zoomListener}
/>

// 간단히 props에서 제거합니다.
<NaverMap 
  // onZoomChanged={zoomListener}
/>

```

### children components 전달

Marker, Polygon 등의 UI Component를 children으로 전달합니다.

``` jsx static
<NaverMap>
  <Marker
    position={{ lat: 37.3595704, lng: 127.105399 }}
  />
</NaverMap>
```
 
### Controlled Component

KVO Key를 이용한 단방향 흐름제어

``` js static
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      center: {
        lat: 37.5666103,
        lng: 126.9783882,
      }
    }

    this.panToNaver = this.panToNaver.bind(this);
  }

  panToNaver() {
    this.setState({ center: { lat: 37.3595704, lng: 127.105399 }})
  }

  render() {
    return (
      <div>
        <button onClick={this.panToNaver}>Pan To Naver</button>
        <p>lat: {this.state.center.y || this.state.center.lat}</p>
        <p>lng: {this.state.center.x || this.state.center.lng}</p>
        <NaverMap 
          id="react-naver-maps-introduction"
          style={{width: '100%', height: '400px'}}

          center={this.state.center}
          onCenterChanged={center => this.setState({ center })}
        />
      </div>
    )
  }
}

<RenderAfterNavermapsLoaded clientId={YOUR_CLIENT_ID}>
  <App />
</RenderAfterNavermapsLoaded>
```

## Install

``` bash
npm install react-naver-maps@next
# or 
yarn add react-naver-maps@next
```