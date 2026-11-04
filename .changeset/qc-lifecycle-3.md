---
'react-naver-maps': patch
---

- 지도 init 전에 올렸다 내리거나 숨긴 HeatMap·DotMap·CustomControl·DrawingManager(와 거리뷰 안 Marker)가 init 뒤에 지도에 붙던 것을 고친다.
- 래스터 지도에서 실수 `zoom` 이 조금씩 바뀌면 center 까지 무시되던 것을 고친다. 래스터는 zoom 을 반올림해 쓰므로 반올림해 같으면 center 만 옮긴다.
- `Panorama` 는 거리뷰를 누르고 있는 동안 카메라 prop(`pov` 등)을 보류하고 뗀 뒤 맞춘다. 늦게 되돌려준 pov 가 다음 끌기를 당기지 않는다.
- `Polygon`·`Polyline` 에 `editable` 과 controlled `paths`/`path` 를 함께 주면 개발 모드에서 경고한다(SDK 가 편집을 알리지 않아 다음 렌더가 되돌린다).
