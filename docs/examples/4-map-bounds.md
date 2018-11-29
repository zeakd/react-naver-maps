
https://navermaps.github.io/maps.js/docs/tutorial-4-map-bounds.example.html

아래 예시는 좌표경계가 변경될 때마다 딜레이 후 좌표경계만큼 사각형을 그리는 예시입니다. 
**props.bounds**와 **onBoundsChanged**를 이용해 구현 할 수 있지만 NaverMap이 Mount될 때에는 **bounds_changed** event가 발생하지 않기 때문에 최초 사각형를 초기화 하기 위해서는 NaverMap이 생성되었을 때의 좌표경계를 알아낼 필요가 있습니다. 이 경우에 ref를 활용하여 **NaverMap**의 class method인 getBounds를 사용합니다.

``` js 

const { 
  RenderAfterNavermapsLoaded, 
  NaverMap,
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
        naverRef={ref => { this.mapRef = ref }}
        id='maps-examples-map-bounds'
        style={{
          width: '100%',
          height: '600px',
        }}
        
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={5}
        bounds={this.state.bounds}
        onBoundsChanged={this.handleBoundsChanged}
        
      >
        <Buttons>
          <ControlBtn onClick={this.goToDokdo}>독도로 이동하기</ControlBtn>
        </Buttons>
        {this.state.rect}
      </NaverMap>
    )
  }

  componentDidMount() {
    // map이 생성될 때의 bounds를 알기 위해 method를 이용합니다.
    this.changeBounds(this.mapRef.getBounds())
  }
}

const EnhancedApp = withNavermaps(App);

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <EnhancedApp />
</RenderAfterNavermapsLoaded>
```