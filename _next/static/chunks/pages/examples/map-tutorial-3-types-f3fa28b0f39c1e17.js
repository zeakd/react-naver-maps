(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[917],{48404:function(n,e,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/examples/map-tutorial-3-types",function(){return t(84439)}])},84439:function(n,e,t){"use strict";t.r(e);var a=t(33861),r=t(35250),d=t(75615),p=t(29905),i=t(70079),o=t(88898);e.default=function(){var n=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},e=function(){var e=Object.assign({h1:"h1",p:"p",a:"a",div:"div",button:"button"},(0,d.ah)(),n.components);return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(e.h1,{children:"\uc9c0\ub3c4 \uc720\ud615 \uc124\uc815\ud558\uae30"}),"\n",(0,r.jsxs)(e.p,{children:["\ub124\uc774\ubc84\uc9c0\ub3c4 \uacf5\uc2dd \ud29c\ud1a0\ub9ac\uc5bc ",(0,r.jsx)(e.a,{href:"https://navermaps.github.io/maps.js.ncp/docs/tutorial-3-map-types.example.html",children:"\uc9c0\ub3c4 \uc720\ud615 \uc124\uc815\ud558\uae30"}),"\uc758 \uad6c\ud604 \uc608\uc2dc\uc785\ub2c8\ub2e4."]}),"\n",(0,r.jsx)(p.X,{codeClassName:"language-tsx",codeHeader:"import { Container as MapDiv, NaverMap, useNavermaps } from 'react-naver-maps';\n",__position:"0",__code:"<MapDiv\n  style={{\n    position: 'relative',\n    width: '100%',\n    height: '600px',\n  }}\n>\n  {() => {\n    const navermaps = useNavermaps()\n    const [mapTypeId, setMapTypeId] = useState(navermaps.MapTypeId.NORMAL)\n    const buttons = [\n      {\n        typeId: navermaps.MapTypeId.NORMAL,\n        text: '\uc77c\ubc18\uc9c0\ub3c4',\n      },\n      {\n        typeId: navermaps.MapTypeId.TERRAIN,\n        text: '\uc9c0\ud615\ub3c4',\n      },\n      {\n        typeId: navermaps.MapTypeId.SATELLITE,\n        text: '\uc704\uc131\uc9c0\ub3c4',\n      },\n      {\n        typeId: navermaps.MapTypeId.HYBRID,\n        text: '\uacb9\uccd0\ubcf4\uae30',\n      },\n    ]\n\n    return (\n      <>\n        <div\n          style={{\n            position: 'absolute',\n            top: 0,\n            left: 0,\n            zIndex: 1000,\n            padding: 5,\n          }}\n        >\n          {buttons.map((btn) => {\n            return (\n              <button\n                key={btn.typeId}\n                style={{\n                  backgroundColor: '#fff',\n                  border: 'solid 1px #333',\n                  outline: '0 none',\n                  borderRadius: '5px',\n                  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',\n                  margin: '0 5px 5px 0',\n                  backgroundColor:\n                    btn.typeId === mapTypeId ? '#2780E3' : 'white',\n                  color: btn.typeId === mapTypeId ? 'white' : 'black',\n                }}\n                onClick={() => {\n                  setMapTypeId(btn.typeId)\n                }}\n              >\n                {btn.text}\n              </button>\n            )\n          })}\n        </div>\n        <NaverMap\n          // uncontrolled KVO\n          defaultZoom={15}\n          defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}\n          // controlled KVO\n          mapTypeId={mapTypeId}\n        />\n      </>\n    )\n  }}\n</MapDiv>",children:(0,r.jsx)(o.W2,{style:{position:"relative",width:"100%",height:"600px"},"client:only":"react",children:function(){var n=(0,o.UL)(),t=(0,i.useState)(n.MapTypeId.NORMAL),d=t[0],p=t[1],s=[{typeId:n.MapTypeId.NORMAL,text:"\uc77c\ubc18\uc9c0\ub3c4"},{typeId:n.MapTypeId.TERRAIN,text:"\uc9c0\ud615\ub3c4"},{typeId:n.MapTypeId.SATELLITE,text:"\uc704\uc131\uc9c0\ub3c4"},{typeId:n.MapTypeId.HYBRID,text:"\uacb9\uccd0\ubcf4\uae30"}];return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(e.div,{style:{position:"absolute",top:0,left:0,zIndex:1e3,padding:5},children:s.map((function(n){var t;return(0,r.jsx)(e.button,{style:(t={backgroundColor:"#fff",border:"solid 1px #333",outline:"0 none",borderRadius:"5px",boxShadow:"2px 2px 1px 1px rgba(0, 0, 0, 0.5)",margin:"0 5px 5px 0"},(0,a.Z)(t,"backgroundColor",n.typeId===d?"#2780E3":"white"),(0,a.Z)(t,"color",n.typeId===d?"white":"black"),t),onClick:function(){p(n.typeId)},children:n.text},n.typeId)}))}),(0,r.jsx)(o.EL,{defaultZoom:15,defaultCenter:new n.LatLng(37.3595704,127.105399),mapTypeId:d})]})}})})]})},t=Object.assign({},(0,d.ah)(),n.components),s=t.wrapper;return s?(0,r.jsx)(s,Object.assign({},n,{children:(0,r.jsx)(e,{})})):e()}},29905:function(n,e,t){"use strict";t.d(e,{X:function(){return p},x:function(){return o}});var a=t(75615),r=t(70079),d=t(4926);function p(n){const e=(0,a.ah)().code??"code";return(0,d.BX)(d.HY,{children:["function"===typeof n.children?r.createElement(n.children):n.children,(0,d.tZ)(e,{className:`language-tsx ${n.codeClassName}`,children:`${n.codeHeader||""}\n${n.__code}`})]})}var i=t(73371);function o({__docgen:n,attrs:e}){const t=Object.entries(n.props).filter((([n])=>e?e.includes(n):!["key","ref"].includes(n))).map((([,n])=>n));return(0,d.BX)("div",{css:(0,i.iv)({display:"grid",gridTemplateColumns:"max-content fit-content(200px) 100px 1fr",gridGap:"5px",boxSizing:"border-box",wordBreak:"break-word",background:"rgb(250, 250, 250)",padding:"5px"}),children:[(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Name"}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Type"}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Default"}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",fontWeight:"bold",color:"black"}),children:"Description"}),t.map((n=>{var e;return(0,d.BX)(r.Fragment,{children:[(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",color:"rgb(124, 77, 255)"}),children:n.name}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",color:"rgb(57, 173, 181)"}),children:null==(e=n.type)?void 0:e.name}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px"}),children:n.required?(0,d.tZ)("span",{css:(0,i.iv)({color:"rgb(247, 109, 71)"}),children:"Required"}):(0,d.tZ)("span",{css:(0,i.iv)({color:"rgb(246, 164, 52)"}),children:null!=n.defaultValue?n.defaultValue.value:"-"})}),(0,d.tZ)("div",{css:(0,i.iv)({padding:"5px",color:"rgb(144, 164, 174)"}),children:n.description})]},n.name)}))]})}}},function(n){n.O(0,[790,774,888,179],(function(){return e=48404,n(n.s=e);var e}));var e=n.O();_N_E=e}]);