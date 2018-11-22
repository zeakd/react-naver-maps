import React from 'react'
import { NaverMap } from '../../../'

class App extends React.Component {
  render () {
    return (
      <div>
        <h1>Naver Maps Script Injected </h1>
        <NaverMap 
          style={{
            width: '400px',
            height: '400px',
          }}
        />
      </div>
    )
  }
}

export default App