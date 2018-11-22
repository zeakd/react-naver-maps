# script tag example

html에 직접 naver maps module을 script tag로 적는 예시입니다.

## How to use

1. `.env.example`을 참고하여 `.env`파일을 생성합니다. Map Client Id 는 네이버에서 받은 client id 입니다.
2. `yarn` 혹은 `npm install`을 합니다.
3. 두가지 방법으로 선택하여 port 설정을 합니다. 
  - webpack의 디폴트 포트에 맞춰 `localhost:8080`을 [Naver App API 설정](https://developers.naver.com/apps/)에서 열어주거나
  - 열어둔 URL 포트에 맞춰 로컬 서버의 port를 맞춰줍니다. 
4. `yarn start` 혹은 `npm run start`
  - 특정 열어둔 URL 포트가 있을경우 `webpack.config.js`에서 `devServer.port`를 설정하거나, `yarn start --port 포트번호`, `npm run start -- --port 포트번호`로 실행합니다.