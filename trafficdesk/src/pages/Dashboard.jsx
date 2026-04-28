import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  ::-webkit-scrollbar{width:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}
  input,select,textarea{outline:none;-webkit-appearance:none}
  input::placeholder,textarea::placeholder{color:#475569}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
  .anim{animation:fadeUp .35s ease both}
  .card{transition:border-color .2s}
  .card:hover{border-color:rgba(255,255,255,.12)!important}
  .nav-btn{transition:all .15s}
  .nav-btn:hover{background:rgba(255,255,255,.04)!important}
  .btn-p{transition:all .15s}
  .btn-p:hover{filter:brightness(1.12);transform:translateY(-1px)}
  .tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;letter-spacing:.05em;border-radius:5px;padding:3px 8px}
  .rh{transition:background .12s}
  .rh:hover{background:rgba(255,255,255,.03)}
  .sdot{width:6px;height:6px;border-radius:50%;display:inline-block}
  .sdot.pulse{animation:pulse 2s infinite}
  .bottom-nav-btn{transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;border:none;background:transparent;padding:6px 10px;border-radius:10px;flex:1}
  .scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .scroll-x::-webkit-scrollbar{height:3px}
  @media(max-width:768px){
    .hide-mobile{display:none!important}
    .show-mobile{display:flex!important}
    .mob-full{width:100%!important}
    .mob-p{padding:14px!important}
    .mob-col{flex-direction:column!important}
    textarea{font-size:16px!important}
    input,select{font-size:16px!important}
  }
  @media(min-width:769px){
    .show-mobile{display:none!important}
    .hide-desktop{display:none!important}
  }
