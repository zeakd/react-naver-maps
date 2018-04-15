> 이 라이브러리는 지속적으로 작업이 진행중입니다. 

# react-naver-maps
Controlled React Component for Naver Maps to handle zoom, center, etc.

## examples

``` js
import React from 'react'
import ReactDOM from 'react-dom'
import {
  Map as NaverMap
} from 'react-naver-maps'

class App extends React.Component {
  state = {
    zoom: 12,
    center: new navermaps.LatLng()
  }

  render () {
    return (
      <NaverMap
        zoom={this.state.zoom}
        onZoomChanged={(zoom) => { this.setState({ zoom })}}

        center={this.state.center}
        onCenterChanged={(center) => {this.setState({ center })}}
      />
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))

```

## Idea
Naver maps를 사용할 때 center, zoom 등 Map의 KVO key들을 자주 다루는 react 프로젝트의 경우 Map 객체가 uncontrolled component이기 때문에 render된 Map의 화면을 예측하기 어렵고 naver고유의 이벤트들과 혼재되어 개발이 복잡해집니다. 이를 해결하기 위해 react-naver-maps는 naver의 모듈을 controlled component처럼 구현하여 props로 전달된 KVO key들과 이벤트 핸들러로 maps객체들의 동작을 예측 가능하게 만듭니다.

## Goal
- Naver maps 모듈을 controlled component처럼 사용할 수 있도록 합니다. 즉, props와 event handler (ex. onZoomChanged)를 통한 center, zoom 등의 kvo key의 단방향 흐름 제어를 목적으로 합니다. 
- Marker, Polygon등 Map 위의 ui들을 Children Component로 다룰 수 있도록 합니다.

## Caveat
`react-naver-maps`는 naver maps module을 불러오는 코드를 포함 하지 않으며, 모든 컴포넌트들은 window.naver.maps 모듈이 없이 mount될 경우 에러가 발생합니다. [react-loadable](https://github.com/jamiebuilds/react-loadable) 등을 활용할 수 있습니다. 

``` js
const loadJs = require('load-js')

const MyApp = () => {
  return <Map center={window.naver.maps.LatLng(37.3595704, 127.105399)} /> 
}

const NaverMapLoadable = Loadable({
  loader: () => loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${CLIENT_ID}`
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

## API

### \<Map />

``` js
<Map 
  zoom={14}
  center={new navermaps.Center}
  
>

```

**props**

- [MapOptions](https://navermaps.github.io/maps.js/docs/naver.maps.html#.MapOptions) 

- `zoom`
- `center`

### Marker

[naver.maps.Marker](https://navermaps.github.io/maps.js/docs/naver.maps.Marker.html)의 React Component입니다. Map Component의 Chilren으로 사용할 수 있습니다. 

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

#### Panorama

#####props

## TODO
- [ ] Map의 kvo
- [ ] Panorama의 kvo 
- [ ] hocs 사용법
- [ ] example
- [ ] docs
 
## Contribute
이 슈 환 영

피 알 환 영

## FAQ

####  왜 Readme를 한국어로 작성하였나요?

naver.maps 문서가 한국어 문서만 지원하기 때문입니다. 영어를 잘 못하기도 하고요.
  
  
