# react-naver-maps
Controlled React Component for Naver Maps to handle zoom, center, etc.

## Goal
- Naver maps 모듈을 controlled component처럼 사용할 수 있도록 합니다. 즉, props와 event handler (ex. onZoomChanged)를 통한 center, zoom 등의 kvo key의 단방향 흐름 제어를 목적으로 합니다. 
- Marker, Polygon등 Map 위의 ui들을 Children Component로 다룰 수 있도록 합니다.

## Caveat
`react-naver-maps`는 naver maps module을 불러오는 코드를 포함 하지 않으며, 모든 컴포넌트들은 window.naver.maps 모듈이 없이 mount될 경우 에러가 발생합니다. [example]()에서 몇가지 방법을 예시로 제시하지만 자신만의 방법으로 자유롭게 사용하세요.

## API

### Map

** props **
- `zoom`
- `center`
- `

#### Marker



### Panorama

## TODO

## Contribute
이 슈 환 영
피 알 환 영

