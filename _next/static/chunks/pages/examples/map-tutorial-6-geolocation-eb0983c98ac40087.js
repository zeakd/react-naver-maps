(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[461],{10065:function(n,e,o){(window.__NEXT_P=window.__NEXT_P||[]).push(["/examples/map-tutorial-6-geolocation",function(){return o(77837)}])},77837:function(n,e,o){"use strict";o.r(e);var t=o(35250),i=o(75615),a=o(29905),r=o(70079),s=o(31316);e.default=function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=function(){var e=Object.assign({h1:"h1",p:"p",a:"a"},(0,i.ah)(),n.components);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(e.h1,{children:"HTML5 Geolocation API \ud65c\uc6a9\ud558\uae30"}),"\n",(0,t.jsxs)(e.p,{children:["\ub124\uc774\ubc84\uc9c0\ub3c4 \uacf5\uc2dd \ud29c\ud1a0\ub9ac\uc5bc ",(0,t.jsx)(e.a,{href:"https://navermaps.github.io/maps.js.ncp/docs/tutorial-6-map-geolocation.example.html",children:"HTML5 Geolocation API \ud65c\uc6a9\ud558\uae30"}),"\uc758 \uad6c\ud604 \uc608\uc2dc\uc785\ub2c8\ub2e4."]}),"\n",(0,t.jsx)(a.X,{codeClassName:"language-tsx",codeHeader:"import { useState, useRef, useEffect } from 'react';\nimport { Container as MapDiv, NaverMap, useNavermaps, InfoWindow } from 'react-naver-maps';\n",__position:"0",__code:"function MyMap() {\n  const navermaps = useNavermaps()\n\n  // useRef \ub300\uc2e0 useState\ub97c \ud1b5\ud574 ref\ub97c \uac00\uc838\uc635\ub2c8\ub2e4.\n  const [map, setMap] = useState(null)\n  const [infowindow, setInfoWindow] = useState(null)\n\n  function onSuccessGeolocation(position) {\n    if (!map || !infowindow) return\n\n    const location = new navermaps.LatLng(\n      position.coords.latitude,\n      position.coords.longitude,\n    )\n    map.setCenter(location)\n    map.setZoom(10)\n    infowindow.setContent(\n      '<div style=\"padding:20px;\">' +\n        'geolocation.getCurrentPosition() \uc704\uce58' +\n        '</div>',\n    )\n    infowindow.open(map, location)\n    console.log('Coordinates: ' + location.toString())\n  }\n\n  function onErrorGeolocation() {\n    if (!map || !infowindow) return\n\n    const center = map.getCenter()\n    infowindow.setContent(\n      '<div style=\"padding:20px;\">' +\n        '<h5 style=\"margin-bottom:5px;color:#f00;\">Geolocation failed!</h5>' +\n        'latitude: ' +\n        center.lat() +\n        '<br />longitude: ' +\n        center.lng() +\n        '</div>',\n    )\n    infowindow.open(map, center)\n\n    if (navigator.geolocation) {\n      navigator.geolocation.getCurrentPosition(\n        onSuccessGeolocation,\n        onErrorGeolocation,\n      )\n    } else {\n      const center = map.getCenter()\n      infowindow.setContent(\n        '<div style=\"padding:20px;\"><h5 style=\"margin-bottom:5px;color:#f00;\">Geolocation not supported</h5></div>',\n      )\n      infowindow.open(map, center)\n    }\n  }\n\n  useEffect(() => {\n    if (!map || !infowindow) {\n      return\n    }\n\n    if (navigator.geolocation) {\n      navigator.geolocation.getCurrentPosition(\n        onSuccessGeolocation,\n        onErrorGeolocation,\n      )\n    } else {\n      var center = map.getCenter()\n      infowindow.setContent(\n        '<div style=\"padding:20px;\"><h5 style=\"margin-bottom:5px;color:#f00;\">Geolocation not supported</h5></div>',\n      )\n      infowindow.open(map, center)\n    }\n  }, [map, infowindow])\n\n  return (\n    <NaverMap\n      // uncontrolled\n      defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}\n      defaultZoom={10}\n      defaultMapTypeId={navermaps.MapTypeId.NORMAL}\n      ref={setMap}\n    >\n      <InfoWindow ref={setInfoWindow} />\n    </NaverMap>\n  )\n}\n\n<MapDiv\n  style={{\n    position: 'relative',\n    width: '100%',\n    height: '600px',\n  }}\n>\n  <MyMap />\n</MapDiv>",children:function(){return(0,t.jsx)(s.W2,{style:{position:"relative",width:"100%",height:"600px"},children:(0,t.jsx)((function(){var n=(0,s.UL)(),e=(0,r.useState)(null),o=e[0],i=e[1],a=(0,r.useState)(null),d=a[0],c=a[1];function l(e){if(o&&d){var t=new n.LatLng(e.coords.latitude,e.coords.longitude);o.setCenter(t),o.setZoom(10),d.setContent('<div style="padding:20px;">geolocation.getCurrentPosition() \uc704\uce58</div>'),d.open(o,t),console.log("Coordinates: "+t.toString())}}function p(){if(o&&d){var n=o.getCenter();if(d.setContent('<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">Geolocation failed!</h5>latitude: '+n.lat()+"<br />longitude: "+n.lng()+"</div>"),d.open(o,n),navigator.geolocation)navigator.geolocation.getCurrentPosition(l,p);else{var e=o.getCenter();d.setContent('<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">Geolocation not supported</h5></div>'),d.open(o,e)}}}return(0,r.useEffect)((function(){if(o&&d)if(navigator.geolocation)navigator.geolocation.getCurrentPosition(l,p);else{var n=o.getCenter();d.setContent('<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">Geolocation not supported</h5></div>'),d.open(o,n)}}),[o,d]),(0,t.jsx)(s.EL,{defaultCenter:new n.LatLng(37.5666805,126.9784147),defaultZoom:10,defaultMapTypeId:n.MapTypeId.NORMAL,ref:i,children:(0,t.jsx)(s.nx,{ref:c})})}),{})})}})]})},o=Object.assign({},(0,i.ah)(),n.components),d=o.wrapper;return d?(0,t.jsx)(d,Object.assign({},n,{children:(0,t.jsx)(e,{})})):e()}},29905:function(n,e,o){"use strict";o.d(e,{X:function(){return r},x:function(){return d}});var t=o(75615),i=o(70079),a=o(4926);function r(n){const e=(0,t.ah)().code??"code";return(0,a.BX)(a.HY,{children:["function"===typeof n.children?i.createElement(n.children):n.children,(0,a.tZ)(e,{className:`language-tsx ${n.codeClassName}`,children:`${n.codeHeader||""}\n${n.__code}`})]})}var s=o(73371);function d({__docgen:n,attrs:e}){const o=Object.entries(n.props).filter((([n])=>e?e.includes(n):!["key","ref"].includes(n))).map((([,n])=>n));return(0,a.BX)("div",{css:(0,s.iv)({display:"grid",gridTemplateColumns:"max-content fit-content(200px) 100px 1fr",gridGap:"5px",boxSizing:"border-box",wordBreak:"break-word",background:"rgb(250, 250, 250)",padding:"5px"}),children:[(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Name"}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Type"}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Default"}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Description"}),o.map((n=>{var e;return(0,a.BX)(i.Fragment,{children:[(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",color:"rgb(124, 77, 255)"}),children:n.name}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",color:"rgb(57, 173, 181)"}),children:null==(e=n.type)?void 0:e.name}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px"}),children:n.required?(0,a.tZ)("span",{css:(0,s.iv)({color:"rgb(247, 109, 71)"}),children:"Required"}):(0,a.tZ)("span",{css:(0,s.iv)({color:"rgb(246, 164, 52)"}),children:null!=n.defaultValue?n.defaultValue.value:"-"})}),(0,a.tZ)("div",{css:(0,s.iv)({padding:"5px",color:"rgb(144, 164, 174)"}),children:n.description})]},n.name)}))]})}}},function(n){n.O(0,[790,774,888,179],(function(){return e=10065,n(n.s=e);var e}));var e=n.O();_N_E=e}]);