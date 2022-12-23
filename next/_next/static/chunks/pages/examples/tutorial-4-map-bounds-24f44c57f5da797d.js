(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[966],{5572:function(n,e,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/examples/tutorial-4-map-bounds",function(){return t(3389)}])},3389:function(n,e,t){"use strict";t.r(e);var o=t(5250),s=t(5615),a=t(3585),u=t(79),r=t(8505);e.default=function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=function(){var e=Object.assign({h2:"h2",p:"p",button:"button"},(0,s.ah)(),n.components);return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(e.h2,{children:"\uc9c0\ub3c4 \uc88c\ud45c \uacbd\uacc4 \ud655\uc778\ud558\uae30"}),"\n",(0,o.jsx)(e.p,{children:"\uc9c0\ub3c4\uc758 bounds \uac1d\uccb4\ub97c \uc774\uc6a9\ud558\ub294 \uc608\uc81c\uc785\ub2c8\ub2e4."}),"\n",(0,o.jsx)(e.p,{children:"https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-map-simple.example.html"}),"\n",(0,o.jsx)(a.X,{codeClassName:"language-tsx",codeHeader:"import { Suspense, useState, useEffect, useRef, useCallback } from 'react'\nimport { MapDiv, NaverMap, useNavermaps, Rectangle, useMap } from 'react-naver-maps'\n",__position:"0",__code:"function MyMap() {\n  const navermaps = useNavermaps()\n  const [center] = useState(new navermaps.LatLng(37.5666805, 126.9784147))\n  const [bounds, setBounds] = useState()\n  return (\n    <NaverMap\n      // uncontrolled\n      defaultCenter={center}\n      defaultZoom={10}\n      mapTypeId={navermaps.MapTypeId.NORMAL}\n      // controlled bounds, center, zoom\uc744 \uc0ac\uc6a9\ud560 \uacbd\uc6b0 \ubc18\ub4dc\uc2dc \ud574\ub2f9 changed event\ub97c \uc5f0\uacb0\ud574\uc57c\ud569\ub2c8\ub2e4.\n      bounds={bounds}\n      onBoundsChanged={setBounds}\n    >\n      <FullRect bounds={bounds} />\n      <button\n        style={{\n          position: 'absolute',\n          top: 10,\n          left: 10,\n          zIndex: 1000,\n          backgroundColor: '#fff',\n          border: 'solid 1px #333',\n          outline: '0 none',\n          borderRadius: '5px',\n          boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',\n          margin: '0 5px 5px 0',\n        }}\n        onClick={() => {\n          setBounds(\n            new navermaps.LatLngBounds(\n              new navermaps.LatLng(37.2380651, 131.8562652),\n              new navermaps.LatLng(37.2444436, 131.8786475),\n            ),\n          )\n        }}\n      >\n        \ub3c5\ub3c4\ub85c \uc774\ub3d9\ud558\uae30\n      </button>\n    </NaverMap>\n  )\n}\n\nfunction FullRect({ bounds }) {\n  const nmap = useMap()\n  const [rectBounds, setRectBounds] = useState(nmap.getBounds())\n  useEffect(() => {\n    if (bounds) {\n      setTimeout(() => {\n        setRectBounds(bounds)\n      }, 500)\n    }\n  }, [bounds])\n  return (\n    <Rectangle\n      strokeOpacity={0}\n      strokeWeight={0}\n      fillOpacity={0.2}\n      fillColor={'#f00'}\n      bounds={rectBounds}\n    />\n  )\n}\n\n<MapDiv\n  style={{\n    position: 'relative',\n    width: '100%',\n    height: '600px',\n  }}\n>\n  <MyMap />\n</MapDiv>",children:function(){function n(n){var e=n.bounds,t=(0,r.Sx)(),s=(0,u.useState)(t.getBounds()),a=s[0],c=s[1];return(0,u.useEffect)((function(){e&&setTimeout((function(){c(e)}),500)}),[e]),(0,o.jsx)(r.Ae,{strokeOpacity:0,strokeWeight:0,fillOpacity:.2,fillColor:"#f00",bounds:a})}return(0,o.jsx)(r.DP,{style:{position:"relative",width:"100%",height:"600px"},children:(0,o.jsx)((function(){var t=(0,r.UL)(),s=(0,u.useState)(new t.LatLng(37.5666805,126.9784147))[0],a=(0,u.useState)(),c=a[0],i=a[1];return(0,o.jsxs)(r.EL,{defaultCenter:s,defaultZoom:10,mapTypeId:t.MapTypeId.NORMAL,bounds:c,onBoundsChanged:i,children:[(0,o.jsx)(n,{bounds:c}),(0,o.jsx)(e.button,{style:{position:"absolute",top:10,left:10,zIndex:1e3,backgroundColor:"#fff",border:"solid 1px #333",outline:"0 none",borderRadius:"5px",boxShadow:"2px 2px 1px 1px rgba(0, 0, 0, 0.5)",margin:"0 5px 5px 0"},onClick:function(){i(new t.LatLngBounds(new t.LatLng(37.2380651,131.8562652),new t.LatLng(37.2444436,131.8786475)))},children:"\ub3c5\ub3c4\ub85c \uc774\ub3d9\ud558\uae30"})]})}),{})})}})]})},t=Object.assign({},(0,s.ah)(),n.components),c=t.wrapper;return c?(0,o.jsx)(c,Object.assign({},n,{children:(0,o.jsx)(e,{})})):e()}},3585:function(n,e,t){"use strict";t.d(e,{X:function(){return a}});var o=t(79),s=t(5615);function a(n){const e=(0,s.ah)().code??"code";return o.createElement(o.Fragment,null,"function"===typeof n.children?o.createElement(n.children):n.children,o.createElement(e,{className:n.codeClassName},`${n.codeHeader}\n${n.__code}`))}}},function(n){n.O(0,[774,888,179],(function(){return e=5572,n(n.s=e);var e}));var e=n.O();_N_E=e}]);