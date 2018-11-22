
### 0.

시작에 앞서 어플리케이션 등록이 필요합니다. 이미 `클라이언트 아이디`가 있다면 이 부분은 넘어가셔도 됩니다.
2018년 11월 13일 부로 네이버 신규 어플리케이션 등록은 [네이버 클라우드 플랫폼](https://www.ncloud.com/)에서 가능합니다. 자세한 내용은 [네이버 클라우드 플랫폼 Maps API](https://navermaps.github.io/maps.js.ncp/index.html)를 참고하세요. 기존 [네이버 개발자 센터](https://developers.naver.com/) 클라이언트 아이디는 2019년 4월 19일 까지 사용가능합니다.

- [Naver Maps Enterprise API 공지사항](https://developers.naver.com/notice/article/10000000000030663434)
- [Naver Cloud Platform 클라이언트 아이디 발급](https://navermaps.github.io/maps.js.ncp/tutorial-1-Getting-Client-ID.html)

### 1. 

React Naver Maps를 사용하기전 먼저 Naver Maps 스크립트를 불러와야하며 크게 두가지 방법이 있습니다. 먼저 html에 직접 추가하는 방법은 아래와 같습니다. 

``` html static
...
<script 
  type="text/javascript" 
  src="https://openapi.map.naver.com/openapi/v3/maps.js?clientId=YOUR_CLIENT_ID">
</script>
<script ...>
```

이는 반드시 React 코드 전에 추가되어야합니다. 코드 작성이 편하다는 장점과 항상 React App 전에 로드되므로 페이지로딩이 느리다는 단점이 있습니다. 

두번째로 navermaps를 비동기적으로 불러와 map을 사용하는 곳에서만 요청하는 방법이 있습니다. React Naver Maps는 간단한 유틸 컴포넌트를 제공합니다. [\<RenderAfterNavermapsLoaded /\>](http://localhost:6060/#/Utils?id=renderafternavermapsloaded)는 마운트될 때 `naver maps`모듈을 비동기적으로 요청합니다.

``` js
<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID} // required
  error={<p>Maps Load Error</p>}
  loading={<p>Maps Loading...</p>}
>
  <p>Navermaps Loaded!</p>
</RenderAfterNavermapsLoaded>

```

### 2. 

`<Map />`의 className, id, style를 이용해 width, height을 정의합니다. 
**defaultCenter**, **defaultZoom** 등 **defaultKVOKEY** props를 이용해 uncontrolled component로 사용할 수 있습니다.

``` js
<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <NaverMap 
    mapDivId={'maps-getting-started-uncontrolled'} // default: react-naver-map
    style={{
      width: '100%',
      height: '400px',
    }}
    defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
    defaultZoom={10}
  />
</RenderAfterNavermapsLoaded>
```

panning등을 fully controlled component처럼 사용할 수 있습니다. 이경우 **defaultKVOKey**는 사용하지않습니다.


``` js
class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      center: { lat: 37.3595704, lng: 127.105399 }
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
          mapDivId='maps-getting-started-controlled' 
          style={{width: '100%', height: '400px'}}
          
          // uncontrolled zoom
          defaultZoom={10}

          // controlled center
          // Not defaultCenter={this.state.center}
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


