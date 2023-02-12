(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[116],{29464:function(n,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/examples/marker-tutorial-1-simple",function(){return r(91527)}])},91527:function(n,e,r){"use strict";r.r(e);var i=r(35250),a=r(75615),t=(r(70079),r(89925)),c=r(98666);e.default=function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=function(){var e=Object.assign({h1:"h1",p:"p",a:"a"},(0,a.ah)(),n.components);return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(e.h1,{children:"\uc9c0\ub3c4 \uae30\ubcf8 \uc608\uc81c"}),"\n",(0,i.jsxs)(e.p,{children:["\ub124\uc774\ubc84\uc9c0\ub3c4 \uacf5\uc2dd \ud29c\ud1a0\ub9ac\uc5bc ",(0,i.jsx)(e.a,{href:"https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-marker-simple.example.html",children:"\ub9c8\ucee4 \ud45c\uc2dc\ud558\uae30"}),"\uc758 \uad6c\ud604 \uc608\uc2dc\uc785\ub2c8\ub2e4."]}),"\n",(0,i.jsx)(t.X,{codeClassName:"language-tsx",codeHeader:"import { Container as MapDiv, NaverMap, Marker, useNavermaps } from 'react-naver-maps'\n",__position:"0",__code:"function MyMap() {\n  // instead of window.naver.maps\n  const navermaps = useNavermaps()\n\n  return (\n    <NaverMap\n      defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}\n      defaultZoom={15}\n    >\n      <Marker position={new navermaps.LatLng(37.3595704, 127.105399)} />\n    </NaverMap>\n  )\n}\n\n<MapDiv\n  style={{\n    width: '100%',\n    height: '600px',\n  }}\n>\n  <MyMap />\n</MapDiv>",children:function(){return(0,i.jsx)(c.W2,{style:{width:"100%",height:"600px"},children:(0,i.jsx)((function(){var n=(0,c.UL)();return(0,i.jsx)(c.EL,{defaultCenter:new n.LatLng(37.3595704,127.105399),defaultZoom:15,children:(0,i.jsx)(c.Jx,{position:new n.LatLng(37.3595704,127.105399)})})}),{})})}})]})},r=Object.assign({},(0,a.ah)(),n.components),d=r.wrapper;return d?(0,i.jsx)(d,Object.assign({},n,{children:(0,i.jsx)(e,{})})):e()}},89925:function(n,e,r){"use strict";r.d(e,{X:function(){return c},x:function(){return s}});var i=r(75615),a=r(70079),t=r(4926);function c(n){const e=(0,i.ah)().code??"code";return(0,t.BX)(t.HY,{children:["function"===typeof n.children?a.createElement(n.children):n.children,(0,t.tZ)(e,{className:n.codeClassName,children:`${n.codeHeader}\n${n.__code}`})]})}var d=r(73371);function s({__docgen:n,attrs:e}){const r=Object.entries(n.props).filter((([n])=>e?e.includes(n):!["key","ref"].includes(n))).map((([,n])=>n));return(0,t.BX)("div",{css:(0,d.iv)({display:"grid",gridTemplateColumns:"max-content fit-content(200px) 100px 1fr",gridGap:"5px",boxSizing:"border-box",wordBreak:"break-word",background:"rgb(250, 250, 250)",padding:"5px"}),children:[(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Name"}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Type"}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Default"}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Description"}),r.map((n=>{var e;return(0,t.BX)(a.Fragment,{children:[(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",color:"rgb(124, 77, 255)"}),children:n.name}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",color:"rgb(57, 173, 181)"}),children:null==(e=n.type)?void 0:e.name}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px"}),children:n.required?(0,t.tZ)("span",{css:(0,d.iv)({color:"rgb(247, 109, 71)"}),children:"Required"}):(0,t.tZ)("span",{css:(0,d.iv)({color:"rgb(246, 164, 52)"}),children:null!=n.defaultValue?n.defaultValue.value:"-"})}),(0,t.tZ)("div",{css:(0,d.iv)({padding:"5px",color:"rgb(144, 164, 174)"}),children:n.description})]},n.name)}))]})}}},function(n){n.O(0,[790,774,888,179],(function(){return e=29464,n(n.s=e);var e}));var e=n.O();_N_E=e}]);