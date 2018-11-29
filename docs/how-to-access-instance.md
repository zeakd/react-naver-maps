세상 만사 원하는대로 되지 않기 때문에 때때로 직접 Naver Maps 인스턴스에 접근해야할 수 있습니다. 이경우 **naverRef** props를 사용해 **ref.instance** 에 접근합니다.

``` js static
<NaverMap 
  naverRef={ref => { this.mapRef = ref }} 
  ...
/>

// this.mapRef.instance === new Navermaps.Map(...)

```

map의 getBounds에 직접 접근하는 예시입니다.

``` js
const { NaverMap } = require('react-naver-maps');

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {};
  }
  render() {
    return (
      <div>
        <span>initial bounds</span>
        {this.state.initBounds && <p>
          {this.state.initBounds._sw.y}, 
          {this.state.initBounds._sw.x}, 
          {this.state.initBounds._ne.y}, 
          {this.state.initBounds._ne.x}
        </p>}
        <NaverMap 
          id="maps-access-instance"
          style={{
            width: '100%',
            height: '400px',
          }}
          naverRef={ref => { this.naverMapRef = ref }}
        />
      </div>
    )
  }

  componentDidMount() {
    this.setState({ initBounds: this.naverMapRef.instance.getBounds() })
  }
}

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```

그러나 위 에시를 포함해 대부분의 경우 instance에 직접 접근할 필요는 없을 수 있습니다. **NaverMap** 은 이미 [Naver Maps Map Method](https://navermaps.github.io/maps.js/docs/naver.maps.Map.html#toc4__anchor)를 컴포넌트 단에서 구현해 두었기 때문에 위 예시는 간단히 다음과 같이 바꿀 수 있습니다. 

``` js static
  componentDidMount() {
    // this.setState({ initBounds: this.naverMapRef.instance.getBounds() })
    this.setState({ initBounds: this.naverMapRef.getBounds() })
  }
```

따라서 instance에 접근은 안전을 위해 꼭 필요한 경우에만 해주세요.
사용할 수 있는 React Component Method는 [<NaverMap /\> 문서](#/UI%20Components?id=navermap)를 참고해주세요. 