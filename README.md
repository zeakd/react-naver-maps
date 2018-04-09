> 현재 이 라이브러리는 작업중입니다. Map의 zoom, center, Marker가 간략히 구현되어 있습니다.

# react-naver-maps
Controlled React Component for Naver Maps to handle zoom, center, etc.

# Idea
Naver maps를 사용할 때 center, zoom 등 Map의 KVO key들을 자주 다루는 react 프로젝트의 경우 Map 객체가 uncontrolled component이기 때문에 render된 Map의 화면을 예측하기 어렵고 naver고유의 이벤트들과 혼재되어 개발이 복잡해집니다. 이를 해결하기 위해 react-naver-maps는 naver의 모듈을 controlled component처럼 구현하여 props로 전달된 KVO key들과 이벤트 핸들러로 maps객체들의 동작을 예측 가능하게 만듭니다.


``` js
import {
  Map as NaverMap
} from 'react-naver-maps'

...
<NaverMap
  zoom={this.state.zoom}
  onZoomChanged={(zoom) => { this.setState({ zoom })}}
/>
...

```

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

### Map

** props **
- `zoom`
- `center`

#### Marker

** props **

### Panorama

## TODO

## Contribute
이 슈 환 영
피 알 환 영

