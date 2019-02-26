예를 들어 [좌표경계 확인하기](#/Naver%20Maps%20Examples/지도%20좌표%20경계%20확인하기)의 경우처럼 Mount시에는 **changed** 이벤트 들이 발생하지 않기 때문에 **event handler**만으로는 초기값을 알아낼 수 없습니다. 
이처럼 props와 eventHandler를 사용하는 것에 한계가 있을 때 Reference를 활용해 Class Componet Method 를 직접 이용할 수 있습니다. **props.naverRef** 를 이용하며 사용방법은 [ref](https://reactjs.org/docs/refs-and-the-dom.html)와 동일합니다.


``` js

import { RenderAfterNavermapsLoaded, NaverMap } from 'react-naver-maps'

class App extends React.Component {
  render () {
    return (
      <NaverMap 
        naverRef={ref => { this.mapRef = ref }}
        id='maps-examples-map-bounds'
        style={{
          width: '100%',
          height: '600px',
        }}
      />
    )
  }

  componentDidMount() {
    // map이 생성될 때의 bounds를 알기 위해 method를 이용합니다.
    console.log(this.mapRef.getBounds());
  }
}

<RenderAfterNavermapsLoaded
  clientId={YOUR_CLIENT_ID}
>
  <App />
</RenderAfterNavermapsLoaded>
```

각 Class Component마다 사용할 수 있는 메소드는 각 컴포넌트의 네이버 문서에 구현되어있는 메소드와 동일합니다. Api Docs를 참고해주세요.