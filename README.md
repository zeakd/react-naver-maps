> 이 라이브러리는 지속적으로 작업이 진행중입니다. Readme 내용이 아직 부족하니 [examples](./examples)를 참고해주세요.

# react-naver-maps
Controlled React Component for Naver Maps to handle zoom, center, etc.

[website](https://zeakd.github.io/react-naver-maps)

## Getting Started

``` bash
npm install --save react-naver-maps react-loadable load-js
```

``` js
import React from 'react'
import ReactDOM from 'react-dom'

import {
  Map as NaverMap,
  withNavermaps, 
} from 'react-naver-maps'
import Loadable from 'react-loadable'
import loadJs from 'load-js'

const CLIENT_ID = YOUR_CLIENT_ID

class App extends React.Component {
  constructor (props) {
    super(props);

    const navermaps = window.naver.maps;

    this.state = {
      zoom: 12,
      center: new navermaps.LatLng(37.3595704, 127.105399)
    }
  }

  render () {
    return (
      <NaverMap
        style={{ width: "400px", height: "500px" }}

        zoom={this.state.zoom}
        onZoomChanged={(zoom) => { this.setState({ zoom })}}

        center={this.state.center}
        onCenterChanged={(center) => {this.setState({ center })}}
      />
    )
  }
}

// use react-loadable component 
const NaverMapsLoadable = Loadable({
  loader: () => loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${CLIENT_ID}`
  ).then(() => window.naver.maps),

  render(navermaps, props) {
    return <App {...props} />
  },
  
  loading(props) {
    if (props.error) {
      return <div>Error!</div>;
    } else if (props.pastDelay) {
      return <div>Loading...</div>;
    } else {
      return null;
    }
  }
})


ReactDOM.render(<NaverMapsLoadable />, document.getElementById('root'))

```

## Idea
[Naver maps v3](https://navermaps.github.io/maps.js/docs/)를 사용할 때 center, zoom 등 Map의 [KVO](https://navermaps.github.io/maps.js/docs/tutorial-3-KVO-Mechanism.html) key들을 자주 다루는 react 프로젝트의 경우 Map 객체가 [uncontrolled component](https://reactjs.org/docs/uncontrolled-components.html)이기 때문에 render된 Map의 화면을 예측하기 어렵고 naver고유의 이벤트들과 혼재되어 개발이 복잡해집니다. 이를 해결하기 위해 react-naver-maps는 naver의 모듈을 controlled component처럼 구현하여 props로 전달된 KVO key들과 이벤트 핸들러로 maps객체들의 동작을 예측 가능하게 만듭니다.

## Goal

Naver maps 모듈을 controlled component처럼 사용할 수 있도록 합니다.

- props를 통한 center, zoom 등의 kvo key의 단방향 흐름 제어
``` js
<Map 
  ...
  zoom={12}
  center={new window.naver.maps.LatLng(37.3595704, 127.105399)}
  ...
/>
```
- props를 통한 이벤트핸들러 제어 

``` js
//
// naver maps v3 방식
//

// listener를 추가할 때
map.addListener('zoom_changed', zoomListener);
// 혹은
window.naver.maps.Event.addListener(map, 'zoom_changed', zoomListener)

// listener를 제거할 때
map.removeListener(zoomListener);
// 혹은 
window.naver.maps.Event.removeListener(zoomListener)

//
// react-naver-maps 방식
// 

// camelCased된 props로 전달되어 add됩니다. 
<Map 
  ...
  onZoomChanged={zoomListener}
  ...
/>

// 간단히 props에서 제거합니다.
<Map 
  ...
  // onZoomChanged={zoomListener}
  ...
/>

```
- Children Component를 통한 Marker, Polygon등 Map 위의 ui들을 제어.

``` js
<Map 
  ...
>
  <Marker
    icon={...}
    ...
  />
</Map>
```

## Caveat
`react-naver-maps`는 naver maps module을 불러오는 코드를 포함 하지 않으며, 모든 컴포넌트들은 window.naver.maps 모듈이 없이 mount될 경우 에러가 발생합니다. [react-loadable](https://github.com/jamiebuilds/react-loadable) 등을 활용할 수 있습니다. 

``` js
import loadJs from 'load-js'

const MyApp = () => {
  ...
}

