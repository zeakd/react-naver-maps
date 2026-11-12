import{j as e,N as u,C as m,u as p,a as x}from"./naver-map.D7zW2a_N.js";import{r as d}from"./index.2rfxsHwN.js";import{u as f}from"./use-map.XDcE58iR.js";const c=`
<a href="#" style="
  z-index: 100;
  overflow: hidden;
  display: inline-block;
  position: absolute;
  top: 7px;
  left: 5px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(58,70,88,.45);
  border-radius: 2px;
  background: #fcfcfd;
  background-clip: border-box;
  text-align: center;
  -webkit-background-clip: padding;
  background-clip: padding-box;
">
  <span style="
    overflow: hidden;
    display: inline-block;
    color: transparent !important;
    vertical-align: top;
    background: url(https://ssl.pstatic.net/static/maps/m/spr_trff_v6.png) 0 0;
    background-size: 200px 200px;
    width: 20px;
    height: 20px;
    margin: 7px 0 0 0;
    background-position: -153px -31px;
  ">NAVER 그린팩토리</span>
</a>
`;function g(){const t=p(),n=f();return d.useEffect(()=>{const o=new t.CustomControl(c,{position:t.Position.TOP_LEFT});o.setMap(n);const s=o.getElement(),i=()=>{n.setCenter(new t.LatLng(37.3595953,127.1053971))};s.addEventListener("click",i);const a=document.createElement("div");a.innerHTML=c;const r=a.children[0];n.controls[naver.maps.Position.LEFT_CENTER].push(r);const l=()=>{n.setCenter(new t.LatLng(37.3595953,127.1053971))};return r.addEventListener("click",l),()=>{s.removeEventListener("click",i),r.removeEventListener("click",l),o.setMap(null)}},[n,t]),null}function h(){p();const[t,n]=d.useState(!1);return e.jsx(x,{defaultZoom:13,onInit:()=>n(!0),children:t&&e.jsx(g,{})})}function C(){return e.jsx(m,{style:{width:"100%",height:"600px"},children:e.jsx(h,{})})}function k(){return e.jsx(u,{ncpKeyId:"aluya4ff04",children:e.jsx(C,{})})}export{k as default};
