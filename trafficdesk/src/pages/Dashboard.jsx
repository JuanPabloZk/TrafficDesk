import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
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

const clients=[
  {id:1,name:"Empresa Alpha",short:"EA",platforms:["meta","google"],budget:15000,status:"active"},
  {id:2,name:"Loja Beta",short:"LB",platforms:["meta"],budget:5000,status:"warning"},
  {id:3,name:"Startup Gama",short:"SG",platforms:["google"],budget:8000,status:"paused"},
  {id:4,name:"Marca Delta",short:"MD",platforms:["meta","google"],budget:20000,status:"active"},
  {id:5,name:"Clínica Epsilon",short:"CE",platforms:["meta"],budget:3500,status:"active"},
];
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

const IcoBudget=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6h12" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="9" r="1" fill="currentColor"/></svg>;
const IcoExport=()=><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;

const navItems=[
  {id:"dashboard",label:"Dashboard",Icon:IcoGrid},
  {id:"clients",label:"Clientes",Icon:IcoPpl},
  {id:"tasks",label:"Tarefas",Icon:IcoList},
  {id:"reports",label:"Relatórios",Icon:IcoChart},
  {id:"export",label:"Exportar",Icon:IcoExport},
  {id:"whatsapp",label:"WhatsApp",Icon:IcoWA},
  {id:"budget",label:"Verba",Icon:IcoBudget},
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
  const[dashPeriod,setDashPeriod]=useState("last_30d");
  const[showDatePicker,setShowDatePicker]=useState(false);
  const[customRange,setCustomRange]=useState({start:null,end:null,selecting:false});
  const[calYear,setCalYear]=useState(()=>new Date().getFullYear());
  const[calMonth,setCalMonth]=useState(()=>new Date().getMonth());
  const[liveMetrics,setLiveMetrics]=useState(null);
  const[fetchingInsights,setFetchingInsights]=useState(false);
  const[alerts,setAlerts]=useState([]);
  const[budgetRules,setBudgetRules]=useState([]);
  const[budgetLoading,setBudgetLoading]=useState(true);
  const[showBudgetForm,setShowBudgetForm]=useState(false);
  const[newBudget,setNewBudget]=useState({name:"",accountId:"",currency:"BRL",limit:"",alertPct:80,period:"monthly"});
  const[budgetAlerts,setBudgetAlerts]=useState([]);
  const[budgetFilter,setBudgetFilter]=useState("all");
  // Exportar planilha — estados
  const[exportConfig,setExportConfig]=useState({
    accountIds:[],
    period:"this_month",
    customRange:{start:null,end:null},
    level:"account", // account, campaign, adset
    metrics:["spend","impressions","clicks","cpc","conversions","cpa"],
    spreadsheetId:"",
    sheetName:"Sheet1",
    layout:"vertical", // vertical (como o template) ou horizontal
    startCell:"A1",
  });
  const[exportLoading,setExportLoading]=useState(false);
  const[exportLog,setExportLog]=useState(null);
  const[googleSheetsAuth,setGoogleSheetsAuth]=useState(null);
  const[exportShowPicker,setExportShowPicker]=useState(false);
  const[exportCalMonth,setExportCalMonth]=useState(new Date().getMonth());
  const[exportCalYear,setExportCalYear]=useState(new Date().getFullYear());
  const[clientSettings,setClientSettings]=useState({});
  const[repLoading,setRepLoading]=useState(false);
  const[repData,setRepData]=useState(null);
  const[repError,setRepError]=useState("");
  const[repShowPicker,setRepShowPicker]=useState(false);
  const[repShowAccounts,setRepShowAccounts]=useState(false);
  const[repCustomRange,setRepCustomRange]=useState({start:null,end:null,selecting:false});
  const[repCalYear,setRepCalYear]=useState(()=>new Date().getFullYear());
  const[repCalMonth,setRepCalMonth]=useState(()=>new Date().getMonth());
  const[isMobile,setIsMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  const{user,signOut}=useAuth();
  const navigate=useNavigate();
  const[savedToken,setSavedToken]=useState("");
  const GRAPH="https://graph.facebook.com/v19.0";

  const periods=[
    {v:"today",l:"Hoje"},{v:"yesterday",l:"Ontem"},
    {v:"last_7d",l:"7 dias"},{v:"last_14d",l:"14 dias"},
    {v:"last_30d",l:"30 dias"},{v:"last_90d",l:"90 dias"},
    {v:"this_month",l:"Este mês"},{v:"last_month",l:"Mês passado"},
  ];

  // ── Supabase helpers ──────────────────────────────────────
  function timeAgo(ts){const d=Math.floor((new Date()-new Date(ts))/60000);if(d<60)return d+"min";if(d<1440)return Math.floor(d/60)+"h";return Math.floor(d/1440)+"d";}

  async function fetchInsights(accounts,token,period,dateRange){
    if(!token||!accounts?.length)return;
    setFetchingInsights(true);
    try{
      const results=await Promise.all(accounts.map(async(acc)=>{
        // Build time params — custom range or preset
        let timeParam;
        if(dateRange?.start&&dateRange?.end){
          timeParam=`time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}`;
        } else {
          timeParam=`date_preset=${period||"last_30d"}`;
        }
        const res=await fetch(`${GRAPH}/act_${acc.id}/insights?fields=impressions,reach,clicks,ctr,cpc,spend,actions,action_values&${timeParam}&level=account&access_token=${token}`);
        const data=await res.json();
        if(data.error||!data.data?.[0])return null;
        const d=data.data[0];

        // ── EXPANDED conversion detection ──
        // Result = sum of ALL relevant conversion-like actions
        // (Meta returns "Resultados" as the campaign optimization goal)
        const conversionTypes=[
          "purchase","omni_purchase","offsite_conversion.fb_pixel_purchase",
          "lead","omni_lead","offsite_conversion.fb_pixel_lead","onsite_conversion.lead_grouped",
          "complete_registration","omni_complete_registration",
          "messaging_conversation_started_7d","onsite_conversion.messaging_conversation_started_7d",
          "messaging_first_reply",
          "onsite_conversion.purchase",
          "onsite_conversion.flow_complete",
          "submit_application","schedule",
        ];
        const valueTypes=[
          "purchase","omni_purchase","offsite_conversion.fb_pixel_purchase",
          "lead","omni_lead","offsite_conversion.fb_pixel_lead",
          "onsite_conversion.purchase",
        ];

        // Build a breakdown of all conversion types found
        const breakdown=(d.actions||[]).filter(a=>conversionTypes.includes(a.action_type)).map(a=>({type:a.action_type,value:parseInt(a.value)||0}));

        // Total conversions = sum of all conversion-like actions (priority: campaign objective)
        // Use first match priority order, else sum all
        let totalConv=0;
        const primaryOrder=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","lead","omni_lead","offsite_conversion.fb_pixel_lead","messaging_conversation_started_7d","onsite_conversion.messaging_conversation_started_7d","complete_registration"];
        for(const t of primaryOrder){
          const found=d.actions?.find(a=>a.action_type===t);
          if(found){totalConv=parseInt(found.value)||0;break;}
        }
        // If no priority match, sum all conversion-like actions
        if(totalConv===0){
          totalConv=(d.actions||[]).filter(a=>conversionTypes.includes(a.action_type)).reduce((s,a)=>s+(parseInt(a.value)||0),0);
        }

        // Conversion value
        const convVal=(d.action_values||[]).find(a=>valueTypes.includes(a.action_type));

        return{
          client:acc.name,accountId:acc.id,
          impressoes:parseInt(d.impressions)||0,
          alcance:parseInt(d.reach)||0,
          cliques:parseInt(d.clicks)||0,
          ctr:parseFloat(d.ctr||0).toFixed(2),
          cpc:parseFloat(d.cpc||0).toFixed(2),
          investido:parseFloat(d.spend||0).toFixed(2),
          conversoes:totalConv,
          valorResult:parseFloat(convVal?.value||0).toFixed(2),
          breakdown,
          allActions:d.actions||[],
        };
      }));
      const valid=results.filter(Boolean);
      if(valid.length>0){
        setLiveMetrics(valid);
        if(user?.id){
          await supabase.from("alerts").delete().eq("user_id",user.id).eq("auto_generated",true);
          const newAlerts=[];
          valid.forEach(m=>{
            if(parseFloat(m.ctr)<1) newAlerts.push({user_id:user.id,severity:"med",client:m.client,message:`CTR baixo: ${m.ctr}% — verifique os criativos`,platform:"meta",auto_generated:true});
            const roas=parseFloat(m.investido)>0?parseFloat(m.valorResult)/parseFloat(m.investido):0;
            if(roas>0&&roas<2) newAlerts.push({user_id:user.id,severity:"high",client:m.client,message:`ROAS ${roas.toFixed(2)}x — abaixo de 2x`,platform:"meta",auto_generated:true});
          });
          if(newAlerts.length>0){
            const{data:aData}=await supabase.from("alerts").insert(newAlerts).select();
            if(aData) setAlerts(prev=>[...aData.map(a=>({id:a.id,sev:a.severity,client:a.client||"",msg:a.message||"",age:"agora",plat:a.platform||"meta",resolved:false})),...prev.filter(a=>!a.auto_generated)]);
          }
          await Promise.all(valid.map(m=>supabase.from("metrics_cache").upsert({user_id:user.id,account_id:m.accountId,platform:"meta",period:period||"last_30d",data:m,fetched_at:new Date().toISOString()},{onConflict:"user_id,account_id,platform,period"})));
        }
      }
    }catch(e){console.error("fetchInsights error:",e);}
    finally{setFetchingInsights(false);}
  }

  async function changePeriod(p){
    setDashPeriod(p);
    setCustomRange({start:null,end:null,selecting:false});
    setShowDatePicker(false);
    if(metaStatus==="connected"&&metaAccounts.length>0&&savedToken){
      await fetchInsights(metaAccounts,savedToken,p,null);
    }
  }

  async function applyCustomRange(start,end){
    if(!start||!end)return;
    setShowDatePicker(false);
    setDashPeriod("custom");
    if(metaStatus==="connected"&&metaAccounts.length>0&&savedToken){
      await fetchInsights(metaAccounts,savedToken,null,{start,end});
    }
  }

  async function saveConnection(platform,token,bmId,accounts){
    if(!user?.id){console.warn("saveConnection: no user");return;}
    try{
      const{error:connErr}=await supabase.from("connections").upsert({
        user_id:user.id,platform,access_token:token,bm_id:bmId,
        status:"connected",connected_at:new Date().toISOString(),updated_at:new Date().toISOString()
      },{onConflict:"user_id,platform"});
      if(connErr)console.error("saveConnection (connections):",connErr);

      localStorage.setItem(`td_${platform}_accounts`,JSON.stringify(accounts));

      // ★ Persistir contas como "clients" no Supabase
      if(accounts?.length>0){
        const clientRows=accounts.map(a=>({
          user_id:user.id,
          account_id:a.id,
          platform,
          name:a.name,
          short:a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),
          platforms:[platform],
          currency:a.currency||"BRL",
          status:a.status==="active"?"active":"paused",
          last_synced_at:new Date().toISOString(),
          is_archived:false,
        }));
        const{error:cliErr}=await supabase.from("clients").upsert(clientRows,{onConflict:"user_id,account_id,platform"});
        if(cliErr)console.error("saveConnection (clients):",cliErr);
      }
    }catch(e){
      console.error("saveConnection error:",e);
    }
  }

  async function loadSavedClients(platform){
    if(!user?.id)return[];
    try{
      const{data,error}=await supabase.from("clients").select("*").eq("user_id",user.id).eq("platform",platform).eq("is_archived",false).order("name");
      if(error){console.error("loadSavedClients:",error);return[];}
      return(data||[]).map(c=>({id:c.account_id,name:c.name,status:c.status,currency:c.currency||"BRL",spend:"R$ 0,00"}));
    }catch(e){
      console.error("loadSavedClients error:",e);
      return[];
    }
  }

  async function clearConnection(platform){
    if(!user?.id)return;
    await supabase.from("connections").upsert({user_id:user.id,platform,status:"idle",access_token:null,bm_id:null,updated_at:new Date().toISOString()},{onConflict:"user_id,platform"});
    localStorage.removeItem(`td_${platform}_accounts`);
    // Archive (não deleta — mantém histórico) clientes da plataforma
    await supabase.from("clients").update({is_archived:true}).eq("user_id",user.id).eq("platform",platform);
  }

  async function saveClientBudget(accountId,platform,budget){
    if(!user?.id)return;
    await supabase.from("client_settings").upsert({user_id:user.id,account_id:accountId,platform,budget,updated_at:new Date().toISOString()},{onConflict:"user_id,account_id,platform"});
    setClientSettings(prev=>({...prev,[`${platform}_${accountId}`]:{...prev[`${platform}_${accountId}`],budget}}));
  }

  async function resolveAlert(id){
    setAlerts(prev=>prev.filter(a=>a.id!==id));
    if(user?.id) await supabase.from("alerts").update({resolved:true}).eq("id",id).eq("user_id",user.id);
  }

  async function saveBudgetRule(){
    if(!newBudget.name||!newBudget.limit){
      alert("Preencha o nome e o valor do limite.");
      return;
    }
    if(!user?.id){
      alert("Erro: usuário não identificado. Faça login novamente.");
      return;
    }
    const row={
      user_id:user.id,
      name:newBudget.name,
      account_id:newBudget.accountId||null,
      currency:newBudget.currency,
      limit_value:parseFloat(newBudget.limit),
      alert_pct:parseInt(newBudget.alertPct),
      period:newBudget.period,
    };
    try{
      const{data,error}=await supabase.from("budget_rules").insert(row).select().single();
      if(error){
        console.error("saveBudgetRule:",error);
        alert("Erro ao salvar a regra: "+(error.message||"verifique sua conexão"));
        return;
      }
      if(data){
        setBudgetRules(prev=>[data,...prev]);
        setNewBudget({name:"",accountId:"",currency:"BRL",limit:"",alertPct:80,period:"monthly"});
        setShowBudgetForm(false);
      }
    }catch(e){
      console.error("saveBudgetRule error:",e);
      alert("Erro inesperado ao salvar a regra.");
    }
  }

  async function deleteBudgetRule(id){
    if(!confirm("Tem certeza que deseja remover esta regra?"))return;
    setBudgetRules(prev=>prev.filter(r=>r.id!==id));
    if(user?.id){
      const{error}=await supabase.from("budget_rules").delete().eq("id",id).eq("user_id",user.id);
      if(error)console.error("deleteBudgetRule:",error);
    }
  }

  async function updateBudgetRule(id,field,value){
    setBudgetRules(prev=>prev.map(r=>r.id===id?{...r,[field]:value}:r));
    if(user?.id) await supabase.from("budget_rules").update({[field]:value}).eq("id",id).eq("user_id",user.id);
  }

  // ── Load all data on mount ────────────────────────────────
  useEffect(()=>{
    if(!user?.id)return;
    (async()=>{
      try{
        // Tasks
        const{data:tData,error:tErr}=await supabase.from("tasks").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
        if(tErr)console.error("load tasks:",tErr);
        else if(tData)setTasks(tData.map(t=>({id:t.id,title:t.title,client:t.client||"",status:t.status,priority:t.priority,due:t.due||"–"})));

        // WA Campaigns
        const{data:waData,error:waErr}=await supabase.from("wa_campaigns").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
        if(waErr)console.error("load wa_campaigns:",waErr);
        else if(waData)setWaCampaigns(waData.map(c=>({id:c.id,name:c.name,client:c.client||"",status:c.status,total:c.total||0,sent:c.sent||0,delivered:c.delivered||0,read:c.read_count||0,replied:c.replied||0,converted:c.converted||0,createdAt:new Date(c.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),scheduledAt:c.scheduled_at||"",msg:c.msg||""})));

        // Alerts
        const{data:aData,error:aErr}=await supabase.from("alerts").select("*").eq("user_id",user.id).eq("resolved",false).order("created_at",{ascending:false}).limit(20);
        if(aErr)console.error("load alerts:",aErr);
        else if(aData)setAlerts(aData.map(a=>({id:a.id,sev:a.severity,client:a.client||"",msg:a.message||"",age:timeAgo(a.created_at),plat:a.platform||"meta",resolved:false,auto_generated:a.auto_generated})));

        // Budget rules
        const{data:brData,error:brErr}=await supabase.from("budget_rules").select("*").eq("user_id",user.id).order("created_at",{ascending:false});
        if(brErr)console.error("load budget_rules:",brErr);
        else if(brData)setBudgetRules(brData);
        setBudgetLoading(false);

        // Client settings
        const{data:csData,error:csErr}=await supabase.from("client_settings").select("*").eq("user_id",user.id);
        if(csErr)console.error("load client_settings:",csErr);
        else if(csData){const map={};csData.forEach(s=>{map[`${s.platform}_${s.account_id}`]=s;});setClientSettings(map);}

        // User preferences (maybeSingle handles no-row gracefully)
        let pData=null;
        try{
          const{data}=await supabase.from("user_preferences").select("*").eq("user_id",user.id).maybeSingle();
          pData=data;
        }catch(e){console.error("load user_preferences:",e);}
        if(pData?.dash_period)setDashPeriod(pData.dash_period);

      // Restore connection
      const{data:connData}=await supabase.from("connections").select("*").eq("user_id",user.id).eq("status","connected");
      if(connData?.length){
        for(const conn of connData){
          if(conn.platform==="meta"&&conn.access_token&&conn.bm_id){
            setMetaForm(f=>({...f,accessToken:conn.access_token,bmId:conn.bm_id}));
            setSavedToken(conn.access_token);

            // ★ Priority 1: Load from Supabase clients table (instant, works offline)
            const savedClients=await loadSavedClients("meta");
            if(savedClients.length>0){
              setMetaAccounts(savedClients);setMetaStatus("connected");setMetaStep(2);
              localStorage.setItem("td_meta_accounts",JSON.stringify(savedClients)); // sync cache
              await fetchInsights(savedClients,conn.access_token,dashPeriod);
              continue;
            }

            // Priority 2: localStorage cache
            const cached=localStorage.getItem("td_meta_accounts");
            if(cached){
              const accs=JSON.parse(cached);
              setMetaAccounts(accs);setMetaStatus("connected");setMetaStep(2);
              // Save to Supabase for next time
              await saveConnection("meta",conn.access_token,conn.bm_id,accs);
              await fetchInsights(accs,conn.access_token,dashPeriod);
              continue;
            }

            // Priority 3: Fetch fresh from Meta API
            try{
              const res=await fetch(`${GRAPH}/${conn.bm_id}/owned_ad_accounts?fields=id,name,account_status,currency,amount_spent&access_token=${conn.access_token}&limit=20`);
              const d=await res.json();
              if(!d.error&&d.data){
                const accs=d.data.map(a=>({id:a.id.replace("act_",""),name:a.name,status:a.account_status===1?"active":"inactive",currency:a.currency||"BRL",spend:"R$ 0,00"}));
                setMetaAccounts(accs);setMetaStatus("connected");setMetaStep(2);
                localStorage.setItem("td_meta_accounts",JSON.stringify(accs));
                // Save to Supabase
                await saveConnection("meta",conn.access_token,conn.bm_id,accs);
                await fetchInsights(accs,conn.access_token,dashPeriod);
              }
            }catch(e){console.error("restore meta:",e);}
          }
        }
      }

      // Metrics cache (show while loading)
      const{data:mcData,error:mcErr}=await supabase.from("metrics_cache").select("*").eq("user_id",user.id);
      if(mcErr)console.error("load metrics_cache:",mcErr);
      else if(mcData?.length){
        const fresh=mcData.filter(m=>new Date()-new Date(m.fetched_at)<7200000);
        if(fresh.length>0) setLiveMetrics(fresh.map(m=>m.data));
      }
      }catch(err){
        console.error("Data load error:",err);
        setBudgetLoading(false);
      }
    })();
  },[user?.id]);

  // Save preferences when period changes
  useEffect(()=>{
    if(!user?.id||!dashPeriod)return;
    supabase.from("user_preferences").upsert({user_id:user.id,dash_period:dashPeriod,updated_at:new Date().toISOString()},{onConflict:"user_id"}).then(()=>{}).catch(()=>{});
  },[dashPeriod,user?.id]);

  // Budget alerts check
  useEffect(()=>{
    if(!liveMetrics||!budgetRules.length){setBudgetAlerts([]);return;}
    const triggered=budgetRules.filter(rule=>{
      let spent;
      if(rule.account_id){
        // Regra para conta específica
        const m=liveMetrics.find(d=>d.accountId===rule.account_id);
        spent=m?parseFloat(m.investido):0;
      }else{
        // Regra para todas as contas — soma tudo
        spent=liveMetrics.reduce((s,m)=>s+parseFloat(m.investido||0),0);
      }
      const pct=rule.limit_value>0?(spent/rule.limit_value)*100:0;
      return pct>=rule.alert_pct;
    });
    setBudgetAlerts(triggered);
  },[liveMetrics,budgetRules]);


  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);
  const[tasks,setTasks]=useState([]);
  const[showNew,setShowNew]=useState(false);
  const[nt,setNt]=useState({title:"",client:"",priority:"med"});
  const[tf,setTf]=useState("all");

  // WhatsApp state
  const[waCampaigns,setWaCampaigns]=useState([]);
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
  const[connTab,setConnTab]=useState("connect"); // connect | docs
  const[metaError,setMetaError]=useState("");

  const connectMeta=async()=>{
    if(!metaForm.accessToken||!metaForm.bmId)return;
    setMetaStatus("connecting");
    setMetaError("");
    try{
      // 1) Validate token — get user info
      const meRes=await fetch(`${GRAPH}/me?fields=id,name&access_token=${metaForm.accessToken}`);
      const meData=await meRes.json();
      if(meData.error)throw new Error(meData.error.message);

      // 2) Fetch ad accounts owned by the BM
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
      setMetaAccounts(finalAccounts);setMetaStatus("connected");setMetaStep(2);
      setSavedToken(metaForm.accessToken);
      await saveConnection("meta",metaForm.accessToken,metaForm.bmId,finalAccounts);
      // ← Fix: switch to dashboard and fetch data immediately
      setView("dashboard");
      setLiveMetrics(null); // clear stale data first
      await fetchInsights(finalAccounts,metaForm.accessToken,dashPeriod,customRange.start?customRange:null);
    }catch(err){
      setMetaStatus("error");
      setMetaError(err.message||"Erro ao conectar. Verifique o token e o BM ID.");
    }
  };

  const disconnectMeta=()=>{setMetaStatus("idle");setMetaAccounts([]);setMetaForm(initMeta);setMetaStep(0);setMetaError("");setLiveMetrics(null);setSavedToken("");clearConnection("meta");};

  const connectGoogle=()=>{
    if(!googleForm.clientId||!googleForm.clientSecret||!googleForm.devToken)return;
    setGoogleStatus("connecting");
    setTimeout(()=>{setGoogleStatus("connected");setGoogleAccounts(mockGoogleAccounts);setGoogleStep(2);},2000);
  };
  const disconnectGoogle=()=>{setGoogleStatus("idle");setGoogleAccounts([]);setGoogleForm(initGoogle);setGoogleStep(0);};

  // ═══════════════════════════════════════════════════════════
  // KPIs do Dashboard — calculados a partir de liveMetrics (dados reais)
  // ═══════════════════════════════════════════════════════════
  const totMeta=liveMetrics?liveMetrics.reduce((s,d)=>s+parseFloat(d.investido||0),0):0;
  const totGoogle=googleRows.reduce((s,d)=>s+d.spend,0); // Google ainda mockup
  const total=totMeta+totGoogle;
  const totalConvValue=liveMetrics?liveMetrics.reduce((s,d)=>s+parseFloat(d.valorResult||0),0):0;
  // ROAS médio: valor de conversão / investimento (não média de roas individuais)
  const avgMROAS=totMeta>0?(totalConvValue/totMeta).toFixed(1):"0.0";
  const avgGROAS=googleRows.length>0?(googleRows.reduce((s,d)=>s+d.roas,0)/googleRows.length).toFixed(1):"0.0";
  const crit=alerts.filter(a=>a.sev==="high").length;
  // Dynamic clients from connected accounts — cruza com liveMetrics para spend real
  function getRealSpend(accountId,platform){
    if(!liveMetrics)return null;
    const m=liveMetrics.find(d=>d.accountId===accountId);
    if(!m)return null;
    const currency=platform==="meta"?(metaAccounts.find(a=>a.id===accountId)?.currency||"BRL"):"BRL";
    const symbol={BRL:"R$",USD:"$",EUR:"€"}[currency]||"R$";
    return`${symbol} ${parseFloat(m.investido||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
  }
  // Build metaRows from liveMetrics for tables/exports
  const liveMetaRows=liveMetrics?liveMetrics.map(d=>{
    const spend=parseFloat(d.investido||0);
    const value=parseFloat(d.valorResult||0);
    return{
      client:d.client,
      accountId:d.accountId,
      spend,
      ctr:parseFloat(d.ctr||0),
      cpc:parseFloat(d.cpc||0),
      conv:parseInt(d.conversoes||0),
      roas:spend>0?+(value/spend).toFixed(2):0,
      impressoes:d.impressoes||0,
      alcance:d.alcance||0,
    };
  }):[];
  const dynClients=[
    ...metaAccounts.map((a,i)=>{
      const realSpend=getRealSpend(a.id,"meta");
      return{id:`meta-${i}`,name:a.name,short:a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),platforms:["meta"],budget:clientSettings[`meta_${a.id}`]?.budget||0,status:a.status||"active",accountId:a.id,spend:realSpend||a.spend||"R$ 0,00"};
    }),
    ...googleAccounts.map((a,i)=>({id:`google-${i}`,name:a.name,short:a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),platforms:["google"],budget:clientSettings[`google_${a.id}`]?.budget||0,status:a.status||"active",accountId:a.id,spend:a.spend||"R$ 0,00"})),
  ];
  const activeClients=dynClients;

  const addTask=async()=>{
    if(!nt.title||!nt.client)return;
    const row={user_id:user?.id,title:nt.title,client:nt.client,status:"todo",priority:nt.priority,due:"–"};
    const{data,error}=user?.id?await supabase.from("tasks").insert(row).select().single():{data:{id:Date.now(),...row},error:null};
    if(!error&&data) setTasks(ts=>[{id:data.id,title:data.title,client:data.client,status:data.status,priority:data.priority,due:data.due||"–"},...ts]);
    setNt({title:"",client:"",priority:"med"});setShowNew(false);
  };
  const move=async(id,status)=>{setTasks(ts=>ts.map(t=>t.id===id?{...t,status}:t));if(user?.id)await supabase.from("tasks").update({status}).eq("id",id).eq("user_id",user.id);};
  const exportCSV=()=>{
    const rows=[["Plataforma","Cliente","Gasto","CTR","CPC","Conv","ROAS"],
      ...liveMetaRows.map(d=>["Meta",d.client,d.spend,d.ctr,d.cpc,d.conv,d.roas]),
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
              {[{l:"Clientes",v:5,c:T.ok},{l:"Alertas",v:alerts.length,c:crit>0?T.err:T.warn}].map(x=>(<div key={x.l}><div style={{fontSize:10,color:T.mute,marginBottom:4,fontWeight:500}}>{x.l}</div><div style={{fontFamily:T.mono,fontSize:22,fontWeight:500,color:x.c}}>{x.v}</div></div>))}
            </div>
          </div>
          {/* User + signout */}
          <div style={{margin:"0 8px 14px",borderTop:`1px solid ${T.border}`,paddingTop:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 8px",marginBottom:8}}>
              <div style={{width:28,height:28,borderRadius:8,background:"rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,flexShrink:0}}>{user?.email?.[0]?.toUpperCase()||"U"}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:11,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email||"Admin"}</div><div style={{fontSize:9,color:T.mute,letterSpacing:".04em"}}>ADMIN</div></div>
            </div>
            <button onClick={async()=>{await signOut();navigate("/login");}} style={{width:"100%",padding:"8px 12px",borderRadius:9,border:"1px solid rgba(239,68,68,.2)",background:"rgba(239,68,68,.06)",color:T.err,cursor:"pointer",fontSize:11,fontWeight:500,fontFamily:T.font,display:"flex",alignItems:"center",gap:7}}>
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
              {{dashboard:"Visão Geral",clients:"Clientes",tasks:"Tarefas",reports:"Relatórios",budget:"Controle de Verba",whatsapp:"WhatsApp",connections:"Conexões"}[view]}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {crit>0&&<button onClick={()=>setView("dashboard")} style={{background:"rgba(239,68,68,.1)",border:`1px solid rgba(239,68,68,.25)`,borderRadius:8,padding:"4px 10px",fontSize:10,color:T.err,fontWeight:500,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:5}}><span className="sdot pulse" style={{background:T.err}}></span>{isMobile?crit:`${crit} alerta${crit>1?"s":""}`}</button>}
            {!isMobile&&<div style={{fontSize:11,color:T.mute,background:"rgba(255,255,255,.04)",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 12px"}}>{new Date().toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</div>}
          </div>
        </div>

        <div style={{padding:P,flex:1}}>

          {/* ═══════ DASHBOARD ═══════ */}
          {view==="dashboard"&&(
            <div>
              {/* ── Meta Ads style date picker ── */}
              {(()=>{
                const presets=[
                  {v:"today",l:"Hoje"},{v:"yesterday",l:"Ontem"},
                  {v:"this_month",l:"Este mês"},{v:"maximum",l:"Máximo"},
                  {v:"last_7d",l:"Últimos 7 dias"},{v:"last_14d",l:"Últimos 14 dias"},
                  {v:"last_28d",l:"Últimos 28 dias"},{v:"last_30d",l:"Últimos 30 dias"},
                  {v:"last_90d",l:"Últimos 90 dias"},{v:"this_week_sun_today",l:"Esta semana"},
                  {v:"last_week_sun_sat",l:"Semana passada"},{v:"last_month",l:"Mês passado"},
                ];

                // Calendar helpers
                const today=new Date();
                const rightMonth=calMonth===11?0:calMonth+1;
                const rightYear=calMonth===11?calYear+1:calYear;

                const monthNames=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
                const monthFull=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

                function getDays(year,month){
                  const first=new Date(year,month,1).getDay();
                  const days=new Date(year,month+1,0).getDate();
                  const dow=(first+6)%7; // Mon=0
                  return{offset:dow,days};
                }

                function toISO(y,m,d){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
                function fromISO(s){if(!s)return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}

                function isInRange(y,m,d){
                  if(!customRange.start||!customRange.end)return false;
                  const date=new Date(y,m,d);
                  return date>fromISO(customRange.start)&&date<fromISO(customRange.end);
                }
                function isStart(y,m,d){return toISO(y,m,d)===customRange.start;}
                function isEnd(y,m,d){return toISO(y,m,d)===customRange.end;}

                function handleDayClick(y,m,d){
                  const iso=toISO(y,m,d);
                  if(!customRange.selecting||!customRange.start){
                    setCustomRange({start:iso,end:null,selecting:true});
                  } else {
                    if(iso<customRange.start){
                      setCustomRange({start:iso,end:customRange.start,selecting:false});
                      applyCustomRange(iso,customRange.start);
                    } else {
                      setCustomRange({start:customRange.start,end:iso,selecting:false});
                      applyCustomRange(customRange.start,iso);
                    }
                  }
                }

                function renderCalendar(year,month){
                  const{offset,days}=getDays(year,month);
                  const cells=[];
                  for(let i=0;i<offset;i++)cells.push(null);
                  for(let d=1;d<=days;d++)cells.push(d);
                  const weeks=[];
                  for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
                  return(
                    <div style={{minWidth:200}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                        <span style={{fontSize:12,fontWeight:600,color:T.txt}}>{monthFull[month]} {year}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4}}>
                        {["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=>(
                          <div key={d} style={{fontSize:9,color:T.mute,textAlign:"center",padding:"2px 0",fontWeight:500}}>{d}</div>
                        ))}
                      </div>
                      {weeks.map((week,wi)=>(
                        <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                          {week.map((d,di)=>{
                            if(!d)return<div key={di}/>;
                            const start=isStart(year,month,d);
                            const end=isEnd(year,month,d);
                            const inRange=isInRange(year,month,d);
                            const isToday=toISO(year,month,d)===toISO(today.getFullYear(),today.getMonth(),today.getDate());
                            return(
                              <div key={di} onClick={()=>handleDayClick(year,month,d)}
                                style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,cursor:"pointer",borderRadius:start||end?"50%":"0",background:start||end?"#0081FB":inRange?"rgba(0,129,251,.15)":"transparent",color:start||end?"#fff":isToday?T.accent:T.txt,fontWeight:start||end||isToday?600:400,position:"relative"}}>
                                {d}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                }

                const activeLabel=dashPeriod==="custom"&&customRange.start&&customRange.end
                  ?`${customRange.start} → ${customRange.end}`
                  :presets.find(p=>p.v===dashPeriod)?.l||"Últimos 30 dias";

                return(
                  <div style={{position:"relative",marginBottom:14}}>
                    {/* Trigger button — looks like Meta Ads */}
                    <button onClick={()=>setShowDatePicker(!showDatePicker)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:9,border:`1px solid ${T.borderMid}`,background:T.card,color:T.txt,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:T.font}}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke={T.meta} strokeWidth="1.2"/><path d="M1 5.5h12" stroke={T.meta} strokeWidth="1.2"/><path d="M4 1v3M10 1v3" stroke={T.meta} strokeWidth="1.2" strokeLinecap="round"/></svg>
                      <span style={{color:T.meta,fontWeight:600}}>{activeLabel}</span>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke={T.sub} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>

                    {/* Picker dropdown */}
                    {showDatePicker&&(
                      <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:999,background:"#131825",border:`1px solid ${T.borderMid}`,borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.6)",display:"flex",minWidth:560}}>
                        {/* Left: presets */}
                        <div style={{width:170,borderRight:`1px solid ${T.border}`,padding:"12px 0",flexShrink:0}}>
                          <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",padding:"0 14px 8px",fontWeight:500}}>USADOS RECENTEMENTE</div>
                          {presets.map(p=>(
                            <div key={p.v} onClick={()=>changePeriod(p.v)}
                              style={{padding:"7px 14px",fontSize:12,color:dashPeriod===p.v?T.txt:T.sub,cursor:"pointer",background:dashPeriod===p.v?"rgba(255,255,255,.06)":"transparent",display:"flex",alignItems:"center",gap:7}}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.04)"}
                              onMouseLeave={e=>e.currentTarget.style.background=dashPeriod===p.v?"rgba(255,255,255,.06)":"transparent"}>
                              {dashPeriod===p.v&&<span style={{width:6,height:6,borderRadius:"50%",background:T.meta,display:"inline-block",flexShrink:0}}></span>}
                              {dashPeriod!==p.v&&<span style={{width:6,height:6,flexShrink:0}}></span>}
                              {p.l}
                            </div>
                          ))}
                        </div>

                        {/* Right: calendars */}
                        <div style={{flex:1,padding:16}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1}}>‹</button>
                            <div style={{fontSize:11,color:T.mute,fontWeight:500}}>
                              {customRange.start&&customRange.end?`${customRange.start} → ${customRange.end}`:customRange.start?"Selecione a data final":"Selecione o período"}
                            </div>
                            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1}}>›</button>
                          </div>
                          <div style={{display:"flex",gap:20}}>
                            {renderCalendar(calYear,calMonth)}
                            {renderCalendar(rightYear,rightMonth)}
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                            <div style={{fontSize:11,color:T.mute}}>Fuso: Horário de Brasília</div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={()=>{setShowDatePicker(false);setCustomRange({start:null,end:null,selecting:false});}} style={{padding:"6px 14px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Cancelar</button>
                              <button onClick={()=>{if(customRange.start&&customRange.end)applyCustomRange(customRange.start,customRange.end);}} disabled={!customRange.start||!customRange.end} style={{padding:"6px 14px",borderRadius:7,border:"none",background:customRange.start&&customRange.end?T.meta:"rgba(0,129,251,.3)",color:"#fff",fontSize:11,cursor:customRange.start&&customRange.end?"pointer":"not-allowed",fontFamily:T.font,fontWeight:600}}>Atualizar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Refresh + status */}
                    <div style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
                      {metaStatus==="connected"&&(
                        <button onClick={()=>fetchInsights(metaAccounts,savedToken,dashPeriod==="custom"?null:dashPeriod,customRange.start&&customRange.end?customRange:null)} disabled={fetchingInsights} style={{padding:"5px 11px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:fetchingInsights?"not-allowed":"pointer",fontSize:11,fontFamily:T.font,display:"flex",alignItems:"center",gap:5,opacity:fetchingInsights?.5:1}}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{animation:fetchingInsights?"spin .8s linear infinite":"none"}}><path d="M10 6A4 4 0 1 1 6 2a4 4 0 0 1 2.83 1.17L10 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 1v3H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          {fetchingInsights?"Buscando...":"Atualizar"}
                        </button>
                      )}
                      {liveMetrics&&!fetchingInsights&&<span style={{fontSize:11,color:T.ok}}>✅ Dados reais · {activeLabel}</span>}
                      {fetchingInsights&&<span style={{fontSize:11,color:T.accent}}>⏳ Buscando dados...</span>}
                      {!liveMetrics&&metaStatus!=="connected"&&<span style={{fontSize:11,color:T.mute}}>Conecte o BM para ver dados reais</span>}
                    </div>
                  </div>
                );
              })()}

              <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?10:12,marginBottom:isMobile?14:18}}>
                <MCard label="Gasto Total" value={`R$ ${(total/1000).toFixed(1)}k`} sub={dashPeriod==="custom"&&customRange.start?`${customRange.start} → ${customRange.end||"..."}`:periods.find(p=>p.v===dashPeriod)?.l||"período"} accent={T.accent} m={isMobile}/>
                <MCard label="ROAS Meta" value={avgMROAS+"x"} sub={liveMetrics?"dados reais":"sem dados"} accent={T.meta} up={parseFloat(avgMROAS)>2} m={isMobile}/>
                <MCard label="ROAS Google" value={avgGROAS+"x"} sub="estável" accent={T.google} m={isMobile}/>
                <MCard label="Alertas" value={alerts.length} sub={`${crit} crítico${crit!==1?"s":""}`} accent={T.err} up={false} m={isMobile}/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 360px",gap:12,marginBottom:12}}>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {[{label:"Meta Ads",color:T.meta,rows:liveMetaRows,tot:totMeta,lowCTR:1.2},{label:"Google Ads",color:T.google,rows:googleRows,tot:totGoogle,lowCTR:2}].map(pl=>(
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
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(288px,1fr))",gap:12}}>
              {activeClients.map(c=>{
                // Usa liveMetrics (dados reais) em vez de metaRows (mockados)
                const liveData=liveMetrics?.find(d=>d.accountId===c.accountId);
                const tot=liveData?parseFloat(liveData.investido)||0:0;
                const pct=c.budget>0?Math.min(Math.round((tot/c.budget)*100),100):0;
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
                        {l:"Gasto",v:fR(tot)},{l:"Orçamento",v:fR(c.budget)},
                        ...(liveData?[
                          {l:"Resultados",v:liveData.conversoes||0},
                          {l:"CTR",v:liveData.ctr+"%"},
                        ]:[]),
                      ].map((m,i)=>(
                        <div key={i} style={{background:"rgba(255,255,255,.03)",borderRadius:8,border:`1px solid ${T.border}`,padding:"10px 12px"}}>
                          <div style={{fontSize:9,color:T.mute,marginBottom:4,fontWeight:500,letterSpacing:".07em",textTransform:"uppercase"}}>{m.l}</div>
                          <div style={{fontFamily:T.mono,fontSize:14,color:T.txt}}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <span style={{fontSize:10,color:T.mute}}>Uso do orçamento</span>
                        <span style={{fontSize:10,fontFamily:T.mono,color:c.budget>0?bc:T.mute}}>{c.budget>0?`${pct}%`:"Defina o orçamento"}</span>
                      </div>
                      <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:4,overflow:"hidden"}}>
                        <div style={{background:c.budget>0?bc:T.mute,width:c.budget>0?`${pct}%`:"0%",height:"100%",borderRadius:100}}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                        {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
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
            const repPeriodMap={"7d":"last_7d","14d":"last_14d","30d":"last_30d","90d":"last_90d","this_month":"this_month","last_month":"last_month"};
            const periodLabels={"7d":"7 dias","14d":"14 dias","30d":"30 dias","90d":"90 dias","this_month":"Este mês","last_month":"Mês passado"};
            const actionLabels={"purchase":"Compras","omni_purchase":"Compras (Omni)","offsite_conversion.fb_pixel_purchase":"Compras (Pixel)","lead":"Leads","omni_lead":"Leads (Omni)","offsite_conversion.fb_pixel_lead":"Leads (Pixel)","onsite_conversion.lead_grouped":"Leads agrupados","complete_registration":"Cadastros","omni_complete_registration":"Cadastros (Omni)","messaging_conversation_started_7d":"Conversas WhatsApp","onsite_conversion.messaging_conversation_started_7d":"Conversas Messenger","messaging_first_reply":"Primeira resposta","onsite_conversion.purchase":"Compras (onsite)","onsite_conversion.flow_complete":"Fluxos completos","submit_application":"Aplicações","schedule":"Agendamentos"};
            const conversionTypes=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","lead","omni_lead","offsite_conversion.fb_pixel_lead","onsite_conversion.lead_grouped","complete_registration","omni_complete_registration","messaging_conversation_started_7d","onsite_conversion.messaging_conversation_started_7d","messaging_first_reply","onsite_conversion.purchase","onsite_conversion.flow_complete","submit_application","schedule"];
            const valueTypes=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","lead","omni_lead","offsite_conversion.fb_pixel_lead","onsite_conversion.purchase"];
            const primaryOrder=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","lead","omni_lead","offsite_conversion.fb_pixel_lead","messaging_conversation_started_7d","onsite_conversion.messaging_conversation_started_7d","complete_registration"];

            const repPresets=[
              {v:"today",l:"Hoje"},{v:"yesterday",l:"Ontem"},
              {v:"this_month",l:"Este mês"},{v:"maximum",l:"Máximo"},
              {v:"last_7d",l:"Últimos 7 dias"},{v:"last_14d",l:"Últimos 14 dias"},
              {v:"last_28d",l:"Últimos 28 dias"},{v:"last_30d",l:"Últimos 30 dias"},
              {v:"last_90d",l:"Últimos 90 dias"},{v:"this_week_sun_today",l:"Esta semana"},
              {v:"last_week_sun_sat",l:"Semana passada"},{v:"last_month",l:"Mês passado"},
            ];
            const repPresetLabel=repPresets.find(p=>p.v===repPeriod)?.l||"Últimos 30 dias";
            const repActivePeriodLabel=repPeriod==="custom"&&repCustomRange.start&&repCustomRange.end?`${repCustomRange.start} → ${repCustomRange.end}`:repPresetLabel;

            const repRightMonth=repCalMonth===11?0:repCalMonth+1;
            const repRightYear=repCalMonth===11?repCalYear+1:repCalYear;
            const repMonthFull=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

            function repGetDays(y,m){const first=new Date(y,m,1).getDay();const days=new Date(y,m+1,0).getDate();return{offset:(first+6)%7,days};}
            function repToISO(y,m,d){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
            function repFromISO(s){if(!s)return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
            function repIsStart(y,m,d){return repToISO(y,m,d)===repCustomRange.start;}
            function repIsEnd(y,m,d){return repToISO(y,m,d)===repCustomRange.end;}
            function repInRange(y,m,d){if(!repCustomRange.start||!repCustomRange.end)return false;const dt=new Date(y,m,d);return dt>repFromISO(repCustomRange.start)&&dt<repFromISO(repCustomRange.end);}
            const repToday=new Date();
            function repIsToday(y,m,d){return repToISO(y,m,d)===repToISO(repToday.getFullYear(),repToday.getMonth(),repToday.getDate());}

            function repHandleDay(y,m,d){
              const iso=repToISO(y,m,d);
              if(!repCustomRange.selecting||!repCustomRange.start){
                setRepCustomRange({start:iso,end:null,selecting:true});
              } else {
                const [s,e]=iso<repCustomRange.start?[iso,repCustomRange.start]:[repCustomRange.start,iso];
                setRepCustomRange({start:s,end:e,selecting:false});
                setRepPeriod("custom");
                setRepShowPicker(false);
              }
            }

            function repRenderCal(year,month){
              const{offset,days}=repGetDays(year,month);
              const cells=[];
              for(let i=0;i<offset;i++)cells.push(null);
              for(let d=1;d<=days;d++)cells.push(d);
              const weeks=[];
              for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
              return(
                <div style={{minWidth:190}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:10,textAlign:"center"}}>{repMonthFull[month]} {year}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
                    {["S","T","Q","Q","S","S","D"].map((d,i)=>(<div key={i} style={{fontSize:9,color:T.mute,textAlign:"center",padding:"2px 0",fontWeight:500}}>{d}</div>))}
                  </div>
                  {weeks.map((wk,wi)=>(
                    <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
                      {wk.map((d,di)=>{
                        if(!d)return<div key={di}/>;
                        const start=repIsStart(year,month,d);
                        const end=repIsEnd(year,month,d);
                        const inR=repInRange(year,month,d);
                        const todayD=repIsToday(year,month,d);
                        return(
                          <div key={di} onClick={()=>repHandleDay(year,month,d)} style={{height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",borderRadius:start||end?"50%":"2px",background:start||end?"#0081FB":inR?"rgba(0,129,251,.18)":"transparent",color:start||end?"#fff":todayD?"#0081FB":T.txt,fontWeight:start||end||todayD?600:400}}>
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            }

            const fetchRepData=async()=>{
              if(metaStatus!=="connected"||metaAccounts.length===0){setRepError("Conecte o Business Manager para ver os dados.");return;}
              setRepLoading(true);setRepError("");setRepData(null);
              try{
                const accs=repClient==="all"?metaAccounts:metaAccounts.filter(a=>a.name===repClient||a.id===repClient);
                if(!accs.length){setRepError("Nenhuma conta encontrada.");setRepLoading(false);return;}

                // Calcula datas para período anterior (mesma duração)
                const calcPrevRange=()=>{
                  const today=new Date();
                  let start,end;
                  if(repPeriod==="custom"&&repCustomRange.start&&repCustomRange.end){
                    start=new Date(repCustomRange.start);end=new Date(repCustomRange.end);
                  }else{
                    const map={"7d":7,"14d":14,"30d":30,"90d":90,"this_month":today.getDate(),"last_month":30};
                    const days=map[repPeriod]||30;
                    end=new Date(today);end.setDate(end.getDate()-1);
                    start=new Date(end);start.setDate(start.getDate()-days+1);
                  }
                  const duration=Math.ceil((end-start)/(1000*60*60*24))+1;
                  const prevEnd=new Date(start);prevEnd.setDate(prevEnd.getDate()-1);
                  const prevStart=new Date(prevEnd);prevStart.setDate(prevStart.getDate()-duration+1);
                  const fmt=d=>d.toISOString().slice(0,10);
                  return{prev_since:fmt(prevStart),prev_until:fmt(prevEnd),since:fmt(start),until:fmt(end),duration};
                };
                const ranges=calcPrevRange();

                const fetchPeriod=async(acc,timeParam,withDaily=false)=>{
                  const fields="impressions,reach,clicks,ctr,cpc,spend,actions,action_values";
                  const url=`${GRAPH}/act_${acc.id}/insights?fields=${fields}&${timeParam}&level=account&access_token=${savedToken}`;
                  const res=await fetch(url);
                  const data=await res.json();
                  if(data.error||!data.data?.[0])return null;
                  const d=data.data[0];
                  const allConvs=(d.actions||[]).filter(a=>conversionTypes.includes(a.action_type));
                  let totalConv=0,primaryType=null;
                  for(const t of primaryOrder){const f=d.actions?.find(a=>a.action_type===t);if(f){totalConv=parseInt(f.value)||0;primaryType=t;break;}}
                  if(!totalConv&&allConvs.length)totalConv=allConvs.reduce((s,a)=>s+(parseInt(a.value)||0),0);
                  const convVal=(d.action_values||[]).find(a=>valueTypes.includes(a.action_type));

                  // Daily breakdown para detectar tendências
                  let dailyData=[];
                  if(withDaily){
                    const dailyUrl=`${GRAPH}/act_${acc.id}/insights?fields=impressions,clicks,spend,actions,ctr&${timeParam}&level=account&time_increment=1&access_token=${savedToken}`;
                    try{
                      const dRes=await fetch(dailyUrl);
                      const dData=await dRes.json();
                      if(dData.data){
                        dailyData=dData.data.map(day=>{
                          let dayConv=0;
                          for(const t of primaryOrder){const f=day.actions?.find(a=>a.action_type===t);if(f){dayConv=parseInt(f.value)||0;break;}}
                          return{date:day.date_start,spend:parseFloat(day.spend||0),conv:dayConv,ctr:parseFloat(day.ctr||0),imp:parseInt(day.impressions||0),clicks:parseInt(day.clicks||0)};
                        });
                      }
                    }catch(e){}
                  }

                  return{
                    client:acc.name,accountId:acc.id,
                    impressoes:parseInt(d.impressions)||0,alcance:parseInt(d.reach)||0,cliques:parseInt(d.clicks)||0,
                    ctr:parseFloat(d.ctr||0).toFixed(2),cpc:parseFloat(d.cpc||0).toFixed(2),
                    investido:parseFloat(d.spend||0).toFixed(2),conversoes:totalConv,
                    valorResult:parseFloat(convVal?.value||0).toFixed(2),primaryType,
                    breakdown:allConvs.map(a=>({type:a.action_type,label:actionLabels[a.action_type]||a.action_type,value:parseInt(a.value)||0})),
                    daily:dailyData,
                  };
                };

                const results=await Promise.all(accs.map(async(acc)=>{
                  let timeParam,prevTimeParam;
                  if(repPeriod==="custom"&&repCustomRange.start&&repCustomRange.end){
                    timeParam=`time_range={"since":"${repCustomRange.start}","until":"${repCustomRange.end}"}`;
                  } else {
                    timeParam=`date_preset=${repPeriodMap[repPeriod]||repPeriod||"last_30d"}`;
                  }
                  prevTimeParam=`time_range={"since":"${ranges.prev_since}","until":"${ranges.prev_until}"}`;

                  // Busca paralelo: período atual (com daily) + período anterior
                  const[current,previous]=await Promise.all([
                    fetchPeriod(acc,timeParam,true),
                    fetchPeriod(acc,prevTimeParam,false),
                  ]);
                  if(!current)return null;
                  return{...current,previous};
                }));
                setRepData(results.filter(Boolean));
              }catch(e){setRepError("Erro: "+e.message);}
              finally{setRepLoading(false);}
            };

            const rd=repData||[];
            const agg=rd.length?rd.reduce((a,d)=>({impressoes:a.impressoes+d.impressoes,alcance:a.alcance+d.alcance,cliques:a.cliques+(d.cliques||0),ctr:0,cpc:0,investido:a.investido+parseFloat(d.investido),conversoes:a.conversoes+d.conversoes,valorResult:a.valorResult+parseFloat(d.valorResult)}),{impressoes:0,alcance:0,cliques:0,ctr:0,cpc:0,investido:0,conversoes:0,valorResult:0}):null;
            if(agg&&rd.length){agg.ctr=parseFloat((rd.reduce((s,d)=>s+parseFloat(d.ctr),0)/rd.length).toFixed(2));agg.cpc=parseFloat((rd.reduce((s,d)=>s+parseFloat(d.cpc),0)/rd.length).toFixed(2));}
            const roas=agg&&agg.investido>0?(agg.valorResult/agg.investido).toFixed(2):"0.00";
            const cpa=agg&&agg.conversoes>0?(agg.investido/agg.conversoes).toFixed(2):"0.00";

            const aggBreakdown={};
            rd.forEach(d=>(d.breakdown||[]).forEach(b=>{if(!aggBreakdown[b.type])aggBreakdown[b.type]={type:b.type,label:b.label,value:0};aggBreakdown[b.type].value+=b.value;}));
            const breakdownList=Object.values(aggBreakdown).sort((a,b)=>b.value-a.value);

            const exportCSV=()=>{
              if(!agg)return;
              const rows=[["Conta",repClient==="all"?"Todas":repClient],["Período",periodLabels[repPeriod]],["Investido","R$"+agg.investido.toFixed(2)],["Resultados",agg.conversoes],["ROAS",roas+"x"],["CPA","R$"+cpa],["CTR",agg.ctr+"%"],["CPC","R$"+agg.cpc],["Impressões",agg.impressoes],["Alcance",agg.alcance],[],["TIPO DE RESULTADO","QUANTIDADE"],...breakdownList.map(b=>[b.label,b.value]),[],["CONTA","INVESTIDO","RESULTADOS","CPA","ROAS","CTR","CPC"],...rd.map(d=>{const r=parseFloat(d.investido)>0?(parseFloat(d.valorResult)/parseFloat(d.investido)).toFixed(2):"0";return[d.client,"R$"+d.investido,d.conversoes,d.conversoes>0?"R$"+(parseFloat(d.investido)/d.conversoes).toFixed(2):"–",r+"x",d.ctr+"%","R$"+d.cpc];})];
              const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+rows.map(r=>r.join(",")).join("\n")],{type:"text/csv;charset=utf-8;"}));a.download=`relatorio_${repClient}_${repPeriod}.csv`;a.click();
            };

            const roasColor=parseFloat(roas)>=4?T.ok:parseFloat(roas)>=2.5?T.warn:parseFloat(roas)>0?T.err:T.mute;
            const roasLabel=parseFloat(roas)>=4?"🔥 Excelente":parseFloat(roas)>=2.5?"⚡ Bom":parseFloat(roas)>0?"⚠ Otimizar":"—";

            return(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>

                {/* ── FILTROS — conta + período ── */}
                <div style={{background:T.card,borderRadius:16,border:`1px solid ${T.border}`,overflow:"visible"}}>
                  <div style={{padding:"13px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M3.5 7h7M6 11h2" stroke={T.meta} strokeWidth="1.4" strokeLinecap="round"/></svg>
                    <span style={{fontSize:12,fontWeight:600,color:T.txt}}>Filtros do relatório</span>
                    {agg&&<span style={{marginLeft:"auto",fontSize:10,color:T.ok,background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.2)",borderRadius:20,padding:"2px 10px",fontWeight:500}}>● Dados carregados</span>}
                  </div>
                  <div style={{padding:"16px 20px",display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>

                    {/* Conta — dropdown customizado */}
                    <div style={{flex:"1 1 200px",minWidth:160,position:"relative"}}>
                      <div style={{fontSize:9,color:T.mute,letterSpacing:".1em",fontWeight:600,marginBottom:6}}>CONTA DE ANÚNCIO</div>
                      <button onClick={()=>{setRepShowAccounts(!repShowAccounts);setRepShowPicker(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,border:`1px solid ${repShowAccounts?T.meta+"66":T.borderMid}`,background:repShowAccounts?"rgba(0,129,251,.06)":"rgba(255,255,255,.04)",color:T.txt,cursor:"pointer",fontFamily:T.font,fontSize:13,transition:"all .15s"}}>
                        <span style={{width:22,height:22,borderRadius:6,background:"rgba(0,129,251,.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:T.meta,flexShrink:0}}>{repClient==="all"?"★":repClient.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</span>
                        <span style={{flex:1,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{repClient==="all"?`Todas as contas (${metaAccounts.length})`:repClient}</span>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,transform:repShowAccounts?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M2 4.5l4 4 4-4" stroke={T.mute} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      {repShowAccounts&&(
                        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:200,background:"#131825",border:`1px solid ${T.borderMid}`,borderRadius:12,overflow:"hidden",boxShadow:"0 16px 40px rgba(0,0,0,.5)"}}>
                          {[{id:"all",name:`Todas as contas (${metaAccounts.length})`},...metaAccounts].map(a=>{
                            const sel=repClient===(a.id==="all"?"all":a.name);
                            return(
                              <div key={a.id} onClick={()=>{setRepClient(a.id==="all"?"all":a.name);setRepShowAccounts(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer",background:sel?"rgba(0,129,251,.08)":"transparent"}} onMouseEnter={e=>!sel&&(e.currentTarget.style.background="rgba(255,255,255,.04)")} onMouseLeave={e=>!sel&&(e.currentTarget.style.background=sel?"rgba(0,129,251,.08)":"transparent")}>
                                <span style={{width:24,height:24,borderRadius:7,background:sel?"rgba(0,129,251,.2)":"rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:sel?T.meta:T.mute,flexShrink:0}}>{a.id==="all"?"★":a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</span>
                                <span style={{fontSize:12,color:sel?T.txt:T.sub,flex:1}}>{a.name}</span>
                                {sel&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.meta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Período — Meta Ads style */}
                    <div style={{flex:"1 1 220px",position:"relative"}}>
                      <div style={{fontSize:9,color:T.mute,letterSpacing:".1em",fontWeight:600,marginBottom:6}}>PERÍODO</div>
                      <button onClick={()=>{setRepShowPicker(!repShowPicker);setRepShowAccounts(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,border:`1px solid ${repShowPicker?T.meta+"66":T.borderMid}`,background:repShowPicker?"rgba(0,129,251,.06)":"rgba(255,255,255,.04)",color:T.txt,cursor:"pointer",fontFamily:T.font,fontSize:13,transition:"all .15s"}}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke={T.meta} strokeWidth="1.2"/><path d="M1 5.5h12" stroke={T.meta} strokeWidth="1.2"/><path d="M4 1v3M10 1v3" stroke={T.meta} strokeWidth="1.2" strokeLinecap="round"/></svg>
                        <span style={{flex:1,textAlign:"left",color:T.meta,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{repActivePeriodLabel}</span>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,transform:repShowPicker?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M2 4.5l4 4 4-4" stroke={T.mute} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      {repShowPicker&&(
                        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:"#131825",border:`1px solid ${T.borderMid}`,borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.7)",display:"flex",minWidth:560}}>
                          <div style={{width:170,borderRight:`1px solid ${T.border}`,padding:"10px 0",flexShrink:0}}>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",padding:"0 14px 8px",fontWeight:600}}>USADOS RECENTEMENTE</div>
                            {repPresets.map(p=>{const sel=repPeriod===p.v;return(
                              <div key={p.v} onClick={()=>{setRepPeriod(p.v);setRepCustomRange({start:null,end:null,selecting:false});setRepShowPicker(false);}} style={{padding:"8px 14px",fontSize:12,color:sel?T.txt:T.sub,cursor:"pointer",background:sel?"rgba(255,255,255,.06)":"transparent",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>!sel&&(e.currentTarget.style.background="rgba(255,255,255,.04)")} onMouseLeave={e=>!sel&&(e.currentTarget.style.background=sel?"rgba(255,255,255,.06)":"transparent")}>
                                <span style={{width:7,height:7,borderRadius:"50%",background:sel?"#0081FB":"transparent",flexShrink:0,border:sel?"none":`1px solid ${T.border}`}}></span>{p.l}
                              </div>
                            );})}
                          </div>
                          <div style={{flex:1,padding:16,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                              <button onClick={()=>{if(repCalMonth===0){setRepCalMonth(11);setRepCalYear(y=>y-1);}else setRepCalMonth(m=>m-1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 8px"}}>‹</button>
                              <div style={{fontSize:11,color:T.mute,fontWeight:500}}>{repCustomRange.start&&repCustomRange.end?`${repCustomRange.start} → ${repCustomRange.end}`:repCustomRange.start?"Selecione a data final":"Selecione o período"}</div>
                              <button onClick={()=>{if(repCalMonth===11){setRepCalMonth(0);setRepCalYear(y=>y+1);}else setRepCalMonth(m=>m+1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 8px"}}>›</button>
                            </div>
                            <div style={{display:"flex",gap:20}}>{repRenderCal(repCalYear,repCalMonth)}{repRenderCal(repRightYear,repRightMonth)}</div>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                              <span style={{fontSize:10,color:T.mute}}>Fuso: Horário de Brasília</span>
                              <div style={{display:"flex",gap:8}}>
                                <button onClick={()=>{setRepShowPicker(false);setRepCustomRange({start:null,end:null,selecting:false});}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Cancelar</button>
                                <button onClick={()=>{if(repCustomRange.start&&repCustomRange.end){setRepPeriod("custom");setRepShowPicker(false);}}} disabled={!repCustomRange.start||!repCustomRange.end} style={{padding:"7px 14px",borderRadius:8,border:"none",background:repCustomRange.start&&repCustomRange.end?"#0081FB":"rgba(0,129,251,.3)",color:"#fff",fontSize:11,fontWeight:600,cursor:repCustomRange.start&&repCustomRange.end?"pointer":"not-allowed",fontFamily:T.font}}>Atualizar</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{display:"flex",gap:8,flexShrink:0}}>
                      <button onClick={fetchRepData} disabled={repLoading||metaStatus!=="connected"} style={{padding:"10px 20px",borderRadius:10,border:"none",background:metaStatus==="connected"?T.meta:"rgba(0,129,251,.3)",color:"#fff",cursor:metaStatus==="connected"&&!repLoading?"pointer":"not-allowed",fontSize:12,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",gap:8,opacity:repLoading?.7:1,whiteSpace:"nowrap"}}>
                        {repLoading?<><span style={{width:13,height:13,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}></span>Buscando...</>:<><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M12 7A5 5 0 1 1 7 2a5 5 0 0 1 3.54 1.46L12 5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/><path d="M12 1.5V5H8.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>Gerar relatório</>}
                      </button>
                      {agg&&<button onClick={exportCSV} style={{padding:"10px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:"rgba(255,255,255,.04)",color:T.sub,cursor:"pointer",fontFamily:T.font,display:"flex",alignItems:"center",gap:6,fontSize:12}}>
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v8M3.5 6.5L7 10l3.5-3.5M2 12.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>CSV
                      </button>}
                    </div>
                  </div>
                  {metaStatus!=="connected"&&<div style={{margin:"0 20px 14px",padding:"10px 14px",background:"rgba(99,102,241,.07)",border:`1px solid rgba(99,102,241,.2)`,borderRadius:10,fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:8}}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={T.accent} strokeWidth="1.2"/><path d="M7 6v4M7 4.5v-.5" stroke={T.accent} strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Conecte o Business Manager na aba <button onClick={()=>setView("connections")} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:12,fontFamily:T.font,padding:0,fontWeight:500}}>Conexões →</button>
                  </div>}
                  {repError&&<div style={{margin:"0 20px 14px",padding:"10px 14px",background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,fontSize:12,color:T.err,display:"flex",alignItems:"center",gap:8}}>⚠ {repError}</div>}
                </div>

                {/* ── EMPTY STATE ── */}
                {!agg&&!repLoading&&(
                  <div style={{background:T.card,borderRadius:16,border:`1px dashed ${T.borderMid}`,padding:"64px 24px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
                    <div style={{width:56,height:56,borderRadius:16,background:"rgba(0,129,251,.08)",border:"1px solid rgba(0,129,251,.15)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 22V12h4v10M9 22V6h4v16M15 22v-6h4v6" stroke={T.meta} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div style={{fontSize:16,fontWeight:600,color:T.txt}}>Seu relatório vai aparecer aqui</div>
                    <div style={{fontSize:13,color:T.mute,maxWidth:320,lineHeight:1.7}}>Selecione a conta e o período acima e clique em Gerar relatório para ver as métricas da Meta Ads.</div>
                  </div>
                )}

                {/* ── RELATÓRIO INTELIGENTE ── */}
                {agg&&(()=>{
                  // ════════════════════════════════════════════════
                  // INTELIGÊNCIA: agregação do período anterior
                  // ════════════════════════════════════════════════
                  const aggPrev=rd.length&&rd[0].previous?rd.reduce((a,d)=>{
                    const p=d.previous||{};
                    return{
                      impressoes:a.impressoes+(p.impressoes||0),
                      alcance:a.alcance+(p.alcance||0),
                      cliques:a.cliques+(p.cliques||0),
                      investido:a.investido+parseFloat(p.investido||0),
                      conversoes:a.conversoes+(p.conversoes||0),
                      valorResult:a.valorResult+parseFloat(p.valorResult||0),
                    };
                  },{impressoes:0,alcance:0,cliques:0,investido:0,conversoes:0,valorResult:0}):null;

                  // Variação % entre períodos
                  const variation=(curr,prev)=>{
                    if(!prev||prev===0)return curr>0?{val:100,trend:"up",label:"novo"}:null;
                    const pct=((curr-prev)/prev)*100;
                    return{val:pct,trend:pct>=0?"up":"down",label:`${pct>=0?"+":""}${pct.toFixed(1)}%`};
                  };
                  const varInvestido=aggPrev?variation(agg.investido,aggPrev.investido):null;
                  const varConv=aggPrev?variation(agg.conversoes,aggPrev.conversoes):null;
                  const varRoas=aggPrev?(()=>{
                    const prevRoas=aggPrev.investido>0?aggPrev.valorResult/aggPrev.investido:0;
                    return variation(parseFloat(roas),prevRoas);
                  })():null;
                  const varCpa=aggPrev?(()=>{
                    const prevCpa=aggPrev.conversoes>0?aggPrev.investido/aggPrev.conversoes:0;
                    return variation(parseFloat(cpa),prevCpa);
                  })():null;

                  // ════════════════════════════════════════════════
                  // INTELIGÊNCIA: tendências (análise diária)
                  // ════════════════════════════════════════════════
                  const allDaily=rd.flatMap(d=>(d.daily||[]).map(day=>({...day,client:d.client})));
                  const dailyByDate={};
                  allDaily.forEach(d=>{
                    if(!dailyByDate[d.date])dailyByDate[d.date]={date:d.date,spend:0,conv:0,clicks:0,imp:0};
                    dailyByDate[d.date].spend+=d.spend;
                    dailyByDate[d.date].conv+=d.conv;
                    dailyByDate[d.date].clicks+=d.clicks;
                    dailyByDate[d.date].imp+=d.imp;
                  });
                  const dailyAgg=Object.values(dailyByDate).sort((a,b)=>a.date.localeCompare(b.date));

                  // Detectar tendências (últimos 5 dias vs anteriores)
                  const detectTrend=(arr,key)=>{
                    if(arr.length<5)return null;
                    const recent=arr.slice(-5);
                    const earlier=arr.slice(-10,-5);
                    if(earlier.length<3)return null;
                    const avgRecent=recent.reduce((s,d)=>s+d[key],0)/recent.length;
                    const avgEarlier=earlier.reduce((s,d)=>s+d[key],0)/earlier.length;
                    if(avgEarlier===0)return null;
                    const pct=((avgRecent-avgEarlier)/avgEarlier)*100;
                    return{pct,direction:pct>0?"up":"down",magnitude:Math.abs(pct)};
                  };
                  const trendSpend=detectTrend(dailyAgg,"spend");
                  const trendConv=detectTrend(dailyAgg,"conv");

                  // Detectar anomalias (picos e quedas)
                  const detectAnomaly=(arr,key)=>{
                    if(arr.length<7)return null;
                    const values=arr.slice(0,-1).map(d=>d[key]);
                    const avg=values.reduce((s,v)=>s+v,0)/values.length;
                    const last=arr[arr.length-1][key];
                    if(avg===0)return null;
                    const ratio=last/avg;
                    if(ratio>=2)return{type:"spike",ratio,value:last,avg};
                    if(ratio<=.3&&avg>10)return{type:"drop",ratio,value:last,avg};
                    return null;
                  };
                  const anomalySpend=detectAnomaly(dailyAgg,"spend");

                  // ════════════════════════════════════════════════
                  // INTELIGÊNCIA: projeção do mês
                  // ════════════════════════════════════════════════
                  const today=new Date();
                  const dayOfMonth=today.getDate();
                  const lastDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
                  const dailyAvg=dayOfMonth>0?agg.investido/dayOfMonth:0;
                  const projectedMonth=dailyAvg*lastDay;
                  const showProjection=repPeriod==="this_month"&&dayOfMonth>=3;

                  // ════════════════════════════════════════════════
                  // INTELIGÊNCIA: score por conta (A/B/C/D)
                  // ════════════════════════════════════════════════
                  const scoreAccount=(d)=>{
                    const r=parseFloat(d.investido)>0?parseFloat(d.valorResult)/parseFloat(d.investido):0;
                    const ct=parseFloat(d.ctr);
                    const conv=d.conversoes;
                    let pts=0;
                    if(r>=4)pts+=40;else if(r>=2.5)pts+=28;else if(r>=1.5)pts+=15;else if(r>0)pts+=5;
                    if(ct>=2)pts+=30;else if(ct>=1)pts+=20;else if(ct>=.5)pts+=10;
                    if(conv>=50)pts+=30;else if(conv>=10)pts+=20;else if(conv>=1)pts+=10;
                    if(r===0&&conv===0)pts=Math.min(pts,10);
                    const grade=pts>=80?"A":pts>=60?"B":pts>=40?"C":"D";
                    return{pts,grade,r,roasNum:r};
                  };

                  // ════════════════════════════════════════════════
                  // INTELIGÊNCIA: recomendações acionáveis
                  // ════════════════════════════════════════════════
                  const recommendations=[];

                  // Top performers para escalar
                  const scored=rd.map(d=>({...d,...scoreAccount(d)})).sort((a,b)=>b.pts-a.pts);
                  const topAccounts=scored.filter(a=>a.grade==="A"&&parseFloat(a.investido)>10);
                  if(topAccounts.length>0){
                    recommendations.push({
                      priority:"high",type:"scale",icon:"🚀",
                      title:`Escale ${topAccounts.length} conta${topAccounts.length>1?"s":""} performando bem`,
                      desc:`${topAccounts.map(a=>a.client).join(", ")}: ROAS ${topAccounts[0].r.toFixed(1)}x. Aumente o investimento em 20-30%.`,
                      action:"Aumentar verba",
                    });
                  }

                  // Bottom performers para pausar/revisar
                  const badAccounts=scored.filter(a=>a.grade==="D"&&parseFloat(a.investido)>30);
                  if(badAccounts.length>0){
                    recommendations.push({
                      priority:"high",type:"pause",icon:"⏸",
                      title:`Pause ou revise ${badAccounts.length} conta${badAccounts.length>1?"s":""}`,
                      desc:`${badAccounts.map(a=>a.client).join(", ")}: gastando R$ ${badAccounts.reduce((s,a)=>s+parseFloat(a.investido),0).toFixed(0)} sem retorno. Revisar urgente.`,
                      action:"Revisar contas",
                    });
                  }

                  // Frequência alta
                  const highFreq=rd.filter(d=>d.alcance>0&&(d.impressoes/d.alcance)>3.5);
                  if(highFreq.length>0){
                    recommendations.push({
                      priority:"medium",type:"creative",icon:"🎨",
                      title:"Refresh nos criativos",
                      desc:`${highFreq.length} conta${highFreq.length>1?"s":""} com frequência > 3.5x — público saturado dos anúncios.`,
                      action:"Renovar criativos",
                    });
                  }

                  // CTR baixo geral
                  if(parseFloat(agg.ctr)<.8&&agg.impressoes>1000){
                    recommendations.push({
                      priority:"medium",type:"ctr",icon:"📉",
                      title:`CTR de ${agg.ctr}% está baixo`,
                      desc:`Abaixo do benchmark (1-2%). Teste novos headlines, imagens ou ajuste o público.`,
                      action:"Otimizar criativo",
                    });
                  }

                  // Tendência negativa
                  if(trendConv&&trendConv.direction==="down"&&trendConv.magnitude>20){
                    recommendations.push({
                      priority:"high",type:"trend",icon:"⚠️",
                      title:`Conversões caíram ${trendConv.magnitude.toFixed(0)}% recentemente`,
                      desc:`Últimos 5 dias com queda significativa. Verifique pixel, públicos e criativos.`,
                      action:"Investigar",
                    });
                  }

                  // Conversões zero
                  if(agg.conversoes===0&&agg.investido>50){
                    recommendations.push({
                      priority:"high",type:"pixel",icon:"🔧",
                      title:"Sem conversões registradas",
                      desc:"Verifique se o pixel está configurado e os eventos estão sendo disparados.",
                      action:"Verificar pixel",
                    });
                  }

                  // Tudo bem
                  if(recommendations.length===0){
                    recommendations.push({
                      priority:"low",type:"ok",icon:"✅",
                      title:"Tudo dentro do esperado",
                      desc:"Continue monitorando a performance e mantenha os testes.",
                      action:null,
                    });
                  }

                  // ════════════════════════════════════════════════
                  // BENCHMARKS por tipo de resultado
                  // ════════════════════════════════════════════════
                  const benchmarks={
                    "purchase":{ctr:"1-3",cpa:"R$ 30-100",roas:"3-5"},
                    "lead":{ctr:"1-2.5",cpa:"R$ 5-25",roas:"—"},
                    "messaging_conversation_started_7d":{ctr:"1-2",cpa:"R$ 3-15",roas:"—"},
                    "complete_registration":{ctr:"1-2",cpa:"R$ 2-10",roas:"—"},
                  };
                  const primaryConvType=rd[0]?.primaryType;
                  const benchmark=benchmarks[primaryConvType]||benchmarks["lead"];
                  const convTypeLabel=actionLabels[primaryConvType]||"conversões";

                  // ════════════════════════════════════════════════
                  // SCORE GERAL
                  // ════════════════════════════════════════════════
                  const roasScore=parseFloat(roas)>=4?100:parseFloat(roas)>=2.5?70:parseFloat(roas)>=1?40:20;
                  const ctrScore=parseFloat(agg.ctr)>=2?100:parseFloat(agg.ctr)>=1?70:parseFloat(agg.ctr)>=.5?40:20;
                  const cpaScore=agg.conversoes>0?(parseFloat(cpa)<=10?100:parseFloat(cpa)<=30?70:parseFloat(cpa)<=50?40:20):50;
                  const healthScore=Math.round((roasScore+ctrScore+cpaScore)/3);
                  const healthColor=healthScore>=80?T.ok:healthScore>=60?"#60a5fa":healthScore>=40?T.warn:T.err;
                  const healthLabel=healthScore>=80?"Excelente":healthScore>=60?"Boa":healthScore>=40?"Atenção":"Crítica";

                  const freq=agg.alcance>0?(agg.impressoes/agg.alcance).toFixed(2):"0.00";
                  const cpm=agg.impressoes>0?((agg.investido/agg.impressoes)*1000).toFixed(2):"0.00";
                  const accInitials=repClient==="all"?"AC":repClient.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

                  // Componente: badge de variação
                  const VarBadge=({v,inverted=false})=>{
                    if(!v)return null;
                    const isPositive=inverted?v.trend==="down":v.trend==="up";
                    const c=isPositive?T.ok:T.err;
                    return(
                      <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontFamily:T.mono,fontWeight:600,color:c,background:`${c}15`,border:`1px solid ${c}30`,borderRadius:5,padding:"2px 6px",lineHeight:1}}>
                        {v.trend==="up"?"↑":"↓"} {v.label}
                      </span>
                    );
                  };

                  // Sparkline mini
                  const Sparkline=({data,color,height=24})=>{
                    if(!data||data.length<2)return null;
                    const max=Math.max(...data,1);
                    const min=Math.min(...data,0);
                    const range=max-min||1;
                    const w=80;
                    const points=data.map((v,i)=>{
                      const x=(i/(data.length-1))*w;
                      const y=height-((v-min)/range)*height;
                      return`${x},${y}`;
                    }).join(" ");
                    return(
                      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} style={{display:"block"}}>
                        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    );
                  };

                  return(
                    <div style={{display:"flex",flexDirection:"column",gap:14}}>

                      {/* ╔══ HERO COM COMPARAÇÃO ══╗ */}
                      <div style={{background:`linear-gradient(135deg,rgba(0,129,251,.06) 0%,rgba(99,102,241,.04) 100%)`,borderRadius:16,border:`1px solid rgba(0,129,251,.15)`,padding:isMobile?"20px":"24px 28px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:-30,right:-30,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,129,251,.08) 0%,transparent 70%)",pointerEvents:"none"}}></div>

                        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:18,position:"relative",flexWrap:"wrap"}}>
                          <div style={{width:48,height:48,borderRadius:12,background:"rgba(0,129,251,.18)",border:"1px solid rgba(0,129,251,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:T.meta,flexShrink:0}}>{accInitials}</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                              <div style={{fontSize:isMobile?16:18,fontWeight:600,color:T.txt,letterSpacing:"-.01em"}}>{repClient==="all"?"Todas as contas":repClient}</div>
                              <span style={{background:"rgba(0,129,251,.12)",color:T.meta,fontSize:10,fontWeight:600,borderRadius:5,padding:"2px 7px",letterSpacing:".05em",textTransform:"uppercase"}}>Meta Ads</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,fontSize:11,color:T.mute,flexWrap:"wrap"}}>
                              <span>{repActivePeriodLabel}</span>
                              <span style={{opacity:.4}}>·</span>
                              <span>{rd.length} conta{rd.length>1?"s":""}</span>
                              {aggPrev&&<><span style={{opacity:.4}}>·</span><span style={{display:"flex",alignItems:"center",gap:4}}>vs {ranges.duration} dias anteriores</span></>}
                            </div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Saúde geral</div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{position:"relative",width:46,height:46}}>
                                <svg width="46" height="46" viewBox="0 0 46 46" style={{transform:"rotate(-90deg)"}}>
                                  <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="3.5"/>
                                  <circle cx="23" cy="23" r="19" fill="none" stroke={healthColor} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(healthScore/100)*119.4} 119.4`}/>
                                </svg>
                                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:T.mono,fontSize:13,fontWeight:600,color:healthColor}}>{healthScore}</div>
                              </div>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,color:healthColor,letterSpacing:"-.01em"}}>{healthLabel}</div>
                                <div style={{fontSize:9,color:T.mute,fontFamily:T.mono}}>de 100</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4 KPIs com variação */}
                        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:isMobile?12:16,position:"relative"}}>
                          <div>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>Investimento</div>
                            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                              <span style={{fontFamily:T.mono,fontSize:isMobile?22:28,fontWeight:500,color:T.txt,letterSpacing:"-.01em",lineHeight:1}}>R$ {agg.investido.toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}</span>
                              <VarBadge v={varInvestido}/>
                            </div>
                            {dailyAgg.length>0&&<Sparkline data={dailyAgg.map(d=>d.spend)} color={T.accent}/>}
                          </div>
                          <div>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>Resultados</div>
                            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                              <span style={{fontFamily:T.mono,fontSize:isMobile?22:28,fontWeight:500,color:T.txt,letterSpacing:"-.01em",lineHeight:1}}>{agg.conversoes.toLocaleString("pt-BR")}</span>
                              <VarBadge v={varConv}/>
                            </div>
                            {dailyAgg.length>0&&<Sparkline data={dailyAgg.map(d=>d.conv)} color={T.ok}/>}
                          </div>
                          <div>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>ROAS</div>
                            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                              <span style={{fontFamily:T.mono,fontSize:isMobile?22:28,fontWeight:500,color:roasColor,letterSpacing:"-.01em",lineHeight:1}}>{roas}<span style={{fontSize:14,color:T.mute,marginLeft:2}}>x</span></span>
                              <VarBadge v={varRoas}/>
                            </div>
                            <div style={{fontSize:10,color:T.mute,marginTop:6}}>Benchmark: {benchmark.roas}x</div>
                          </div>
                          <div>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:6}}>CPA</div>
                            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:5}}>
                              <span style={{fontFamily:T.mono,fontSize:isMobile?22:28,fontWeight:500,color:"#a78bfa",letterSpacing:"-.01em",lineHeight:1}}>R$ {cpa}</span>
                              <VarBadge v={varCpa} inverted={true}/>
                            </div>
                            <div style={{fontSize:10,color:T.mute,marginTop:6}}>Benchmark: {benchmark.cpa}</div>
                          </div>
                        </div>

                        {/* Projeção do mês */}
                        {showProjection&&(
                          <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid rgba(0,129,251,.1)`,display:"flex",alignItems:"center",gap:10,fontSize:11,color:T.sub,flexWrap:"wrap"}}>
                            <span style={{fontSize:14}}>📅</span>
                            <span>Ritmo atual: <strong style={{color:T.txt,fontFamily:T.mono}}>R$ {dailyAvg.toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}/dia</strong></span>
                            <span style={{opacity:.4}}>·</span>
                            <span>Projeção mês: <strong style={{color:T.warn,fontFamily:T.mono}}>R$ {projectedMonth.toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}</strong> ({lastDay-dayOfMonth} dias restantes)</span>
                          </div>
                        )}
                      </div>

                      {/* ╔══ RECOMENDAÇÕES ACIONÁVEIS ══╗ */}
                      {recommendations.length>0&&(
                        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                          <div style={{padding:"14px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,rgba(99,102,241,.18) 0%,rgba(168,139,250,.18) 100%)",border:"1px solid rgba(99,102,241,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🧠</div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Recomendações inteligentes</div>
                              <div style={{fontSize:11,color:T.mute,marginTop:2}}>Baseadas em performance, tendências e benchmarks</div>
                            </div>
                            <span style={{fontSize:10,background:"rgba(99,102,241,.1)",color:T.accent,borderRadius:6,padding:"3px 10px",fontWeight:600}}>{recommendations.length} ação{recommendations.length>1?"ões":""}</span>
                          </div>
                          <div>
                            {recommendations.map((rec,i)=>{
                              const c=rec.priority==="high"?(rec.type==="scale"?T.ok:T.err):rec.priority==="medium"?T.warn:T.sub;
                              return(
                                <div key={i} style={{padding:"14px 22px",borderBottom:i<recommendations.length-1?`1px solid ${T.border}`:"none",display:"flex",alignItems:"flex-start",gap:14}}>
                                  <div style={{width:36,height:36,borderRadius:9,background:`${c}15`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{rec.icon}</div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                                      <div style={{fontSize:13,fontWeight:600,color:T.txt}}>{rec.title}</div>
                                      {rec.priority==="high"&&<span style={{fontSize:9,background:`${c}18`,color:c,borderRadius:4,padding:"2px 6px",fontWeight:700,letterSpacing:".05em"}}>ALTA PRIORIDADE</span>}
                                    </div>
                                    <div style={{fontSize:11,color:T.sub,lineHeight:1.55}}>{rec.desc}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ╔══ DESEMPENHO + TENDÊNCIAS ══╗ */}
                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr",gap:14}}>
                        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"18px 22px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Desempenho de entrega</div>
                              <div style={{fontSize:11,color:T.mute,marginTop:2}}>Comparado com período anterior</div>
                            </div>
                            <span style={{fontSize:10,color:T.mute,fontFamily:T.mono}}>Benchmark CTR: {benchmark.ctr}%</span>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                            {[
                              {l:"CTR",v:`${agg.ctr}%`,c:parseFloat(agg.ctr)>=1?T.ok:T.warn,sub:parseFloat(agg.ctr)>=2?"acima média":parseFloat(agg.ctr)>=1?"bom":"baixo"},
                              {l:"CPC",v:`R$ ${agg.cpc}`,c:T.sub,sub:"por clique"},
                              {l:"CPM",v:`R$ ${cpm}`,c:T.sub,sub:"por mil imp."},
                              {l:"Frequência",v:freq,c:parseFloat(freq)>3.5?T.err:parseFloat(freq)>3?T.warn:T.sub,sub:parseFloat(freq)>3.5?"saturado":parseFloat(freq)>3?"alta":"normal"},
                            ].map((m,i)=>(
                              <div key={i} style={{background:"rgba(255,255,255,.025)",borderRadius:10,padding:"12px 14px",border:`1px solid ${T.border}`}}>
                                <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:5}}>{m.l}</div>
                                <div style={{fontFamily:T.mono,fontSize:15,color:m.c,fontWeight:500,marginBottom:3,lineHeight:1.2}}>{m.v}</div>
                                <div style={{fontSize:9,color:m.c,fontWeight:500}}>{m.sub}</div>
                              </div>
                            ))}
                          </div>
                          {/* Tendências */}
                          {(trendSpend||trendConv||anomalySpend)&&(
                            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`,display:"flex",flexDirection:"column",gap:8}}>
                              <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Tendências detectadas</div>
                              {trendConv&&Math.abs(trendConv.pct)>10&&(
                                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:T.sub}}>
                                  <span style={{fontSize:14}}>{trendConv.direction==="up"?"📈":"📉"}</span>
                                  <span>Conversões {trendConv.direction==="up"?"crescendo":"caindo"} <strong style={{color:trendConv.direction==="up"?T.ok:T.err,fontFamily:T.mono}}>{Math.abs(trendConv.pct).toFixed(0)}%</strong> nos últimos 5 dias</span>
                                </div>
                              )}
                              {trendSpend&&Math.abs(trendSpend.pct)>15&&(
                                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:T.sub}}>
                                  <span style={{fontSize:14}}>💸</span>
                                  <span>Investimento {trendSpend.direction==="up"?"acelerando":"desacelerando"} <strong style={{color:T.warn,fontFamily:T.mono}}>{Math.abs(trendSpend.pct).toFixed(0)}%</strong> nos últimos 5 dias</span>
                                </div>
                              )}
                              {anomalySpend&&(
                                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:T.sub}}>
                                  <span style={{fontSize:14}}>{anomalySpend.type==="spike"?"⚠️":"❗"}</span>
                                  <span>Anomalia detectada hoje: <strong style={{color:T.warn,fontFamily:T.mono}}>R$ {anomalySpend.value.toFixed(0)}</strong> ({anomalySpend.ratio.toFixed(1)}x da média)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ROAS */}
                        <div style={{background:T.card,borderRadius:14,border:`1px solid ${roasColor}22`,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:roasColor}}></div>
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Retorno do investimento</div>
                              <div style={{fontSize:11,color:T.mute,marginTop:2}}>{convTypeLabel}</div>
                            </div>
                            <span style={{fontSize:10,background:`${roasColor}18`,color:roasColor,borderRadius:6,padding:"3px 9px",fontWeight:600,border:`1px solid ${roasColor}40`}}>{roasLabel}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:14}}>
                            <span style={{fontFamily:T.mono,fontSize:42,fontWeight:500,color:roasColor,lineHeight:.95,letterSpacing:"-.02em"}}>{roas}</span>
                            <span style={{fontSize:18,color:T.mute,marginBottom:6,fontFamily:T.mono}}>x</span>
                            {varRoas&&<div style={{marginBottom:8,marginLeft:"auto"}}><VarBadge v={varRoas}/></div>}
                          </div>
                          <div style={{fontSize:11,color:T.sub,lineHeight:1.65,marginBottom:14}}>Cada <span style={{color:T.txt,fontFamily:T.mono,fontWeight:500}}>R$ 1,00</span> retornou <span style={{color:roasColor,fontFamily:T.mono,fontWeight:600}}>R$ {roas}</span>.</div>
                          <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",background:"rgba(255,255,255,.05)",marginBottom:6}}>
                            <div style={{flex:1,background:T.err,opacity:parseFloat(roas)<2?1:.18}}></div>
                            <div style={{flex:1,background:T.warn,opacity:parseFloat(roas)>=2&&parseFloat(roas)<3?1:.18}}></div>
                            <div style={{flex:1,background:"#60a5fa",opacity:parseFloat(roas)>=3&&parseFloat(roas)<4?1:.18}}></div>
                            <div style={{flex:1,background:T.ok,opacity:parseFloat(roas)>=4?1:.18}}></div>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.mute,fontFamily:T.mono}}>
                            <span style={{color:parseFloat(roas)<2?T.err:T.mute,fontWeight:parseFloat(roas)<2?600:400}}>&lt; 2 ruim</span>
                            <span style={{color:parseFloat(roas)>=2&&parseFloat(roas)<3?T.warn:T.mute,fontWeight:parseFloat(roas)>=2&&parseFloat(roas)<3?600:400}}>2-3 ok</span>
                            <span style={{color:parseFloat(roas)>=3&&parseFloat(roas)<4?"#60a5fa":T.mute,fontWeight:parseFloat(roas)>=3&&parseFloat(roas)<4?600:400}}>3-4 bom</span>
                            <span style={{color:parseFloat(roas)>=4?T.ok:T.mute,fontWeight:parseFloat(roas)>=4?600:400}}>4+ ótimo</span>
                          </div>
                        </div>
                      </div>

                      {/* ╔══ CONTAS COM SCORE ══╗ */}
                      {rd.length>1&&(
                        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                          <div style={{padding:"16px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:32,height:32,borderRadius:9,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.8 4.2 4.2.5-3 3 .9 4.3-3.9-2-3.9 2 .9-4.3-3-3 4.2-.5L7 1z" stroke={T.accent} strokeWidth="1.2" strokeLinejoin="round"/></svg>
                              </div>
                              <div>
                                <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Ranking de contas</div>
                                <div style={{fontSize:11,color:T.mute,marginTop:2}}>Score baseado em ROAS + CTR + volume</div>
                              </div>
                            </div>
                            <div style={{display:"flex",gap:5,fontSize:9,color:T.mute,fontFamily:T.mono}}>
                              <span style={{background:`${T.ok}18`,color:T.ok,borderRadius:4,padding:"2px 6px",fontWeight:600}}>A escalar</span>
                              <span style={{background:`${T.warn}18`,color:T.warn,borderRadius:4,padding:"2px 6px",fontWeight:600}}>B otimizar</span>
                              <span style={{background:"rgba(168,139,250,.15)",color:"#a78bfa",borderRadius:4,padding:"2px 6px",fontWeight:600}}>C revisar</span>
                              <span style={{background:`${T.err}18`,color:T.err,borderRadius:4,padding:"2px 6px",fontWeight:600}}>D pausar</span>
                            </div>
                          </div>
                          <div>
                            {scored.map((d,i)=>{
                              const cp=d.conversoes>0?(parseFloat(d.investido)/d.conversoes).toFixed(2):"–";
                              const accInit=d.client.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                              const gradeColors={A:T.ok,B:T.warn,C:"#a78bfa",D:T.err};
                              const gc=gradeColors[d.grade];
                              return(
                                <div key={i} style={{padding:"16px 22px",borderBottom:i<scored.length-1?`1px solid ${T.border}`:"none",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                                  <div style={{position:"relative",flexShrink:0}}>
                                    <div style={{width:42,height:42,borderRadius:10,background:"rgba(0,129,251,.1)",border:"1px solid rgba(0,129,251,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.meta}}>{accInit}</div>
                                    <div style={{position:"absolute",bottom:-4,right:-4,width:20,height:20,borderRadius:6,background:gc,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,fontFamily:T.mono,border:`2px solid ${T.card}`}}>{d.grade}</div>
                                  </div>
                                  <div style={{flex:1,minWidth:140}}>
                                    <div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:3}}>{d.client}</div>
                                    <div style={{display:"flex",gap:10,fontSize:10,color:T.mute,fontFamily:T.mono,flexWrap:"wrap"}}>
                                      <span>R$ {parseFloat(d.investido).toLocaleString("pt-BR",{minimumFractionDigits:0,maximumFractionDigits:0})}</span>
                                      <span style={{opacity:.4}}>·</span>
                                      <span>{d.conversoes} conv</span>
                                      <span style={{opacity:.4}}>·</span>
                                      <span style={{color:parseFloat(d.ctr)<1?T.warn:T.ok}}>{d.ctr}% CTR</span>
                                    </div>
                                  </div>
                                  <div style={{textAlign:"right",flexShrink:0}}>
                                    <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>ROAS</div>
                                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:600,color:gc,lineHeight:1}}>{d.r.toFixed(2)}<span style={{fontSize:11,color:T.mute,marginLeft:2}}>x</span></div>
                                  </div>
                                  <div style={{flexShrink:0,width:isMobile?"100%":120}}>
                                    <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
                                      <div style={{height:"100%",width:`${d.pts}%`,background:gc,borderRadius:3,transition:"width .4s"}}></div>
                                    </div>
                                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.mute,fontFamily:T.mono}}>
                                      <span>Score</span>
                                      <span style={{color:gc,fontWeight:600}}>{d.pts}/100</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ╔══ BREAKDOWN DE CONVERSÕES ══╗ */}
                      {breakdownList.length>0&&(
                        <div style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                          <div style={{padding:"16px 22px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:32,height:32,borderRadius:9,background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10l4-4 3 3 5-6" stroke={T.ok} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Tipos de conversão</div>
                              <div style={{fontSize:11,color:T.mute,marginTop:2}}>{breakdownList.length} tipo{breakdownList.length>1?"s":""} detectado{breakdownList.length>1?"s":""}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontFamily:T.mono,fontSize:16,fontWeight:600,color:T.ok}}>{agg.conversoes.toLocaleString("pt-BR")}</div>
                              <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase"}}>total</div>
                            </div>
                          </div>
                          <div>
                            {breakdownList.map((b,i)=>{
                              const pct=agg.conversoes>0?(b.value/agg.conversoes)*100:0;
                              const isPrimary=i===0;
                              const colorList=[T.ok,"#60a5fa","#a78bfa",T.warn,"#f472b6"];
                              const c=colorList[i%colorList.length];
                              return(
                                <div key={i} style={{padding:"14px 22px",borderBottom:i<breakdownList.length-1?`1px solid ${T.border}`:"none",display:"flex",alignItems:"center",gap:14}}>
                                  <div style={{width:6,height:36,borderRadius:3,background:c,flexShrink:0}}></div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                      <div style={{fontSize:12,fontWeight:500,color:T.txt}}>{b.label}</div>
                                      {isPrimary&&<span style={{fontSize:9,background:"rgba(34,197,94,.12)",color:T.ok,borderRadius:4,padding:"2px 6px",fontWeight:600,letterSpacing:".05em"}}>PRINCIPAL</span>}
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                                      <div style={{flex:1,background:"rgba(255,255,255,.06)",borderRadius:100,height:6,overflow:"hidden"}}>
                                        <div style={{background:c,width:`${pct}%`,height:"100%",borderRadius:100}}></div>
                                      </div>
                                      <span style={{fontSize:11,color:T.mute,fontFamily:T.mono,minWidth:40,textAlign:"right"}}>{pct.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div style={{textAlign:"right",flexShrink:0,minWidth:60}}>
                                    <div style={{fontFamily:T.mono,fontSize:18,fontWeight:600,color:isPrimary?T.ok:T.txt,lineHeight:1}}>{b.value.toLocaleString("pt-BR")}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })()}

              </div>
            );
          })()}


          {/* ═══════ BUDGET ═══════ */}
          {view==="budget"&&(()=>{
            const symb=(c)=>c==="EUR"?"€":c==="USD"?"$":"R$";
            const fmtM=(v,c)=>`${symb(c)} ${parseFloat(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
            const getSpent=(rule)=>{if(!liveMetrics)return 0;if(rule.account_id){const m=liveMetrics.find(d=>d.accountId===rule.account_id);return m?parseFloat(m.investido):0;}return liveMetrics.reduce((s,m)=>s+parseFloat(m.investido),0);};
            const barClr=(pct,ap)=>pct>=100?T.err:pct>=(ap||80)?T.warn:T.ok;

            // Calcular dias restantes do período
            const daysRemaining=(period)=>{
              const today=new Date();
              if(period==="daily")return 1;
              if(period==="weekly"){
                const day=today.getDay();
                return 7-day;
              }
              // monthly
              const lastDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
              return lastDay-today.getDate();
            };

            // Projeção: ao ritmo atual, em quantos dias vai estourar?
            const daysElapsed=(period)=>{
              const today=new Date();
              if(period==="daily")return 1;
              if(period==="weekly")return today.getDay()+1;
              return today.getDate();
            };

            // Filtrar regras
            const filteredRules=budgetRules.filter(rule=>{
              if(budgetFilter==="all")return true;
              const spent=getSpent(rule);
              const pct=rule.limit_value>0?(spent/rule.limit_value)*100:0;
              if(budgetFilter==="alert")return pct>=rule.alert_pct;
              if(budgetFilter==="ok")return pct<rule.alert_pct;
              return true;
            });

            // Resumo geral
            const totalLimit=budgetRules.reduce((s,r)=>s+parseFloat(r.limit_value||0),0);
            const totalSpent=budgetRules.reduce((s,r)=>s+getSpent(r),0);
            const inAlert=budgetRules.filter(r=>{const sp=getSpent(r);const pc=r.limit_value>0?(sp/r.limit_value)*100:0;return pc>=r.alert_pct;}).length;
            const exceeded=budgetRules.filter(r=>{const sp=getSpent(r);return sp>=r.limit_value;}).length;

            return(
              <div>
                {/* ── HERO RESUMO ── */}
                {budgetRules.length>0&&(
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10,marginBottom:14}}>
                    {[
                      {l:"Total comprometido",v:`R$ ${totalLimit.toLocaleString("pt-BR",{minimumFractionDigits:2})}`,sub:`${budgetRules.length} regra${budgetRules.length>1?"s":""} ativa${budgetRules.length>1?"s":""}`,c:T.accent,icon:"💰"},
                      {l:"Total investido",v:`R$ ${totalSpent.toLocaleString("pt-BR",{minimumFractionDigits:2})}`,sub:totalLimit>0?`${Math.round((totalSpent/totalLimit)*100)}% do limite`:"sem limite",c:totalSpent>=totalLimit?T.err:totalSpent>=totalLimit*.8?T.warn:T.ok,icon:"📊"},
                      {l:"Em alerta",v:inAlert,sub:inAlert>0?"requer atenção":"tudo sob controle",c:inAlert>0?T.warn:T.ok,icon:"⚠️"},
                      {l:"Limite atingido",v:exceeded,sub:exceeded>0?"ultrapassou o limite":"nenhuma estourou",c:exceeded>0?T.err:T.ok,icon:"🛑"},
                    ].map((m,i)=>(
                      <div key={i} className="card" style={{background:T.card,borderRadius:12,border:`1px solid ${T.border}`,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:m.c}}></div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",fontWeight:600,textTransform:"uppercase"}}>{m.l}</div>
                          <span style={{fontSize:14}}>{m.icon}</span>
                        </div>
                        <div style={{fontFamily:T.mono,fontSize:isMobile?16:20,color:T.txt,fontWeight:500,marginBottom:4}}>{m.v}</div>
                        <div style={{fontSize:10,color:m.c,fontWeight:500}}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── BANNER DE ALERTA ── */}
                {budgetAlerts.length>0&&(
                  <div style={{background:exceeded>0?"rgba(239,68,68,.08)":"rgba(245,158,11,.08)",border:`1px solid ${exceeded>0?"rgba(239,68,68,.25)":"rgba(245,158,11,.25)"}`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{width:24,height:24,borderRadius:6,background:exceeded>0?"rgba(239,68,68,.15)":"rgba(245,158,11,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{exceeded>0?"🔴":"⚠"}</div>
                      <div style={{fontSize:12,fontWeight:600,color:exceeded>0?T.err:T.warn}}>{budgetAlerts.length} regra{budgetAlerts.length>1?"s":""} {exceeded>0?"ultrapassaram":"em alerta"}</div>
                    </div>
                    <div style={{paddingLeft:34,fontSize:11,color:T.sub,display:"flex",flexDirection:"column",gap:3}}>
                      {budgetAlerts.slice(0,3).map(a=>{const spent=getSpent(a);const pct=a.limit_value>0?Math.round((spent/a.limit_value)*100):0;return(<div key={a.id}>• <span style={{color:T.txt,fontWeight:500}}>{a.name}</span> — gastou {fmtM(spent,a.currency)} de {fmtM(a.limit_value,a.currency)} <span style={{color:pct>=100?T.err:T.warn,fontWeight:600}}>({pct}%)</span></div>);})}
                      {budgetAlerts.length>3&&<div style={{color:T.mute}}>+ {budgetAlerts.length-3} regra{budgetAlerts.length-3>1?"s":""}</div>}
                    </div>
                  </div>
                )}

                {/* ── HEADER + FILTROS ── */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.txt,marginBottom:3}}>Regras de Controle de Verba</div>
                    <div style={{fontSize:11,color:T.mute}}>Defina limites e receba avisos. Nenhuma alteração nas contas.</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    {budgetRules.length>0&&(
                      <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:9,padding:3,border:`1px solid ${T.border}`}}>
                        {[{v:"all",l:`Todas (${budgetRules.length})`},{v:"alert",l:`Em alerta (${inAlert})`},{v:"ok",l:`OK (${budgetRules.length-inAlert})`}].map(f=>(
                          <button key={f.v} onClick={()=>setBudgetFilter(f.v)} style={{padding:"5px 11px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:T.font,background:budgetFilter===f.v?"rgba(99,102,241,.15)":"transparent",color:budgetFilter===f.v?T.accent:T.sub,fontSize:11,fontWeight:budgetFilter===f.v?500:400}}>{f.l}</button>
                        ))}
                      </div>
                    )}
                    <button className="btn-p" onClick={()=>setShowBudgetForm(!showBudgetForm)} style={{padding:"9px 18px",borderRadius:9,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:T.font,whiteSpace:"nowrap"}}>+ Nova Regra</button>
                  </div>
                </div>

                {/* ── FORM DE NOVA REGRA ── */}
                {showBudgetForm&&(()=>{
                  const symb=(c)=>c==="EUR"?"€":c==="USD"?"$":"R$";
                  const fmtPrev=(v,c)=>v?`${symb(c)} ${parseFloat(v).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:`${symb(c)} 0,00`;
                  const periodLabels={monthly:"Mensal",weekly:"Semanal",daily:"Diário"};
                  const periodHints={monthly:"do mês corrente",weekly:"da semana corrente",daily:"do dia"};
                  // Sugestão: gasto da conta selecionada nos últimos 30d
                  const suggestion=(()=>{
                    if(!liveMetrics)return null;
                    if(newBudget.accountId){
                      const m=liveMetrics.find(d=>d.accountId===newBudget.accountId);
                      if(m){const v=parseFloat(m.investido);return v>0?{val:Math.ceil(v*1.2),label:"Sugestão: 20% acima do gasto atual"}:null;}
                    }else{
                      const total=liveMetrics.reduce((s,m)=>s+parseFloat(m.investido||0),0);
                      if(total>0)return{val:Math.ceil(total*1.2),label:"Sugestão: 20% acima do gasto total"};
                    }
                    return null;
                  })();
                  const previewName=newBudget.name||"Nome da regra";
                  const previewAcc=newBudget.accountId?(metaAccounts.find(a=>a.id===newBudget.accountId)?.name||"Conta"):"Todas as contas";
                  const valid=newBudget.name&&newBudget.limit&&parseFloat(newBudget.limit)>0;

                  return(
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.borderMid}`,padding:0,marginBottom:16,overflow:"hidden"}}>
                      {/* Header */}
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:`1px solid ${T.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:32,height:32,borderRadius:8,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>💰</div>
                          <div>
                            <div style={{fontSize:13,fontWeight:600,color:T.txt}}>Nova Regra de Verba</div>
                            <div style={{fontSize:11,color:T.mute,marginTop:2}}>Configure limites e alertas para suas contas</div>
                          </div>
                        </div>
                        <button onClick={()=>setShowBudgetForm(false)} style={{width:30,height:30,borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                      </div>

                      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.4fr 1fr"}}>
                        {/* ─── COLUNA ESQUERDA: FORM ─── */}
                        <div style={{padding:"20px 22px",borderRight:isMobile?"none":`1px solid ${T.border}`}}>

                          {/* Templates rápidos */}
                          <div style={{marginBottom:18}}>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",textTransform:"uppercase",marginBottom:8,fontWeight:600}}>Comece rápido</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                              {[
                                {l:"Limite mensal",p:"monthly",a:80,emoji:"📅"},
                                {l:"Limite semanal",p:"weekly",a:75,emoji:"📊"},
                                {l:"Verba diária",p:"daily",a:70,emoji:"⚡"},
                              ].map((t,i)=>(
                                <button key={i} onClick={()=>setNewBudget({...newBudget,period:t.p,alertPct:t.a,name:newBudget.name||t.l})} style={{padding:"10px 8px",borderRadius:9,border:`1px solid ${newBudget.period===t.p?T.accent+"66":T.border}`,background:newBudget.period===t.p?"rgba(99,102,241,.08)":"transparent",color:newBudget.period===t.p?T.accent:T.sub,cursor:"pointer",fontSize:11,fontFamily:T.font,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all .15s"}}>
                                  <span style={{fontSize:14}}>{t.emoji}</span>
                                  <span style={{fontWeight:newBudget.period===t.p?600:500}}>{t.l}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nome */}
                          <div style={{marginBottom:14}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                              <label style={{fontSize:11,color:T.txt,fontWeight:500}}>Nome da regra</label>
                              <span style={{fontSize:10,color:T.mute}}>{newBudget.name.length}/40</span>
                            </div>
                            <input value={newBudget.name} maxLength={40} onChange={e=>setNewBudget({...newBudget,name:e.target.value})} placeholder="Ex: Limite mensal — Cliente A" style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${newBudget.name?T.accent+"44":T.borderMid}`,borderRadius:9,padding:"10px 12px",color:T.txt,fontSize:13,fontFamily:T.font,boxSizing:"border-box",outline:"none",transition:"border-color .15s"}}/>
                          </div>

                          {/* Conta — visual */}
                          <div style={{marginBottom:14}}>
                            <label style={{fontSize:11,color:T.txt,fontWeight:500,marginBottom:6,display:"block"}}>Aplicar para</label>
                            <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:140,overflowY:"auto",background:"rgba(255,255,255,.02)",borderRadius:9,padding:5,border:`1px solid ${T.borderMid}`}}>
                              <button onClick={()=>setNewBudget({...newBudget,accountId:""})} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:7,border:"none",background:newBudget.accountId===""?"rgba(99,102,241,.1)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font,transition:"background .15s"}}>
                                <div style={{width:22,height:22,borderRadius:6,background:newBudget.accountId===""?"rgba(99,102,241,.2)":"rgba(255,255,255,.05)",border:`1px solid ${newBudget.accountId===""?T.accent+"55":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:newBudget.accountId===""?T.accent:T.sub,fontWeight:600}}>∗</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:12,fontWeight:500,color:newBudget.accountId===""?T.txt:T.sub}}>Todas as contas</div>
                                  <div style={{fontSize:10,color:T.mute,marginTop:1}}>Soma o gasto de todas as contas conectadas</div>
                                </div>
                                {newBudget.accountId===""&&<span style={{fontSize:13,color:T.accent}}>✓</span>}
                              </button>
                              {metaAccounts.map(a=>(
                                <button key={a.id} onClick={()=>setNewBudget({...newBudget,accountId:a.id})} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",borderRadius:7,border:"none",background:newBudget.accountId===a.id?"rgba(99,102,241,.1)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font,transition:"background .15s"}}>
                                  <div style={{width:22,height:22,borderRadius:6,background:newBudget.accountId===a.id?"rgba(99,102,241,.2)":"rgba(255,255,255,.05)",border:`1px solid ${newBudget.accountId===a.id?T.accent+"55":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:newBudget.accountId===a.id?T.accent:T.sub,fontWeight:600}}>{a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:12,fontWeight:500,color:newBudget.accountId===a.id?T.txt:T.sub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>
                                    <div style={{fontSize:10,color:T.mute,marginTop:1,fontFamily:T.mono}}>{a.id}</div>
                                  </div>
                                  {newBudget.accountId===a.id&&<span style={{fontSize:13,color:T.accent}}>✓</span>}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Período + Moeda em linha */}
                          <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:10,marginBottom:14}}>
                            <div>
                              <label style={{fontSize:11,color:T.txt,fontWeight:500,marginBottom:6,display:"block"}}>Período</label>
                              <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:9,padding:3,border:`1px solid ${T.borderMid}`}}>
                                {[{v:"daily",l:"Diário"},{v:"weekly",l:"Semanal"},{v:"monthly",l:"Mensal"}].map(p=>(
                                  <button key={p.v} onClick={()=>setNewBudget({...newBudget,period:p.v})} style={{flex:1,padding:"7px 10px",borderRadius:7,border:"none",cursor:"pointer",background:newBudget.period===p.v?"rgba(99,102,241,.15)":"transparent",color:newBudget.period===p.v?T.accent:T.sub,fontSize:11,fontFamily:T.font,fontWeight:newBudget.period===p.v?600:500,transition:"all .15s"}}>{p.l}</button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label style={{fontSize:11,color:T.txt,fontWeight:500,marginBottom:6,display:"block"}}>Moeda</label>
                              <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:9,padding:3,border:`1px solid ${T.borderMid}`}}>
                                {[{v:"BRL",l:"R$"},{v:"USD",l:"$"},{v:"EUR",l:"€"}].map(c=>(
                                  <button key={c.v} onClick={()=>setNewBudget({...newBudget,currency:c.v})} style={{flex:1,padding:"7px 8px",borderRadius:7,border:"none",cursor:"pointer",background:newBudget.currency===c.v?"rgba(99,102,241,.15)":"transparent",color:newBudget.currency===c.v?T.accent:T.sub,fontSize:11,fontFamily:T.mono,fontWeight:newBudget.currency===c.v?600:500,transition:"all .15s"}}>{c.l}</button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Valor limite com sugestão */}
                          <div style={{marginBottom:14}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                              <label style={{fontSize:11,color:T.txt,fontWeight:500}}>Valor do limite</label>
                              {suggestion&&(
                                <button onClick={()=>setNewBudget({...newBudget,limit:String(suggestion.val)})} style={{fontSize:10,color:T.accent,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",padding:"3px 9px",borderRadius:5,cursor:"pointer",fontFamily:T.font}}>💡 Usar {symb(newBudget.currency)} {suggestion.val.toLocaleString("pt-BR")}</button>
                              )}
                            </div>
                            <div style={{position:"relative"}}>
                              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.sub,fontFamily:T.mono,pointerEvents:"none",fontWeight:500}}>{symb(newBudget.currency)}</span>
                              <input type="number" value={newBudget.limit} onChange={e=>setNewBudget({...newBudget,limit:e.target.value})} placeholder="0,00" style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${newBudget.limit&&parseFloat(newBudget.limit)>0?T.accent+"44":T.borderMid}`,borderRadius:9,padding:"10px 12px 10px 38px",color:T.txt,fontSize:13,fontFamily:T.mono,fontWeight:500,boxSizing:"border-box",outline:"none",transition:"border-color .15s"}}/>
                            </div>
                            {suggestion&&<div style={{fontSize:10,color:T.mute,marginTop:5}}>{suggestion.label}</div>}
                          </div>

                          {/* Slider de alerta */}
                          <div style={{marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                              <label style={{fontSize:11,color:T.txt,fontWeight:500}}>Alertar quando atingir</label>
                              <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                                <span style={{fontSize:18,color:T.warn,fontFamily:T.mono,fontWeight:600}}>{newBudget.alertPct}</span>
                                <span style={{fontSize:11,color:T.warn,fontFamily:T.mono}}>%</span>
                              </div>
                            </div>
                            <div style={{position:"relative",padding:"4px 0"}}>
                              <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:100,position:"relative",overflow:"hidden"}}>
                                <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${((newBudget.alertPct-50)/45)*100}%`,background:`linear-gradient(90deg,${T.ok} 0%,${T.warn} 60%,${T.err} 100%)`,borderRadius:100,transition:"width .2s"}}></div>
                              </div>
                              <input type="range" min="50" max="95" step="5" value={newBudget.alertPct} onChange={e=>setNewBudget({...newBudget,alertPct:parseInt(e.target.value)})} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",opacity:0,cursor:"pointer",margin:0}}/>
                              <div style={{position:"absolute",top:"50%",left:`${((newBudget.alertPct-50)/45)*100}%`,transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"#fff",border:`3px solid ${T.warn}`,boxShadow:"0 2px 6px rgba(0,0,0,.3)",pointerEvents:"none",transition:"left .15s"}}></div>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T.mute,marginTop:8,fontFamily:T.mono}}>
                              <span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span><span>95%</span>
                            </div>
                          </div>
                        </div>

                        {/* ─── COLUNA DIREITA: PREVIEW + AÇÕES ─── */}
                        <div style={{padding:"20px 22px",background:"rgba(255,255,255,.015)",display:"flex",flexDirection:"column"}}>
                          <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",textTransform:"uppercase",marginBottom:10,fontWeight:600}}>Preview da regra</div>

                          {/* Card preview */}
                          <div style={{background:"rgba(255,255,255,.03)",borderRadius:11,border:`1px solid ${T.border}`,padding:"14px 16px",marginBottom:14}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8,flexWrap:"wrap"}}>
                              <span style={{fontSize:13,fontWeight:600,color:newBudget.name?T.txt:T.mute}}>{previewName}</span>
                              <span style={{fontSize:9,background:"rgba(34,197,94,.1)",color:T.ok,borderRadius:5,padding:"2px 6px",fontWeight:600}}>✓ Saudável</span>
                            </div>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                              <span style={{fontSize:10,color:T.mute}}>{previewAcc}</span>
                              <span style={{fontSize:9,background:"rgba(255,255,255,.06)",borderRadius:4,padding:"1px 6px",color:T.mute}}>{periodLabels[newBudget.period]}</span>
                            </div>
                            <div style={{marginBottom:8}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                                <span style={{fontSize:10,color:T.mute}}>Progresso {periodHints[newBudget.period]}</span>
                                <span style={{fontSize:11,fontFamily:T.mono,color:T.ok,fontWeight:600}}>0%</span>
                              </div>
                              <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:6,position:"relative",overflow:"hidden"}}>
                                <div style={{background:T.ok,width:"0%",height:"100%",borderRadius:100}}></div>
                                <div style={{position:"absolute",top:-1,bottom:-1,left:`${newBudget.alertPct}%`,width:2,background:T.warn,opacity:.9}}></div>
                              </div>
                              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:T.mute,fontFamily:T.mono}}>
                                <span>0</span>
                                <span style={{color:T.warn}}>▲ {newBudget.alertPct}%</span>
                                <span>{fmtPrev(newBudget.limit,newBudget.currency)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Resumo legível */}
                          <div style={{background:"rgba(99,102,241,.05)",border:"1px solid rgba(99,102,241,.15)",borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:11,color:T.sub,lineHeight:1.6}}>
                            <div style={{fontSize:9,color:T.accent,letterSpacing:".08em",textTransform:"uppercase",marginBottom:4,fontWeight:600}}>Resumo</div>
                            Vou monitorar <span style={{color:T.txt,fontWeight:500}}>{previewAcc.toLowerCase()}</span> com limite de <span style={{color:T.accent,fontFamily:T.mono,fontWeight:500}}>{fmtPrev(newBudget.limit,newBudget.currency)}</span> {periodHints[newBudget.period]}, e te aviso quando atingir <span style={{color:T.warn,fontWeight:500}}>{newBudget.alertPct}%</span> do limite.
                          </div>

                          {/* Spacer empurra botões pra baixo */}
                          <div style={{flex:1}}></div>

                          {/* Botões */}
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            <button className="btn-p" onClick={saveBudgetRule} disabled={!valid} style={{padding:"11px 0",borderRadius:9,border:"none",background:valid?T.accent:"rgba(99,102,241,.3)",color:"#fff",cursor:valid?"pointer":"not-allowed",fontSize:13,fontWeight:600,fontFamily:T.font,opacity:valid?1:.6,transition:"all .15s"}}>{valid?"Criar regra":"Preencha os campos"}</button>
                            <button onClick={()=>setShowBudgetForm(false)} style={{padding:"9px 0",borderRadius:9,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontSize:12,fontFamily:T.font}}>Cancelar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}


                {/* ── EMPTY STATES ── */}
                {budgetLoading&&<div style={{textAlign:"center",padding:"40px 0",color:T.mute,fontSize:12}}>Carregando regras...</div>}
                {!budgetLoading&&budgetRules.length===0&&!showBudgetForm&&(
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"60px 20px",textAlign:"center",background:T.card,borderRadius:14,border:`1px dashed ${T.borderMid}`}}>
                    <div style={{width:56,height:56,borderRadius:16,background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:14}}>💰</div>
                    <div style={{fontSize:16,fontWeight:600,color:T.txt,marginBottom:6}}>Nenhuma regra de verba criada</div>
                    <div style={{fontSize:13,color:T.mute,maxWidth:380,lineHeight:1.7,marginBottom:18}}>Crie regras para monitorar gastos por conta ou globalmente, e receba avisos antes de ultrapassar o limite.</div>
                    <button className="btn-p" onClick={()=>setShowBudgetForm(true)} style={{padding:"10px 22px",borderRadius:10,border:"none",background:T.accent,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:T.font}}>+ Criar primeira regra</button>
                  </div>
                )}
                {!budgetLoading&&budgetRules.length>0&&filteredRules.length===0&&(
                  <div style={{textAlign:"center",padding:"40px 0",color:T.mute,fontSize:12,background:T.card,borderRadius:12,border:`1px dashed ${T.border}`}}>
                    <div style={{fontSize:14,marginBottom:6}}>🔍</div>
                    Nenhuma regra {budgetFilter==="alert"?"em alerta":"sem alertas"} no momento
                  </div>
                )}

                {/* ── LISTA DE REGRAS ── */}
                {!budgetLoading&&filteredRules.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {filteredRules.map(rule=>{
                      const spent=getSpent(rule);
                      const pct=rule.limit_value>0?Math.min(Math.round((spent/rule.limit_value)*100),100):0;
                      const realPct=rule.limit_value>0?(spent/rule.limit_value)*100:0;
                      const bc=barClr(pct,rule.alert_pct);
                      const triggered=pct>=rule.alert_pct;
                      const exceededRule=spent>=rule.limit_value;
                      const accName=metaAccounts.find(a=>a.id===rule.account_id)?.name||"Todas as contas";
                      const periodLabel=rule.period==="monthly"?"Mensal":rule.period==="weekly"?"Semanal":"Diário";

                      // Projeção
                      const elapsed=daysElapsed(rule.period);
                      const remaining=daysRemaining(rule.period);
                      const dailyAvg=elapsed>0?spent/elapsed:0;
                      const projected=dailyAvg*(elapsed+remaining);
                      const willExceed=projected>rule.limit_value&&!exceededRule;
                      const daysToExceed=dailyAvg>0?Math.max(Math.ceil((rule.limit_value-spent)/dailyAvg),0):null;

                      return(
                        <div key={rule.id} className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${exceededRule?"rgba(239,68,68,.3)":triggered?"rgba(245,158,11,.3)":T.border}`,padding:"18px 22px",position:"relative",overflow:"hidden"}}>
                          {triggered&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:exceededRule?T.err:T.warn}}></div>}
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                                <span style={{fontSize:14,fontWeight:600,color:T.txt}}>{rule.name}</span>
                                {exceededRule?<span className="tag" style={{background:"rgba(239,68,68,.1)",color:T.err,fontSize:10,fontWeight:600}}>🔴 Limite ultrapassado</span>:triggered?<span className="tag" style={{background:"rgba(245,158,11,.1)",color:T.warn,fontSize:10,fontWeight:600}}>⚠ Em alerta</span>:<span className="tag" style={{background:"rgba(34,197,94,.1)",color:T.ok,fontSize:10,fontWeight:600}}>✓ Saudável</span>}
                              </div>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                                <span style={{fontSize:11,color:T.mute,display:"flex",alignItems:"center",gap:4}}>
                                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" stroke="currentColor" strokeWidth="1.2"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                  {accName}
                                </span>
                                <span style={{fontSize:10,background:"rgba(255,255,255,.06)",borderRadius:5,padding:"2px 8px",color:T.mute}}>{periodLabel}</span>
                                {willExceed&&daysToExceed!==null&&daysToExceed<=remaining&&<span style={{fontSize:10,background:"rgba(239,68,68,.1)",color:T.err,borderRadius:5,padding:"2px 8px",fontWeight:500}}>📉 Vai estourar em {daysToExceed} dia{daysToExceed!==1?"s":""}</span>}
                              </div>
                            </div>
                            <button onClick={()=>deleteBudgetRule(rule.id)} title="Remover regra" style={{padding:"6px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,.2)",background:"rgba(239,68,68,.06)",color:T.err,cursor:"pointer",fontSize:11,fontFamily:T.font,display:"flex",alignItems:"center",gap:5}}>
                              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5.5 4V2.5h3V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Remover
                            </button>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:14}}>
                            {[
                              {l:"Limite",v:fmtM(rule.limit_value,rule.currency),c:T.sub},
                              {l:"Gasto atual",v:fmtM(spent,rule.currency),c:bc},
                              {l:"Restante",v:fmtM(Math.max(rule.limit_value-spent,0),rule.currency),c:rule.limit_value-spent<rule.limit_value*.1?T.err:T.ok},
                              {l:"Projeção fim período",v:fmtM(projected,rule.currency),c:projected>rule.limit_value?T.err:T.sub},
                            ].map((m,i)=>(
                              <div key={i} style={{background:"rgba(255,255,255,.03)",borderRadius:9,border:`1px solid ${T.border}`,padding:"10px 12px"}}>
                                <div style={{fontSize:9,color:T.mute,letterSpacing:".07em",textTransform:"uppercase",marginBottom:4,fontWeight:500}}>{m.l}</div>
                                <div style={{fontFamily:T.mono,fontSize:13,fontWeight:500,color:m.c}}>{m.v}</div>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                              <span style={{fontSize:11,color:T.sub}}>Progresso do {periodLabel.toLowerCase()}</span>
                              <span style={{fontSize:12,fontFamily:T.mono,fontWeight:600,color:bc}}>{realPct.toFixed(1)}%</span>
                            </div>
                            <div style={{background:"rgba(255,255,255,.07)",borderRadius:100,height:10,overflow:"hidden",position:"relative"}}>
                              <div style={{background:bc,width:`${pct}%`,height:"100%",borderRadius:100,transition:"width .4s ease"}}></div>
                              {/* Marcador do alerta */}
                              <div style={{position:"absolute",top:-2,bottom:-2,left:`${rule.alert_pct}%`,width:2,background:T.warn,opacity:.9}}/>
                              <div style={{position:"absolute",top:-6,left:`calc(${rule.alert_pct}% - 4px)`,width:0,height:0,borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:`5px solid ${T.warn}`,opacity:.9}}/>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:T.mute,fontFamily:T.mono}}>
                              <span>0</span>
                              <span style={{color:T.warn,position:"absolute",left:`${rule.alert_pct}%`,transform:"translateX(-50%)",marginTop:-2,fontSize:9}}>▲ {rule.alert_pct}%</span>
                              <span>{fmtM(rule.limit_value,rule.currency)}</span>
                            </div>
                          </div>
                          <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontSize:11,color:T.mute}}>Alertar em:</span>
                            {[60,70,80,90,95].map(p=>(
                              <button key={p} onClick={()=>updateBudgetRule(rule.id,"alert_pct",p)} style={{padding:"3px 9px",borderRadius:6,border:`1px solid ${rule.alert_pct===p?T.warn+"88":T.border}`,background:rule.alert_pct===p?"rgba(245,158,11,.1)":"transparent",color:rule.alert_pct===p?T.warn:T.mute,fontSize:11,fontFamily:T.font,cursor:"pointer",transition:"all .15s"}}>{p}%</button>
                            ))}
                            {liveMetrics?<span style={{fontSize:11,color:T.ok,marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>● Dados em tempo real</span>:<span style={{fontSize:11,color:T.mute,marginLeft:"auto"}}>⚡ Conecte o BM para dados reais</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                              {clients.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
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

          {/* ═══════ EXPORT — Exportador de Planilhas ═══════ */}
          {view==="export"&&(()=>{
            const allMetrics=[
              {id:"spend",l:"Investimento",icon:"💰",cat:"core",fmt:"currency"},
              {id:"impressions",l:"Impressões",icon:"👁",cat:"core",fmt:"number"},
              {id:"reach",l:"Alcance",icon:"👥",cat:"core",fmt:"number"},
              {id:"clicks",l:"Cliques",icon:"🖱",cat:"core",fmt:"number"},
              {id:"ctr",l:"CTR",icon:"📊",cat:"quality",fmt:"percent"},
              {id:"cpc",l:"CPC",icon:"💵",cat:"quality",fmt:"currency"},
              {id:"cpm",l:"CPM",icon:"💸",cat:"quality",fmt:"currency"},
              {id:"frequency",l:"Frequência",icon:"🔁",cat:"quality",fmt:"decimal"},
              {id:"conversions",l:"Conversões",icon:"🎯",cat:"results",fmt:"number"},
              {id:"cpa",l:"Custo por Conversão",icon:"📉",cat:"results",fmt:"currency"},
              {id:"convValue",l:"Valor Conv.",icon:"💎",cat:"results",fmt:"currency"},
              {id:"roas",l:"ROAS",icon:"💹",cat:"results",fmt:"decimal"},
            ];
            const expPresets=[
              {v:"today",l:"Hoje"},{v:"yesterday",l:"Ontem"},
              {v:"this_month",l:"Este mês"},{v:"maximum",l:"Máximo"},
              {v:"last_7d",l:"Últimos 7 dias"},{v:"last_14d",l:"Últimos 14 dias"},
              {v:"last_28d",l:"Últimos 28 dias"},{v:"last_30d",l:"Últimos 30 dias"},
              {v:"last_90d",l:"Últimos 90 dias"},{v:"this_week_sun_today",l:"Esta semana"},
              {v:"last_week_sun_sat",l:"Semana passada"},{v:"last_month",l:"Mês passado"},
            ];
            const expActivePeriodLabel=exportConfig.period==="custom"&&exportConfig.customRange.start&&exportConfig.customRange.end?`${exportConfig.customRange.start} → ${exportConfig.customRange.end}`:(expPresets.find(p=>p.v===exportConfig.period)?.l||"Selecione período");

            const toggleAccount=(id)=>{
              setExportConfig(c=>({...c,accountIds:c.accountIds.includes(id)?c.accountIds.filter(a=>a!==id):[...c.accountIds,id]}));
            };
            const toggleAllAccounts=()=>{
              setExportConfig(c=>({...c,accountIds:c.accountIds.length===metaAccounts.length?[]:metaAccounts.map(a=>a.id)}));
            };
            const toggleMetric=(id)=>{
              setExportConfig(c=>({...c,metrics:c.metrics.includes(id)?c.metrics.filter(m=>m!==id):[...c.metrics,id]}));
            };
            const presetMetrics=(preset)=>{
              const presets={
                basic:["spend","impressions","clicks","cpc","conversions","cpa"],
                performance:["spend","ctr","cpc","cpm","conversions","cpa","roas"],
                full:["spend","impressions","reach","clicks","ctr","cpc","cpm","frequency","conversions","cpa","convValue","roas"],
              };
              setExportConfig(c=>({...c,metrics:presets[preset]||c.metrics}));
            };

            const valid=exportConfig.accountIds.length>0&&exportConfig.metrics.length>0&&exportConfig.spreadsheetId.trim()!=="";

            const groupedMetrics={
              core:allMetrics.filter(m=>m.cat==="core"),
              quality:allMetrics.filter(m=>m.cat==="quality"),
              results:allMetrics.filter(m=>m.cat==="results"),
            };
            const catLabels={core:"Métricas principais",quality:"Qualidade da entrega",results:"Resultados e retorno"};

            const handleExport=async()=>{
              if(!valid){alert("Preencha todos os campos obrigatórios.");return;}
              if(metaStatus!=="connected"){alert("Conecte o Business Manager primeiro.");return;}
              setExportLoading(true);setExportLog(null);
              try{
                // Buscar dados Meta API (nivel de conta por enquanto)
                const accs=metaAccounts.filter(a=>exportConfig.accountIds.includes(a.id));
                const periodMap={"7d":"last_7d","14d":"last_14d","28d":"last_28d","30d":"last_30d","90d":"last_90d","maximum":"maximum"};
                let timeParam;
                if(exportConfig.period==="custom"&&exportConfig.customRange.start&&exportConfig.customRange.end){
                  timeParam=`time_range={"since":"${exportConfig.customRange.start}","until":"${exportConfig.customRange.end}"}`;
                }else{
                  timeParam=`date_preset=${periodMap[exportConfig.period]||exportConfig.period||"last_30d"}`;
                }
                const levelParam={"account":"account","campaign":"campaign","adset":"adset"}[exportConfig.level];
                const fields="impressions,reach,clicks,ctr,cpc,spend,actions,action_values"+(exportConfig.level==="campaign"?",campaign_name":exportConfig.level==="adset"?",adset_name,campaign_name":"");
                const conversionTypes=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","lead","omni_lead","offsite_conversion.fb_pixel_lead","onsite_conversion.lead_grouped","complete_registration","omni_complete_registration","messaging_conversation_started_7d","onsite_conversion.messaging_conversation_started_7d","messaging_first_reply"];
                const valueTypes=["purchase","omni_purchase","offsite_conversion.fb_pixel_purchase","onsite_conversion.purchase"];

                const allRows=[];
                for(const acc of accs){
                  const url=`${GRAPH}/act_${acc.id}/insights?fields=${fields}&${timeParam}&level=${levelParam}&limit=200&access_token=${savedToken}`;
                  const res=await fetch(url);
                  const data=await res.json();
                  if(data.error){console.error("Meta API error:",data.error);continue;}
                  (data.data||[]).forEach(d=>{
                    const allConvs=(d.actions||[]).filter(a=>conversionTypes.includes(a.action_type));
                    const totalConv=allConvs.reduce((s,a)=>s+(parseInt(a.value)||0),0);
                    const convVal=(d.action_values||[]).filter(a=>valueTypes.includes(a.action_type)).reduce((s,a)=>s+parseFloat(a.value||0),0);
                    const spend=parseFloat(d.spend||0);
                    const impressions=parseInt(d.impressions)||0;
                    const reach=parseInt(d.reach)||0;
                    const row={
                      _name:d.campaign_name||d.adset_name||acc.name,
                      _account:acc.name,
                      _level:exportConfig.level,
                      spend,impressions,reach,
                      clicks:parseInt(d.clicks)||0,
                      ctr:parseFloat(d.ctr||0),
                      cpc:parseFloat(d.cpc||0),
                      cpm:impressions>0?(spend/impressions)*1000:0,
                      frequency:reach>0?impressions/reach:0,
                      conversions:totalConv,
                      cpa:totalConv>0?spend/totalConv:0,
                      convValue:convVal,
                      roas:spend>0?convVal/spend:0,
                    };
                    allRows.push(row);
                  });
                }

                if(allRows.length===0){
                  setExportLoading(false);
                  setExportLog({type:"error",msg:"Nenhum dado encontrado para o período selecionado."});
                  return;
                }

                // Formatar dados como pediu
                const fmt=(val,type)=>{
                  if(type==="currency")return`R$ ${val.toFixed(2)}`;
                  if(type==="percent")return`${val.toFixed(2)}%`;
                  if(type==="decimal")return val.toFixed(2);
                  return Math.round(val).toString();
                };

                const periodLabel=expActivePeriodLabel;
                const sel=allMetrics.filter(m=>exportConfig.metrics.includes(m.id));

                let cellsToWrite=[];
                if(exportConfig.layout==="vertical"){
                  // Layout vertical (como o template do print)
                  let r=1;
                  for(const row of allRows){
                    cellsToWrite.push({row:r,col:1,val:`${exportConfig.level==="account"?"Conta":exportConfig.level==="campaign"?"Campanha":"Conjunto"}: ${row._name}`,bold:true,bg:"#FFE4A8"});
                    cellsToWrite.push({row:r,col:2,val:periodLabel,bold:true,bg:"#FFE4A8"});
                    r++;
                    for(const m of sel){
                      cellsToWrite.push({row:r,col:1,val:m.l});
                      cellsToWrite.push({row:r,col:2,val:fmt(row[m.id]||0,m.fmt)});
                      r++;
                    }
                    r+=2; // espaço entre blocos
                  }
                }else{
                  // Layout horizontal (cabeçalho + linhas)
                  const headers=["Conta",exportConfig.level!=="account"?(exportConfig.level==="campaign"?"Campanha":"Conjunto"):null,"Período",...sel.map(m=>m.l)].filter(Boolean);
                  cellsToWrite.push(...headers.map((h,i)=>({row:1,col:i+1,val:h,bold:true,bg:"#FFE4A8"})));
                  allRows.forEach((row,i)=>{
                    let col=1;
                    cellsToWrite.push({row:i+2,col:col++,val:row._account});
                    if(exportConfig.level!=="account")cellsToWrite.push({row:i+2,col:col++,val:row._name});
                    cellsToWrite.push({row:i+2,col:col++,val:periodLabel});
                    sel.forEach(m=>{
                      cellsToWrite.push({row:i+2,col:col++,val:fmt(row[m.id]||0,m.fmt)});
                    });
                  });
                }

                // Por enquanto: exportar como CSV (sem Google Sheets API)
                // Em uma fase futura, conectar OAuth Google Sheets
                const maxCol=Math.max(...cellsToWrite.map(c=>c.col));
                const maxRow=Math.max(...cellsToWrite.map(c=>c.row));
                const grid=Array.from({length:maxRow},()=>Array(maxCol).fill(""));
                cellsToWrite.forEach(c=>{grid[c.row-1][c.col-1]=c.val;});
                const csv="\uFEFF"+grid.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
                const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
                const a=document.createElement("a");a.href=URL.createObjectURL(blob);
                const dt=new Date().toISOString().slice(0,10);
                a.download=`relatorio_${exportConfig.level}_${dt}.csv`;a.click();

                setExportLog({type:"success",msg:`✅ ${allRows.length} ${exportConfig.level==="account"?"conta(s)":exportConfig.level==="campaign"?"campanha(s)":"conjunto(s)"} exportada(s) com sucesso!`,detail:`${cellsToWrite.length} células geradas. Arquivo CSV baixado.`,rows:allRows.length});
              }catch(e){
                console.error("Export error:",e);
                setExportLog({type:"error",msg:"Erro ao exportar: "+e.message});
              }finally{
                setExportLoading(false);
              }
            };

            return(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>

                {/* HEADER */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                  <div>
                    <div style={{fontSize:18,fontWeight:600,color:T.txt,marginBottom:4,letterSpacing:"-.01em"}}>Exportador de Planilhas</div>
                    <div style={{fontSize:12,color:T.mute,maxWidth:520,lineHeight:1.6}}>Configure conta, período e métricas para gerar um relatório formatado pronto pra colar em Google Sheets ou Excel.</div>
                  </div>
                  {metaStatus==="connected"?<span style={{fontSize:10,background:"rgba(34,197,94,.1)",color:T.ok,borderRadius:6,padding:"5px 10px",fontWeight:600,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,borderRadius:"50%",background:T.ok}}></span> Meta conectado</span>:<span style={{fontSize:10,background:"rgba(239,68,68,.1)",color:T.err,borderRadius:6,padding:"5px 10px",fontWeight:600}}>⚠ BM desconectado</span>}
                </div>

                {metaStatus!=="connected"&&(
                  <div style={{padding:"12px 16px",background:"rgba(99,102,241,.07)",border:`1px solid rgba(99,102,241,.2)`,borderRadius:10,fontSize:12,color:T.sub,display:"flex",alignItems:"center",gap:10}}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke={T.accent} strokeWidth="1.2"/><path d="M7 6v4M7 4.5v-.5" stroke={T.accent} strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Conecte o Business Manager na aba <button onClick={()=>setView("connections")} style={{background:"none",border:"none",color:T.accent,cursor:"pointer",fontSize:12,fontFamily:T.font,padding:0,fontWeight:500}}>Conexões →</button> para começar.
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1.5fr 1fr",gap:14}}>

                  {/* ════ COLUNA ESQUERDA — CONFIG ════ */}
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>

                    {/* PASSO 1 — Contas */}
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden"}}>
                      <div style={{padding:"14px 18px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:24,height:24,borderRadius:6,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,fontFamily:T.mono}}>1</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Selecione as contas</div>
                            <div style={{fontSize:10,color:T.mute,marginTop:1}}>{exportConfig.accountIds.length} de {metaAccounts.length} selecionada{exportConfig.accountIds.length!==1?"s":""}</div>
                          </div>
                        </div>
                        {metaAccounts.length>0&&<button onClick={toggleAllAccounts} style={{fontSize:11,padding:"5px 12px",borderRadius:7,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontFamily:T.font}}>{exportConfig.accountIds.length===metaAccounts.length?"Desmarcar todas":"Selecionar todas"}</button>}
                      </div>
                      {metaAccounts.length===0?(
                        <div style={{padding:"24px 18px",textAlign:"center",fontSize:12,color:T.mute}}>Conecte o Business Manager para ver as contas.</div>
                      ):(
                        <div style={{maxHeight:180,overflowY:"auto"}}>
                          {metaAccounts.map(a=>{
                            const checked=exportConfig.accountIds.includes(a.id);
                            const init=a.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
                            return(
                              <button key={a.id} onClick={()=>toggleAccount(a.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 18px",border:"none",background:checked?"rgba(99,102,241,.06)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font,width:"100%",borderBottom:`1px solid ${T.border}`}}>
                                <div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${checked?T.accent:T.borderMid}`,background:checked?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{checked&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
                                <div style={{width:26,height:26,borderRadius:7,background:"rgba(0,129,251,.1)",border:"1px solid rgba(0,129,251,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.meta,flexShrink:0}}>{init}</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:12,fontWeight:500,color:T.txt,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.name}</div>
                                  <div style={{fontSize:10,color:T.mute,fontFamily:T.mono,marginTop:1}}>{a.id}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* PASSO 2 — Período + Nível */}
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{width:24,height:24,borderRadius:6,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,fontFamily:T.mono}}>2</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Período e nível dos dados</div>
                          <div style={{fontSize:10,color:T.mute,marginTop:1}}>Define o que vai virar uma linha na planilha</div>
                        </div>
                      </div>

                      {/* Nível */}
                      <div style={{marginBottom:14}}>
                        <div style={{fontSize:10,color:T.sub,marginBottom:8,fontWeight:500}}>Nível de detalhamento</div>
                        <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:9,padding:3,border:`1px solid ${T.borderMid}`}}>
                          {[{v:"account",l:"Conta",d:"Métricas agregadas"},{v:"campaign",l:"Campanha",d:"1 linha por campanha"},{v:"adset",l:"Conjunto",d:"1 linha por conjunto"}].map(p=>(
                            <button key={p.v} onClick={()=>setExportConfig(c=>({...c,level:p.v}))} style={{flex:1,padding:"8px 10px",borderRadius:7,border:"none",cursor:"pointer",background:exportConfig.level===p.v?"rgba(99,102,241,.15)":"transparent",color:exportConfig.level===p.v?T.accent:T.sub,fontFamily:T.font,textAlign:"left"}}>
                              <div style={{fontSize:11,fontWeight:exportConfig.level===p.v?600:500,marginBottom:2}}>{p.l}</div>
                              <div style={{fontSize:9,color:T.mute}}>{p.d}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Período — estilo Meta Ads (presets + calendário duplo) */}
                      {(()=>{
                        const expRightMonth=exportCalMonth===11?0:exportCalMonth+1;
                        const expRightYear=exportCalMonth===11?exportCalYear+1:exportCalYear;
                        const expMonthFull=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
                        const expGetDays=(y,m)=>{const first=new Date(y,m,1).getDay();const days=new Date(y,m+1,0).getDate();return{offset:(first+6)%7,days};};
                        const expToISO=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                        const expFromISO=(s)=>{if(!s)return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);};
                        const expIsStart=(y,m,d)=>expToISO(y,m,d)===exportConfig.customRange.start;
                        const expIsEnd=(y,m,d)=>expToISO(y,m,d)===exportConfig.customRange.end;
                        const expInRange=(y,m,d)=>{if(!exportConfig.customRange.start||!exportConfig.customRange.end)return false;const dt=new Date(y,m,d);return dt>expFromISO(exportConfig.customRange.start)&&dt<expFromISO(exportConfig.customRange.end);};
                        const expToday=new Date();
                        const expIsToday=(y,m,d)=>expToISO(y,m,d)===expToISO(expToday.getFullYear(),expToday.getMonth(),expToday.getDate());

                        const expHandleDay=(y,m,d)=>{
                          const iso=expToISO(y,m,d);
                          if(!exportConfig.customRange.selecting||!exportConfig.customRange.start){
                            setExportConfig(c=>({...c,customRange:{start:iso,end:null,selecting:true}}));
                          }else{
                            const[s,e]=iso<exportConfig.customRange.start?[iso,exportConfig.customRange.start]:[exportConfig.customRange.start,iso];
                            setExportConfig(c=>({...c,customRange:{start:s,end:e,selecting:false},period:"custom"}));
                            setExportShowPicker(false);
                          }
                        };

                        const expRenderCal=(year,month)=>{
                          const{offset,days}=expGetDays(year,month);
                          const cells=[];
                          for(let i=0;i<offset;i++)cells.push(null);
                          for(let d=1;d<=days;d++)cells.push(d);
                          const weeks=[];
                          for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));
                          return(
                            <div style={{flex:1,minWidth:200}}>
                              <div style={{fontSize:12,color:T.txt,fontWeight:500,textAlign:"center",marginBottom:10}}>{expMonthFull[month]} {year}</div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0,fontSize:9,color:T.mute,marginBottom:6}}>{["S","T","Q","Q","S","S","D"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontWeight:600,letterSpacing:".05em"}}>{d}</div>))}</div>
                              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                                {weeks.map((w,wi)=>(
                                  <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:0}}>
                                    {w.map((d,di)=>{
                                      if(d===null)return<div key={di} style={{height:30}}></div>;
                                      const start=expIsStart(year,month,d);
                                      const end=expIsEnd(year,month,d);
                                      const inR=expInRange(year,month,d);
                                      const todayD=expIsToday(year,month,d);
                                      return(
                                        <div key={di} onClick={()=>expHandleDay(year,month,d)} style={{height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,cursor:"pointer",borderRadius:start||end?"50%":"2px",background:start||end?"#0081FB":inR?"rgba(0,129,251,.18)":"transparent",color:start||end?"#fff":todayD?"#0081FB":T.txt,fontWeight:start||end||todayD?600:400}}>
                                          {d}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        };

                        return(
                          <div>
                            <div style={{fontSize:10,color:T.sub,marginBottom:8,fontWeight:500}}>Período</div>
                            <div style={{position:"relative"}}>
                              <button onClick={()=>setExportShowPicker(!exportShowPicker)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,border:`1px solid ${exportShowPicker?T.meta+"66":T.borderMid}`,background:exportShowPicker?"rgba(0,129,251,.06)":"rgba(255,255,255,.04)",color:T.txt,cursor:"pointer",fontFamily:T.font,fontSize:13,transition:"all .15s"}}>
                                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="11" rx="2" stroke={T.meta} strokeWidth="1.2"/><path d="M1 5.5h12" stroke={T.meta} strokeWidth="1.2"/><path d="M4 1v3M10 1v3" stroke={T.meta} strokeWidth="1.2" strokeLinecap="round"/></svg>
                                <span style={{flex:1,textAlign:"left",color:T.meta,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{expActivePeriodLabel}</span>
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,transform:exportShowPicker?"rotate(180deg)":"none",transition:"transform .2s"}}><path d="M2 4.5l4 4 4-4" stroke={T.mute} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                              {exportShowPicker&&(
                                <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:200,background:"#131825",border:`1px solid ${T.borderMid}`,borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.7)",display:isMobile?"block":"flex",minWidth:isMobile?"100%":560,maxWidth:isMobile?"100%":"none"}}>
                                  <div style={{width:isMobile?"100%":170,borderRight:isMobile?"none":`1px solid ${T.border}`,borderBottom:isMobile?`1px solid ${T.border}`:"none",padding:"10px 0",flexShrink:0}}>
                                    <div style={{fontSize:9,color:T.mute,letterSpacing:".09em",padding:"0 14px 8px",fontWeight:600}}>USADOS RECENTEMENTE</div>
                                    {expPresets.map(p=>{
                                      const sel=exportConfig.period===p.v;
                                      return(
                                        <div key={p.v} onClick={()=>{setExportConfig(c=>({...c,period:p.v,customRange:{start:null,end:null,selecting:false}}));setExportShowPicker(false);}} style={{padding:"8px 14px",fontSize:12,color:sel?T.txt:T.sub,cursor:"pointer",background:sel?"rgba(255,255,255,.06)":"transparent",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>!sel&&(e.currentTarget.style.background="rgba(255,255,255,.04)")} onMouseLeave={e=>!sel&&(e.currentTarget.style.background=sel?"rgba(255,255,255,.06)":"transparent")}>
                                          <span style={{width:7,height:7,borderRadius:"50%",background:sel?"#0081FB":"transparent",flexShrink:0,border:sel?"none":`1px solid ${T.border}`}}></span>{p.l}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div style={{flex:1,padding:16,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                                      <button onClick={()=>{if(exportCalMonth===0){setExportCalMonth(11);setExportCalYear(y=>y-1);}else setExportCalMonth(m=>m-1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 8px"}}>‹</button>
                                      <div style={{fontSize:11,color:T.mute,fontWeight:500}}>{exportConfig.customRange.start&&exportConfig.customRange.end?`${exportConfig.customRange.start} → ${exportConfig.customRange.end}`:exportConfig.customRange.start?"Selecione a data final":"Selecione o período"}</div>
                                      <button onClick={()=>{if(exportCalMonth===11){setExportCalMonth(0);setExportCalYear(y=>y+1);}else setExportCalMonth(m=>m+1);}} style={{background:"none",border:"none",color:T.sub,cursor:"pointer",fontSize:18,lineHeight:1,padding:"2px 8px"}}>›</button>
                                    </div>
                                    <div style={{display:isMobile?"block":"flex",gap:20}}>
                                      {expRenderCal(exportCalYear,exportCalMonth)}
                                      {!isMobile&&expRenderCal(expRightYear,expRightMonth)}
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
                                      <span style={{fontSize:10,color:T.mute}}>Fuso: Horário de Brasília</span>
                                      <div style={{display:"flex",gap:8}}>
                                        <button onClick={()=>{setExportShowPicker(false);setExportConfig(c=>({...c,customRange:{start:null,end:null,selecting:false}}));}} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,fontSize:11,cursor:"pointer",fontFamily:T.font}}>Cancelar</button>
                                        <button onClick={()=>{if(exportConfig.customRange.start&&exportConfig.customRange.end){setExportConfig(c=>({...c,period:"custom"}));setExportShowPicker(false);}}} disabled={!exportConfig.customRange.start||!exportConfig.customRange.end} style={{padding:"7px 14px",borderRadius:8,border:"none",background:exportConfig.customRange.start&&exportConfig.customRange.end?"#0081FB":"rgba(0,129,251,.3)",color:"#fff",fontSize:11,fontWeight:600,cursor:exportConfig.customRange.start&&exportConfig.customRange.end?"pointer":"not-allowed",fontFamily:T.font}}>Atualizar</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* PASSO 3 — Métricas */}
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:24,height:24,borderRadius:6,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,fontFamily:T.mono}}>3</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Quais métricas exportar?</div>
                            <div style={{fontSize:10,color:T.mute,marginTop:1}}>{exportConfig.metrics.length} métrica{exportConfig.metrics.length!==1?"s":""} selecionada{exportConfig.metrics.length!==1?"s":""}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:5}}>
                          {[{v:"basic",l:"Básico"},{v:"performance",l:"Performance"},{v:"full",l:"Completo"}].map(p=>(
                            <button key={p.v} onClick={()=>presetMetrics(p.v)} style={{fontSize:10,padding:"4px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:"transparent",color:T.sub,cursor:"pointer",fontFamily:T.font}}>{p.l}</button>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:14}}>
                        {Object.entries(groupedMetrics).map(([cat,metrics])=>(
                          <div key={cat}>
                            <div style={{fontSize:9,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:8}}>{catLabels[cat]}</div>
                            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:6}}>
                              {metrics.map(m=>{
                                const checked=exportConfig.metrics.includes(m.id);
                                return(
                                  <button key={m.id} onClick={()=>toggleMetric(m.id)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:8,border:`1px solid ${checked?T.accent+"55":T.border}`,background:checked?"rgba(99,102,241,.07)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
                                    <span style={{fontSize:13,flexShrink:0}}>{m.icon}</span>
                                    <span style={{fontSize:11,fontWeight:checked?600:500,color:checked?T.txt:T.sub,flex:1}}>{m.l}</span>
                                    {checked&&<span style={{color:T.accent,fontSize:11}}>✓</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ════ COLUNA DIREITA — DESTINO + AÇÃO ════ */}
                  <div style={{display:"flex",flexDirection:"column",gap:14,position:isMobile?"relative":"sticky",top:isMobile?"auto":14,height:"fit-content"}}>
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                        <div style={{width:24,height:24,borderRadius:6,background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:T.accent,fontFamily:T.mono}}>4</div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:T.txt}}>Formato de saída</div>
                          <div style={{fontSize:10,color:T.mute,marginTop:1}}>Como organizar os dados</div>
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        <button onClick={()=>setExportConfig(c=>({...c,layout:"vertical"}))} style={{padding:"12px 14px",borderRadius:9,border:`1px solid ${exportConfig.layout==="vertical"?T.accent+"55":T.border}`,background:exportConfig.layout==="vertical"?"rgba(99,102,241,.07)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontSize:13}}>📋</span>
                            <span style={{fontSize:12,fontWeight:600,color:exportConfig.layout==="vertical"?T.accent:T.txt}}>Vertical (em blocos)</span>
                            {exportConfig.layout==="vertical"&&<span style={{marginLeft:"auto",color:T.accent,fontSize:11}}>✓</span>}
                          </div>
                          <div style={{fontSize:10,color:T.mute,paddingLeft:21}}>Cada conta/campanha em um bloco separado, métricas em linhas. Como o template do print que você mandou.</div>
                        </button>
                        <button onClick={()=>setExportConfig(c=>({...c,layout:"horizontal"}))} style={{padding:"12px 14px",borderRadius:9,border:`1px solid ${exportConfig.layout==="horizontal"?T.accent+"55":T.border}`,background:exportConfig.layout==="horizontal"?"rgba(99,102,241,.07)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:T.font}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <span style={{fontSize:13}}>📊</span>
                            <span style={{fontSize:12,fontWeight:600,color:exportConfig.layout==="horizontal"?T.accent:T.txt}}>Horizontal (tabela)</span>
                            {exportConfig.layout==="horizontal"&&<span style={{marginLeft:"auto",color:T.accent,fontSize:11}}>✓</span>}
                          </div>
                          <div style={{fontSize:10,color:T.mute,paddingLeft:21}}>Cabeçalho na primeira linha, uma linha por conta/campanha. Formato tradicional de tabela.</div>
                        </button>
                      </div>
                    </div>

                    {/* PREVIEW */}
                    <div className="card" style={{background:T.card,borderRadius:14,border:`1px solid ${T.border}`,padding:"14px 18px"}}>
                      <div style={{fontSize:10,color:T.mute,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:10}}>Resumo da exportação</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8,fontSize:11}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.mute}}>Contas</span><span style={{color:T.txt,fontWeight:500}}>{exportConfig.accountIds.length||"—"}</span></div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.mute}}>Nível</span><span style={{color:T.txt,fontWeight:500,textTransform:"capitalize"}}>{exportConfig.level==="account"?"Conta":exportConfig.level==="campaign"?"Campanha":"Conjunto"}</span></div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.mute}}>Período</span><span style={{color:T.txt,fontWeight:500}}>{expActivePeriodLabel}</span></div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.mute}}>Métricas</span><span style={{color:T.txt,fontWeight:500}}>{exportConfig.metrics.length}</span></div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:T.mute}}>Layout</span><span style={{color:T.txt,fontWeight:500}}>{exportConfig.layout==="vertical"?"Vertical":"Horizontal"}</span></div>
                      </div>
                    </div>

                    {/* AÇÃO */}
                    <button onClick={handleExport} disabled={!valid||exportLoading||metaStatus!=="connected"} className="btn-p" style={{padding:"14px 18px",borderRadius:11,border:"none",background:(valid&&!exportLoading&&metaStatus==="connected")?T.accent:"rgba(99,102,241,.3)",color:"#fff",cursor:(valid&&!exportLoading&&metaStatus==="connected")?"pointer":"not-allowed",fontSize:13,fontWeight:600,fontFamily:T.font,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      {exportLoading?<><span style={{width:14,height:14,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block"}}></span> Buscando dados...</>:<><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M3.5 5.5L7 9l3.5-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg> Gerar e baixar planilha (CSV)</>}
                    </button>

                    {/* AVISO Google Sheets */}
                    <div style={{padding:"12px 14px",background:"rgba(99,102,241,.05)",border:"1px solid rgba(99,102,241,.15)",borderRadius:10,fontSize:10,color:T.mute,lineHeight:1.6}}>
                      <div style={{fontSize:10,color:T.accent,letterSpacing:".08em",fontWeight:600,textTransform:"uppercase",marginBottom:5}}>📋 Como usar no Google Sheets</div>
                      Por enquanto a exportação gera um arquivo <strong style={{color:T.txt}}>CSV</strong> que você abre no Google Sheets via <strong style={{color:T.txt}}>Arquivo → Importar</strong>. Em breve teremos integração direta via OAuth para escrever na planilha automaticamente.
                    </div>

                    {/* LOG */}
                    {exportLog&&(
                      <div style={{padding:"12px 14px",background:exportLog.type==="success"?"rgba(34,197,94,.08)":"rgba(239,68,68,.08)",border:`1px solid ${exportLog.type==="success"?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"}`,borderRadius:10,fontSize:11}}>
                        <div style={{color:exportLog.type==="success"?T.ok:T.err,fontWeight:600,marginBottom:exportLog.detail?4:0}}>{exportLog.msg}</div>
                        {exportLog.detail&&<div style={{color:T.sub,fontSize:10}}>{exportLog.detail}</div>}
                      </div>
                    )}
                  </div>
                </div>
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