const NaverMapLoadable = Loadable({
  loader: () => loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${YOUR_NAVER_APP_CLIENT_ID}`
  ).then(() => window.naver.maps),

  render(navermaps, props) {
    return <MyApp {...props} />
  },
  
  loading(props) {
    if (props.error) {
      return <div>Error!</div>;
    } else if (props.pastDelay) {
      return <div>Loading...</div>;
    } else {
      return null;
    }
  }
})
```

## Currently Available Feature

- Component 공통
  - naverEventNames로 전달된 event들의 eventHandlers(camelCased. 각 Component의 default naverEventNames 참고)
  - naverInstanceRef를 통한 instance 접근
  
- \<Map />
  - center
  - zoom
  - size
  - children 
  - naverEventNames

- \<Panorama />
  - position
  - size
  - naverEventNames
  
- \<Marker />
  - [marker의 모든 options](https://navermaps.github.io/maps.js/docs/naver.maps.Marker.html#~MarkerOptions)
  - naverEventNames
  - children을 통한 htmlIcon render

## API

### KVO Component Common Interface

``` js
// Map, Panorama, Marker etc
<SomeKVO
  naverInstanceRef={(ref) => { 
    this.instance = ref && ref.instance // or ref.map, ref.marker, etc.
  }}
  naverEventNames={[...]}
/>
```

#### naverInstanceRef

react-naver-maps는 모듈들을 컴포넌트화 하여 props로 관리하는 목적을 가지고 있지만 세상만사 다 원하는 대로 되지는 않습니다. Map이나, Marker등의 컴포넌트를 조작할 때 naver kvo 인스턴스에 직접 접근하려면 `props.naverInstanceRef`를 활용하세요. kvo 인스턴스는 `ref.instance`에 담겨 있습니다. (또한 각 컴포넌트들은 ref.map, ref.marker등 alias도 가지고 있습니다.)

#### onCamelCasedEvent

react-naver-maps는 naver event들을 camelCased 된 이벤트핸들러로 관리합니다 (ex. zoom_changed -> props.onZoomChanged, rightclick -> props.onRightClick)

#### naverEventNames

naver고유의 event를 `onCamelCasedEvent` Props로 사용하기 위해 어떤 event들을 관리할 것인지를 명시합니다. naverEventNames로 전달된 naver event들만이 `onCamelCasedEvent` 이벤트 헨들러로 관리됩니다. 

``` js
<Map 
  ...
  naverEventNames={['zoom_changed', 'center_changed']}

  onZoomChanged={this.zoomHandler} // works
  onCenterChanged={this.centerHandler} // works
  onBoundsChanged={this.boundHandler} // ignored
/>
```

각 컴포넌트들의 default naverEventNames는 Docs를 참고하세요. 퍼포먼스 향상을 위해 사용하는 naverEventNames들만을 전달하는 것도 좋은 방법입니다.


### \<Map />

``` js
<Map 
  zoom={14}
  center={new navermaps.Center}
  
  // commons default
  naverEventNames={[
    'addLayer',
    'click',
    'dblclick',
    'doubletap',
    'drag',
    'dragend',
    'dragstart',
    'idle',
    'keydown',
    'keyup',
    'longtap',
    'mousedown',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'panning',
    'pinch',
    'pinchend',
    'pinchstart',
    'removeLayer',
    'resize',
    'rightclick',
    'tap',
    'tilesloaded',
    'touchend',
    'touchmove',
    'touchstart',
    'twofingertap',
    'zooming',
    'mapType_changed',
    'mapTypeId_changed',
    'size_changed',
    'bounds_changed',
    'center_changed',
    'centerPoint_changed',
    'projection_changed',
    'zoom_changed',
  ]}
  naverInstanceRef={(ref) => { 
    this.map = ref && ref.map 
  }}
/>

```

**props**

- [MapOptions](https://navermaps.github.io/maps.js/docs/naver.maps.html#.MapOptions) 

- `zoom`
- `center`

    

### \<Marker />

[naver.maps.Marker](https://navermaps.github.io/maps.js/docs/naver.maps.Marker.html)의 React Component입니다. Map Component의 Chilren으로 사용할 수 있습니다. 

``` js
<Marker 
  {...markerOptions}

  //
  // commons
  //
  naverEventNames={[
    'clickable_changed',
    'cursor_changed',
    'draggable_changed',
    'icon_changed',
    'position_changed',
    'shape_changed',
    'title_changed',
    'visible_changed',
    'zIndex_changed',
    'mousedown', 
    'mouseup', 
    'click', 
    'dblclick', 
    'rightclick', 
    'mouseover', 
    'mouseout', 
    'mousemove',
    'dragstart', 
    'drag', 
    'dragend',
    'touchstart', 
    'touchmove', 
    'touchend', 
    'pinchstart', 
    'pinch', 
    'pinchend', 
    'tap', 
    'longtap', 
    'twofingertap', 
    'doubletap'
  ]} // default
  naverInstanceRef={(ref) => { 
    this.marker = ref && ref.marker 
  }}
/>
```

#### props

- [MarkerOptions](https://navermaps.github.io/maps.js/docs/naver.maps.Marker.html#~MarkerOptions)의 모든 properties

- [KVO 이벤트 핸들러](.)

- children

편의를 위해 props.children으로 htmlIcon을 생성하는 방식을 제공합니다. 

```js
import { Marker } from 'react-naver-maps'

function MarkerContent({ color }) {
  return (
    <div style={{ color }}>
      x
    </div>
  )
}

...
<Marker>
  <MarkerContent
    color='red'
    size={new navermaps.Size(80, 30)}
  />
</Marker>
```

Marker의 children은 유일해야하며, [ReactDOMServer.renderToStaticMarkup](https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup)으로 render되어 [htmlIcon](https://navermaps.github.io/maps.js/docs/naver.maps.Marker.html#~HtmlIcon)의 content가 됩니다.

또한 size와 anchor는 props로 전달 할 수 있습니다.

### \<Panorama />

``` jsx
<Panorama 
  position={}
  
  // commons default
  naverEventNames={[
    'init',
    'pano_changed',
    'pano_status',
    'pov_changed',
  ]}
  naverInstanceRef={(ref) => { 
    this.pano = ref && ref.pano
  }}
/>
```

**props**

### withNavermaps(options) : hocs

``` js
import { withNavermaps } from 'react-naver-maps'

const App = (props) => {
  const navermaps = props.navermaps;

  ... 
}

const AppWithNavermaps = withNavermaps()(App);

...

```

inject 

## TODO
- [ ] Panorama의 kvo 
- [ ] hocs 사용법
- [x] examples
- [x] docs
 
## Contribute

이 슈 환 영

피 알 환 영

  
  
