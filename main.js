"use strict";
/* Security: all data is written with textContent; URLs and paths are allow-listed. */
if(window.top!==window.self){document.documentElement.hidden=true}
const S=SITE,$=id=>document.getElementById(id);
const run=f=>{try{f()}catch(e){console.error(e)}};
const arr=v=>Array.isArray(v)?v:[];
const txt=v=>typeof v==="string"&&v.trim()!=="";
const safeUrl=u=>{try{const x=new URL(String(u),location.href);return(x.protocol==="https:"||x.protocol==="mailto:")?x.href:"#"}catch{return"#"}};
const safePath=p=>typeof p==="string"&&p&&!/^[a-z][a-z0-9+.-]*:/i.test(p)&&!p.startsWith("//")&&!p.includes("..")?p:"";
const okMail=e=>typeof e==="string"&&/^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(e);
const h=(t,a={},k=[])=>{const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(/^(innerHTML|outerHTML|srcdoc)$/i.test(x)||(/^on/i.test(x)&&typeof v!=="function"))continue;x in e?e[x]=v:e.setAttribute(x,v)}[].concat(k).forEach(c=>e.append(c));return e};
const img=(src,alt)=>h("img",{src:safePath(src),alt:alt||"",loading:"lazy",onerror(){this.style.visibility="hidden"}});
const chips=a=>h("ul",{className:"chips"},arr(a).filter(txt).map(t=>h("li",{textContent:t})));

/* ---- 1. Theme and menu: independent of the data, so they always work ---- */
run(()=>{
  const root=document.documentElement,mq=matchMedia("(prefers-color-scheme: dark)");
  const cur=()=>root.dataset.theme||(mq.matches?"dark":"light");
  const paint=()=>{const d=cur()==="dark";$("theme").textContent=d?"Light mode":"Dark mode";$("theme").setAttribute("aria-pressed",String(d))};
  $("theme").onclick=()=>{root.dataset.theme=cur()==="dark"?"light":"dark";paint()};
  paint();
  $("menu").onclick=()=>$("nav").classList.toggle("open");
});

/* ---- 2. Clean the data, then remove every section that has nothing to show ---- */
const plain=a=>arr(a).filter(x=>x&&txt(x.title));
const D={
  about:arr(S.about).filter(txt),
  skills:Object.fromEntries(Object.entries(S.skills||{}).filter(([,v])=>arr(v).some(txt))),
  experience:plain(S.experience),
  projects:arr(S.projects).map(p=>typeof p==="string"?{title:p}:p).filter(p=>p&&txt(p.title)),
  conference:arr(S.conferences).filter(c=>c&&(txt(c.title)||txt(c.event))),
  training:plain(S.training),awards:plain(S.awards),affiliations:plain(S.affiliations),
  contact:okMail(S.email)||txt(S.location)?[1]:[]
};
const has=v=>Array.isArray(v)?v.length>0:Object.keys(v).length>0;
Object.entries(D).forEach(([id,v])=>{if(!has(v)&&$(id))$(id).remove()});

