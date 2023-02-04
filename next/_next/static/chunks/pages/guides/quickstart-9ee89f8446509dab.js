(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[361],{20231:function(n,e,a){(window.__NEXT_P=window.__NEXT_P||[]).push(["/guides/quickstart",function(){return a(75337)}])},75337:function(n,e,a){"use strict";a.r(e);var r=a(35250),t=a(75615),s=a(82193),i=a(70079),c=a(44208);e.default=function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=function(){var e=Object.assign({h1:"h1",p:"p",code:"code",pre:"pre",span:"span"},(0,t.ah)(),n.components);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(e.h1,{children:"Quickstart"}),"\n",(0,r.jsxs)(e.p,{children:["Application \ub8e8\ud2b8\uc5d0 NaverMaps Provider\ub97c \uc81c\uacf5\ud574\uc57c\ud569\ub2c8\ub2e4. \uc0ac\uc6a9\ud558\uc2dc\ub294 \ud504\ub808\uc784\uc6cc\ud06c\uc5d0 \ub9de\ucdb0 ",(0,r.jsx)(e.code,{children:"<NaverMapsProvider />"})," \ub97c \uac10\uc2f8\uc8fc\uc138\uc694."]}),"\n",(0,r.jsx)(e.pre,{children:(0,r.jsx)(e.code,{className:"language-jsx",children:"import { NaverMapsProvider } from 'react-naver-maps';\n\nfunction App() {\n  return (\n    <NaverMapsProvider \n      ncpClientId='MY_NAVERMAPS_CLIENT_ID'\n      // or finClientId, govClientId  \n    >\n      <TheRestOfYourApplication />\n    </NaverMapsProvider>\n  )\n}\n"})}),"\n",(0,r.jsx)(s.X,{codeClassName:"language-tsx",codeHeader:"import { Container as MapDiv, NaverMap, Marker, useNavermaps } from 'react-naver-maps'\n",__position:"0",__code:"function MyMap() {\n  // instead of window.naver.maps\n  const navermaps = useNavermaps()\n\n  return (\n    <NaverMap\n      defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}\n      defaultZoom={15}\n    >\n      <Marker\n        defaultPosition={new navermaps.LatLng(37.3595704, 127.105399)}\n      />\n    </NaverMap>\n  )\n}\n\n<MapDiv\n  style={{\n    width: '100%',\n    height: '600px',\n  }}\n>\n  <Suspense fallback={<span>Loading</span>}>\n    <MyMap />\n  </Suspense>\n</MapDiv>",children:function(){return(0,r.jsx)(c.W2,{style:{width:"100%",height:"600px"},children:(0,r.jsx)(i.Suspense,{fallback:(0,r.jsx)(e.span,{children:"Loading"}),children:(0,r.jsx)((function(){var n=(0,c.UL)();return(0,r.jsx)(c.EL,{defaultCenter:new n.LatLng(37.3595704,127.105399),defaultZoom:15,children:(0,r.jsx)(c.Jx,{defaultPosition:new n.LatLng(37.3595704,127.105399)})})}),{})})})}})]})},a=Object.assign({},(0,t.ah)(),n.components),o=a.wrapper;return o?(0,r.jsx)(o,Object.assign({},n,{children:(0,r.jsx)(e,{})})):e()}},82193:function(n,e,a){"use strict";a.d(e,{X:function(){return s}});var r=a(75615),t=a(70079);function s(n){const e=(0,r.ah)().code??"code";return t.createElement(t.Fragment,null,"function"===typeof n.children?t.createElement(n.children):n.children,t.createElement(e,{className:n.codeClassName},`${n.codeHeader}\n${n.__code}`))}}},function(n){n.O(0,[774,888,179],(function(){return e=20231,n(n.s=e);var e}));var e=n.O();_N_E=e}]);