`;

const T = {
  bg:"#07090F", side:"#0C0F1A", card:"#111827",
  border:"rgba(255,255,255,.06)", borderMid:"rgba(255,255,255,.1)",
  accent:"#6366F1", meta:"#0081FB", google:"#4285F4",
  txt:"#F1F5F9", sub:"#94A3B8", mute:"#475569",
  ok:"#22C55E", warn:"#F59E0B", err:"#EF4444",
  font:"'Sora',system-ui,sans-serif", mono:"'JetBrains Mono',monospace",
};

// Clients, metaRows and googleRows are now built dynamically from connected accounts
const clients=[];
const metaRows=[];
const googleRows=[];
const spendTrend=[
  {w:"S1",meta:0,google:0},{w:"S2",meta:0,google:0},
  {w:"S3",meta:0,google:0},{w:"S4",meta:0,google:0},
  {w:"S5",meta:0,google:0},{w:"S6",meta:0,google:0},
];
const roasChart=[
  {name:"Alpha",meta:0,google:0},{name:"Beta",meta:0,google:null},
  {name:"Gama",meta:null,google:0},{name:"Delta",meta:0,google:0},
  {name:"Epsilon",meta:0,google:null},
];
const alerts=[
  {id:1,sev:"high",client:"Startup Gama",msg:"Orçamento esgotado — campanha pausada",age:"2h",plat:"google"},
  {id:2,sev:"med",client:"Loja Beta",msg:"CTR abaixo de 1% por 3 dias consecutivos",age:"5h",plat:"meta"},
  {id:3,sev:"med",client:"Empresa Alpha",msg:"ROAS em queda: 4.2 → 3.1 em 7 dias",age:"1d",plat:"meta"},
  {id:4,sev:"low",client:"Clínica Epsilon",msg:"Impressões 32% abaixo da média anterior",age:"1d",plat:"meta"},
];
const initTasks=[
  {id:1,title:"Revisar criativos Loja Beta",client:"Loja Beta",status:"doing",priority:"high",due:"Hoje"},
  {id:2,title:"Relatório mensal Empresa Alpha",client:"Empresa Alpha",status:"todo",priority:"med",due:"27/04"},
  {id:3,title:"Otimizar palavras-chave Startup Gama",client:"Startup Gama",status:"done",priority:"high",due:"Concluído"},
  {id:4,title:"A/B test criativos Marca Delta",client:"Marca Delta",status:"doing",priority:"med",due:"28/04"},
  {id:5,title:"Aumentar orçamento Google Marca Delta",client:"Marca Delta",status:"todo",priority:"low",due:"30/04"},
  {id:6,title:"Campanha Stories Clínica Epsilon",client:"Clínica Epsilon",status:"todo",priority:"med",due:"29/04"},
];

const fR=(n)=>`R$ ${n.toLocaleString("pt-BR")}`;
const sevC={high:T.err,med:T.warn,low:"#60a5fa"};
const sevL={high:"Crítico",med:"Atenção",low:"Info"};
const sevBg={high:"rgba(239,68,68,.07)",med:"rgba(245,158,11,.07)",low:"rgba(96,165,250,.07)"};

const PTag=({p})=>(
  <span className="tag" style={{background:p==="meta"?"rgba(0,129,251,.12)":"rgba(66,133,244,.12)",color:p==="meta"?T.meta:T.google}}>
    <span className="sdot" style={{background:p==="meta"?T.meta:T.google}}></span>
    {p==="meta"?"Meta":"Google"}
  </span>
);

const SBadge=({s})=>{
  const m={active:[T.ok,"rgba(34,197,94,.1)","Ativo",true],warning:[T.warn,"rgba(245,158,11,.1)","Atenção",false],paused:[T.mute,"rgba(71,85,105,.15)","Pausado",false]};
  const[c,bg,l,pulse]=m[s]||m.paused;
  return <span className="tag" style={{background:bg,color:c}}><span className={`sdot${pulse?" pulse":""}`} style={{background:c}}></span>{l}</span>;
};

const MCard=({label,value,sub,accent,up,m})=>(
  <div className="card anim" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:m?"14px 16px":"20px 22px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accent,borderRadius:"14px 14px 0 0"}}></div>
    <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",textTransform:"uppercase",fontWeight:500,marginBottom:m?6:10}}>{label}</div>
    <div style={{fontFamily:T.mono,fontSize:m?20:28,color:T.txt,fontWeight:500,letterSpacing:"-0.01em",marginBottom:m?3:6}}>{value}</div>
    <div style={{fontSize:m?10:12,color:up===true?T.ok:up===false?T.err:T.sub,display:"flex",alignItems:"center",gap:4}}>
      {up===true&&"↑ "}{up===false&&"↓ "}{sub}
    </div>
  </div>
);

const TipC=({active,payload})=>{
  if(!active||!payload?.length)return null;
  return(
    <div style={{background:"#1a2235",border:`1px solid ${T.borderMid}`,borderRadius:10,padding:"10px 14px",fontSize:12,fontFamily:T.font}}>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:i<payload.length-1?4:0}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.color,display:"inline-block"}}></span>
          <span style={{color:T.sub}}>{p.name}:</span>
          <span style={{color:T.txt,fontFamily:T.mono}}>{p.value!=null?(p.value>100?fR(p.value):p.value+"x"):"–"}</span>
        </div>
      ))}
    </div>
  );
};

const IcoGrid=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="1" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><rect x="8" y="8" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>;
const IcoPpl=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1.5 13c0-3.038 2.462-5.5 5.5-5.5S12.5 9.962 12.5 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IcoList=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M2 7h10M2 10.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IcoChart=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 12.5v-4h3v4H1.5zM5.5 12.5V5.5h3v7H5.5zM9.5 12.5V2h3v10.5H9.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>;
const IcoDl=()=><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5.5l3 3.5 3-3.5M1 11h10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoPlug=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><rect x="2" y="4" width="10" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 8v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M5 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IcoCheck=()=><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoRefresh=()=><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32L11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 2v3H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IcoEye=()=><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><ellipse cx="6.5" cy="6.5" rx="5" ry="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>;
const IcoEyeOff=()=><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2l9 9M5.2 5.3A1.5 1.5 0 0 0 7.7 7.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M3.5 3.8C2.5 4.5 1.8 5.5 1.5 6.5c.8 2.2 3 3.5 5 3.5a6 6 0 0 0 2.2-.4M5.5 2.6A6 6 0 0 1 6.5 2.5c2 0 4.2 1.3 5 3.5-.3.8-.8 1.5-1.4 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;

const IcoWA=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.2A5.8 5.8 0 0 0 1.5 8.1c0 1.02.27 2 .74 2.85L1.2 13l2.12-.53A5.8 5.8 0 1 0 7 1.2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5.2 5.5c.1.3.4.9.9 1.3.5.5 1.1.8 1.4.9.2.07.4.04.55-.1l.4-.4c.15-.15.37-.17.55-.06l1.1.65c.2.12.25.38.12.56-.3.44-.9 1-1.5.88-1-.2-2.5-1-3.3-2.6-.35-.7-.2-1.3.1-1.6.17-.17.43-.2.6-.07z" fill="currentColor"/></svg>;
const IcoSend=()=><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M11.5 1.5L1.5 6l4 1.5 1.5 4 4.5-10z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5.5 7.5l3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const IcoCopy=({c="#94A3B8"})=><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.2"/><path d="M3 8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1" stroke={c} strokeWidth="1.2"/></svg>;

const navItems=[
  {id:"dashboard",label:"Dashboard",Icon:IcoGrid},
  {id:"clients",label:"Clientes",Icon:IcoPpl},
  {id:"tasks",label:"Tarefas",Icon:IcoList},
  {id:"reports",label:"Relatórios",Icon:IcoChart},
  {id:"whatsapp",label:"WhatsApp",Icon:IcoWA},
  {id:"connections",label:"Conexões",Icon:IcoPlug},
];

const ax={fill:T.mute,fontSize:11,fontFamily:"'Sora',system-ui"};
const grid={strokeDasharray:"3 3",stroke:"rgba(255,255,255,.04)"};

const initMeta={appId:"",appSecret:"",accessToken:"",bmId:""};
const initGoogle={clientId:"",clientSecret:"",devToken:"",customerId:""};
const mockMetaAccounts=[
  {id:"123456789",name:"Empresa Alpha — BM",spend:"R$ 15.400",status:"active"},
  {id:"987654321",name:"Marca Delta — BM",spend:"R$ 20.700",status:"active"},
  {id:"111222333",name:"Loja Beta — BM",spend:"R$ 5.100",status:"active"},
];
const mockGoogleAccounts=[
  {id:"123-456-7890",name:"Empresa Alpha — MCC",spend:"R$ 7.100",status:"active"},
  {id:"098-765-4321",name:"Startup Gama — MCC",spend:"R$ 4.200",status:"active"},
  {id:"555-666-7777",name:"Marca Delta — MCC",spend:"R$ 11.200",status:"active"},
];

const WA="#25D366";
const initWACampaigns=[
  {id:1,name:"Black Friday — Loja Beta",client:"Loja Beta",status:"completed",total:0,sent:0,delivered:0,read:0,replied:0,converted:0,createdAt:"20/04",scheduledAt:"20/04 10:00",msg:""},
  {id:2,name:"Reengajamento — Clínica Epsilon",client:"Clínica Epsilon",status:"sending",total:0,sent:0,delivered:0,read:0,replied:0,converted:0,createdAt:"25/04",scheduledAt:"25/04 09:00",msg:""},
  {id:3,name:"Lançamento Produto — Marca Delta",client:"Marca Delta",status:"scheduled",total:0,sent:0,delivered:0,read:0,replied:0,converted:0,createdAt:"25/04",scheduledAt:"28/04 14:00",msg:""},
  {id:4,name:"Follow-up Leads — Empresa Alpha",client:"Empresa Alpha",status:"draft",total:0,sent:0,delivered:0,read:0,replied:0,converted:0,createdAt:"26/04",scheduledAt:"",msg:""},
];
const initWACfg={url:"",token:"",instance:""};
const N8N_WEBHOOK_EX="https://seu-n8n.com/webhook/wa-tracking";
const N8N_FLOW=`{
  "nodes": [
    {
      "name": "Webhook — Recebe Status",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "wa-tracking",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Switch — Tipo de Evento",
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "rules": [
          {"value1": "={{$json.event}}", "operation": "equals", "value2": "message.delivered"},
          {"value1": "={{$json.event}}", "operation": "equals", "value2": "message.read"},
          {"value1": "={{$json.event}}", "operation": "equals", "value2": "message.reply"}
        ]
      }
    },
    {
      "name": "HTTP — Atualiza Dashboard",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://seu-backend.com/api/campaign-tracking",
        "method": "POST",
        "body": {
          "campaignId": "={{$json.campaignId}}",
          "phone": "={{$json.phone}}",
          "event": "={{$json.event}}",
          "timestamp": "={{$now}}"
        }
      }
    }
  ]
}`;

export default function Dashboard(){
  const[view,setView]=useState("dashboard");
  const[isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  const{user,signOut}=useAuth();
  const navigate=useNavigate();
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  const[tasks,setTasks]=useState(initTasks);
  const[showNew,setShowNew]=useState(false);
  const[nt,setNt]=useState({title:"",client:"",priority:"med"});
  const[tf,setTf]=useState("all");

  // WhatsApp state
  const[waCampaigns,setWaCampaigns]=useState(initWACampaigns);
  const[waCfg,setWaCfg]=useState(initWACfg);
  const[waConnected,setWaConnected]=useState(false);
  const[waConnecting,setWaConnecting]=useState(false);
  const[waTab,setWaTab]=useState("campaigns"); // campaigns | new | config | n8n
  const[newCamp,setNewCamp]=useState({name:"",client:"",msg:"",scheduledAt:"",contacts:""});
  const[selectedCamp,setSelectedCamp]=useState(null);
  const[copied,setCopied]=useState(false);

  // Report state
  const[repClient,setRepClient]=useState("all");
  const[repPlatform,setRepPlatform]=useState("all");
  const[repPeriod,setRepPeriod]=useState("30d");
  const copyText=(t)=>{navigator.clipboard.writeText(t).catch(()=>{});setCopied(true);setTimeout(()=>setCopied(false),1800);};
  const connectWA=()=>{
    if(!waCfg.url||!waCfg.token||!waCfg.instance)return;
    setWaConnecting(true);
    setTimeout(()=>{setWaConnecting(false);setWaConnected(true);},2000);
  };
  const createCampaign=()=>{
    if(!newCamp.name||!newCamp.client||!newCamp.msg)return;
    const total=parseInt(newCamp.contacts)||0;
    setWaCampaigns([...waCampaigns,{id:Date.now(),name:newCamp.name,client:newCamp.client,status:"draft",total,sent:0,delivered:0,read:0,replied:0,converted:0,createdAt:"26/04",scheduledAt:newCamp.scheduledAt,msg:newCamp.msg}]);
    setNewCamp({name:"",client:"",msg:"",scheduledAt:"",contacts:""});
    setWaTab("campaigns");
  };
  const sendCampaign=(id)=>{
    setWaCampaigns(cs=>cs.map(c=>{
      if(c.id!==id)return c;
      const total=c.total||Math.floor(Math.random()*500+100);
      return{...c,status:"sending",total,sent:Math.floor(total*.4)};
    }));
  };

  // Connections state
  const[metaForm,setMetaForm]=useState(initMeta);
  const[googleForm,setGoogleForm]=useState(initGoogle);
  const[metaStatus,setMetaStatus]=useState("idle");
  const[googleStatus,setGoogleStatus]=useState("idle");
  const[metaAccounts,setMetaAccounts]=useState([]);
  const[googleAccounts,setGoogleAccounts]=useState([]);
  const[showMetaSecret,setShowMetaSecret]=useState(false);
  const[showGoogleSecret,setShowGoogleSecret]=useState(false);
  const[showGoogleDev,setShowGoogleDev]=useState(false);
  const[metaStep,setMetaStep]=useState(0);
  const[googleStep,setGoogleStep]=useState(0);
  const[connTab,setConnTab]=useState("connect");
  const[metaError,setMetaError]=useState("");
  const[liveMetrics,setLiveMetrics]=useState(null);
  const[fetchingInsights,setFetchingInsights]=useState(false);

  // Build dynamic clients from connected accounts
  const dynClients=[
    ...metaAccounts.map((a,i)=>({
      id:`meta-${i}`,name:a.name,
      short:a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      platforms:["meta"],budget:0,status:a.status||"active",
      accountId:a.id,spend:a.spend,
    })),
    ...googleAccounts.map((a,i)=>({
      id:`google-${i}`,name:a.name,
      short:a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
      platforms:["google"],budget:0,status:a.status||"active",
      accountId:a.id,spend:a.spend,
    })),
  ];
  const activeClients=dynClients.length>0?dynClients:clients;

  const GRAPH="https://graph.facebook.com/v19.0";

  // Fetch real insights for all connected accounts
  const fetchInsights=async(accounts,token,period="last_30d")=>{
    setFetchingInsights(true);
    try{
      const results=await Promise.all(
        accounts.map(async(acc)=>{
          const res=await fetch(
            `${GRAPH}/act_${acc.id}/insights`+
            `?fields=impressions,reach,clicks,ctr,cpc,spend,actions,action_values,frequency`+
            `&date_preset=${period}&level=account`+
            `&access_token=${token}`
          );
          const data=await res.json();
          if(data.error||!data.data?.[0])return null;
          const d=data.data[0];
          const conv=d.actions?.find(a=>a.action_type==="purchase"||a.action_type==="lead"||a.action_type==="complete_registration");
          const convVal=d.action_values?.find(a=>a.action_type==="purchase"||a.action_type==="lead");
          return{
            client:acc.name,
            accountId:acc.id,
            impressoes:parseInt(d.impressions)||0,
            alcance:parseInt(d.reach)||0,
            ctr:parseFloat(d.ctr||0).toFixed(2),
            cpc:parseFloat(d.cpc||0).toFixed(2),
            investido:parseFloat(d.spend||0).toFixed(2),
            conversoes:parseInt(conv?.value||0),
            valorResult:parseFloat(convVal?.value||0).toFixed(2),
          };
        })
      );
      const valid=results.filter(Boolean);
      if(valid.length>0)setLiveMetrics(valid);
    }catch(e){console.error("Insights fetch error:",e);}
    finally{setFetchingInsights(false);}
  };

  const connectMeta=async()=>{
    if(!metaForm.accessToken||!metaForm.bmId)return;
    setMetaStatus("connecting");
    setMetaError("");
    try{
      const meRes=await fetch(`${GRAPH}/me?fields=id,name&access_token=${metaForm.accessToken}`);
      const meData=await meRes.json();
      if(meData.error)throw new Error(meData.error.message);

      const accsRes=await fetch(
        `${GRAPH}/${metaForm.bmId}/owned_ad_accounts`+
        `?fields=id,name,account_status,currency,timezone_name,amount_spent`+
        `&access_token=${metaForm.accessToken}&limit=20`
      );
      const accsData=await accsRes.json();
      if(accsData.error)throw new Error(accsData.error.message);

      const accounts=(accsData.data||[]).map(a=>({
        id:a.id.replace("act_",""),
        name:a.name,
        status:a.account_status===1?"active":"inactive",
        currency:a.currency||"BRL",
        spend:a.amount_spent
          ?`${a.currency||"R$"} ${(parseInt(a.amount_spent)/100).toLocaleString("pt-BR",{minimumFractionDigits:2})}`
          :"R$ 0,00",
      }));

      const finalAccounts=accounts.length>0?accounts:[{id:metaForm.bmId,name:`BM ${meData.name}`,status:"active",spend:"R$ 0,00"}];
      setMetaAccounts(finalAccounts);
      setMetaStatus("connected");
      setMetaStep(2);

      // Busca insights reais automaticamente após conectar
      await fetchInsights(finalAccounts,metaForm.accessToken);
    }catch(err){
      setMetaStatus("error");
      setMetaError(err.message||"Erro ao conectar. Verifique o token e o BM ID.");
    }
  };

  const disconnectMeta=()=>{setMetaStatus("idle");setMetaAccounts([]);setMetaForm(initMeta);setMetaStep(0);setMetaError("");setLiveMetrics(null);};

  const connectGoogle=()=>{
    if(!googleForm.clientId||!googleForm.clientSecret||!googleForm.devToken)return;
    setGoogleStatus("connecting");
    setTimeout(()=>{setGoogleStatus("connected");setGoogleAccounts(mockGoogleAccounts);setGoogleStep(2);},2000);
  };
  const disconnectGoogle=()=>{setGoogleStatus("idle");setGoogleAccounts([]);setGoogleForm(initGoogle);setGoogleStep(0);};

  // Use live Meta API data when connected, fallback to static zeros
  const liveRows=liveMetrics||[];
  const totMeta=liveRows.length>0
    ?liveRows.reduce((s,d)=>s+parseFloat(d.investido),0)
    :metaRows.reduce((s,d)=>s+d.spend,0);
  const totGoogle=googleRows.reduce((s,d)=>s+d.spend,0);
  const total=totMeta+totGoogle;
  const avgMROAS=liveRows.length>0
    ?(()=>{const totalInv=liveRows.reduce((s,d)=>s+parseFloat(d.investido),0);const totalVal=liveRows.reduce((s,d)=>s+parseFloat(d.valorResult),0);return totalInv>0?(totalVal/totalInv).toFixed(1):"0.0";})()
    :(metaRows.reduce((s,d)=>s+d.roas,0)/metaRows.length).toFixed(1);
  const avgGROAS=(googleRows.reduce((s,d)=>s+d.roas,0)/googleRows.length).toFixed(1);
  const crit=alerts.filter(a=>a.sev==="high").length;

  // Live dashboard rows for Meta
  const activeMeta=liveRows.length>0
    ?liveRows.map(d=>({client:d.client,spend:parseFloat(d.investido),ctr:parseFloat(d.ctr),cpc:parseFloat(d.cpc),conv:d.conversoes,roas:d.investido>0?(parseFloat(d.valorResult)/parseFloat(d.investido)).toFixed(1):0}))
    :metaRows;

  const addTask=()=>{
    if(!nt.title||!nt.client)return;
    setTasks([...tasks,{id:Date.now(),...nt,status:"todo",due:"–"}]);
    setNt({title:"",client:"",priority:"med"});setShowNew(false);
  };
  const move=(id,status)=>setTasks(tasks.map(t=>t.id===id?{...t,status}:t));
  const exportCSV=()=>{
    const rows=[["Plataforma","Cliente","Gasto","CTR","CPC","Conv","ROAS"],
      ...metaRows.map(d=>["Meta",d.client,d.spend,d.ctr,d.cpc,d.conv,d.roas]),
      ...googleRows.map(d=>["Google",d.client,d.spend,d.ctr,d.cpc,d.conv,d.roas])];
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob(["\uFEFF"+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv;charset=utf-8;"}));
    a.download="relatorio_ads.csv";a.click();
  };

  const P=isMobile?"14px":"22px 28px";
  const navIcons={dashboard:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/></svg>,clients:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,tasks:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 5h12M4 10h12M4 15h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,reports:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 17V9l4-4 4 4 4-4v12H3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>,whatsapp:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a8 8 0 0 0-6.9 12.1L2 18l3.9-1.1A8 8 0 1 0 10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M7.5 7.5c.2.4.6 1.2 1.2 1.8.7.7 1.5 1.1 1.8 1.2.2.1.5.05.7-.1l.5-.5c.2-.2.5-.22.7-.08l1.4.85c.24.14.3.46.15.68-.38.55-1.1 1.2-1.8 1.1-1.2-.25-3-1.2-4-3-.42-.82-.25-1.5.1-1.9.2-.2.5-.24.7-.08z" fill="currentColor"/></svg>,connections:<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M6.5 2v4M13.5 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="3" y="6" width="14" height="5" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M10 11v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7.5 18h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>};
  return(
    <div style={{display:"flex",height:"100vh",background:T.bg,color:T.txt,fontFamily:T.font,fontSize:13,overflow:"hidden",position:"relative"}}>
      <style>{G}</style>

      {/* ── Sidebar (desktop) ── */}
      {!isMobile&&(
        <div style={{width:224,minWidth:224,background:T.side,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"22px 18px 18px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:9,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11.5 7 2.5l5 9H2z" fill="white"/></svg></div>
              <div><div style={{fontSize:14,fontWeight:600,letterSpacing:"-0.01em",color:T.txt}}>TrafficDesk</div><div style={{fontSize:10,color:T.mute,marginTop:1}}>Performance Manager</div></div>
            </div>
          </div>
          <nav style={{padding:"12px 8px",flex:1}}>
            <div style={{fontSize:10,color:T.mute,letterSpacing:".1em",padding:"0 10px 8px",fontWeight:500}}>MENU</div>
            {navItems.map(({id,label,Icon})=>{const on=view===id;return(<button key={id} className="nav-btn" onClick={()=>setView(id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"9px 12px",borderRadius:9,border:"none",cursor:"pointer",background:on?"rgba(99,102,241,.13)":"transparent",color:on?T.accent:T.sub,fontSize:13,fontWeight:on?500:400,textAlign:"left",marginBottom:2,fontFamily:T.font}}><Icon/>{label}{id==="dashboard"&&crit>0&&<span style={{marginLeft:"auto",width:17,height:17,borderRadius:"50%",background:T.err,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{crit}</span>}</button>);})}
          </nav>
          <div style={{margin:"0 8px 14px",background:"rgba(255,255,255,.03)",borderRadius:11,border:`1px solid ${T.border}`,padding:"14px 16px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{l:"Clientes",v:activeClients.length,c:T.ok},{l:"Alertas",v:alerts.length,c:crit>0?T.err:T.warn}].map(x=>(<div key={x.l}><div style={{fontSize:10,color:T.mute,marginBottom:4,fontWeight:500}}>{x.l}</div><div style={{fontFamily:T.mono,fontSize:22,fontWeight:500,color:x.c}}>{x.v}</div></div>))}
            </div>
          </div>
          {/* User info + Logout */}
          <div style={{margin:"0 8px 14px",borderTop:`1px solid ${T.border}`,paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 8px",marginBottom:8}}>
              <div style={{width:28,height:28,borderRadius:8,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,flexShrink:0}}>
                {user?.email?.[0]?.toUpperCase()||"U"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:T.txt,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email}</div>
                <div style={{fontSize:9,color:T.mute,letterSpacing:".04em"}}>ADMIN</div>
              </div>
            </div>
            <button onClick={async()=>{await signOut();navigate("/login");}} style={{width:"100%",padding:"8px 12px",borderRadius:9,border:`1px solid rgba(239,68,68,.2)`,background:"rgba(239,68,68,.06)",color:T.err,cursor:"pointer",fontSize:11,fontWeight:500,fontFamily:T.font,display:"flex",alignItems:"center",gap:7,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,.12)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,.06)";}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5 12H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h3M9 9l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sair da conta
            </button>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Topbar */}
        <div style={{height:isMobile?52:58,padding:`0 ${isMobile?14:28}px`,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.side,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isMobile&&<div style={{width:26,height:26,borderRadius:7,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 11.5 7 2.5l5 9H2z" fill="white"/></svg></div>}
            <div style={{fontSize:isMobile?13:15,fontWeight:600,color:T.txt,letterSpacing:"-0.01em"}}>
              {{dashboard:"Visão Geral",clients:"Clientes",tasks:"Tarefas",reports:"Relatórios",whatsapp:"WhatsApp",connections:"Conexões"}[view]}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {crit>0&&<button onClick={()=>setView("dashboard")} style={{background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.25)`,borderRadius:8,padding:"4px 10px",fontSize:10,color:T.err,fontWeight:500,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:5}}><span className="sdot pulse" style={{background:T.err}}></span>{isMobile?crit:`${crit} alerta${crit>1?"s":""}`}</button>}
            {!isMobile&&<div style={{fontSize:11,color:T.mute,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px"}}>26 abr 2026</div>}
          </div>
        </div>

        <div style={{padding:P,flex:1}}>

          {/* ═══════ DASHBOARD ═══════ */}
          {view==="dashboard"&&(
            <div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:12,marginBottom:isMobile?14:18}}>
                <MCard label="Gasto Total" value={`R$ ${(total/1000).toFixed(1)}k`} sub="período atual" accent={T.accent} m={isMobile}/>
                <MCard label="ROAS Meta" value={avgMROAS+"x"} sub="acima da semana passada" accent={T.meta} up={true} m={isMobile}/>
                <MCard label="ROAS Google" value={avgGROAS+"x"} sub="estável" accent={T.google} m={isMobile}/>
                <MCard label="Alertas" value={alerts.length} sub={`${crit} crítico${crit!==1?"s":""}`} accent={T.err} up={false} m={isMobile}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 360px",gap:12,marginBottom:12}}>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {/* Live banner */}
                  {fetchingInsights&&<div style={{background:"rgba(99,102,241,.08)",border:`1px solid rgba(99,102,241,.2)`,borderRadius:10,padding:"10px 16px",fontSize:12,color:T.accent,display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{width:12,height:12,border:"2px solid rgba(99,102,241,.3)",borderTop:`2px solid ${T.accent}`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}></span>Buscando dados reais da Meta API...</div>}
                  {liveMetrics&&!fetchingInsights&&<div style={{background:"rgba(34,197,94,.07)",border:"1px solid rgba(34,197,94,.2)",borderRadius:10,padding:"8px 14px",fontSize:11,color:T.ok,display:"flex",alignItems:"center",gap:6,marginBottom:10}}>✅ Dados reais da Meta API — {liveMetrics.length} conta(s) sincronizada(s)</div>}
                  {[{label:"Meta Ads",color:T.meta,rows:activeMeta,tot:totMeta,lowCTR:1.2},{label:"Google Ads",color:T.google,rows:googleRows,tot:totGoogle,lowCTR:2}].map(pl=>(
                    <div key={pl.label} className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                        <span style={{width:8,height:8,borderRadius:"50%",background:pl.color,display:"inline-block"}}></span>
                        <span style={{fontSize:13,fontWeight:600,color:T.txt}}>{pl.label}</span>
                        <span style={{marginLeft:"auto",fontFamily:T.mono,fontSize:13,color:T.sub}}>{fR(pl.tot)}</span>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead><tr>
                          {["Cliente","Gasto","CTR","CPC","ROAS"].map(h=>(
                            <th key={h} style={{textAlign:"left",padding:"0 0 10px",color:T.mute,fontWeight:500,fontSize:10,letterSpacing:".07em",textTransform:"uppercase"}}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {pl.rows.map((d,i)=>(
                            <tr key={i} className="rh" style={{borderTop:`1px solid ${T.border}`}}>
                              <td style={{padding:"10px 0",fontWeight:500,color:T.txt}}>{d.client.split(" ").slice(0,2).join(" ")}</td>
                              <td style={{padding:"10px 0",fontFamily:T.mono,color:T.sub}}>R${(d.spend/1000).toFixed(1)}k</td>
                              <td style={{padding:"10px 0",fontFamily:T.mono,color:d.ctr<pl.lowCTR?T.err:T.ok}}>{d.ctr}%</td>
                              <td style={{padding:"10px 0",fontFamily:T.mono,color:T.sub}}>R${d.cpc}</td>
                              <td style={{padding:"10px 0"}}>
                                <span style={{fontFamily:T.mono,fontSize:12,background:d.roas<3?"rgba(245,158,11,.1)":"rgba(34,197,94,.1)",color:d.roas<3?T.warn:T.ok,borderRadius:5,padding:"2px 8px"}}>{d.roas}x</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* Alerts */}
                <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 20px",display:"flex",flexDirection:"column"}}>
                  <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:14}}>ALERTAS DE PERFORMANCE</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {alerts.map(a=>(
                      <div key={a.id} style={{background:sevBg[a.sev],borderRadius:10,border:`1px solid rgba(255,255,255,.04)`,borderLeft:`3px solid ${sevC[a.sev]}`,padding:"12px 14px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                          <span style={{fontSize:9,fontWeight:700,color:sevC[a.sev],letterSpacing:".06em"}}>{sevL[a.sev].toUpperCase()}</span>
                          <PTag p={a.plat}/>
                          <span style={{marginLeft:"auto",fontSize:10,color:T.mute}}>{a.age}</span>
                        </div>
                        <div style={{fontSize:12,fontWeight:600,color:T.txt,marginBottom:3}}>{a.client}</div>
                        <div style={{fontSize:11,color:T.sub,lineHeight:1.55}}>{a.msg}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500}}>INVESTIMENTO SEMANAL</div>
                  <div style={{display:"flex",gap:16}}>
                    {[{c:T.meta,l:"Meta Ads"},{c:T.google,l:"Google Ads"}].map(x=>(
                      <span key={x.l} style={{fontSize:11,color:T.sub,display:"flex",alignItems:"center",gap:5}}>
                        <span style={{width:12,height:3,borderRadius:2,background:x.c,display:"inline-block"}}></span>{x.l}
                      </span>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={spendTrend}>
                    <defs>
                      <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.meta} stopOpacity={.22}/><stop offset="100%" stopColor={T.meta} stopOpacity={0}/></linearGradient>
                      <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.google} stopOpacity={.22}/><stop offset="100%" stopColor={T.google} stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid {...grid}/><XAxis dataKey="w" tick={ax} axisLine={false} tickLine={false}/>
                    <YAxis tick={ax} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={46}/>
                    <Tooltip content={<TipC/>}/>
                    <Area type="monotone" dataKey="meta" stroke={T.meta} strokeWidth={2} fill="url(#gM)" name="Meta Ads" dot={false}/>
                    <Area type="monotone" dataKey="google" stroke={T.google} strokeWidth={2} fill="url(#gG)" name="Google Ads" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ═══════ CLIENTS ═══════ */}
          {view==="clients"&&(
            <div>
              {activeClients.length===0?(
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}>
                  <div style={{width:60,height:60,borderRadius:16,background:"rgba(99,102,241,.1)",border:`1px solid rgba(99,102,241,.2)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,fontSize:28}}>🔌</div>
                  <div style={{fontSize:16,fontWeight:600,color:T.txt,marginBottom:8}}>Nenhuma conta conectada</div>
                  <div style={{fontSize:13,color:T.mute,maxWidth:320,lineHeight:1.7,marginBottom:20}}>Conecte seu Business Manager ou Google Ads para ver suas contas aqui automaticamente.</div>
                  <button onClick={()=>setView("connections")} className="btn-p" style={{padding:"10px 22px",borderRadius:10,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font}}>
                    Ir para Conexões →
                  </button>
                </div>
              ):(
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(288px,1fr))",gap:12}}>
              {activeClients.map(c=>{
                const lm=liveMetrics?.find(d=>d.accountId===c.accountId);
                const tot=lm?parseFloat(lm.investido):0;
                const budget=c.budget||0;
                const pct=budget>0?Math.min(Math.round((tot/budget)*100),100):0;
                const bc=pct>90?T.err:pct>70?T.warn:T.ok;
                return(
                  <div key={c.id} className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:38,height:38,borderRadius:10,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.accent}}>{c.short}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:5}}>{c.name}</div>
                          <div style={{display:"flex",gap:4}}>{c.platforms.map(p=><PTag key={p} p={p}/>)}</div>
                        </div>
                      </div>
                      <SBadge s={c.status}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                      {[
                        {l:"Gasto",v:lm?`R$ ${parseFloat(lm.investido).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:"R$ 0,00"},
                        {l:"Impressões",v:lm?parseInt(lm.impressoes).toLocaleString("pt-BR"):"0"},
                        {l:"CTR",v:lm?lm.ctr+"%":"0%"},
                        {l:"CPC",v:lm?`R$ ${lm.cpc}`:"R$ 0,00"},
                        {l:"Conversões",v:lm?lm.conversoes:"0"},
                        {l:"ROAS",v:lm&&parseFloat(lm.investido)>0?(parseFloat(lm.valorResult)/parseFloat(lm.investido)).toFixed(2)+"x":"0x"},
                      ].map((m,i)=>(
                        <div key={i} style={{background:"rgba(255,255,255,.03)",borderRadius:8,border:`1px solid ${T.border}`,padding:"10px 12px"}}>
                          <div style={{fontSize:9,color:T.mute,marginBottom:4,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase"}}>{m.l}</div>
                          <div style={{fontFamily:T.mono,fontSize:14,color:T.txt}}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    {!lm&&metaStatus==="connected"&&<div style={{fontSize:11,color:T.warn,marginBottom:10}}>⏳ Aguardando dados da API...</div>}
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:10,color:T.mute}}>ID da conta</span>
                        <span style={{fontSize:10,fontFamily:T.mono,color:T.mute}}>{c.accountId||"–"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              )}
            </div>
          )}

          {/* ═══════ TASKS ═══════ */}
          {view==="tasks"&&(
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:isMobile?"wrap":"nowrap"}}>
                <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:9,padding:3,border:`1px solid ${T.border}`}}>
                  {["all","todo","doing","done"].map(f=>{
                    const lm={all:"Todas",todo:"Pendente",doing:"Andamento",done:"Concluído"};
                    const cnt=f==="all"?tasks.length:tasks.filter(t=>t.status===f).length;
                    return(
                      <button key={f} onClick={()=>setTf(f)} style={{padding:"6px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:T.font,background:tf===f?"rgba(99,102,241,.15)":"transparent",color:tf===f?T.accent:T.sub,fontSize:12,fontWeight:tf===f?500:400}}>
                        {lm[f]} <span style={{opacity:.55,fontFamily:T.mono}}>{cnt}</span>
                      </button>
                    );
                  })}
                </div>
                <button className="btn-p" onClick={()=>setShowNew(!showNew)} style={{marginLeft:"auto",padding:"8px 16px",borderRadius:9,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>
                  + Nova Tarefa
                </button>
              </div>

              {showNew&&(
                <div className="card" style={{background:T.card,borderRadius:12,border:`1px solid ${T.borderMid}`,padding:"16px 20px",marginBottom:14}}>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                    <div style={{flex:2,minWidth:200}}>
                      <div style={{fontSize:9,color:T.mute,marginBottom:6,fontWeight:500,letterSpacing:".08em",textTransform:"uppercase"}}>Tarefa</div>
                      <input value={nt.title} onChange={e=>setNt({...nt,title:e.target.value})} placeholder="Descrever a tarefa..."
                        style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:12,fontFamily:T.font}}/>
                    </div>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{fontSize:9,color:T.mute,marginBottom:6,fontWeight:500,letterSpacing:".08em",textTransform:"uppercase"}}>Cliente</div>
                      <select value={nt.client} onChange={e=>setNt({...nt,client:e.target.value})}
                        style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 12px",color:nt.client?T.txt:T.mute,fontSize:12,fontFamily:T.font}}>
                        <option value="">Selecionar...</option>
                        {activeClients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{flex:1,minWidth:110}}>
                      <div style={{fontSize:9,color:T.mute,marginBottom:6,fontWeight:500,letterSpacing:".08em",textTransform:"uppercase"}}>Prioridade</div>
                      <select value={nt.priority} onChange={e=>setNt({...nt,priority:e.target.value})}
                        style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:12,fontFamily:T.font}}>
                        <option value="high">Alta</option><option value="med">Média</option><option value="low">Baixa</option>
                      </select>
                    </div>
                    <button className="btn-p" onClick={addTask} style={{padding:"9px 20px",borderRadius:9,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font,flexShrink:0}}>
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
                {[{s:"todo",l:"Pendente",c:T.mute},{s:"doing",l:"Em andamento",c:T.warn},{s:"done",l:"Concluído",c:T.ok}].map(col=>{
                  const ct=tasks.filter(t=>t.status===col.s&&(tf==="all"||tf===col.s));
                  const prioC={high:T.err,med:T.warn,low:T.mute};
                  const prioL={high:"Alta",med:"Média",low:"Baixa"};
                  return(
                    <div key={col.s} style={{background:"rgba(255,255,255,.02)",borderRadius:12,border:`1px solid ${T.border}`,padding:"14px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14,padding:"0 2px"}}>
                        <span className="sdot" style={{background:col.c}}></span>
                        <span style={{fontSize:11,fontWeight:500,color:T.sub}}>{col.l}</span>
                        <span style={{marginLeft:"auto",background:"rgba(255,255,255,.06)",borderRadius:5,padding:"1px 8px",fontSize:10,fontFamily:T.mono,color:T.mute}}>{tasks.filter(t=>t.status===col.s).length}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {ct.map(task=>(
                          <div key={task.id} className="card" style={{background:T.card,borderRadius:10,border:`1px solid ${T.border}`,padding:"13px 14px"}}>
                            <div style={{fontSize:12,fontWeight:500,color:T.txt,lineHeight:1.45,marginBottom:10}}>{task.title}</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                              <span style={{fontSize:10,background:"rgba(255,255,255,.05)",borderRadius:5,padding:"2px 8px",color:T.sub}}>{task.client.split(" ")[0]}</span>
                              <span style={{fontSize:11,color:prioC[task.priority],display:"flex",alignItems:"center",gap:4}}>
                                <span style={{width:5,height:5,borderRadius:"50%",background:prioC[task.priority],display:"inline-block"}}></span>
                                {prioL[task.priority]}
                              </span>
                            </div>
                            <div style={{fontSize:10,color:T.mute,marginBottom:10}}>Prazo: {task.due}</div>
                            <div style={{display:"flex",gap:4}}>
                              {["todo","doing","done"].filter(s=>s!==col.s).map(s=>{
                                const bl={todo:"Pendente",doing:"Andamento",done:"Concluído"}[s];
                                return(
                                  <button key={s} onClick={()=>move(task.id,s)}
                                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
                                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.mute;}}
                                    style={{flex:1,padding:"5px 0",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.mute,cursor:"pointer",fontSize:10,fontFamily:T.font,transition:"all .14s"}}>
                                    {bl}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {ct.length===0&&<div style={{textAlign:"center",padding:"22px 0",fontSize:12,color:T.mute}}>Nenhuma tarefa</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ REPORTS ═══════ */}
          {view==="reports"&&(()=>{
            // Full data per client per platform
            const allData={
              "Empresa Alpha":{
                meta:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
                google:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
              },
              "Loja Beta":{
                meta:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
                google:null,
              },
              "Startup Gama":{
                meta:null,
                google:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
              },
              "Marca Delta":{
                meta:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
                google:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
              },
              "Clínica Epsilon":{
                meta:{impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0},
                google:null,
              },
            };

            // Weekly trend per client
            const trendData={
              "all":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
              "Empresa Alpha":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
              "Marca Delta":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
              "Loja Beta":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
              "Startup Gama":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
              "Clínica Epsilon":[
                {w:"S1",investido:0,conversoes:0},{w:"S2",investido:0,conversoes:0},
                {w:"S3",investido:0,conversoes:0},{w:"S4",investido:0,conversoes:0},
                {w:"S5",investido:0,conversoes:0},{w:"S6",investido:0,conversoes:0},
              ],
            };

            // Build merged metrics for selected client + platform
            const buildMetrics=(clientKey,plat)=>{
              const zero={impressoes:0,alcance:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0};
              if(clientKey==="all"){
                const entries=Object.values(allData);
                const mergePlat=(p)=>entries.reduce((acc,e)=>{
                  const d=e[p]; if(!d)return acc;
                  return{
                    impressoes:acc.impressoes+d.impressoes,alcance:acc.alcance+d.alcance,
                    ctr:0,cpc:0,investido:acc.investido+d.investido,
                    conversoes:acc.conversoes+d.conversoes,valorResult:acc.valorResult+d.valorResult,
                  };
                },{...zero});
                if(plat==="meta"){const m=mergePlat("meta");m.ctr=parseFloat((metaRows.reduce((s,d)=>s+d.ctr,0)/metaRows.length).toFixed(2));m.cpc=parseFloat((metaRows.reduce((s,d)=>s+d.cpc,0)/metaRows.length).toFixed(2));return m;}
                if(plat==="google"){const g=mergePlat("google");g.ctr=parseFloat((googleRows.reduce((s,d)=>s+d.ctr,0)/googleRows.length).toFixed(2));g.cpc=parseFloat((googleRows.reduce((s,d)=>s+d.cpc,0)/googleRows.length).toFixed(2));return g;}
                const m=mergePlat("meta");const g=mergePlat("google");
                return{impressoes:m.impressoes+g.impressoes,alcance:m.alcance+g.alcance,ctr:parseFloat(((m.ctr||0+g.ctr||0)/2).toFixed(2)),cpc:parseFloat((((metaRows.reduce((s,d)=>s+d.cpc,0)/metaRows.length)+(googleRows.reduce((s,d)=>s+d.cpc,0)/googleRows.length))/2).toFixed(2)),investido:m.investido+g.investido,conversoes:m.conversoes+g.conversoes,valorResult:m.valorResult+g.valorResult};
              }
              const e=allData[clientKey];
              if(!e)return zero;
              if(plat==="meta")return e.meta||zero;
              if(plat==="google")return e.google||zero;
              // both
              const md=e.meta||zero;const gd=e.google||zero;
              return{
                impressoes:md.impressoes+gd.impressoes,alcance:md.alcance+gd.alcance,
                ctr:parseFloat(((md.ctr+gd.ctr)/(e.meta&&e.google?2:e.meta?1:1)).toFixed(2)),
                cpc:parseFloat(((md.cpc+gd.cpc)/(e.meta&&e.google?2:e.meta?1:1)).toFixed(2)),
                investido:md.investido+gd.investido,conversoes:md.conversoes+gd.conversoes,
                valorResult:md.valorResult+gd.valorResult,
              };
            };

            const m=buildMetrics(repClient,repPlatform);
            const roas=m.investido>0?(m.valorResult/m.investido).toFixed(2):0;
            const cpl=m.conversoes>0?(m.investido/m.conversoes).toFixed(2):0;
            const trend=trendData[repClient]||trendData["all"];
            const clientObj=activeClients.find(c=>c.name===repClient);
            const hasMeta=repClient==="all"||allData[repClient]?.meta;
            const hasGoogle=repClient==="all"||allData[repClient]?.google;

            const exportClientCSV=()=>{
              const rows=[
                ["Métrica","Valor"],
                ["Cliente",repClient==="all"?"Todos os Clientes":repClient],
                ["Plataforma",repPlatform==="all"?"Todas":repPlatform==="meta"?"Meta Ads":"Google Ads"],
                ["Período",repPeriod],
                ["Impressões",m.impressoes.toLocaleString("pt-BR")],
                ["Alcance",m.alcance.toLocaleString("pt-BR")],
                ["CTR",m.ctr+"%"],
                ["CPC","R$ "+m.cpc],
                ["Valor Investido","R$ "+m.investido.toLocaleString("pt-BR")],
                ["Conversões",m.conversoes],
                ["Valor do Resultado","R$ "+m.valorResult.toLocaleString("pt-BR")],
                ["ROAS",roas+"x"],
                ["CPL","R$ "+cpl],
              ];
              const a=document.createElement("a");
              a.href=URL.createObjectURL(new Blob(["\uFEFF"+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv;charset=utf-8;"}));
              a.download=`relatorio_${(repClient==="all"?"geral":repClient.split(" ")[0]).toLowerCase()}_${repPeriod}.csv`;
              a.click();
            };

            const MetBox=({label,value,sub,accent,big})=>(
              <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:accent}}></div>
                <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",textTransform:"uppercase",fontWeight:500,marginBottom:8}}>{label}</div>
                <div style={{fontFamily:T.mono,fontSize:big?28:22,color:T.txt,fontWeight:500,letterSpacing:"-0.01em",marginBottom:4}}>{value}</div>
                {sub&&<div style={{fontSize:11,color:T.mute}}>{sub}</div>}
              </div>
            );

            const periodLabel={
              "7d":"Últimos 7 dias","30d":"Últimos 30 dias","90d":"Últimos 90 dias","custom":"Personalizado"
            };

            return(
              <div>
                {/* ── Selector bar ── */}
                <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px 20px",marginBottom:18,display:"flex",gap:isMobile?10:12,alignItems:isMobile?"flex-start":"center",flexWrap:"wrap",flexDirection:isMobile?"column":"row"}}>
                  {/* Client selector */}
                  <div style={{flex:2,minWidth:180}}>
                    <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:5}}>CONTA / CLIENTE</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {[{v:"all",l:"Todos"}, ...activeClients.map(c=>({v:c.name,l:c.name.split(" ").slice(0,2).join(" ")}))].map(opt=>(
                        <button key={opt.v} onClick={()=>setRepClient(opt.v)} style={{
                          padding:"6px 12px",borderRadius:8,border:`1px solid ${repClient===opt.v?T.accent+"88":T.border}`,
                          background:repClient===opt.v?"rgba(99,102,241,.12)":"transparent",
                          color:repClient===opt.v?T.accent:T.sub,fontSize:11,fontFamily:T.font,cursor:"pointer",fontWeight:repClient===opt.v?500:400,
                        }}>{opt.l}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{width:1,height:44,background:T.border,flexShrink:0}}></div>

                  {/* Platform */}
                  <div>
                    <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:5}}>PLATAFORMA</div>
                    <div style={{display:"flex",gap:5}}>
                      {[
                        {v:"all",l:"Todas",c:T.accent},
                        {v:"meta",l:"Meta Ads",c:T.meta},
                        {v:"google",l:"Google Ads",c:T.google},
                      ].map(opt=>{
                        const disabled=(opt.v==="meta"&&!hasMeta)||(opt.v==="google"&&!hasGoogle);
                        return(
                          <button key={opt.v} onClick={()=>!disabled&&setRepPlatform(opt.v)} style={{
                            padding:"6px 12px",borderRadius:8,border:`1px solid ${repPlatform===opt.v?opt.c+"88":T.border}`,
                            background:repPlatform===opt.v?`${opt.c}18`:"transparent",
                            color:repPlatform===opt.v?opt.c:disabled?T.mute:T.sub,
                            fontSize:11,fontFamily:T.font,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.4:1,
                          }}>{opt.l}</button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{width:1,height:44,background:T.border,flexShrink:0}}></div>

                  {/* Period */}
                  <div>
                    <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:5}}>PERÍODO</div>
                    <div style={{display:"flex",gap:5}}>
                      {["7d","30d","90d"].map(p=>(
                        <button key={p} onClick={()=>setRepPeriod(p)} style={{
                          padding:"6px 12px",borderRadius:8,border:`1px solid ${repPeriod===p?"#60a5fa88":T.border}`,
                          background:repPeriod===p?"rgba(96,165,250,.1)":"transparent",
                          color:repPeriod===p?"#60a5fa":T.sub,fontSize:11,fontFamily:T.font,cursor:"pointer",fontWeight:repPeriod===p?500:400,
                        }}>{p==="7d"?"7 dias":p==="30d"?"30 dias":"90 dias"}</button>
                      ))}
                    </div>
                  </div>

                  <button className="btn-p" onClick={exportClientCSV} style={{marginLeft:"auto",padding:"9px 16px",borderRadius:9,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
                    <IcoDl/>Exportar CSV
                  </button>
                </div>

                {/* ── Account header ── */}
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                  {clientObj?(
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.accent}}>{clientObj.short}</div>
                  ):(
                    <div style={{width:40,height:40,borderRadius:10,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:T.accent}}>ALL</div>
                  )}
                  <div>
                    <div style={{fontSize:16,fontWeight:600,color:T.txt}}>{repClient==="all"?"Todas as Contas":repClient}</div>
                    <div style={{fontSize:11,color:T.mute,marginTop:2}}>{periodLabel[repPeriod]} · {repPlatform==="all"?"Meta + Google":repPlatform==="meta"?"Meta Ads":"Google Ads"}</div>
                  </div>
                  {clientObj&&<div style={{display:"flex",gap:5,marginLeft:8}}>{clientObj.platforms.map(p=><PTag key={p} p={p}/>)}</div>}
                </div>

                {/* ── 7 Metric cards ── */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:12}}>
                  <MetBox label="Impressões" value={m.impressoes.toLocaleString("pt-BR")} sub="total no período" accent="#a78bfa" big/>
                  <MetBox label="Alcance" value={m.alcance.toLocaleString("pt-BR")} sub="pessoas únicas" accent="#60a5fa" big/>
                  <MetBox label="CTR" value={m.ctr+"%"} sub={m.ctr<2?"abaixo da média":"acima da média"} accent={m.ctr<2?T.warn:T.ok} big/>
                  <MetBox label="CPC" value={"R$ "+m.cpc.toLocaleString("pt-BR",{minimumFractionDigits:2})} sub="custo por clique" accent={T.sub} big/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:isMobile?10:12,marginBottom:isMobile?12:16}}>
                  <MetBox label="Valor Investido" value={"R$ "+m.investido.toLocaleString("pt-BR")} sub={`${repPeriod==="30d"?"mês":repPeriod==="7d"?"semana":"trimestre"} atual`} accent={T.accent} big/>
                  <MetBox label="Conversões" value={m.conversoes.toLocaleString("pt-BR")} sub={`CPL médio: R$ ${cpl}`} accent={T.ok} big/>
                  <MetBox label="Valor do Resultado" value={"R$ "+m.valorResult.toLocaleString("pt-BR")} sub={`ROAS: ${roas}x`} accent={T.err} big/>
                </div>

                {/* ── ROAS + CPL highlights ── */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:16}}>
                  <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:52,height:52,borderRadius:14,background:parseFloat(roas)>=3?"rgba(34,197,94,.1)":"rgba(245,158,11,.1)",border:`1px solid ${parseFloat(roas)>=3?"rgba(34,197,94,.2)":"rgba(245,158,11,.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontFamily:T.mono,fontSize:18,fontWeight:700,color:parseFloat(roas)>=3?T.ok:T.warn}}>{roas}x</span>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",textTransform:"uppercase",marginBottom:4}}>ROAS — Retorno sobre investimento</div>
                      <div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>Para cada <span style={{color:T.txt,fontWeight:500}}>R$ 1,00</span> investido, a conta gerou <span style={{color:parseFloat(roas)>=3?T.ok:T.warn,fontWeight:600}}>R$ {roas}</span> em resultado.</div>
                      <div style={{marginTop:8,display:"flex",gap:8}}>
                        {parseFloat(roas)>=4?<span className="tag" style={{background:"rgba(34,197,94,.1)",color:T.ok}}>🔥 Excelente</span>:parseFloat(roas)>=2.5?<span className="tag" style={{background:"rgba(245,158,11,.1)",color:T.warn}}>⚡ Bom</span>:<span className="tag" style={{background:"rgba(239,68,68,.1)",color:T.err}}>⚠ Otimizar</span>}
                      </div>
                    </div>
                  </div>
                  <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px",display:"flex",alignItems:"center",gap:16}}>
                    <div style={{width:52,height:52,borderRadius:14,background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontFamily:T.mono,fontSize:14,fontWeight:700,color:"#60a5fa"}}>R${cpl}</span>
                    </div>
                    <div>
                      <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",textTransform:"uppercase",marginBottom:4}}>CPL — Custo por lead/conversão</div>
                      <div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>Cada conversão custou em média <span style={{color:"#60a5fa",fontWeight:600}}>R$ {cpl}</span> com <span style={{color:T.txt,fontWeight:500}}>{m.conversoes} conversões</span> no período.</div>
                      <div style={{marginTop:8}}>
                        <div style={{background:"rgba(255,255,255,.06)",borderRadius:100,height:5,overflow:"hidden",width:180}}>
                          <div style={{background:"#60a5fa",width:`${Math.min((m.conversoes/500)*100,100)}%`,height:"100%",borderRadius:100}}></div>
                        </div>
                        <div style={{fontSize:10,color:T.mute,marginTop:3}}>{m.conversoes} de 500 meta do período</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Trend charts ── */}
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                  <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px"}}>
                    <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:16}}>INVESTIMENTO SEMANAL (R$)</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={trend}>
                        <defs>
                          <linearGradient id="rInv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={T.accent} stopOpacity={.25}/>
                            <stop offset="100%" stopColor={T.accent} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...grid}/>
                        <XAxis dataKey="w" tick={ax} axisLine={false} tickLine={false}/>
                        <YAxis tick={ax} tickFormatter={v=>v>=1000?`R$${(v/1000).toFixed(0)}k`:`R$${v}`} axisLine={false} tickLine={false} width={52}/>
                        <Tooltip content={<TipC/>}/>
                        <Area type="monotone" dataKey="investido" stroke={T.accent} strokeWidth={2} fill="url(#rInv)" name="Investido" dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px"}}>
                    <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:16}}>CONVERSÕES SEMANAIS</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={trend} barCategoryGap="40%">
                        <CartesianGrid {...grid}/>
                        <XAxis dataKey="w" tick={ax} axisLine={false} tickLine={false}/>
                        <YAxis tick={ax} axisLine={false} tickLine={false} width={32}/>
                        <Tooltip content={<TipC/>}/>
                        <Bar dataKey="conversoes" fill={T.ok} name="Conversões" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })()}
          {/* ═══════ WHATSAPP ═══════ */}
          {view==="whatsapp"&&(()=>{
            const stCfg={completed:[WA,"rgba(37,211,102,.1)","Concluída"],sending:[T.warn,"rgba(245,158,11,.1)","Enviando"],scheduled:["#60a5fa","rgba(96,165,250,.1)","Agendada"],draft:[T.mute,"rgba(71,85,105,.15)","Rascunho"]};
            const pct=(a,b)=>b>0?Math.round((a/b)*100):0;
            const inp2=(label,val,set,ph,type="text",hint)=>(
              <div>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:10,color:T.mute,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase"}}>{label}</span>
                  {hint&&<span style={{fontSize:9,color:T.mute,background:"rgba(255,255,255,.05)",borderRadius:4,padding:"1px 6px"}}>{hint}</span>}
                </div>
                <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 12px",color:T.txt,fontSize:12,fontFamily:T.font}}/>
              </div>
            );
            const bar=(label,val,total,color)=>{
              const p=pct(val,total);
              return(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:T.sub}}>{label}</span>
                    <span style={{fontSize:11,fontFamily:T.mono,color}}>{val.toLocaleString("pt-BR")} <span style={{color:T.mute}}>({p}%)</span></span>
                  </div>
                  <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:5,overflow:"hidden",marginBottom:8}}>
                    <div style={{background:color,width:`${p}%`,height:"100%",borderRadius:100}}></div>
                  </div>
                </div>
              );
            };
            const tabBtn=(id,label)=>(
              <button onClick={()=>setWaTab(id)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${waTab===id?WA+"55":T.border}`,background:waTab===id?"rgba(37,211,102,.08)":"transparent",color:waTab===id?WA:T.sub,fontSize:12,fontWeight:waTab===id?500:400,cursor:"pointer",fontFamily:T.font}}>
                {label}
              </button>
            );
            return(
              <div>
                {/* Sub-tabs */}
                <div style={{display:"flex",gap:8,marginBottom:20}}>
                  {tabBtn("campaigns","Campanhas")}
                  {tabBtn("new","+ Nova Campanha")}
                  {tabBtn("config","Configurar Uazapi")}
                  {tabBtn("n8n","Integração n8n")}
                  {waConnected&&<span className="tag" style={{background:"rgba(37,211,102,.1)",color:WA,marginLeft:"auto"}}><span className="sdot pulse" style={{background:WA}}></span>Uazapi conectado</span>}
                  {!waConnected&&<span className="tag" style={{background:"rgba(71,85,105,.15)",color:T.mute,marginLeft:"auto"}}><span className="sdot" style={{background:T.mute}}></span>Uazapi desconectado</span>}
                </div>

                {/* ── CAMPAIGNS LIST ── */}
                {waTab==="campaigns"&&(
                  <div>
                    {/* Summary row */}
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:12,marginBottom:isMobile?14:18}}>
                      {[
                        {l:"Total Enviados",v:waCampaigns.reduce((s,c)=>s+c.sent,0).toLocaleString("pt-BR"),c:WA},
                        {l:"Taxa de Leitura",v:pct(waCampaigns.reduce((s,c)=>s+c.read,0),waCampaigns.reduce((s,c)=>s+c.sent,0))+"%",c:"#60a5fa"},
                        {l:"Taxa de Resposta",v:pct(waCampaigns.reduce((s,c)=>s+c.replied,0),waCampaigns.reduce((s,c)=>s+c.sent,0))+"%",c:T.warn},
                        {l:"Campanhas Ativas",v:waCampaigns.filter(c=>c.status==="sending").length,c:T.ok},
                      ].map((m,i)=>(
                        <div key={i} className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px 20px",borderLeft:`3px solid ${m.c}`}}>
                          <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",textTransform:"uppercase",marginBottom:8}}>{m.l}</div>
                          <div style={{fontFamily:T.mono,fontSize:26,color:m.c,fontWeight:500}}>{m.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Campaign cards */}
                    {selectedCamp?(()=>{
                      const c=waCampaigns.find(x=>x.id===selectedCamp);
                      if(!c)return null;
                      const[sc,sbg,sl]=stCfg[c.status];
                      return(
                        <div>
                          <button onClick={()=>setSelectedCamp(null)} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
                            ← Voltar às campanhas
                          </button>
                          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
                            {/* Left: info + metrics */}
                            <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:600,color:T.txt,marginBottom:4}}>{c.name}</div>
                                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                    <span className="tag" style={{background:sbg,color:sc}}>{sl}</span>
                                    <span style={{fontSize:11,color:T.mute}}>{c.client}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                                <div style={{fontSize:10,color:T.mute,letterSpacing:".07em",marginBottom:8,fontWeight:500}}>MENSAGEM ENVIADA</div>
                                <div style={{fontSize:12,color:T.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{c.msg||"Nenhuma mensagem definida."}</div>
                              </div>
                              <div style={{marginBottom:4}}>
                                {bar("Enviados",c.sent,c.total,WA)}
                                {bar("Entregues",c.delivered,c.sent,"#60a5fa")}
                                {bar("Lidos",c.read,c.delivered,"#a78bfa")}
                                {bar("Responderam",c.replied,c.read,T.warn)}
                                {bar("Converteram",c.converted,c.replied,T.ok)}
                              </div>
                            </div>
                            {/* Right: event log */}
                            <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                              <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:14}}>FUNIL DE CONVERSÃO</div>
                              {[
                                {label:"Contatos alvo",val:c.total,icon:"👥",c:T.sub},
                                {label:"Mensagens enviadas",val:c.sent,icon:"📤",c:WA},
                                {label:"Entregues",val:c.delivered,icon:"✅",c:"#60a5fa"},
                                {label:"Visualizadas",val:c.read,icon:"👁",c:"#a78bfa"},
                                {label:"Responderam",val:c.replied,icon:"💬",c:T.warn},
                                {label:"Converteram",val:c.converted,icon:"🎯",c:T.ok},
                              ].map((s,i,arr)=>(
                                <div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<arr.length-1?0:0}}>
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:24}}>
                                    <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{s.icon}</div>
                                    {i<arr.length-1&&<div style={{width:1,height:16,background:T.border,marginTop:2}}></div>}
                                  </div>
                                  <div style={{flex:1,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                                    <span style={{fontSize:12,color:T.sub}}>{s.label}</span>
                                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                                      <span style={{fontFamily:T.mono,fontSize:13,fontWeight:500,color:s.c}}>{s.val.toLocaleString("pt-BR")}</span>
                                      {i>0&&<span style={{fontSize:10,color:T.mute,fontFamily:T.mono}}>{pct(s.val,arr[i-1].val)}%</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div style={{marginTop:16,background:"rgba(255,255,255,.03)",borderRadius:10,padding:"12px 14px"}}>
                                <div style={{fontSize:10,color:T.mute,letterSpacing:".07em",marginBottom:6,fontWeight:500}}>INFO DA CAMPANHA</div>
                                {[{l:"Agendado para",v:c.scheduledAt||"–"},{l:"Criada em",v:c.createdAt},{l:"ID",v:"#"+c.id}].map(x=>(
                                  <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${T.border}`}}>
                                    <span style={{fontSize:11,color:T.mute}}>{x.l}</span>
                                    <span style={{fontSize:11,fontFamily:T.mono,color:T.sub}}>{x.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })():(
                      <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {waCampaigns.map(c=>{
                          const[sc,sbg,sl]=stCfg[c.status];
                          return(
                            <div key={c.id} className="card" style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"16px 20px",cursor:"pointer"}} onClick={()=>setSelectedCamp(c.id)}>
                              <div style={{display:"flex",alignItems:"center",gap:12}}>
                                <div style={{width:38,height:38,borderRadius:10,background:`${WA}18`,border:`1px solid ${WA}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  <IcoWA/>
                                </div>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                    <span style={{fontSize:13,fontWeight:600,color:T.txt}}>{c.name}</span>
                                    <span className="tag" style={{background:sbg,color:sc,fontSize:9}}>{sl}</span>
                                  </div>
                                  <div style={{fontSize:11,color:T.mute}}>{c.client} · {c.scheduledAt||"Sem agendamento"}</div>
                                </div>
                                {/* Mini metrics */}
                                <div style={{display:"flex",gap:16,marginRight:8}}>
                                  {[
                                    {l:"Enviados",v:c.sent,c:WA},
                                    {l:"Lidos",v:c.read,c:"#a78bfa"},
                                    {l:"Respostas",v:c.replied,c:T.warn},
                                    {l:"Conv.",v:c.converted,c:T.ok},
                                  ].map(m=>(
                                    <div key={m.l} style={{textAlign:"center"}}>
                                      <div style={{fontFamily:T.mono,fontSize:15,fontWeight:500,color:m.c}}>{m.v.toLocaleString()}</div>
                                      <div style={{fontSize:9,color:T.mute,letterSpacing:".04em"}}>{m.l.toUpperCase()}</div>
                                    </div>
                                  ))}
                                </div>
                                {/* Progress bar */}
                                {c.total>0&&(
                                  <div style={{width:80}}>
                                    <div style={{fontSize:9,color:T.mute,marginBottom:3,textAlign:"right"}}>{pct(c.sent,c.total)}% enviado</div>
                                    <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:4}}>
                                      <div style={{background:WA,width:`${pct(c.sent,c.total)}%`,height:"100%",borderRadius:100}}></div>
                                    </div>
                                  </div>
                                )}
                                {c.status==="draft"&&(
                                  <button className="btn-p" onClick={e=>{e.stopPropagation();sendCampaign(c.id);}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:WA,color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                                    <IcoSend/>Enviar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── NEW CAMPAIGN ── */}
                {waTab==="new"&&(
                  <div style={{maxWidth:680}}>
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"24px"}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:18}}>Nova Campanha WhatsApp</div>
                      <div style={{display:"flex",flexDirection:"column",gap:14}}>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          {inp2("Nome da Campanha",newCamp.name,v=>setNewCamp({...newCamp,name:v}),"Ex: Promoção de Maio — Loja Beta")}
                          <div>
                            <div style={{fontSize:10,color:T.mute,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase",marginBottom:5}}>Cliente</div>
                            <select value={newCamp.client} onChange={e=>setNewCamp({...newCamp,client:e.target.value})}
                              style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 12px",color:newCamp.client?T.txt:T.mute,fontSize:12,fontFamily:T.font}}>
                              <option value="">Selecionar cliente...</option>
                              {activeClients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                          {inp2("Nº de Contatos",newCamp.contacts,v=>setNewCamp({...newCamp,contacts:v}),"Ex: 500","number","da lista")}
                          {inp2("Agendamento",newCamp.scheduledAt,v=>setNewCamp({...newCamp,scheduledAt:v}),"","datetime-local","opcional")}
                        </div>
                        <div>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                            <span style={{fontSize:10,color:T.mute,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase"}}>Mensagem</span>
                            <span style={{fontSize:10,color:T.mute}}>Use {"{nome}"} para personalizar</span>
                          </div>
                          <textarea value={newCamp.msg} onChange={e=>setNewCamp({...newCamp,msg:e.target.value})} placeholder={"Olá {nome}! 👋 Temos uma oferta especial pra você..."}
                            style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"10px 12px",color:T.txt,fontSize:12,fontFamily:T.font,minHeight:120,resize:"vertical",lineHeight:1.65}}/>
                        </div>
                        {/* Preview */}
                        {newCamp.msg&&(
                          <div style={{background:"#0a1628",borderRadius:10,padding:"14px",border:`1px solid rgba(37,211,102,.2)`}}>
                            <div style={{fontSize:10,color:WA,letterSpacing:".07em",fontWeight:500,marginBottom:10}}>PRÉVIA DA MENSAGEM</div>
                            <div style={{display:"flex",justifyContent:"flex-end"}}>
                              <div style={{background:"#005c4b",borderRadius:"12px 12px 2px 12px",padding:"10px 14px",maxWidth:"75%",fontSize:12,color:"#e8e8e8",lineHeight:1.65,whiteSpace:"pre-wrap"}}>
                                {newCamp.msg.replace("{nome}","João")}
                                <div style={{fontSize:10,color:"rgba(255,255,255,.4)",textAlign:"right",marginTop:6}}>10:00 ✓✓</div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div style={{display:"flex",gap:10,marginTop:4}}>
                          <button onClick={()=>setWaTab("campaigns")} style={{flex:1,padding:"10px 0",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font}}>Cancelar</button>
                          <button className="btn-p" onClick={createCampaign} style={{flex:2,padding:"10px 0",borderRadius:9,border:"none",background:WA,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:(!newCamp.name||!newCamp.client||!newCamp.msg)?.45:1}}>
                            <IcoSend/>Criar Campanha
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CONFIG UAZAPI ── */}
                {waTab==="config"&&(
                  <div style={{maxWidth:680}}>
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"24px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
                        <div style={{width:40,height:40,borderRadius:10,background:`${WA}18`,border:`1px solid ${WA}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <IcoWA/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:600,color:T.txt}}>Configurar Uazapi</div>
                          <div style={{fontSize:11,color:T.sub,marginTop:1}}>API WhatsApp não-oficial · auto-hospedada</div>
                        </div>
                        {waConnected&&<span className="tag" style={{marginLeft:"auto",background:"rgba(37,211,102,.1)",color:WA}}><span className="sdot pulse" style={{background:WA}}></span>Conectado</span>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:12}}>
                        {inp2("URL da Instância Uazapi",waCfg.url,v=>setWaCfg({...waCfg,url:v}),"https://api.uazapi.dev","text","seu servidor")}
                        {inp2("API Token",waCfg.token,v=>setWaCfg({...waCfg,token:v}),"Ex: uaz_live_xxxxxxxxxxxx","password")}
                        {inp2("Nome da Instância",waCfg.instance,v=>setWaCfg({...waCfg,instance:v}),"Ex: agencia-principal")}
                        <div style={{background:"rgba(255,255,255,.03)",borderRadius:10,padding:"14px 16px",fontSize:11,color:T.sub,lineHeight:1.7}}>
                          <div style={{color:T.txt,fontWeight:500,marginBottom:6}}>Como obter o Token:</div>
                          1. Acesse seu painel Uazapi → Settings → API Keys<br/>
                          2. Clique em "Gerar novo token"<br/>
                          3. Copie e cole aqui — o token aparece apenas uma vez
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          {waConnected?(
                            <button onClick={()=>{setWaConnected(false);setWaCfg(initWACfg);}} style={{flex:1,padding:"10px 0",borderRadius:9,border:`1px solid rgba(239,68,68,.3)`,background:"rgba(239,68,68,.07)",color:T.err,cursor:"pointer",fontSize:12,fontFamily:T.font}}>Desconectar</button>
                          ):(
                            <button className="btn-p" onClick={connectWA} style={{flex:1,padding:"10px 0",borderRadius:9,border:"none",background:waConnecting?"rgba(37,211,102,.4)":WA,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:(!waCfg.url||!waCfg.token||!waCfg.instance)?.45:1}}>
                              {waConnecting?<><span className="sdot pulse" style={{background:"#fff"}}></span>Conectando...</>:"Conectar Uazapi"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── N8N INTEGRATION ── */}
                {waTab==="n8n"&&(
                  <div style={{maxWidth:860}}>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:14,marginBottom:isMobile?12:14}}>
                      {/* Webhook config */}
                      <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                        <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:14}}>WEBHOOK DO N8N</div>
                        <div style={{fontSize:12,color:T.sub,lineHeight:1.65,marginBottom:14}}>Configure este endpoint no Uazapi como webhook de eventos. O n8n receberá todos os status de mensagens em tempo real.</div>
                        <div style={{background:"rgba(255,255,255,.04)",borderRadius:9,border:`1px solid ${T.border}`,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                          <span style={{fontFamily:T.mono,fontSize:11,color:WA,flex:1,wordBreak:"break-all"}}>{N8N_WEBHOOK_EX}</span>
                          <button onClick={()=>copyText(N8N_WEBHOOK_EX)} style={{background:"none",border:"none",cursor:"pointer",color:copied?T.ok:T.mute,display:"flex",flexShrink:0}}>
                            {copied?<IcoCheck/>:<IcoCopy/>}
                          </button>
                        </div>
                        <div style={{fontSize:10,color:T.mute,letterSpacing:".07em",fontWeight:500,marginBottom:10}}>EVENTOS RASTREADOS</div>
                        {[
                          {ev:"message.sent",d:"Mensagem enviada para a fila",c:WA},
                          {ev:"message.delivered",d:"Entregue no dispositivo",c:"#60a5fa"},
                          {ev:"message.read",d:"Visualizada pelo contato",c:"#a78bfa"},
                          {ev:"message.reply",d:"Contato respondeu",c:T.warn},
                          {ev:"message.failed",d:"Falha no envio",c:T.err},
                        ].map(x=>(
                          <div key={x.ev} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${T.border}`}}>
                            <span style={{width:7,height:7,borderRadius:"50%",background:x.c,display:"inline-block",flexShrink:0}}></span>
                            <span style={{fontFamily:T.mono,fontSize:11,color:T.sub}}>{x.ev}</span>
                            <span style={{marginLeft:"auto",fontSize:10,color:T.mute}}>{x.d}</span>
                          </div>
                        ))}
                      </div>
                      {/* Payload example */}
                      <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500}}>PAYLOAD DE EXEMPLO</div>
                          <button onClick={()=>copyText(`{\n  "event": "message.read",\n  "campaignId": "camp_001",\n  "phone": "+5531999999999",\n  "timestamp": "2026-04-26T10:00:00Z",\n  "messageId": "3EB0AB12345"\n}`)} style={{background:"none",border:"none",cursor:"pointer",color:T.mute,display:"flex",alignItems:"center",gap:4,fontSize:11,fontFamily:T.font}}>
                            <IcoCopy/> Copiar
                          </button>
                        </div>
                        <pre style={{fontFamily:T.mono,fontSize:11,color:T.sub,lineHeight:1.8,background:"rgba(255,255,255,.03)",borderRadius:9,padding:"12px 14px",overflow:"auto"}}>
{`{
  "event": "message.read",
  "campaignId": "camp_001",
  "phone": "+5531999999999",
  "timestamp": "2026-04-26T10:00:00Z",
  "messageId": "3EB0AB12345"
}`}
                        </pre>
                        <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:10,marginTop:14}}>FLUXO DE AUTOMAÇÃO</div>
                        {[
                          {n:"1",t:"Webhook Trigger",d:"Recebe evento do Uazapi"},
                          {n:"2",t:"Switch Node",d:"Roteia por tipo de evento"},
                          {n:"3",t:"HTTP Request",d:"Atualiza banco de dados"},
                          {n:"4",t:"IF Node",d:"Verifica se é resposta"},
                          {n:"5",t:"Send Message",d:"Ativa follow-up automático"},
                        ].map((s,i,arr)=>(
                          <div key={s.n} style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:28,flexShrink:0}}>
                              <div style={{width:26,height:26,borderRadius:7,background:`${WA}18`,border:`1px solid ${WA}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontFamily:T.mono,color:WA}}>{s.n}</div>
                              {i<arr.length-1&&<div style={{width:1,height:10,background:T.border}}></div>}
                            </div>
                            <div style={{padding:"3px 0"}}>
                              <div style={{fontSize:11,fontWeight:500,color:T.txt}}>{s.t}</div>
                              <div style={{fontSize:10,color:T.mute}}>{s.d}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* n8n JSON */}
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"20px 22px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                        <div>
                          <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500}}>TEMPLATE DE WORKFLOW N8N</div>
                          <div style={{fontSize:11,color:T.sub,marginTop:3}}>Importe diretamente no n8n via "Import from JSON"</div>
                        </div>
                        <button className="btn-p" onClick={()=>copyText(N8N_FLOW)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:11,fontFamily:T.font,display:"flex",alignItems:"center",gap:5}}>
                          <IcoCopy c={T.sub}/>{copied?"Copiado!":"Copiar JSON"}
                        </button>
                      </div>
                      <pre style={{fontFamily:T.mono,fontSize:11,color:T.sub,lineHeight:1.75,background:"rgba(255,255,255,.03)",borderRadius:9,padding:"14px 16px",overflow:"auto",maxHeight:220}}>
                        {N8N_FLOW}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══════ CONNECTIONS ═══════ */}
          {view==="connections"&&(()=>{
            const inp=(val,set,ph,secret,showS,setShow)=>(
              <div style={{position:"relative"}}>
                <input type={secret&&!showS?"password":"text"} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                  style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${T.borderMid}`,borderRadius:8,padding:"9px 36px 9px 12px",color:T.txt,fontSize:12,fontFamily:T.font}}/>
                {secret&&<button onClick={()=>setShow(!showS)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.mute,display:"flex"}}>{showS?<IcoEyeOff/>:<IcoEye/>}</button>}
              </div>
            );
            const fldLabel=(l,hint)=>(<div style={{marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,color:T.mute,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase"}}>{l}</span>{hint&&<span style={{fontSize:10,color:T.mute,background:"rgba(255,255,255,.05)",borderRadius:4,padding:"1px 6px"}}>{hint}</span>}</div></div>);
            const SPill=({s})=>{const c={idle:[T.mute,"rgba(71,85,105,.15)","Desconectado"],connecting:[T.warn,"rgba(245,158,11,.1)","Conectando..."],connected:[T.ok,"rgba(34,197,94,.1)","Conectado"],error:[T.err,"rgba(239,68,68,.1)","Erro"]}[s]||[T.mute,"rgba(71,85,105,.15)","Desconectado"];return <span className="tag" style={{background:c[1],color:c[0]}}><span className={`sdot${s==="connecting"?" pulse":""}`} style={{background:c[0]}}></span>{c[2]}</span>;};
            const CtTab=({id,label})=>(<button onClick={()=>setConnTab(id)} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${connTab===id?T.meta+"66":T.border}`,background:connTab===id?"rgba(0,129,251,.08)":"transparent",color:connTab===id?T.meta:T.sub,fontSize:12,fontWeight:connTab===id?500:400,cursor:"pointer",fontFamily:T.font}}>{label}</button>);
            const Code=({children,lang})=>(<div style={{position:"relative",marginBottom:14}}>{lang&&<div style={{position:"absolute",top:8,right:10,fontSize:9,color:T.mute,letterSpacing:".06em",fontFamily:T.mono}}>{lang}</div>}<pre style={{background:"#0d1117",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",fontFamily:T.mono,fontSize:11,color:"#e2e8f0",lineHeight:1.8,overflow:"auto",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{children}</pre></div>);
            const Step=({n,title,children})=>(<div style={{display:"flex",gap:16,marginBottom:22}}><div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:28,height:28,borderRadius:8,background:"rgba(0,129,251,.12)",border:"1px solid rgba(0,129,251,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontFamily:T.mono,color:T.meta,fontWeight:600}}>{n}</div><div style={{width:1,flex:1,background:T.border,marginTop:6}}></div></div><div style={{flex:1,paddingBottom:6}}><div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:8}}>{title}</div>{children}</div></div>);
            const Info=({children,type="info"})=>{const c={info:["rgba(96,165,250,.08)","rgba(96,165,250,.2)"],warn:["rgba(245,158,11,.08)","rgba(245,158,11,.2)"],ok:["rgba(34,197,94,.08)","rgba(34,197,94,.2)"]}[type]||["rgba(96,165,250,.08)","rgba(96,165,250,.2)"];return <div style={{background:c[0],border:`1px solid ${c[1]}`,borderRadius:9,padding:"10px 14px",fontSize:12,color:T.sub,lineHeight:1.7,marginBottom:12}}>{children}</div>;};
            const Perm=({scope,desc,req})=>(<div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.03)",borderRadius:9,padding:"9px 14px",border:`1px solid ${T.border}`,marginBottom:6}}><div style={{width:22,height:22,borderRadius:6,background:req?"rgba(239,68,68,.1)":"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:req?T.err:T.ok}}><IcoCheck/></div><div style={{flex:1}}><div style={{fontFamily:T.mono,fontSize:11,color:T.txt}}>{scope}</div><div style={{fontSize:10,color:T.mute}}>{desc}</div></div><span className="tag" style={{background:req?"rgba(239,68,68,.08)":"rgba(255,255,255,.05)",color:req?T.err:T.mute,fontSize:9}}>{req?"Obrigatório":"Opcional"}</span></div>);
            return(
              <div style={{maxWidth:1000}}>
                <div style={{display:"flex",gap:8,marginBottom:22}}>
                  <CtTab id="connect" label="Conectar Contas"/>
                  <CtTab id="docs" label="📄 Documentação API Meta BM"/>
                </div>

                {/* ══ CONNECT ══ */}
                {connTab==="connect"&&(
                  <div>
                    <div style={{background:"rgba(99,102,241,.07)",border:"1px solid rgba(99,102,241,.2)",borderRadius:12,padding:"14px 18px",marginBottom:20,display:"flex",alignItems:"flex-start",gap:12}}>
                      <div style={{width:32,height:32,borderRadius:8,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#6366F1" strokeWidth="1.3"/><path d="M7 5v2.5l1.5 1.5" stroke="#6366F1" strokeWidth="1.3" strokeLinecap="round"/></svg></div>
                      <div><div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:4}}>Conecte suas contas de anúncio</div><div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>As credenciais são usadas apenas nesta sessão e nunca armazenadas. Consulte a aba <span style={{color:T.meta,cursor:"pointer",fontWeight:500}} onClick={()=>setConnTab("docs")}>Documentação →</span> para saber como obter cada credencial.</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:isMobile?12:16}}>
                      {/* META */}
                      <div className="card" style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                        <div style={{padding:"20px 22px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:40,height:40,borderRadius:10,background:"rgba(0,129,251,.12)",border:"1px solid rgba(0,129,251,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm-1.2 11.5V8.9L12.6 10l-3.8 3.5z" fill="#0081FB"/><circle cx="10" cy="10" r="8" stroke="#0081FB" strokeWidth="1.2" strokeOpacity=".3"/></svg></div>
                          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.txt}}>Meta Business Manager</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>Facebook & Instagram Ads</div></div>
                          <SPill s={metaStatus}/>
                        </div>
                        <div style={{padding:"18px 22px"}}>
                          {metaStatus==="connected"?(
                            <div>
                              <div style={{fontSize:10,color:T.mute,letterSpacing:".08em",fontWeight:500,marginBottom:12}}>CONTAS CONECTADAS</div>
                              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                                {metaAccounts.map(acc=>(<div key={acc.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(34,197,94,.05)",border:"1px solid rgba(34,197,94,.12)",borderRadius:9,padding:"10px 14px"}}><div style={{width:28,height:28,borderRadius:7,background:"rgba(0,129,251,.12)",display:"flex",alignItems:"center",justifyContent:"center"}}><IcoCheck/></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:T.txt}}>{acc.name}</div><div style={{fontSize:10,color:T.mute,fontFamily:T.mono}}>ID: {acc.id}</div></div><div style={{fontSize:11,fontFamily:T.mono,color:T.ok}}>{acc.spend}</div></div>))}
                              </div>
                              <div style={{display:"flex",gap:8}}>
                                <button className="btn-p" onClick={async()=>{
                                  setMetaStatus("connecting");
                                  try{
                                    const accsRes=await fetch(`${GRAPH}/${metaForm.bmId}/owned_ad_accounts?fields=id,name,account_status,currency,amount_spent&access_token=${metaForm.accessToken}&limit=20`);
                                    const accsData=await accsRes.json();
                                    if(accsData.error)throw new Error(accsData.error.message);
                                    const updated=(accsData.data||[]).map(a=>({id:a.id.replace("act_",""),name:a.name,status:a.account_status===1?"active":"inactive",currency:a.currency||"BRL",spend:a.amount_spent?`${a.currency||"R$"} ${(parseInt(a.amount_spent)/100).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:"R$ 0,00"}));
                                    if(updated.length>0)setMetaAccounts(updated);
                                  }catch(e){setMetaError(e.message);}finally{setMetaStatus("connected");}
                                }} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${T.borderMid}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><IcoRefresh/>Sincronizar</button>
                                <button className="btn-p" onClick={disconnectMeta} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid rgba(239,68,68,.3)`,background:"rgba(239,68,68,.07)",color:T.err,cursor:"pointer",fontSize:12,fontFamily:T.font}}>Desconectar</button>
                              </div>
                            </div>
                          ):(
                            <div>
                              <div style={{display:"flex",gap:6,marginBottom:18}}>
                                {["Credenciais","Permissões","Contas"].map((s,i)=>(<div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",height:3,borderRadius:2,background:i<=metaStep?"#0081FB":"rgba(255,255,255,.08)"}}></div><span style={{fontSize:9,color:i<=metaStep?T.meta:T.mute,letterSpacing:".04em"}}>{s}</span></div>))}
                              </div>
                              {metaStep===0&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><div>{fldLabel("App ID","Meta for Developers")}{inp(metaForm.appId,v=>setMetaForm({...metaForm,appId:v}),"Ex: 1234567890123456")}</div><div>{fldLabel("App Secret")}{inp(metaForm.appSecret,v=>setMetaForm({...metaForm,appSecret:v}),"Ex: abc123...",true,showMetaSecret,setShowMetaSecret)}</div><div>{fldLabel("Access Token de Longa Duração")}{inp(metaForm.accessToken,v=>setMetaForm({...metaForm,accessToken:v}),"EAAxxxxxxxx...",true,showMetaSecret,setShowMetaSecret)}</div><div>{fldLabel("Business Manager ID")}{inp(metaForm.bmId,v=>setMetaForm({...metaForm,bmId:v}),"Ex: 987654321098765")}</div><div style={{background:"rgba(0,129,251,.06)",border:"1px solid rgba(0,129,251,.15)",borderRadius:8,padding:"10px 12px",fontSize:11,color:T.sub,lineHeight:1.65}}>💡 Não sabe como obter? Veja a <span style={{color:T.meta,cursor:"pointer",fontWeight:500}} onClick={()=>setConnTab("docs")}>Documentação API Meta BM →</span></div><button className="btn-p" onClick={()=>setMetaStep(1)} style={{width:"100%",padding:"10px 0",borderRadius:9,border:"none",background:T.meta,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,opacity:(!metaForm.accessToken||!metaForm.bmId)?.45:1}}>Próximo →</button></div>)}
                              {metaStep===1&&(<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{fontSize:12,color:T.sub,lineHeight:1.65,marginBottom:4}}>Confirme as permissões ativas no App:</div>{[{p:"ads_read",d:"Leitura de anúncios"},{p:"ads_management",d:"Gerenciar campanhas"},{p:"business_management",d:"Acesso ao BM"},{p:"read_insights",d:"Métricas e insights"}].map(x=>(<div key={x.p} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.03)",borderRadius:9,padding:"10px 14px",border:`1px solid ${T.border}`}}><div style={{width:22,height:22,borderRadius:6,background:"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:T.ok,flexShrink:0}}><IcoCheck/></div><div><div style={{fontSize:11,fontFamily:T.mono,color:T.txt}}>{x.p}</div><div style={{fontSize:10,color:T.mute}}>{x.d}</div></div></div>))}<div style={{display:"flex",gap:8,marginTop:4}}><button onClick={()=>setMetaStep(0)} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font}}>← Voltar</button><button className="btn-p" onClick={connectMeta} disabled={metaStatus==="connecting"} style={{flex:2,padding:"10px 0",borderRadius:9,border:"none",background:metaStatus==="connecting"?"rgba(0,129,251,.5)":T.meta,color:"#fff",cursor:metaStatus==="connecting"?"not-allowed":"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{metaStatus==="connecting"?<><span className="sdot pulse" style={{background:"#fff"}}></span>Conectando à API...</>:"Conectar ao BM"}</button></div>{metaError&&<div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:8,padding:"10px 12px",fontSize:11,color:T.err,lineHeight:1.6}}>⚠ {metaError}</div>}</div>)}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* GOOGLE */}
                      <div className="card" style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                        <div style={{padding:"20px 22px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:40,height:40,borderRadius:10,background:"rgba(66,133,244,.12)",border:"1px solid rgba(66,133,244,.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" stroke="#4285F4" strokeWidth="1.2"/><path d="M10 7.5v5M7.5 10h5" stroke="#4285F4" strokeWidth="1.3" strokeLinecap="round"/><path d="M14 14l2.5 2.5" stroke="#EA4335" strokeWidth="1.3" strokeLinecap="round"/></svg></div>
                          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:T.txt}}>Google Ads</div><div style={{fontSize:11,color:T.sub,marginTop:2}}>Search, Display & YouTube</div></div>
                          <SPill s={googleStatus}/>
                        </div>
                        <div style={{padding:"18px 22px"}}>
                          {googleStatus==="connected"?(
                            <div>
                              <div style={{fontSize:10,color:T.mute,letterSpacing:".08em",fontWeight:500,marginBottom:12}}>CONTAS CONECTADAS</div>
                              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{googleAccounts.map(acc=>(<div key={acc.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(34,197,94,.05)",border:"1px solid rgba(34,197,94,.12)",borderRadius:9,padding:"10px 14px"}}><div style={{width:28,height:28,borderRadius:7,background:"rgba(66,133,244,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:T.ok}}><IcoCheck/></div><div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:T.txt}}>{acc.name}</div><div style={{fontSize:10,color:T.mute,fontFamily:T.mono}}>ID: {acc.id}</div></div><div style={{fontSize:11,fontFamily:T.mono,color:T.ok}}>{acc.spend}</div></div>))}</div>
                              <div style={{display:"flex",gap:8}}><button className="btn-p" onClick={()=>{setGoogleStatus("connecting");setTimeout(()=>setGoogleStatus("connected"),1200);}} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${T.borderMid}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><IcoRefresh/>Sincronizar</button><button className="btn-p" onClick={disconnectGoogle} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid rgba(239,68,68,.3)`,background:"rgba(239,68,68,.07)",color:T.err,cursor:"pointer",fontSize:12,fontFamily:T.font}}>Desconectar</button></div>
                            </div>
                          ):(
                            <div>
                              <div style={{display:"flex",gap:6,marginBottom:18}}>{["Credenciais","Token OAuth","Contas"].map((s,i)=>(<div key={s} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",height:3,borderRadius:2,background:i<=googleStep?"#4285F4":"rgba(255,255,255,.08)"}}></div><span style={{fontSize:9,color:i<=googleStep?T.google:T.mute,letterSpacing:".04em"}}>{s}</span></div>))}</div>
                              {googleStep===0&&(<div style={{display:"flex",flexDirection:"column",gap:12}}><div>{fldLabel("Client ID","Google Cloud")}{inp(googleForm.clientId,v=>setGoogleForm({...googleForm,clientId:v}),"Ex: 123456.apps.googleusercontent.com")}</div><div>{fldLabel("Client Secret")}{inp(googleForm.clientSecret,v=>setGoogleForm({...googleForm,clientSecret:v}),"Ex: GOCSPX-xxxx",true,showGoogleSecret,setShowGoogleSecret)}</div><div>{fldLabel("Developer Token")}{inp(googleForm.devToken,v=>setGoogleForm({...googleForm,devToken:v}),"Ex: ABcDeFGH...",true,showGoogleDev,setShowGoogleDev)}</div><div>{fldLabel("Customer ID / MCC","opcional")}{inp(googleForm.customerId,v=>setGoogleForm({...googleForm,customerId:v}),"Ex: 123-456-7890")}</div><button className="btn-p" onClick={()=>setGoogleStep(1)} style={{width:"100%",padding:"10px 0",borderRadius:9,border:"none",background:T.google,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,opacity:(!googleForm.clientId||!googleForm.clientSecret||!googleForm.devToken)?.45:1}}>Próximo →</button></div>)}
                              {googleStep===1&&(<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{fontSize:12,color:T.sub,lineHeight:1.65}}>Escopos de acesso necessários:</div>{[{s:"adwords",d:"API Google Ads"},{s:"userinfo.email",d:"Identificação"},{s:"analytics.readonly",d:"Google Analytics"},{s:"content",d:"Merchant Center (opcional)"}].map(x=>(<div key={x.s} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.03)",borderRadius:9,padding:"10px 14px",border:`1px solid ${T.border}`}}><div style={{width:22,height:22,borderRadius:6,background:"rgba(34,197,94,.1)",display:"flex",alignItems:"center",justifyContent:"center",color:T.ok,flexShrink:0}}><IcoCheck/></div><div><div style={{fontSize:11,fontFamily:T.mono,color:T.txt}}>googleapis.com/auth/{x.s}</div><div style={{fontSize:10,color:T.mute}}>{x.d}</div></div></div>))}<div style={{display:"flex",gap:8,marginTop:4}}><button onClick={()=>setGoogleStep(0)} style={{flex:1,padding:"9px 0",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font}}>← Voltar</button><button className="btn-p" onClick={connectGoogle} style={{flex:2,padding:"10px 0",borderRadius:9,border:"none",background:googleStatus==="connecting"?"rgba(66,133,244,.5)":T.google,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{googleStatus==="connecting"?<><span className="sdot pulse" style={{background:"#fff"}}></span>Autenticando...</>:"Autorizar via OAuth"}</button></div></div>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {(metaStatus==="connected"||googleStatus==="connected")&&(<div style={{marginTop:14,background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)",borderRadius:12,padding:"14px 20px",display:"flex",alignItems:"center",gap:12}}><div style={{width:28,height:28,borderRadius:8,background:"rgba(34,197,94,.12)",display:"flex",alignItems:"center",justifyContent:"center",color:T.ok,flexShrink:0}}><IcoCheck/></div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:2}}>{[metaStatus==="connected"&&"Meta BM",googleStatus==="connected"&&"Google Ads"].filter(Boolean).join(" e ")} conectado(s)</div><div style={{fontSize:11,color:T.sub}}>{metaAccounts.length+googleAccounts.length} conta(s) sincronizada(s).</div></div><button onClick={()=>setView("dashboard")} className="btn-p" style={{padding:"8px 16px",borderRadius:9,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>Ver Dashboard →</button></div>)}
                  </div>
                )}

                {/* ══ DOCS ══ */}
                {connTab==="docs"&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"210px 1fr",gap:isMobile?14:20,alignItems:"start"}}>
                    {/* Index sidebar */}
                    <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px",position:"sticky",top:0}}>
                      <div style={{fontSize:10,color:T.mute,letterSpacing:".09em",fontWeight:500,marginBottom:12}}>ÍNDICE</div>
                      {[["visao","Visão geral"],["prereqs","Pré-requisitos"],["app","1. Criar App no Meta"],["token","2. Gerar Access Token"],["bmid","3. Obter BM ID"],["perms","4. Permissões"],["endpoints","5. Endpoints principais"],["exemplos","6. Exemplos de chamadas"],["erros","7. Erros comuns"],["boas","8. Boas práticas"]].map(([id,label])=>(<a key={id} href={`#doc-${id}`} style={{display:"block",padding:"6px 10px",borderRadius:7,fontSize:12,color:T.sub,textDecoration:"none",marginBottom:2}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,129,251,.08)";e.currentTarget.style.color=T.meta;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.sub;}}>{label}</a>))}
                      <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                        <button className="btn-p" onClick={()=>setConnTab("connect")} style={{width:"100%",padding:"8px 0",borderRadius:8,border:"none",background:T.meta,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font}}>→ Conectar agora</button>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      {/* Header */}
                      <div style={{background:"rgba(0,129,251,.06)",border:"1px solid rgba(0,129,251,.18)",borderRadius:14,padding:"20px 24px",marginBottom:24,display:"flex",alignItems:"center",gap:14}}>
                        <div style={{width:44,height:44,borderRadius:12,background:"rgba(0,129,251,.12)",border:"1px solid rgba(0,129,251,.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm-1.5 13V10L13 11l-3.5 4z" fill="#0081FB"/></svg></div>
                        <div><div style={{fontSize:16,fontWeight:700,color:T.txt,marginBottom:4}}>Documentação — Meta Marketing API</div><div style={{fontSize:12,color:T.sub}}>Guia completo para conectar o Business Manager ao TrafficDesk via API v19.0+</div></div>
                        <span className="tag" style={{marginLeft:"auto",background:"rgba(34,197,94,.1)",color:T.ok,flexShrink:0}}>v19.0</span>
                      </div>

                      {/* VISÃO GERAL */}
                      <div id="doc-visao" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>Visão Geral</div>
                        <div style={{fontSize:12,color:T.sub,lineHeight:1.8,marginBottom:10}}>A <span style={{color:T.txt,fontWeight:500}}>Meta Marketing API</span> permite que aplicações externas leiam e gerenciem campanhas, conjuntos de anúncios e insights de performance dentro do seu Business Manager via <span style={{color:T.meta}}>OAuth 2.0</span>.</div>
                        <Info type="info">🔗 Endpoint base: <span style={{fontFamily:T.mono,color:T.meta}}>https://graph.facebook.com/v19.0/</span></Info>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                          {[{l:"Autenticação",v:"OAuth 2.0 + Token"},{l:"Formato",v:"JSON / REST"},{l:"Rate Limit",v:"200 req/hora/token"}].map(x=>(<div key={x.l} style={{background:"rgba(255,255,255,.03)",borderRadius:9,border:`1px solid ${T.border}`,padding:"12px 14px"}}><div style={{fontSize:10,color:T.mute,marginBottom:4,letterSpacing:".06em"}}>{x.l.toUpperCase()}</div><div style={{fontSize:12,fontFamily:T.mono,color:T.txt}}>{x.v}</div></div>))}
                        </div>
                      </div>

                      {/* PRÉ-REQUISITOS */}
                      <div id="doc-prereqs" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>Pré-requisitos</div>
                        {[{ico:"👤",t:"Conta Meta Business",d:"Acesso de Administrador ao Business Manager da conta de anúncios."},{ico:"📱",t:"App Meta for Developers",d:"Um app criado em developers.facebook.com com tipo 'Business'."},{ico:"🔑",t:"Access Token válido",d:"Token de longa duração (60 dias) ou token de sistema (sem expiração)."},{ico:"✅",t:"Permissões aprovadas",d:"O app precisa ter as permissões de negócios aprovadas pela Meta."}].map(x=>(<div key={x.t} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:18,flexShrink:0}}>{x.ico}</span><div><div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:2}}>{x.t}</div><div style={{fontSize:11,color:T.mute}}>{x.d}</div></div></div>))}
                      </div>

                      {/* PASSO 1 */}
                      <div id="doc-app" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>1. Criar App no Meta for Developers</div>
                        <Step n="1.1" title="Acesse o painel de desenvolvedor"><div style={{fontSize:12,color:T.sub,lineHeight:1.7,marginBottom:6}}>Vá para <span style={{color:T.meta,fontFamily:T.mono}}>developers.facebook.com</span> → <strong style={{color:T.txt}}>Meus Apps → Criar App</strong>.</div><Info type="warn">⚠ Use a mesma conta Meta que é administrador do Business Manager alvo.</Info></Step>
                        <Step n="1.2" title="Escolha o tipo Business"><div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>Selecione <span style={{color:T.txt,fontWeight:500}}>"Business"</span> — não "Consumer". Isso libera as permissões de Ads e Business Management.</div></Step>
                        <Step n="1.3" title="Adicione o produto Marketing API"><div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>No painel do App → <strong style={{color:T.txt}}>Adicionar Produto → Marketing API</strong>. Isso habilita os endpoints de campanhas e insights.</div></Step>
                        <Step n="1.4" title="Copie o App ID e App Secret"><div style={{fontSize:12,color:T.sub,lineHeight:1.7,marginBottom:8}}>Em <strong style={{color:T.txt}}>Configurações → Configurações Básicas</strong>:</div><div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:8}}>{[{l:"ID do Aplicativo",v:"Número de 15-16 dígitos"},{l:"Chave Secreta",v:"String hexadecimal de 32 chars"}].map(x=>(<div key={x.l} style={{display:"flex",gap:10,background:"rgba(255,255,255,.03)",borderRadius:8,padding:"9px 12px",border:`1px solid ${T.border}`}}><span style={{fontSize:11,color:T.mute,minWidth:140}}>{x.l}</span><span style={{fontSize:11,fontFamily:T.mono,color:T.txt}}>{x.v}</span></div>))}</div><Info type="warn">🔒 Nunca exponha o App Secret no frontend. Guarde-o somente no backend.</Info></Step>
                      </div>

                      {/* PASSO 2 */}
                      <div id="doc-token" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>2. Gerar Access Token de Longa Duração</div>
                        <Step n="2.1" title="Token de curta duração (User Token)"><div style={{fontSize:12,color:T.sub,lineHeight:1.7}}>Use o <strong style={{color:T.txt}}>Graph API Explorer</strong> em <span style={{color:T.meta,fontFamily:T.mono}}>developers.facebook.com/tools/explorer</span>. Selecione seu App, clique em <strong style={{color:T.txt}}>Gerar Token de Acesso</strong> e marque as permissões.</div></Step>
                        <Step n="2.2" title="Troque por um token de longa duração (60 dias)"><div style={{fontSize:12,color:T.sub,lineHeight:1.7,marginBottom:8}}>Faça uma requisição GET:</div><Code lang="GET">{`GET https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={TOKEN_CURTO}`}</Code><div style={{fontSize:12,color:T.sub}}>A resposta retorna <span style={{fontFamily:T.mono,color:T.meta}}>access_token</span> com validade de ~60 dias.</div></Step>
                        <Step n="2.3" title="(Recomendado) Token de sistema — sem expiração"><div style={{fontSize:12,color:T.sub,lineHeight:1.7,marginBottom:8}}>No BM: <strong style={{color:T.txt}}>Configurações → Usuários → Usuários do Sistema → Adicionar</strong>. Gere um token para esse usuário — ele nunca expira.</div><Info type="ok">✅ Token de sistema é a forma mais segura e estável para integração contínua.</Info></Step>
                      </div>

                      {/* PASSO 3 */}
                      <div id="doc-bmid" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>3. Obter o Business Manager ID</div>
                        {[{n:"A",t:"Pela URL",d:"Acesse business.facebook.com. O ID aparece na URL:",code:"https://business.facebook.com/settings/?business=123456789012345"},{n:"B",t:"Via Graph API",d:"Com seu token, liste seus BMs:",code:"GET https://graph.facebook.com/v19.0/me/businesses\n    ?access_token={SEU_TOKEN}"},{n:"C",t:"Pelas Configurações",d:'Em Configurações do Negócio → Informações do Negócio, o ID aparece em "ID do Business Manager".'}].map(x=>(<div key={x.n} style={{background:"rgba(255,255,255,.03)",borderRadius:10,border:`1px solid ${T.border}`,padding:"14px 16px",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{width:22,height:22,borderRadius:6,background:"rgba(0,129,251,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.meta,flexShrink:0}}>{x.n}</span><span style={{fontSize:12,fontWeight:500,color:T.txt}}>{x.t}</span></div><div style={{fontSize:11,color:T.mute,marginBottom:x.code?8:0}}>{x.d}</div>{x.code&&<Code>{x.code}</Code>}</div>))}
                      </div>

                      {/* PASSO 4 */}
                      <div id="doc-perms" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>4. Permissões necessárias</div>
                        <Info>Adicione em <strong style={{color:T.txt}}>Casos de Uso do App → Marketing API → Permissões</strong>. Algumas precisam de aprovação avançada da Meta.</Info>
                        <Perm scope="ads_read" desc="Leitura de anúncios, conjuntos e campanhas" req={true}/>
                        <Perm scope="ads_management" desc="Criação e edição de campanhas" req={true}/>
                        <Perm scope="business_management" desc="Acesso às contas do Business Manager" req={true}/>
                        <Perm scope="read_insights" desc="Métricas: CTR, CPC, ROAS, impressões etc." req={true}/>
                        <Perm scope="pages_read_engagement" desc="Dados de Pages vinculadas ao BM" req={false}/>
                        <Perm scope="instagram_basic" desc="Dados básicos de contas Instagram" req={false}/>
                        <Info type="warn">⚠ <span style={{fontFamily:T.mono}}>ads_management</span> requer revisão avançada da Meta antes de usar com usuários externos ao app.</Info>
                      </div>

                      {/* PASSO 5 */}
                      <div id="doc-endpoints" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>5. Endpoints principais</div>
                        {[{m:"GET",ep:"/act_{AD_ACCOUNT_ID}/insights",desc:"Métricas de performance (impressões, alcance, CTR, CPC, ROAS)",fields:"impressions, reach, clicks, ctr, cpc, spend, actions, action_values"},{m:"GET",ep:"/act_{AD_ACCOUNT_ID}/campaigns",desc:"Lista todas as campanhas da conta",fields:"id, name, status, daily_budget, lifetime_budget"},{m:"GET",ep:"/act_{AD_ACCOUNT_ID}/adsets",desc:"Conjuntos de anúncios com targeting",fields:"id, name, status, targeting, bid_amount"},{m:"GET",ep:"/act_{AD_ACCOUNT_ID}/ads",desc:"Anúncios individuais",fields:"id, name, status, creative, adset_id"},{m:"GET",ep:"/{BM_ID}/owned_ad_accounts",desc:"Contas de anúncio vinculadas ao BM",fields:"id, name, account_status, currency, timezone_name"}].map((e,i)=>(<div key={i} style={{background:"rgba(255,255,255,.03)",borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 16px",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{background:"rgba(0,129,251,.12)",color:T.meta,fontFamily:T.mono,fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:4}}>{e.m}</span><span style={{fontFamily:T.mono,fontSize:12,color:T.txt}}>{e.ep}</span></div><div style={{fontSize:11,color:T.mute,marginBottom:4}}>{e.desc}</div><div style={{fontSize:10,color:T.mute}}>Fields: <span style={{fontFamily:T.mono,color:T.sub}}>{e.fields}</span></div></div>))}
                      </div>

                      {/* PASSO 6 */}
                      <div id="doc-exemplos" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>6. Exemplos de chamadas</div>
                        <div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:6}}>Buscar insights — últimos 30 dias:</div>
                        <Code lang="GET">{`GET https://graph.facebook.com/v19.0/act_123456789/insights
  ?fields=impressions,reach,clicks,ctr,cpc,spend,actions,action_values
  &date_preset=last_30d
  &level=campaign
  &access_token={SEU_TOKEN}`}</Code>
                        <div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:6,marginTop:14}}>Resposta esperada:</div>
                        <Code lang="JSON">{`{
  "data": [{
    "impressions": "124500",
    "reach": "89200",
    "clicks": "2490",
    "ctr": "2.0",
    "cpc": "0.74",
    "spend": "1842.60",
    "actions": [{"action_type":"purchase","value":"38"}],
    "action_values": [{"action_type":"purchase","value":"7560.00"}]
  }]
}`}</Code>
                        <div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:6,marginTop:14}}>Listar contas do BM:</div>
                        <Code lang="GET">{`GET https://graph.facebook.com/v19.0/{BM_ID}/owned_ad_accounts
  ?fields=id,name,account_status,currency,timezone_name
  &access_token={SEU_TOKEN}`}</Code>
                      </div>

                      {/* PASSO 7 */}
                      <div id="doc-erros" style={{marginBottom:26}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>7. Erros comuns</div>
                        {[{code:"190",t:"Token inválido ou expirado",s:"Gere um novo token de longa duração ou use token de sistema. Implemente refresh automático antes dos 60 dias."},{code:"200",t:"Permissão insuficiente",s:"Adicione a permissão faltante e garanta que o usuário tem acesso Admin à conta de anúncios."},{code:"4",t:"Rate limit atingido",s:"Implemente exponential backoff. Máx 200 req/hora por token. Use batch requests para múltiplas contas."},{code:"100",t:"Parâmetro inválido",s:"Verifique os campos no parâmetro 'fields'. Alguns precisam de permissões especiais."},{code:"368",t:"Conta de anúncio suspensa",s:"A conta foi bloqueada. Acesse o Business Manager para verificar o status e enviar apelação."}].map(e=>(<div key={e.code} style={{display:"flex",gap:12,background:"rgba(239,68,68,.04)",borderRadius:10,border:"1px solid rgba(239,68,68,.12)",padding:"12px 16px",marginBottom:8}}><span style={{fontFamily:T.mono,fontSize:12,fontWeight:700,color:T.err,flexShrink:0,minWidth:36}}>#{e.code}</span><div><div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:3}}>{e.t}</div><div style={{fontSize:11,color:T.mute,lineHeight:1.6}}>{e.s}</div></div></div>))}
                      </div>

                      {/* PASSO 8 */}
                      <div id="doc-boas" style={{marginBottom:8}}>
                        <div style={{fontSize:14,fontWeight:700,color:T.txt,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><span style={{width:3,height:16,background:T.meta,borderRadius:2,display:"inline-block"}}></span>8. Boas práticas</div>
                        {[{ico:"🔒",t:"Nunca exponha tokens no frontend",d:"Guarde no backend e chame a API server-side. Use variáveis de ambiente (.env) para App Secret."},{ico:"🔄",t:"Renove tokens automaticamente",d:"Tokens de usuário expiram em 60 dias. Configure um job para renovar antes do vencimento."},{ico:"📦",t:"Batch Requests para múltiplas contas",d:"Agrupe até 50 chamadas em um POST para /v19.0/ com o campo 'batch', economizando rate limit."},{ico:"⏱",t:"Respeite os rate limits",d:"Em erro #4 aguarde 60 segundos. Implemente fila de requisições com delay entre chamadas."},{ico:"📊",t:"Use date_preset a datas absolutas",d:"Prefira last_7d, last_30d, last_90d para facilitar manutenção e evitar erros de timezone."},{ico:"🗂",t:"Cache os dados de estrutura",d:"Campanhas mudam pouco — cache por 1h. Insights de performance: atualize a cada 15-30 min."}].map(x=>(<div key={x.t} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}><span style={{fontSize:18,flexShrink:0}}>{x.ico}</span><div><div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:2}}>{x.t}</div><div style={{fontSize:11,color:T.mute,lineHeight:1.6}}>{x.d}</div></div></div>))}
                        <div style={{marginTop:20,background:"rgba(0,129,251,.06)",border:"1px solid rgba(0,129,251,.15)",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                          <div style={{fontSize:20}}>📚</div>
                          <div><div style={{fontSize:12,fontWeight:500,color:T.txt,marginBottom:2}}>Documentação oficial da Meta</div><div style={{fontSize:11,color:T.meta,fontFamily:T.mono}}>developers.facebook.com/docs/marketing-api</div></div>
                          <button className="btn-p" onClick={()=>setConnTab("connect")} style={{marginLeft:"auto",padding:"8px 16px",borderRadius:8,border:"none",background:T.meta,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font,flexShrink:0}}>Conectar agora →</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