/* ---- 3. Render each section on its own, so one bad entry cannot break the rest ---- */
run(()=>{ // hero
  document.title=[S.name,arr(S.roles)[0]].filter(txt).join(" | ")||"Portfolio";
  $("logo").textContent=S.name||"";$("name").textContent=S.name||"";$("tagline").textContent=S.tagline||"";
  txt(S.openToWork)?$("open").textContent=S.openToWork:$("open").remove();
  plain(arr(S.education).map(e=>e&&{title:e.degree,info:e.info})).forEach(e=>$("edu").append(h("p",{className:"edu"},[h("b",{textContent:e.title}),h("small",{textContent:e.info||""})])));
  Object.entries(S.categories||{}).forEach(([k,v])=>$("cats").append(h("span",{},[h("b",{textContent:k+": "}),String(v)])));
  [["LinkedIn",S.linkedin],["GitHub",txt(S.github)?"https://github.com/"+S.github:""],["YouTube",S.youtube]].filter(x=>txt(x[1]))
    .forEach(([n,u])=>$("social").append(h("a",{href:safeUrl(u),textContent:n,target:"_blank",rel:"noopener noreferrer"})));
  const f=S.featured;
  f?$("feat").append(img(f.img,f.label),h("div",{},[h("b",{textContent:f.label||""}),h("a",{className:"btn primary",href:safeUrl(f.link),textContent:"Open project",target:"_blank",rel:"noopener noreferrer"}),h("a",{className:"btn",href:"#projects",textContent:"Details"})])):$("feat").append(img(S.photo,S.name));
  const roles=arr(S.roles).filter(txt),ty=$("typed");
  if(!roles.length)ty.parentElement.remove();
  else if(matchMedia("(prefers-reduced-motion:reduce)").matches)ty.textContent=roles.join(" · ");
  else{let ri=0,ci=0,del=false;(function tick(){const w=roles[ri];ci+=del?-1:1;ty.textContent=w.slice(0,ci);let d=del?40:80;
    if(!del&&ci===w.length){del=true;d=1400}else if(del&&ci===0){del=false;ri=(ri+1)%roles.length;d=300}setTimeout(tick,d)})()}
});
run(()=>{ if(!$("about"))return;
  D.about.forEach(t=>$("aboutText").append(h("p",{textContent:t})));
  $("profile").append(img(S.photo,"Profile photo"),h("h3",{textContent:S.name||""}),h("p",{textContent:arr(S.roles)[0]||""}),h("p",{textContent:S.location||""}));
});
run(()=>{ if(!$("skills"))return;
  $("skillsSub").textContent=S.skillsSub||"";
  Object.entries(D.skills).forEach(([g,a])=>$("skillList").append(h("div",{className:"card"},[h("h3",{textContent:g}),chips(a)])));
});
run(()=>{ if(!$("experience"))return;
  D.experience.forEach(j=>$("jobs").append(h("div",{className:"card job"},[h("h3",{textContent:j.title}),
    h("div",{className:"when",textContent:[j.org,j.when].filter(txt).join(" · ")}),h("ul",{},arr(j.points).filter(txt).map(p=>h("li",{textContent:p})))])));
});
run(()=>{ if(!$("projects"))return;
  $("projSub").textContent=S.projSub||"";
  const tags=["All",...new Set(D.projects.flatMap(p=>arr(p.tags).filter(txt)))];let act="All";
  const draw=()=>{
    $("filters").replaceChildren(...(tags.length>1?tags:[]).map(t=>{const b=h("button",{type:"button",textContent:t,onclick(){act=t;draw()}});b.setAttribute("aria-pressed",String(t===act));return b}));
    $("projGrid").replaceChildren(...D.projects.filter(p=>act==="All"||arr(p.tags).includes(act)).map(p=>{
      const keys=Object.keys(p.tabs||{}),pane=h("div",{className:"pane"}),tb=h("div",{className:"tabs",role:"tablist"});
      const show=k=>{pane.textContent=p.tabs[k];[...tb.children].forEach(b=>b.setAttribute("aria-selected",String(b.textContent===k)))};
      keys.forEach(k=>tb.append(h("button",{type:"button",textContent:k,role:"tab",onclick(){show(k)}})));if(keys.length)show(keys[0]);
      const links=arr(p.links).filter(l=>l&&txt(l.u)).map(l=>h("a",{className:"btn",href:safeUrl(l.u),textContent:l.t||"Link",target:"_blank",rel:"noopener noreferrer"}));
      return h("article",{className:"card proj"},[txt(p.img)?img(p.img,p.title):h("div",{className:"ph"}),
        h("div",{className:"body"},[h("div",{className:"date",textContent:p.date||""}),h("h3",{textContent:p.title}),chips(p.tags),keys.length?tb:"",keys.length?pane:"",links.length?h("p",{},links):""])])}))};
  draw();
});
run(()=>{ if(!$("conference"))return;
  const cnt={};D.conference.forEach(c=>{const t=c.type||"Event";cnt[t]=(cnt[t]||0)+1});
  Object.entries(cnt).forEach(([t,n])=>$("stats").append(h("div",{},[h("b",{textContent:String(n)}),t+(n>1?"s":"")])));
  D.conference.forEach(c=>$("confList").append(h("div",{className:"card"},[
    arr(c.imgs).length?h("div",{className:"shots"},arr(c.imgs).slice(0,3).map(i=>img(i,c.event))):"",
    h("h3",{textContent:c.event||c.title}),h("div",{className:"meta",textContent:[c.type,c.place,c.date].filter(txt).join(" · ")}),txt(c.event)&&txt(c.title)?h("p",{textContent:c.title}):""])));
});
const list=(id,k)=>run(()=>{ if(!$(id))return;
  D[k].forEach(x=>$(id).append(h("div",{className:"card"},[h("h3",{textContent:x.title}),h("div",{className:"meta",textContent:[x.org,x.year].filter(txt).join(" · ")}),txt(x.text)?h("p",{textContent:x.text}):""])))});
list("trainList","training");list("awardList","awards");list("affList","affiliations");
run(()=>{ if(!$("contact"))return;
  const c=$("contactCard");c.append(h("h3",{textContent:"Details"}));
  if(txt(S.location))c.append(h("p",{textContent:S.location}));
  if(okMail(S.email))c.append(h("p",{},[h("a",{href:"mailto:"+S.email,textContent:S.email})]));
  else $("form").remove();
  $("form")&&($("form").onsubmit=e=>{e.preventDefault();location.href="mailto:"+S.email+"?subject="+encodeURIComponent($("fs").value)+"&body="+encodeURIComponent($("fm").value.slice(0,1000))});
});
run(()=>{txt(S.quote)?$("quote").textContent="“"+S.quote+"”":$("quote").remove();$("foot").textContent="© "+new Date().getFullYear()+" "+(S.name||"")});

/* ---- 4. Navigation lists only the sections that exist ---- */
run(()=>{
  const map=[["hero","Home"],["about","About"],["skills","Skills"],["experience","Experience"],["projects","Projects"],["conference","Conference"],["training","Development"],["awards","Awards"],["affiliations","Affiliations"],["contact","Contact"]].filter(([id])=>$(id));
  map.forEach(([id,t])=>$("nav").append(h("a",{href:"#"+id,textContent:t,onclick(){$("nav").classList.remove("open")}})));
  if(!("IntersectionObserver"in window))return;
  const as=[...document.querySelectorAll("#nav a")];
  map.forEach(([id])=>new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)as.forEach(a=>a.classList.toggle("on",a.hash==="#"+id))}),{rootMargin:"-40% 0px -55% 0px"}).observe($(id)));
});
