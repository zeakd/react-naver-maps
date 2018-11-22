세상 만사 원하는대로 되지 않기 때문에 때때로 직접 Naver Maps 인스턴스에 접근해야할 수 있습니다. 이경우 **naverRef** props를 사용합니다.

``` js static
<NaverMap 
  naverRef={ref => { this.mapRef = ref }} 
  ...
/>

// this.mapRef.map === new Navermaps.Map(...)

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
          mapDivId={'maps-access-instance'}
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
    this.setState({ initBounds: this.naverMapRef.map.getBounds() })
  }
}

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```