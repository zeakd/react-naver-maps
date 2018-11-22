
https://navermaps.github.io/maps.js/docs/tutorial-4-map-bounds.example.html

``` js 

const { 
  RenderAfterNavermapsLoaded, 
  Map: NaverMap,
  Rectangle,
} = require('react-naver-maps')
const { 
  withNavermaps,
} = require('react-naver-maps/hocs')

const Rect = (props) => (
  <Rectangle 
    strokeOpacity={0}
    strokeWeight={0}
    fillOpacity={0.2}
    fillColor={"#f00"}
    {...props}
  />
)

class App extends React.Component {
  constructor (props) {
    super(props);
    const { navermaps } = props;

    this.state = {
      rect: null,
    }
    this.handleBoundsChanged = this.handleBoundsChanged.bind(this);
    // this.changeBounds = this.changeBounds.bind(this);
    this.goToDokdo = this.goToDokdo.bind(this);

    this.dokdo = new navermaps.LatLngBounds(
      new navermaps.LatLng(37.2380651, 131.8562652),
      new navermaps.LatLng(37.2444436, 131.8786475)
    );
  }

  changeBounds(bounds) {
    this.setState({ bounds })

    if (this.rectTimeout) clearTimeout(this.rectTimeout)
    this.rectTimeout = setTimeout(() => {
      this.setState({ rect: <Rect bounds={this.state.bounds} /> })
    }, 500)
  }

  goToDokdo() {
    this.setState({ bounds: this.dokdo });
  }

  handleBoundsChanged(bounds) {
    this.changeBounds(bounds);
  }

  render () {
    const { navermaps } = this.props;

    return (
      <NaverMap 
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={5}
        bounds={this.state.bounds}
        onBoundsChanged={this.handleBoundsChanged}
        
        naverRef={ref => { this.mapRef = ref }}
        mapDivId='maps-examples-map-bounds'
        style={{
          width: '100%',
          height: '600px',
        }}
      >
        <Buttons>
          <ControlBtn onClick={this.goToDokdo}>독도로 이동하기</ControlBtn>
        </Buttons>
        {this.state.rect}
      </NaverMap>
    )
  }

  componentDidMount() {
    // map이 생성될 때의 bounds를 알기 위해 map객체에 직접 접근해야합니다.
    this.changeBounds(this.mapRef.map.getBounds())
  }
}

const EnhancedApp = withNavermaps(App);

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <EnhancedApp />
</RenderAfterNavermapsLoaded>
```