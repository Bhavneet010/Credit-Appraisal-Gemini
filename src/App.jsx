import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   DEFAULT RATIO CONFIG (unchanged — your custom thresholds intact)
   ═══════════════════════════════════════════════════════════════ */
const DEF_RATIOS = {
  currentRatio:{label:"Current Ratio",icon:"💧",formula:"Current Assets ÷ Current Liabilities",unit:":1",dec:2,th:{h:2,l:1},gd:"mid",hl:"Strong",ml:"Balanced",ll:"Weak",
    c:{high:["The Current Ratio of [X]:1 exceeds 2, showing very strong liquidity with substantial excess current assets. However, this may indicate idle cash or overstocked inventory."],mid:["The Current Ratio of [X]:1 is in the balanced range (>1 but <2), indicating adequate liquidity with sufficient current assets to cover liabilities and a reasonable safety margin."],low:["The Current Ratio of [X]:1 is below 1, indicating weak liquidity where current assets fall short of current liabilities."]},
    m:{high:["Acceptable as surplus funds are planned for business expansion or debt reduction."],mid:["Supported by healthy cash generation, satisfactory account conduct, and good collateral cover."],low:["Supported by strong cash accruals, quick debtor realisation, and adequate collateral coverage."]}},
  tolTnw:{label:"TOL/TNW",icon:"⚖️",formula:"Total Outside Liabilities ÷ Tangible Net Worth",unit:":1",dec:2,th:{h:5,l:1},gd:"low",hl:"High Leverage",ml:"Balanced",ll:"Conservative",
    c:{high:["The TOL/TNW of [X]:1 exceeds 5, indicating high leverage with heavy reliance on outside liabilities."],mid:["The TOL/TNW of [X]:1 is in the balanced range (>1 & <5), indicating adequate mix of external funds and own capital."],low:["The TOL/TNW of [X]:1 is below 1, indicating very low leverage with strong tangible net worth."]},
    m:{high:["Acceptable as strong cash accruals, high DSCR, and substantial collateral compensate."],mid:["Supported by consistent profitability, satisfactory account conduct, and good tangible security cushion."],low:["Supported by very strong promoter net worth, minimal debt, and excellent solvency."]}},
  dscr:{label:"DSCR",icon:"🔄",formula:"(Net Profit + Dep + Interest) ÷ (Principal + Interest)",unit:"",dec:2,th:{h:1.75,l:1.25},gd:"high",hl:"Excellent",ml:"Adequate",ll:"Weak",
    c:{high:["The DSCR of [X] exceeds 1.75, indicating excellent debt-servicing capacity with strong cash accruals."],mid:["The DSCR of [X] is in the recommended range (1.25 to 1.75), indicating adequate cash flow coverage for debt service."],low:["The DSCR of [X] is below 1.25, indicating inadequate cash flow coverage for debt service."]},
    m:{high:["Acceptable as strong coverage allows flexibility for growth or additional borrowing."],mid:["Supported by consistent cash accruals, satisfactory account conduct, and good collateral coverage."],low:["Acceptable as strong collateral coverage and high monthly inflows compensate."]}},
  icr:{label:"Interest Coverage",icon:"🛡️",formula:"EBIT ÷ Interest Expense",unit:"x",dec:2,th:{h:3,l:1.5},gd:"high",hl:"Excellent",ml:"Adequate",ll:"Weak",
    c:{high:["The Interest Coverage Ratio of [X] exceeds 3.0, indicating excellent ability to meet interest obligations."],mid:["The Interest Coverage Ratio of [X] is in the recommended range (1.5 to 3.0), indicating adequate operating profits to cover interest."],low:["The Interest Coverage Ratio of [X] is below 1.5, indicating weak ability to cover interest from operating profits."]},
    m:{high:["Acceptable as strong profitability provides flexibility for future borrowing or expansion."],mid:["Supported by consistent operating profits, satisfactory account conduct, and good collateral coverage."],low:["Acceptable as strong collateral coverage and high monthly inflows compensate."]}},
  npm:{label:"Net Profit Margin",icon:"💰",formula:"Net Profit ÷ Net Sales × 100",unit:"%",dec:1,th:{h:12,l:5},gd:"high",hl:"Excellent",ml:"Adequate",ll:"Weak",
    c:{high:["The Net Profit Margin of [X]% exceeds 12%, indicating excellent profitability and strong operational efficiency."],mid:["The Net Profit Margin of [X]% is in the recommended range (5% to 12%), indicating adequate profitability."],low:["The Net Profit Margin of [X]% is below 5%, indicating weak profitability with thin earnings."]},
    m:{high:["Acceptable as strong margins support future expansion and additional borrowing capacity."],mid:["Supported by consistent sales growth, satisfactory account conduct, and good collateral coverage."],low:["Acceptable as strong collateral coverage and high monthly inflows compensate."]}},
  invTurnover:{label:"Inventory Turnover",icon:"📦",formula:"Net Sales ÷ Avg Inventory",unit:"x",dec:1,th:{h:8,l:4},gd:"high",hl:"Excellent",ml:"Adequate",ll:"Slow",
    c:{high:["The Inventory Turnover of [X] times exceeds 8, indicating very efficient inventory management."],mid:["The Inventory Turnover of [X] times is in the recommended range (4 to 8), indicating balanced inventory management."],low:["The Inventory Turnover of [X] times is below 4, indicating slow-moving inventory."]},
    m:{high:["Acceptable as fast turnover supports strong liquidity."],mid:["Supported by consistent sales and good collateral coverage."],low:["Acceptable as strong collateral coverage and high monthly inflows compensate."]}},
  recvDays:{label:"Receivable Days",icon:"📅",formula:"(Trade Recv ÷ Net Sales) × 365",unit:" days",dec:0,th:{h:90,l:30},gd:"low",hl:"Slow",ml:"Reasonable",ll:"Quick",
    c:{high:["The Receivable Days of [X] days exceeds 90, indicating slow collection from debtors."],mid:["The Receivable Days of [X] days is in the recommended range (30 to 90), indicating reasonable collection period."],low:["The Receivable Days of [X] days is below 30, indicating very quick collection."]},
    m:{high:["Acceptable as strong collateral and quick inventory turnover compensate."],mid:["Supported by consistent sales and good collateral coverage."],low:["Acceptable as quick collections support excellent liquidity."]}},
  roce:{label:"ROCE",icon:"📈",formula:"EBIT ÷ Capital Employed × 100",unit:"%",dec:1,th:{h:18,l:10},gd:"high",hl:"Excellent",ml:"Adequate",ll:"Weak",
    c:{high:["The ROCE of [X]% exceeds 18%, indicating excellent return on capital employed."],mid:["The ROCE of [X]% is in the recommended range (10% to 18%), indicating adequate return on capital."],low:["The ROCE of [X]% is below 10%, indicating weak return on capital."]},
    m:{high:["Acceptable as strong returns support future expansion."],mid:["Supported by consistent operating profits and good collateral coverage."],low:["Acceptable as strong collateral and high monthly inflows compensate."]}},
  debtEquity:{label:"Debt/Equity",icon:"🏦",formula:"Long-term Debt ÷ Tangible Net Worth",unit:":1",dec:2,th:{h:3,l:1},gd:"low",hl:"High",ml:"Balanced",ll:"Conservative",
    c:{high:["The Debt-Equity Ratio of [X]:1 exceeds 3, indicating high long-term leverage."],mid:["The Debt-Equity Ratio of [X]:1 is in the recommended range (1 to 3), indicating balanced capital structure."],low:["The Debt-Equity Ratio of [X]:1 is below 1, indicating very low leverage."]},
    m:{high:["Acceptable as strong cash accruals and substantial collateral compensate."],mid:["Supported by consistent profitability and good tangible security cushion."],low:["Supported by very strong promoter net worth and excellent solvency."]}},
  facr:{label:"FACR",icon:"🏗️",formula:"Fixed Assets ÷ (LT Debt + TNW)",unit:":1",dec:2,th:{h:1.5,l:1},gd:"high",hl:"Strong",ml:"Adequate",ll:"Weak",
    c:{high:["The FACR of [X]:1 exceeds 1.5, indicating strong coverage of fixed assets by long-term funds."],mid:["The FACR of [X]:1 is in the recommended range (1.0 to 1.5), indicating adequate coverage."],low:["The FACR of [X]:1 is below 1.0, indicating inadequate long-term funds."]},
    m:{high:["Acceptable as strong coverage provides flexibility for future asset addition."],mid:["Supported by consistent long-term funding and good collateral coverage."],low:["Acceptable as strong collateral and high DSCR compensate."]}}
};

const DEF_SETTINGS = {
  fy:{prev:"FY 2024-25",curr:"FY 2025-26",months:11,annMonth:"Feb 2026"},
  bank:{name:"",branch:"",officer:"",cicDate:""},
  geminiKey:"",
  groqKey:"",
  openrouterKey:"",
  scanProvider:"auto",
  ratios:JSON.parse(JSON.stringify(DEF_RATIOS))
};

/* ═══════════ PERSISTENCE ═══════════ */
function ls(k,f){try{const s=localStorage.getItem(k);return s?JSON.parse(s):f;}catch{return f;}}
function ss(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
function loadSettings(){
  try{const s=localStorage.getItem("ca_settings");
    return s?{...DEF_SETTINGS,...JSON.parse(s),ratios:{...DEF_SETTINGS.ratios,...(JSON.parse(s).ratios||{})}}:JSON.parse(JSON.stringify(DEF_SETTINGS));
  }catch{return JSON.parse(JSON.stringify(DEF_SETTINGS));}
}

/* ═══════════ OPTIONS & UTILS ═══════════ */
const O={co:["PARTNERSHIP","PROPRIETORSHIP","PVT LTD","LLP","HUF"],pr:["OWNED","RENTED","LEASED","FAMILY OWNED"],tr:["WHOLESALE","RETAIL","WHOLESALE & RETAIL","MANUFACTURING","SERVICE"],po:["EXISTING LEVEL","ENHANCEMENT","REDUCTION","FRESH","TAKEOVER"],yn:["YES","NO"],ro:["MOST","PARTIAL","MINIMAL"],cd:["Satisfactory","Irregular","Unsatisfactory"],ne:["NEW","EXISTING"]};

function cls(k,v,R){if(v===""||v===undefined||isNaN(v))return null;const r=R[k];return v>=r.th.h?"high":v>=r.th.l?"mid":"low";}
function rc(k,l,R){const g=R[k].gd;if(g==="high")return l==="high"?"#059669":l==="mid"?"#d97706":"#dc2626";if(g==="low")return l==="high"?"#dc2626":l==="mid"?"#d97706":"#059669";return l==="mid"?"#059669":l==="high"?"#d97706":"#dc2626";}
function rbg(c){return c==="#059669"?"rgba(5,150,105,0.1)":c==="#d97706"?"rgba(217,119,6,0.1)":"rgba(220,38,38,0.08)";}
function gc(k,v,R){const l=cls(k,v,R);if(!l)return null;const r=R[k],t=r.c[l],m=r.m[l];return{text:t[Math.floor(Math.random()*t.length)].replace(/\[X\]/g,parseFloat(v).toFixed(r.dec)),mit:m[Math.floor(Math.random()*m.length)],level:l};}
function fv(k,v,R){const r=R[k],n=parseFloat(v);if(r.unit==="%")return n.toFixed(r.dec)+"%";if(r.unit==="x")return n.toFixed(r.dec)+"×";if(r.unit===" days")return n.toFixed(0);return n.toFixed(r.dec);}
function fsu(k,R){const u=R[k].unit;return u===":1"?" :1":u===" days"?" days":"";}

/* ═══════════ INDIAN NUMBER FORMAT ═══════════ */
function fmtInd(n){if(n===""||n===undefined||n===null||isNaN(n))return"";const num=+n;const s=num<0?"-":"";const a=Math.abs(num);const[intP,decP]=a.toFixed(2).split(".");let r=intP;if(r.length>3)r=r.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,",")+","+r.slice(-3);else r=r;return s+r+(decP&&+decP>0?"."+decP:"");}

const EMPTY_D={name:"",constitution:"",newExisting:"EXISTING",partners:"",prevPartners:"",experience:"",agreementDate:"",udyam:"",udyamState:"",udyamDist:"",udyamNum:"",gst:"",gstAvailable:"YES",premises:"",leaseExpiry:"",address:"",commenced:"",tradingType:"",activity:"",cateringTo:"",rawMaterials:"",suppliers:"",buyers:"",proposal:"EXISTING LEVEL",currentCC:"",enhancedCC:"",reducedCC:"",termLoan:"",cicScore:"",salesRouting:"",interestRegular:"",matchGstItr:"",overallConduct:"",crSumm2425:"",crSumm2526:"",annualisedSales:"",gst2425:"",gst2526:"",itrSales:"",freshCC:"",freshTL:"",tlPurpose:"",projectCost:"",promoterContrib:"",existingBanker:"",premisesRent:"",lessorName:"",proprietorFather:"",partnershipDeedDate:"",boardResDate:"",authorizedCap:"",paidUpCap:"",primarySecurity:"",collateralSecurity:"",collateralValue:"",collateralDate:"",valuerName:"",insuranceCoverage:"",insuranceValidity:"",npaHistory:"NO",irregularities:"",accountSince:"",tlRepayMonths:"",tlMoratorium:"",cgtmse:"NO",checklist:{},prevNetSalesAmt:"",prevGstAmt:"",riskGrade:"",takeoverBank:"",takeoverOutstanding:"",takeoverNOC:"",takeoverReason:"",isMudra:"NO",mudraCategory:"",mudraQ1:"",mudraQ2:"",mudraQ3:"",mudraQ4:"",mudraQ5:""};
const EMPTY_FIN={currentRatio:"",tolTnw:"",dscr:"",icr:"",npm:"",invTurnover:"",recvDays:"",roce:"",debtEquity:"",facr:"",ca:"",cl:"",tol:"",tnw:"",ltd:"",fixedAssets:"",netSales:"",netProfit:"",ebit:"",intExp:"",dep:"",principalRepay:"",avgInv:"",tradeRecv:"",capEmployed:"",prevCa:"",prevCl:"",prevTol:"",prevTnw:"",prevLtd:"",prevFixedAssets:"",prevNetSales:"",prevNetProfit:"",prevEbit:"",prevIntExp:"",prevDep:"",prevPrincipalRepay:"",prevAvgInv:"",prevTradeRecv:"",prevCapEmployed:""};

/* ═══════════ VALIDATION ═══════════ */
const REQ_FIELDS = {
  0:["name","constitution","partners","experience","udyam","premises","address","commenced","tradingType","activity"],
};
function getReqStep1(d){
  const base=["proposal","cicScore","overallConduct"];
  const isFresh=d.proposal==="FRESH";
  if(!isFresh){base.push("salesRouting","interestRegular");if(d.currentCC)base.push("currentCC");}
  if(d.proposal==="ENHANCEMENT")base.push("enhancedCC");
  if(d.proposal==="REDUCTION")base.push("reducedCC");
  if(isFresh&&(d.freshCC||d.freshTL)){if(d.freshCC)base.push("freshCC");if(d.freshTL)base.push("freshTL");}
  return base;
}
function stepComplete(step,d,fin){
  let fields;
  if(step===0)fields=REQ_FIELDS[0];
  else if(step===1)fields=getReqStep1(d);
  else if(step===2)fields=["currentRatio","tolTnw","dscr"];
  else return 100;
  const src=step===2?fin:d;
  const filled=fields.filter(f=>src[f]!==""&&src[f]!==undefined&&src[f]!==null).length;
  return Math.round((filled/fields.length)*100);
}
function validateGST(v){if(!v)return true;return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9][Z][A-Z0-9]$/i.test(v);}
function validateUDYAM(v){if(!v)return true;return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i.test(v);}
function validateCIC(v){if(!v&&v!==0)return true;const n=+v;return n>=300&&n<=900;}

/* ═══════════ SCORE CALCULATION ═══════════ */
function calcScore(fin,R){
  const rk=Object.keys(R).filter(k=>fin[k]!==""&&fin[k]!==undefined&&!isNaN(fin[k]));
  if(!rk.length)return null;
  let g=0;rk.forEach(k=>{const l=cls(k,+fin[k],R);const c=rc(k,l,R);if(c==="#059669")g++;});
  return Math.round((g/rk.length)*100);
}
function calcRiskGrade(score,cicScore){
  const cic=+cicScore||0;
  const cicW=cic>=750?30:cic>=650?20:cic>=550?10:0;
  const ratioW=Math.round((score||0)*0.7);
  const total=cicW+ratioW;
  if(total>=80)return{grade:"A",label:"Low Risk",color:"var(--green)"};
  if(total>=60)return{grade:"B",label:"Moderate",color:"var(--amber)"};
  if(total>=40)return{grade:"C",label:"Elevated",color:"var(--amber)"};
  return{grade:"D",label:"High Risk",color:"var(--red)"};
}
function crossVerify(d,sett){
  const warnings=[];
  const ann=+d.annualisedSales||0;
  const gst=+d.gst2526||0;
  const itr=+d.itrSales||0;
  const m=sett.fy.months||11;
  const gstAnn=gst>0?(gst/m)*12:0;
  if(ann>0&&gstAnn>0){const diff=Math.abs(ann-gstAnn)/ann*100;if(diff>15)warnings.push({text:"Annualised Sales (₹"+ann+"L) vs GST annualised (₹"+Math.round(gstAnn)+"L) — "+Math.round(diff)+"% variance",severity:diff>30?"red":"amber"});}
  if(ann>0&&itr>0){const diff=Math.abs(ann-itr)/ann*100;if(diff>20)warnings.push({text:"Annualised Sales (₹"+ann+"L) vs ITR (₹"+itr+"L) — "+Math.round(diff)+"% variance",severity:diff>40?"red":"amber"});}
  if(gstAnn>0&&itr>0){const diff=Math.abs(gstAnn-itr)/gstAnn*100;if(diff>15)warnings.push({text:"GST annualised (₹"+Math.round(gstAnn)+"L) vs ITR (₹"+itr+"L) — "+Math.round(diff)+"% variance",severity:diff>30?"red":"amber"});}
  return warnings;
}
function bsValidate(fin){
  const w=[];
  const ca=+fin.ca,cl=+fin.cl,tol=+fin.tol,tnw=+fin.tnw,ltd=+fin.ltd,fa=+fin.fixedAssets;
  if(ca&&fa&&tol&&tnw){const assets=ca+fa,liab=tol+tnw;const diff=Math.abs(assets-liab);const pct=assets>0?(diff/assets)*100:0;
    if(pct>15&&diff>5)w.push({text:`Assets (₹${fmtInd(assets)}L) vs Liabilities (₹${fmtInd(liab)}L) — ${Math.round(pct)}% mismatch. Check if BS balances.`,severity:pct>30?"red":"amber"});}
  if(cl&&tol&&cl>tol*1.05)w.push({text:`CL (₹${fmtInd(cl)}L) exceeds TOL (₹${fmtInd(tol)}L). TOL should include CL + LT Debt.`,severity:"red"});
  if(tnw&&tnw<0)w.push({text:`Negative Net Worth (₹${fmtInd(tnw)}L) — entity is technically insolvent.`,severity:"red"});
  const ns=+fin.netSales,np=+fin.netProfit;
  if(ns&&np&&Math.abs(np)>ns)w.push({text:`Net Profit (₹${fmtInd(np)}L) exceeds Net Sales (₹${fmtInd(ns)}L) — likely a data entry error.`,severity:"red"});
  const ebit=+fin.ebit;
  if(ebit&&np&&ebit<np*0.9&&np>0)w.push({text:`EBIT (₹${fmtInd(ebit)}L) is less than Net Profit (₹${fmtInd(np)}L). EBIT should be higher.`,severity:"amber"});
  const intE=+fin.intExp;
  if(intE&&ns&&intE>ns*0.5)w.push({text:`Interest Expense is ${Math.round(intE/ns*100)}% of sales — unusually high.`,severity:"amber"});
  return w;
}

/* ═══════════════════════════════════════════════════════════════
   CSS — Refined Professional Theme with Dark Mode
   ═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
:root {
  --bg: #f0eef6; --bg2: #e8e5f0; --card: rgba(255,255,255,0.5); --card-border: rgba(255,255,255,0.6);
  --text: #1b1340; --text2: #4a3f6b; --text3: #8a82a6;
  --accent: #6c5ce7; --accent-light: rgba(108,92,231,0.1); --accent-mid: rgba(108,92,231,0.18);
  --green: #00b894; --amber: #e17055; --red: #d63031;
  --green-bg: rgba(0,184,148,0.12); --amber-bg: rgba(225,112,85,0.12); --red-bg: rgba(214,48,49,0.1);
  --shadow: 0 2px 16px rgba(80,60,120,0.06);
  --shadow-lg: 0 8px 40px rgba(80,60,120,0.12);
  --radius: 20px; --radius-sm: 14px;
  --header-bg: rgba(255,255,255,0.45);
  --input-bg: rgba(255,255,255,0.5); --input-border: rgba(255,255,255,0.7); --input-focus: rgba(108,92,231,0.3);
  --blur: blur(18px); --sat: saturate(1.6);
}
[data-theme="dark"] {
  --bg: #0d0b1a; --bg2: #16132a; --card: rgba(30,25,55,0.55); --card-border: rgba(255,255,255,0.08);
  --text: #e8e4f0; --text2: #b0a8c8; --text3: #6b6488;
  --accent: #a29bfe; --accent-light: rgba(162,155,254,0.12); --accent-mid: rgba(162,155,254,0.2);
  --shadow: 0 2px 16px rgba(0,0,0,0.2); --shadow-lg: 0 8px 40px rgba(0,0,0,0.4);
  --header-bg: rgba(13,11,26,0.7);
  --input-bg: rgba(255,255,255,0.06); --input-border: rgba(255,255,255,0.1); --input-focus: rgba(162,155,254,0.35);
  --green-bg: rgba(0,184,148,0.15); --amber-bg: rgba(225,112,85,0.15); --red-bg: rgba(214,48,49,0.12);
}
[data-theme="yono"] {
  --bg: #f5f3f8; --bg2: #ece8f2; --card: rgba(255,255,255,0.95); --card-border: rgba(106,27,154,0.1);
  --text: #2d1054; --text2: #4a2d6e; --text3: #8a7a9e;
  --accent: #6a1b9a; --accent-light: rgba(106,27,154,0.08); --accent-mid: rgba(106,27,154,0.14);
  --green: #2e7d32; --amber: #e65100; --red: #c62828;
  --green-bg: rgba(46,125,50,0.1); --amber-bg: rgba(230,81,0,0.1); --red-bg: rgba(198,40,40,0.08);
  --shadow: 0 2px 12px rgba(106,27,154,0.06);
  --shadow-lg: 0 6px 30px rgba(106,27,154,0.1);
  --radius: 16px; --radius-sm: 12px;
  --header-bg: linear-gradient(135deg, #6a1b9a, #8e24aa);
  --input-bg: #ffffff; --input-border: rgba(106,27,154,0.18); --input-focus: rgba(106,27,154,0.3);
  --blur: blur(0px); --sat: saturate(1);
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { margin: 0; font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; background: var(--bg); color: var(--text); transition: background .4s, color .4s; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }

.shell { max-width: 480px; margin: 0 auto; min-height: 100dvh; position: relative; overflow: hidden; }
.shell::before { content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none; background: radial-gradient(ellipse 600px 600px at 10% 20%, rgba(162,155,254,0.3), transparent), radial-gradient(ellipse 500px 500px at 90% 70%, rgba(253,203,110,0.25), transparent), radial-gradient(ellipse 400px 400px at 50% 50%, rgba(0,184,148,0.12), transparent); }
[data-theme="dark"] .shell::before { background: radial-gradient(ellipse 600px 600px at 10% 20%, rgba(108,92,231,0.18), transparent), radial-gradient(ellipse 500px 500px at 90% 70%, rgba(253,203,110,0.08), transparent), radial-gradient(ellipse 400px 400px at 50% 50%, rgba(0,184,148,0.06), transparent); }
[data-theme="yono"] .shell::before { background: linear-gradient(180deg, rgba(106,27,154,0.03) 0%, rgba(199,75,139,0.02) 50%, transparent 100%); }
[data-theme="yono"] .hdr { background: linear-gradient(135deg, #6a1b9a, #8e24aa); border-bottom: none; box-shadow: 0 2px 16px rgba(106,27,154,0.25); }
[data-theme="yono"] .hdr-title { color: #ffffff; }
[data-theme="yono"] .hdr-sub { color: rgba(255,255,255,0.75); }
[data-theme="yono"] .hdr-logo { background: linear-gradient(145deg, #5b2d8e, #7b3fa8); box-shadow: 0 4px 16px rgba(91,45,142,0.45); border-radius: 14px; }
[data-theme="yono"] .icon-btn { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.25); color: #ffffff; }
[data-theme="yono"] .icon-btn:active { background: rgba(255,255,255,0.3); }
[data-theme="yono"] .card { backdrop-filter: none; -webkit-backdrop-filter: none; background: #ffffff; border: 1px solid rgba(106,27,154,0.06); box-shadow: 0 2px 10px rgba(106,27,154,0.05); }
[data-theme="yono"] .btn { background: linear-gradient(135deg, #6a1b9a, #8e24aa); box-shadow: 0 4px 16px rgba(106,27,154,0.3); }
[data-theme="yono"] .btn:active { background: linear-gradient(135deg, #4a148c, #6a1b9a); }
[data-theme="yono"] .btn-ghost { border-color: rgba(106,27,154,0.2); color: #6a1b9a; }
[data-theme="yono"] .step-dot.active { background: #6a1b9a; box-shadow: 0 0 0 4px rgba(106,27,154,0.15); }
[data-theme="yono"] .step-dot.done { background: #c74b8b; }
[data-theme="yono"] .step-line.done { background: #c74b8b; }
[data-theme="yono"] .fab { background: linear-gradient(135deg, #6a1b9a, #c74b8b); box-shadow: 0 6px 24px rgba(106,27,154,0.35); }
[data-theme="yono"] .filter-chip.active { background: #6a1b9a; color: #fff; border-color: #6a1b9a; }
[data-theme="yono"] .scan-btn { border-color: #6a1b9a; color: #6a1b9a; background: rgba(106,27,154,0.04); }
[data-theme="yono"] .docx-btn { background: linear-gradient(135deg, #6a1b9a, #8e24aa); }
[data-theme="yono"] .fld-i { background: #ffffff; border-color: rgba(106,27,154,0.15); }
[data-theme="yono"] .fld-i:focus { border-color: #6a1b9a; box-shadow: 0 0 0 3px rgba(106,27,154,0.15); }
[data-theme="yono"] .fin-input { background: #ffffff; border-color: rgba(106,27,154,0.12); }
[data-theme="yono"] .fin-input:focus { border-color: #6a1b9a; box-shadow: 0 0 0 3px rgba(106,27,154,0.15); }
[data-theme="yono"] .r-card { background: #ffffff; border: 1px solid rgba(106,27,154,0.05); box-shadow: 0 1px 6px rgba(106,27,154,0.04); }
[data-theme="yono"] .dash-item { background: #ffffff; border: 1px solid rgba(106,27,154,0.05); }
[data-theme="yono"] .auto-pill { background: rgba(106,27,154,0.06); border-color: rgba(106,27,154,0.12); }
[data-theme="yono"] .auto-pill-val { color: #6a1b9a; }
[data-theme="yono"] .chk-box.on { background: #6a1b9a; border-color: #6a1b9a; }
[data-theme="yono"] .disabled-hint { background: rgba(106,27,154,0.04); border-color: rgba(106,27,154,0.1); color: #4a2d6e; }
[data-theme="yono"] .dash-score { font-weight: 800; }
[data-theme="yono"] .search-i { background: #ffffff; border-color: rgba(106,27,154,0.12); }
[data-theme="yono"] .toast { background: #6a1b9a; }

/* Header — frosted glass */
.hdr { position: sticky; top: 0; z-index: 50; background: var(--header-bg); backdrop-filter: var(--blur) var(--sat); -webkit-backdrop-filter: var(--blur) var(--sat); border-bottom: 1px solid var(--card-border); padding: 12px 16px; }
.hdr-row { display: flex; align-items: center; justify-content: space-between; }
.hdr-brand { display: flex; align-items: center; gap: 10px; }
.hdr-logo { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 800; flex-shrink: 0; box-shadow: 0 4px 16px rgba(108,92,231,0.3); }
.hdr-title { font-size: 15px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; line-height: 1.2; }
.hdr-sub { font-size: 10px; color: var(--accent); font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; }
.hdr-actions { display: flex; gap: 6px; align-items: center; }
.icon-btn { width: 38px; height: 38px; border-radius: 12px; border: 1px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; transition: all .2s; color: var(--text2); }
.icon-btn:active { transform: scale(0.94); background: var(--accent-light); }

/* Page */
.page { padding: 14px 16px 100px; animation: fadeIn .3s ease; position: relative; z-index: 1; }

/* Glass Cards */
.card { background: var(--card); backdrop-filter: var(--blur) var(--sat); -webkit-backdrop-filter: var(--blur) var(--sat); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 18px 16px; margin-bottom: 12px; box-shadow: 0 8px 32px rgba(80,60,120,0.07); animation: slideUp .45s ease both; }
.card:nth-child(2) { animation-delay: .05s; } .card:nth-child(3) { animation-delay: .1s; } .card:nth-child(4) { animation-delay: .15s; } .card:nth-child(5) { animation-delay: .2s; }
.card-t { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.card-icon { font-size: 16px; width: 34px; height: 34px; background: var(--accent-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-label { font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }

/* Fields */
.fld { margin-bottom: 12px; }
.fld-l { font-size: 10.5px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 5px; display: flex; align-items: center; gap: 4px; }
.fld-req { color: var(--red); font-size: 9px; }
.fld-i { width: 100%; padding: 12px 14px; border-radius: var(--radius-sm); border: 1.5px solid var(--input-border); background: var(--input-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: var(--text); font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 600; outline: none; transition: all .25s; min-height: 46px; }
.fld-i:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--input-focus), 0 4px 16px rgba(108,92,231,0.06); }
.fld-i::placeholder { color: var(--text3); font-weight: 400; }
.fld-i.err { border-color: var(--red); box-shadow: 0 0 0 3px rgba(220,38,38,0.08); }
.fld-i:disabled { opacity: 0.35; cursor: not-allowed; background: rgba(0,0,0,0.02); border-style: dashed; }
[data-theme="dark"] .fld-i:disabled { background: rgba(255,255,255,0.02); }
.fld-na { font-size: 8px; background: var(--accent-light); color: var(--text3); padding: 1px 6px; border-radius: 4px; font-weight: 600; letter-spacing: .3px; }
select.fld-i { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236c5ce7' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }
textarea.fld-i { resize: vertical; min-height: 68px; line-height: 1.5; font-size: 14px; }
.fld-err { font-size: 10px; color: var(--red); font-weight: 600; margin-top: 3px; }
.row { display: flex; gap: 10px; } .row > * { flex: 1; min-width: 0; }

/* Section Dividers */
.section-div { display: flex; align-items: center; gap: 10px; margin: 14px 0 8px; }
.section-div-line { flex: 1; height: 1px; background: var(--card-border); }
.section-div-text { font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1.2px; }
.disabled-hint { font-size: 11px; color: var(--text3); font-style: italic; padding: 8px 12px; background: var(--accent-light); border-radius: 10px; margin-top: 6px; line-height: 1.5; }

/* Progress Stepper */
.stepper { display: flex; align-items: center; padding: 14px 16px 6px; gap: 4px; position: relative; z-index: 1; }
.step-dot { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; border: 2px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); color: var(--text3); transition: all .3s; flex-shrink: 0; cursor: pointer; }
.step-dot.active { border-color: var(--accent); background: var(--accent); color: #fff; transform: scale(1.15); box-shadow: 0 4px 20px rgba(108,92,231,0.35); }
.step-dot.done { border-color: var(--green); background: var(--green-bg); color: var(--green); }
.step-line { flex: 1; height: 2px; background: var(--card-border); border-radius: 1px; transition: background .3s; }
.step-line.done { background: var(--green); }
.step-title { text-align: center; padding: 4px 16px 0; font-size: 13px; font-weight: 700; color: var(--text); }
.step-pct { text-align: center; padding: 2px 16px 6px; font-size: 11px; font-weight: 600; }

/* Buttons */
.btn { width: 100%; padding: 15px; border-radius: var(--radius-sm); border: none; background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: #fff; font-size: 15px; font-weight: 800; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; box-shadow: 0 6px 20px rgba(108,92,231,0.3); }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.5; cursor: default; transform: none; }
.btn-ghost { width: 100%; padding: 13px; border-radius: var(--radius-sm); border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); color: var(--text); font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; }
.btn-ghost:active { background: var(--accent-light); }
.btn-danger { width: 100%; padding: 13px; border-radius: var(--radius-sm); border: 1.5px solid rgba(220,38,38,0.15); background: var(--red-bg); color: var(--red); font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; }
.btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 8px 16px; border-radius: 10px; border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); color: var(--text2); font-size: 12px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; }
.btn-sm:active { transform: scale(0.95); background: var(--accent-light); }
.dash-action-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 12px 4px; border-radius: 12px; border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); color: var(--text2); font-size: 11px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .15s; box-shadow: 0 4px 12px rgba(80,60,120,0.04); }
.dash-action-btn:active { transform: scale(0.95); background: var(--accent-light); }
.dash-action-icon { font-size: 22px; line-height: 1; }
.nav-row { display: flex; gap: 10px; padding: 16px; position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; background: var(--header-bg); backdrop-filter: var(--blur) var(--sat); -webkit-backdrop-filter: var(--blur) var(--sat); border-top: 1px solid var(--card-border); z-index: 50; }
.nav-row > * { flex: 1; }

/* Ratio Cards */
.r-card { background: var(--card); backdrop-filter: var(--blur) var(--sat); -webkit-backdrop-filter: var(--blur) var(--sat); border: 1px solid var(--card-border); border-radius: var(--radius); padding: 16px; margin-bottom: 10px; box-shadow: 0 8px 32px rgba(80,60,120,0.07); animation: popIn .4s ease both; }
.r-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.3px; }
.r-val { font-size: 30px; font-weight: 800; color: var(--text); line-height: 1; margin: 4px 0 2px; letter-spacing: -1px; }
.r-sfx { font-size: 14px; font-weight: 600; color: var(--accent); }
.comm { background: var(--accent-light); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 12px 14px; margin-top: 12px; font-size: 12.5px; line-height: 1.7; color: var(--text2); border-left: 3px solid var(--accent); }
.comm-m { color: var(--accent); font-weight: 700; font-size: 11.5px; margin-top: 8px; }

/* Summary Pills */
.s-row { display: flex; gap: 8px; }
.s-pill { flex: 1; text-align: center; padding: 14px 8px; border-radius: var(--radius-sm); border: 1px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); }
.s-num { font-size: 26px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
.s-lab { font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; }

/* Write-up */
.wu-b { background: var(--input-bg); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 16px; font-size: 13px; line-height: 1.85; color: var(--text); white-space: pre-wrap; word-wrap: break-word; }

/* Dashboard */
.dash-stat { display: flex; gap: 10px; margin-bottom: 14px; }
.dash-stat > div { flex: 1; padding: 16px 12px; border-radius: var(--radius); background: var(--card); backdrop-filter: var(--blur) var(--sat); -webkit-backdrop-filter: var(--blur) var(--sat); border: 1px solid var(--card-border); box-shadow: 0 8px 32px rgba(80,60,120,0.07); text-align: center; }
.dash-stat-n { font-size: 24px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
.dash-stat-l { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
.dash-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-sm); background: var(--card); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); border: 1px solid var(--card-border); margin-bottom: 8px; cursor: pointer; transition: all .2s; box-shadow: 0 8px 32px rgba(80,60,120,0.07); }
.dash-item:active { transform: scale(0.98); background: var(--accent-light); }
.dash-item-avatar { width: 42px; height: 42px; border-radius: 12px; background: linear-gradient(135deg, var(--accent-light), var(--accent-mid)); display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: var(--accent); flex-shrink: 0; }
.dash-item-info { flex: 1; min-width: 0; }
.dash-item-name { font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dash-item-meta { font-size: 11px; color: var(--text3); font-weight: 500; margin-top: 2px; }
.dash-score { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; flex-shrink: 0; }
.empty-state { text-align: center; padding: 48px 24px; }
.fab { position: fixed; bottom: 24px; right: calc(50% - 216px); width: 56px; height: 56px; border-radius: 16px; border: none; background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: #fff; font-size: 26px; cursor: pointer; box-shadow: 0 8px 32px rgba(108,92,231,0.4); display: flex; align-items: center; justify-content: center; z-index: 60; transition: all .2s; }
.fab:active { transform: scale(0.88); }
@media(max-width:480px){ .fab { right: 20px; } }

/* Accordion */
.acc { border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 8px; border: 1px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); }
.acc-h { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; cursor: pointer; user-select: none; transition: background .15s; }
.acc-h:active { background: var(--accent-light); }
.acc-h span:first-child { font-size: 13px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
.acc-arrow { font-size: 11px; color: var(--text3); transition: transform .3s; }
.acc-arrow.open { transform: rotate(180deg); }
.acc-body { padding: 14px 16px; border-top: 1px solid var(--card-border); }

/* Toast */
.toast { position: fixed; top: 70px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #00b894, #00cec9); color: #fff; padding: 10px 22px; border-radius: 24px; font-size: 13px; font-weight: 700; z-index: 200; animation: popIn .25s ease; pointer-events: none; box-shadow: 0 6px 24px rgba(0,184,148,0.3); }

/* Search & Filter */
.search-wrap { position: relative; margin-bottom: 12px; }
.search-i { width: 100%; padding: 12px 14px 12px 40px; border-radius: var(--radius-sm); border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); color: var(--text); font-size: 14px; font-family: 'DM Sans', sans-serif; font-weight: 600; outline: none; }
.search-i:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--input-focus); }
.search-i::placeholder { color: var(--text3); font-weight: 400; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--text3); pointer-events: none; }
.filter-row { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.filter-chip { padding: 6px 14px; border-radius: 20px; border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); font-size: 11px; font-weight: 700; color: var(--text3); cursor: pointer; transition: all .2s; font-family: 'DM Sans', sans-serif; }
.filter-chip.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }

/* Checkbox */
.chk-row { display: flex; align-items: center; gap: 10px; padding: 10px 0; cursor: pointer; user-select: none; }
.chk-box { width: 22px; height: 22px; border-radius: 6px; border: 2px solid var(--input-border); background: var(--input-bg); display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all .2s; flex-shrink: 0; }
.chk-box.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.chk-label { font-size: 13px; font-weight: 500; color: var(--text); line-height: 1.4; }

/* Cross-verify warnings */
.xv-warn { padding: 10px 12px; border-radius: var(--radius-sm); margin-bottom: 6px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px; animation: popIn .3s ease; }
.xv-warn.amber { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(225,112,85,0.2); }
.xv-warn.red { background: var(--red-bg); color: var(--red); border: 1px solid rgba(214,48,49,0.2); }

/* Risk badge */
.risk-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: .3px; }
.risk-grade { font-size: 18px; font-weight: 800; }

/* Two-column financial */
.fin-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 8px; align-items: center; margin-bottom: 8px; }
.fin-label { font-size: 12px; color: var(--text2); font-weight: 700; line-height: 1.3; }
.fin-head { font-size: 10px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .5px; text-align: center; }
.fin-input { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid var(--input-border); background: var(--input-bg); backdrop-filter: blur(6px); color: var(--text); font-size: 15px; font-family: 'DM Sans', sans-serif; font-weight: 700; outline: none; text-align: right; min-height: 46px; }
.fin-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--input-focus); }
.fin-input::placeholder { color: var(--text3); font-weight: 400; font-size: 13px; }
.fin-change { font-size: 9px; font-weight: 700; text-align: center; padding: 2px 0; }
.fin-change.up { color: var(--green); }
.fin-change.down { color: var(--red); }

/* Auto-calc pill */
.auto-pill { background: linear-gradient(135deg, var(--accent-light), var(--accent-mid)); border: 1px solid var(--accent-mid); border-radius: var(--radius-sm); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; margin-bottom: 4px; }
.auto-pill-label { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: .5px; }
.auto-pill-val { font-size: 18px; font-weight: 800; color: var(--text); }


/* Turnover Chart */
.chart-wrap { padding: 12px 0; }
.chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding: 0 4px; }
.chart-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.chart-bar { width: 100%; border-radius: 8px 8px 0 0; min-height: 4px; transition: height .5s ease; }
.chart-bar-val { font-size: 10px; font-weight: 800; color: var(--text); }
.chart-bar-label { font-size: 8px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: .3px; text-align: center; line-height: 1.2; }
.chart-baseline { height: 2px; background: var(--card-border); margin: 0 4px; border-radius: 1px; }

/* Comparison View */
.cmp-sel { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.cmp-chip { padding: 6px 12px; border-radius: 10px; border: 1.5px solid var(--card-border); background: var(--card); backdrop-filter: var(--blur); font-size: 11px; font-weight: 600; color: var(--text3); cursor: pointer; transition: all .2s; font-family: 'DM Sans', sans-serif; }
.cmp-chip.sel { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
.cmp-grid { display: grid; gap: 6px; }
.cmp-row { display: grid; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--card-border); }
.cmp-head { font-size: 9px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .5px; text-align: center; }
.cmp-label { font-size: 11px; font-weight: 600; color: var(--text2); }
.cmp-val { font-size: 12px; font-weight: 800; color: var(--text); text-align: center; }

/* Template */
.tpl-item { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: var(--radius-sm); background: var(--card); backdrop-filter: var(--blur); border: 1px solid var(--card-border); margin-bottom: 8px; cursor: pointer; transition: all .15s; }
.tpl-item:active { transform: scale(0.98); background: var(--accent-light); }
.tpl-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--accent-light), var(--accent-mid)); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }

/* DOCX button */
.docx-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border-radius: var(--radius-sm); border: none; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; font-size: 14px; font-weight: 800; font-family: 'DM Sans', sans-serif; cursor: pointer; box-shadow: 0 6px 20px rgba(37,99,235,0.3); transition: all .2s; margin-top: 8px; }
.docx-btn:active { transform: scale(0.97); }

/* Scanner */
.scan-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border-radius: var(--radius-sm); border: 2px dashed var(--accent); background: var(--accent-light); color: var(--accent); font-size: 14px; font-weight: 700; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all .2s; margin-bottom: 12px; }
.scan-btn:active { transform: scale(0.97); background: var(--accent-mid); }
.scan-btn:disabled { opacity: 0.4; cursor: default; }
.scan-preview { width: 100%; max-height: 200px; object-fit: contain; border-radius: var(--radius-sm); border: 1px solid var(--card-border); margin: 8px 0; }
.scan-status { text-align: center; padding: 12px; font-size: 12px; font-weight: 600; color: var(--accent); }
.scan-status.err { color: var(--red); }
@keyframes scanning { 0%{opacity:.6} 50%{opacity:1} 100%{opacity:.6} }

/* Duplicate button */
.dash-dup { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--card-border); background: var(--card); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; flex-shrink: 0; transition: all .15s; }
.dash-dup:active { transform: scale(0.9); background: var(--accent-light); }

/* ═══════════ DESKTOP RESPONSIVE ═══════════ */
@media(min-width:768px){
  .shell { max-width: 1100px; }
  .page { padding: 20px 24px 100px; }
  .hdr { padding: 12px 24px; }
  .stepper { padding: 14px 24px 6px; }
  .nav-row { max-width: 1100px; padding: 16px 24px; }
  .fab { right: calc(50% - 526px); }

  /* Grid layouts for cards */
  .dk-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dk-grid-2 > .card { margin-bottom: 0; }

  /* Dashboard: 2-col items */
  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .dash-grid > .dash-item { margin-bottom: 0; }

  /* Dashboard stats: 4 cols */
  .dash-stat { gap: 12px; }
  .dash-stat > div { padding: 20px 16px; }

  /* Ratio cards: 2-col */
  .ratio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ratio-grid > .r-card { margin-bottom: 0; }

  /* Report sections: 2-col */
  .report-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .report-sections > div { margin-bottom: 0; }
  .report-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .report-bottom > .card { margin-bottom: 0; }

  /* Checklist: 2-col */
  .chk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }

  /* Wider cards get more breathing room */
  .card { padding: 22px 20px; }
  .r-card { padding: 18px 20px; }
  .fld-i { font-size: 15px; }
  .fin-input { font-size: 15px; }

  /* Buttons: hover effects for desktop */
  .btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(108,92,231,0.35); }
  .btn-ghost:hover { background: var(--accent-light); }
  .btn-sm:hover { background: var(--accent-light); }
  .dash-action-btn:hover { background: var(--accent-light); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(80,60,120,0.08); }
  .icon-btn:hover { background: var(--accent-light); }
  .dash-item:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(80,60,120,0.12); }
  .dash-dup:hover { background: var(--accent-light); }
  .filter-chip:hover { border-color: var(--accent); color: var(--accent); }
  .acc-h:hover { background: var(--accent-light); }
  .tpl-item:hover { transform: translateY(-1px); background: var(--accent-light); }
  .scan-btn:hover { background: var(--accent-mid); }
  .docx-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(37,99,235,0.35); }
}

@media(min-width:1024px){
  .shell { max-width: 1200px; }
  .fab { right: calc(50% - 576px); }
  .nav-row { max-width: 1200px; }
}
`;

/* ═══════════ REUSABLE COMPONENTS ═══════════ */
function In({label,value,onChange,type="text",placeholder,options,textarea:ta,required,error,disabled}){
  return(<div className="fld"><label className="fld-l">{label}{required&&<span className="fld-req">●</span>}{disabled&&<span className="fld-na">N/A</span>}</label>
    {options?<select className={`fld-i${error?" err":""}`} value={value||""} onChange={e=>onChange(e.target.value)} disabled={disabled}><option value="">Select...</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>
    :ta?<textarea className={`fld-i${error?" err":""}`} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} disabled={disabled}/>
    :<input className={`fld-i${error?" err":""}`} type={type} value={value??""} onChange={e=>{if(type==="number")onChange(e.target.value===""?"":parseFloat(e.target.value));else onChange(e.target.value);}} placeholder={placeholder} inputMode={type==="number"?"decimal":undefined} disabled={disabled}/>}
    {error&&<div className="fld-err">{error}</div>}
  </div>);
}
function Card({icon,title,children}){return(<div className="card"><div className="card-t"><div className="card-icon">{icon}</div><div className="card-label">{title}</div></div>{children}</div>);}
function Accordion({icon,title,children,open,toggle}){
  return(<div className="acc"><div className="acc-h" onClick={toggle}><span>{icon} {title}</span><span className={`acc-arrow${open?" open":""}`}>▼</span></div>{open&&<div className="acc-body">{children}</div>}</div>);
}
function SectionDiv({text}){return(<div className="section-div"><div className="section-div-line"/><span className="section-div-text">{text}</span><div className="section-div-line"/></div>);}

/* ═══════════ STEP 0: ENTITY (hides N/A fields) ═══════════ */
function StepEntity({d,s}){
  const u=k=>v=>s(p=>({...p,[k]:v}));
  const gstErr=d.gst&&!validateGST(d.gst)?"Format: 22AAAAA0000A1Z5":null;
  const isProp=d.constitution==="PROPRIETORSHIP";
  const isPartnership=d.constitution==="PARTNERSHIP";
  const isCompany=d.constitution==="PVT LTD"||d.constitution==="LLP";
  const isOwned=d.premises==="OWNED"||d.premises==="FAMILY OWNED";
  const isRented=d.premises==="RENTED"||d.premises==="LEASED";
  const hasGst=d.gstAvailable!=="NO";
  const isCgtmse=d.cgtmse==="YES";
  return(<div className="page">
    <Card icon="🏛️" title="Loan Scheme">
      <div className="chk-row" onClick={()=>{const next=d.isMudra==="YES"?"NO":"YES";u("isMudra")(next);if(next==="YES")u("cgtmse")("YES");}}>
        <div className={`chk-box${d.isMudra==="YES"?" on":""}`}>{d.isMudra==="YES"?"✓":""}</div>
        <div className="chk-label">This loan is under <strong>PMMY (Mudra) Scheme</strong></div>
      </div>
      {d.isMudra==="YES"&&<>
        <div className="disabled-hint" style={{background:"linear-gradient(135deg,rgba(108,92,231,0.08),rgba(162,155,254,0.1))",color:"var(--accent)",fontStyle:"normal",fontWeight:600}}>📋 Mudra Q&A write-up will be auto-generated from your entity & proposal data. CGFMU coverage has been auto-enabled.</div>
      </>}
    </Card>

    <div className="dk-grid-2">    <Card icon="🏢" title="Entity & Promoters">
      <In label="Enterprise Name" value={d.name} onChange={u("name")} placeholder="M/S ABC PVT LTD" required/>
      <div className="row"><In label="Constitution" value={d.constitution} onChange={u("constitution")} options={O.co} required/><In label="New / Existing" value={d.newExisting} onChange={u("newExisting")} options={O.ne}/></div>
      {isProp?(<>
        <In label="Proprietor Name" value={d.partners} onChange={u("partners")} placeholder="Shri / Smt ..." required/>
        <In label="Father / Spouse Name (S/o, D/o, W/o)" value={d.proprietorFather} onChange={u("proprietorFather")} placeholder="e.g., S/o Shri Ram Kumar"/>
      </>):(<>
        <In label={isCompany?"Directors / Promoters":"Current Partners"} value={d.partners} onChange={u("partners")} placeholder={isCompany?"Director names":"Partner name(s)"} required/>
        <In label="Previous Partners" value={d.prevPartners} onChange={u("prevPartners")} placeholder="If changed (leave blank if same)"/>
      </>)}
      <div className="row">
        <In label="Experience (yrs)" value={d.experience} onChange={u("experience")} type="number" placeholder="0" required/>
        {isPartnership&&<In label="Partnership Deed Date" value={d.partnershipDeedDate} onChange={u("partnershipDeedDate")} type="date"/>}
        {isCompany&&<In label="Board Resolution Date" value={d.boardResDate} onChange={u("boardResDate")} type="date"/>}
      </div>
      {isCompany&&<div className="row"><In label="Authorized Cap (₹L)" value={d.authorizedCap} onChange={u("authorizedCap")} type="number"/><In label="Paid-Up Cap (₹L)" value={d.paidUpCap} onChange={u("paidUpCap")} type="number"/></div>}
    </Card>
    <Card icon="📍" title="Registration & Premises">
      <div style={{marginBottom:12}}>
        <label className="fld-l">UDYAM Registration No. <span className="fld-req">●</span></label>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{padding:"10px 12px",borderRadius:10,background:"var(--accent-light)",fontSize:13,fontWeight:800,color:"var(--accent)",whiteSpace:"nowrap",flexShrink:0}}>UDYAM</div>
          <select className="fld-i" style={{flex:"0 0 72px",padding:"10px 8px",fontSize:13}} value={d.udyamState||""} onChange={e=>u("udyamState")(e.target.value)}>
            <option value="">State</option>
            {["AN","AP","AR","AS","BR","CG","CH","DD","DL","GA","GJ","HP","HR","JH","JK","KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL","OD","PB","PY","RJ","SK","TN","TS","TR","UK","UP","WB"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <input className="fld-i" style={{flex:"0 0 52px",padding:"10px 8px",textAlign:"center",fontSize:13}} type="text" maxLength={2} value={d.udyamDist||""} onChange={e=>u("udyamDist")(e.target.value.replace(/\D/g,"").slice(0,2))} placeholder="00"/>
          <input className="fld-i" style={{flex:1,padding:"10px 8px",textAlign:"center",fontSize:13}} type="text" maxLength={7} value={d.udyamNum||""} onChange={e=>u("udyamNum")(e.target.value.replace(/\D/g,"").slice(0,7))} placeholder="0000000"/>
        </div>
        <div style={{fontSize:10,color:"var(--text3)",marginTop:3}}>Combined: UDYAM-{d.udyamState||"XX"}-{d.udyamDist||"00"}-{d.udyamNum||"0000000"}</div>
      </div>
      <div className="row">
        <In label="GST Registered?" value={d.gstAvailable} onChange={u("gstAvailable")} options={O.yn}/>
        {hasGst&&<In label="GST No." value={d.gst} onChange={u("gst")} placeholder="22AAAAA0000A1Z5" error={gstErr} required/>}
      </div>
      <div className="row">
        <In label="Premises" value={d.premises} onChange={u("premises")} options={O.pr} required/>
        {isRented&&<In label="Lease Expiry" value={d.leaseExpiry} onChange={u("leaseExpiry")} type="date"/>}
      </div>
      {isRented&&<div className="row"><In label="Monthly Rent (₹)" value={d.premisesRent} onChange={u("premisesRent")} type="number"/><In label="Lessor Name" value={d.lessorName} onChange={u("lessorName")} placeholder="Landlord name"/></div>}
      <In label="Address" value={d.address} onChange={u("address")} placeholder="Full business address" required/>
      <div className="row"><In label="Commenced" value={d.commenced} onChange={u("commenced")} type="date" required/><In label="Activity Type" value={d.tradingType} onChange={u("tradingType")} options={O.tr} required/></div>
    </Card>
    </div>
    <div className="dk-grid-2">
    <Card icon="🔗" title="Supply Chain">
      <In label="Activity" value={d.activity} onChange={u("activity")} placeholder="e.g., Manufacture of steel pipes" required/>
      <In label="Catering To" value={d.cateringTo} onChange={u("cateringTo")} textarea placeholder="Describe target market..."/>
      <In label={d.tradingType==="WHOLESALE"||d.tradingType==="RETAIL"||d.tradingType==="WHOLESALE & RETAIL"?"Items Traded":"Raw Materials"} value={d.rawMaterials} onChange={u("rawMaterials")} placeholder={d.tradingType==="WHOLESALE"||d.tradingType==="RETAIL"||d.tradingType==="WHOLESALE & RETAIL"?"e.g., Garments, Electronics, FMCG goods":"e.g., MS Pipes, SS Coils"}/>
      <div className="row"><In label="Suppliers" value={d.suppliers} onChange={u("suppliers")} placeholder="Key suppliers"/><In label="Buyers" value={d.buyers} onChange={u("buyers")} placeholder="Key buyers"/></div>
    </Card>
    <Card icon="🔒" title="Collateral & Security">
      <div className="chk-row" onClick={()=>u("cgtmse")(d.cgtmse==="YES"?"NO":"YES")}>
        <div className={`chk-box${isCgtmse?" on":""}`}>{isCgtmse?"✓":""}</div>
        <div className="chk-label">Loan covered under <strong>CGTMSE / CGFMU</strong> — collateral not required</div>
      </div>
      <In label="Primary Security" value={d.primarySecurity} onChange={u("primarySecurity")} textarea placeholder="e.g., Hypothecation of stock & book debts..."/>
      {!isCgtmse&&<>
        <In label="Collateral Security" value={d.collateralSecurity} onChange={u("collateralSecurity")} textarea placeholder="e.g., Equitable mortgage of property..."/>
        <div className="row"><In label="Valuation (₹L)" value={d.collateralValue} onChange={u("collateralValue")} type="number"/><In label="Valuation Date" value={d.collateralDate} onChange={u("collateralDate")} type="date"/></div>
        <In label="Valuer Name" value={d.valuerName} onChange={u("valuerName")} placeholder="Approved valuer"/>
      </>}
      <div className="row"><In label="Insurance (₹L)" value={d.insuranceCoverage} onChange={u("insuranceCoverage")} type="number"/><In label="Insurance Valid Till" value={d.insuranceValidity} onChange={u("insuranceValidity")} type="date"/></div>
    </Card>
    </div>
  </div>);
}

/* ═══════════ STEP 1: PROPOSAL (hides N/A fields) ═══════════ */
function TurnoverChart({d,fy,sett}){
  const noGst=d.gstAvailable==="NO";
  const hasGstVal=!noGst&&d.gst2526&&+d.gst2526>0;
  const hasCrSumm=d.crSumm2526&&+d.crSumm2526>0;
  const src=hasGstVal?+d.gst2526:(hasCrSumm?+d.crSumm2526:0);
  const autoAnn=src&&sett.fy.months>0?Math.round((src/sett.fy.months)*12*100)/100:0;
  const annVal=d.annualisedSales?+d.annualisedSales:autoAnn;
  const vals=[{label:"Cr Summ\n"+fy.prev,v:+d.crSumm2425||0,color:"#a29bfe"},{label:"Cr Summ\n"+fy.curr,v:+d.crSumm2526||0,color:"#6c5ce7"},{label:"Annualised\nSales",v:annVal,color:"#00b894"},{label:"GST\n"+fy.prev,v:+d.gst2425||0,color:"#fdcb6e"},{label:"GST\n"+fy.curr,v:+d.gst2526||0,color:"#e17055"},{label:"ITR\n"+fy.prev,v:+d.itrSales||0,color:"#74b9ff"}];
  const max=Math.max(...vals.map(x=>x.v),1);
  if(vals.every(x=>x.v===0))return null;
  return(<div className="chart-wrap"><div className="chart-bars">{vals.map((b,i)=>(<div key={i} className="chart-bar-col"><div className="chart-bar-val">{b.v>0?"₹"+b.v+"L":""}</div><div className="chart-bar" style={{height:Math.max(4,b.v/max*100)+"%",background:b.color,opacity:b.v>0?1:0.2}}/><div className="chart-bar-label">{b.label}</div></div>))}</div><div className="chart-baseline"/></div>);
}
function StepProposal({d,s,sett}){
  const u=k=>v=>s(p=>({...p,[k]:v}));const fy=sett.fy;
  const cicErr=d.cicScore&&!validateCIC(d.cicScore)?"Must be 300–900":null;
  const isFresh=d.proposal==="FRESH";
  const isEnhance=d.proposal==="ENHANCEMENT";
  const isReduce=d.proposal==="REDUCTION";
  const isTakeover=d.proposal==="TAKEOVER";
  const isNew=d.newExisting==="NEW";
  const noHistory=isFresh||isNew;
  const noGst=d.gstAvailable==="NO";
  return(<div className="page">
    <div className="dk-grid-2">
    <Card icon="💳" title="Account Conduct">
      <In label="Proposal Type" value={d.proposal} onChange={u("proposal")} options={O.po} required/>

      {/* Existing Facility — only for non-fresh */}
      {!isFresh&&<>
        <SectionDiv text="Existing Facility"/>
        <div className="row"><In label="Current CC (₹L)" value={d.currentCC} onChange={u("currentCC")} type="number" placeholder="0 (leave blank if TL only)"/><In label="Term Loan Exp (₹L)" value={d.termLoan} onChange={u("termLoan")} type="number" placeholder="0"/></div>
        {isEnhance&&<In label="Enhanced CC (₹L)" value={d.enhancedCC} onChange={u("enhancedCC")} type="number" placeholder="0" required/>}
        {isReduce&&<In label="Reduced CC (₹L)" value={d.reducedCC} onChange={u("reducedCC")} type="number" placeholder="0" required/>}
      </>}

      {/* Fresh Proposal — only for fresh */}
      {isFresh&&<>
        <SectionDiv text="Fresh Proposal"/>
        <div className="row"><In label="Fresh CC (₹L)" value={d.freshCC} onChange={u("freshCC")} type="number" placeholder="Leave blank if TL only"/><In label="Fresh TL (₹L)" value={d.freshTL} onChange={u("freshTL")} type="number" placeholder="Leave blank if CC only"/></div>
        {!d.freshCC&&!d.freshTL&&<div className="disabled-hint" style={{background:"var(--amber-bg)",color:"var(--amber)"}}>⚠ Enter at least one — Fresh CC or Fresh TL amount.</div>}
        {d.freshTL&&<>
          <In label="Purpose of TL" value={d.tlPurpose} onChange={u("tlPurpose")} placeholder="e.g., Purchase of truck"/>
          <div className="row"><In label="Project Cost (₹L)" value={d.projectCost} onChange={u("projectCost")} type="number"/><In label="Promoter Contrib (₹L)" value={d.promoterContrib} onChange={u("promoterContrib")} type="number"/></div>
          <div className="row"><In label="TL Repay (Months)" value={d.tlRepayMonths} onChange={u("tlRepayMonths")} type="number"/><In label="Moratorium (Months)" value={d.tlMoratorium} onChange={u("tlMoratorium")} type="number"/></div>
        </>}
        <In label="Existing Banker (for fresh)" value={d.existingBanker} onChange={u("existingBanker")} placeholder="e.g., PNB, Paonta Sahib"/>
      </>}

      {/* Takeover — only for takeover proposals */}
      {isTakeover&&<>
        <SectionDiv text="Takeover Details"/>
        <In label="Takeover From (Bank)" value={d.takeoverBank} onChange={u("takeoverBank")} placeholder="e.g., Punjab National Bank" required/>
        <div className="row"><In label="Outstanding (₹L)" value={d.takeoverOutstanding} onChange={u("takeoverOutstanding")} type="number"/><In label="NOC Status" value={d.takeoverNOC} onChange={u("takeoverNOC")} options={["Obtained","Pending","Not Required"]}/></div>
        <In label="Reason for Takeover" value={d.takeoverReason} onChange={u("takeoverReason")} textarea placeholder="e.g., Better terms, proximity, existing relationship..."/>
      </>}

      {/* Conduct — CIC always, rest only for existing accounts */}
      <SectionDiv text="Conduct Assessment"/>
      <div className="row">
        <In label="CIC Score" value={d.cicScore} onChange={u("cicScore")} type="number" placeholder="300–900" required error={cicErr}/>
        {!noHistory&&<In label="Sales Routing" value={d.salesRouting} onChange={u("salesRouting")} options={O.ro} required/>}
      </div>
      {!noHistory&&<div className="row"><In label="Interest Regular?" value={d.interestRegular} onChange={u("interestRegular")} options={O.yn} required/><In label="Match GST/ITR?" value={d.matchGstItr} onChange={u("matchGstItr")} options={O.yn}/></div>}
      <In label="Overall Conduct" value={d.overallConduct} onChange={u("overallConduct")} options={O.cd} required/>

      {/* Banking History — only for existing accounts */}
      {!noHistory&&<>
        <SectionDiv text="Banking History"/>
        <div className="row"><In label="Account Since" value={d.accountSince} onChange={u("accountSince")} type="date"/><In label="NPA History?" value={d.npaHistory} onChange={u("npaHistory")} options={O.yn}/></div>
        <In label="Irregularities (if any)" value={d.irregularities} onChange={u("irregularities")} placeholder="Describe if any..."/>
      </>}
    </Card>
    <Card icon="📊" title="Turnover & Summations">
      {/* Always show both prev and curr year credit summations */}
      <div className="row">
        <In label={`Cr Summ ${fy.prev} (₹L)`} value={d.crSumm2425} onChange={u("crSumm2425")} type="number"/>
        <In label={`Cr Summ ${fy.curr} (₹L)`} value={d.crSumm2526} onChange={u("crSumm2526")} type="number" required/>
      </div>
      {!noGst&&<div className="row">
        <In label={`GST ${fy.prev} (₹L)`} value={d.gst2425} onChange={u("gst2425")} type="number"/>
        <In label={`GST ${fy.curr} (₹L)`} value={d.gst2526} onChange={u("gst2526")} type="number"/>
      </div>}
      <In label={`ITR Sales ${fy.prev} (₹L)`} value={d.itrSales} onChange={u("itrSales")} type="number"/>
      {/* Auto-annualised: prefer GST curr year if available, else credit summations */}
      {(()=>{
        const hasGstVal=!noGst&&d.gst2526&&+d.gst2526>0;
        const hasCrSumm=d.crSumm2526&&+d.crSumm2526>0;
        const src=hasGstVal?+d.gst2526:(hasCrSumm?+d.crSumm2526:0);
        const srcLabel=hasGstVal?"GST "+fy.curr:(hasCrSumm?"Cr Summ "+fy.curr:"");
        const ann=src&&sett.fy.months>0?Math.round((src/sett.fy.months)*12*100)/100:0;
        const isManual=d.annualisedSales!==""&&d.annualisedSales!==undefined&&d.annualisedSales!==null;
        const displayVal=isManual?+d.annualisedSales:ann;
        const isOverride=isManual&&ann>0&&+d.annualisedSales!==ann;
        // Auto-clear stored override when ALL source data is cleared
        if(ann===0&&isManual&&!hasGstVal&&!hasCrSumm)setTimeout(()=>u("annualisedSales")(""),0);
        if(displayVal<=0)return null;
        return(<div className="auto-pill" style={{cursor:"pointer",position:"relative"}} onClick={()=>{const v=prompt("Override Annualised Sales (₹L):",displayVal);if(v!==null&&v!=="")u("annualisedSales")(parseFloat(v));}}>
          <span className="auto-pill-label">Annualised Sales (₹L) <span style={{fontSize:9,opacity:.7}}>— {isOverride?"manual override":(isManual&&ann===0?"manual":"from "+srcLabel)}</span></span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span className="auto-pill-val">₹ {displayVal.toLocaleString("en-IN")}</span>
            {isOverride&&<button onClick={e=>{e.stopPropagation();u("annualisedSales")("");}} style={{width:28,height:28,borderRadius:8,border:"1.5px solid var(--amber)",background:"var(--amber-bg)",color:"var(--amber)",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'DM Sans',sans-serif",fontWeight:700,padding:0}} title="Reset to auto-derived value">↺</button>}
          </div>
        </div>);
      })()}
      <TurnoverChart d={d} fy={fy} sett={sett}/>
      {(()=>{const w=crossVerify(d,sett);return w.length>0?(<div style={{marginTop:8}}><div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".8px",marginBottom:6}}>⚠ Cross-Verification Flags</div>{w.map((x,i)=><div key={i} className={`xv-warn ${x.severity}`}>⚠ {x.text}</div>)}</div>):null;})()}
    </Card>
    </div>
  </div>);
}
/* ═══════════ FIN ROW — standalone to prevent focus loss ═══════════ */
function FinInput({value,onCommit,placeholder}){
  const[local,setLocal]=useState(value??"");
  const[focused,setFocused]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{if(!focused)setLocal(value??"");},[value,focused]);
  return focused?
    <input ref={ref} className="fin-input" type="number" step="0.01" value={local} onChange={e=>setLocal(e.target.value)} onBlur={()=>{setFocused(false);const v=local;onCommit(v===""?"":parseFloat(v));}} placeholder={placeholder||"—"} inputMode="decimal"/>
    :<input ref={ref} className="fin-input" type="text" readOnly value={value!==""&&value!==undefined&&value!==null&&!isNaN(value)?fmtInd(value):""} onFocus={()=>{setFocused(true);setLocal(value??"");setTimeout(()=>ref.current?.focus(),0);}} placeholder={placeholder||"—"} style={{cursor:"pointer"}}/>;
}
function FinRow({label,currKey,prevKey,fin,u}){
  const c=fin[currKey],p=fin[prevKey];
  let ch=null;
  if(c&&p&&+p!==0){const v=((+c-+p)/Math.abs(+p))*100;ch={v:v.toFixed(1),up:v>=0};}
  return(<div className="fin-grid">
    <div className="fin-label">{label}</div>
    <FinInput value={fin[prevKey]} onCommit={v=>u(prevKey)(v)}/>
    <div style={{position:"relative"}}>
      <FinInput value={fin[currKey]} onCommit={v=>u(currKey)(v)}/>
      {ch&&<div className={`fin-change ${ch.up?"up":"down"}`}>{ch.up?"▲":"▼"} {Math.abs(ch.v)}%</div>}
    </div>
  </div>);
}
/* ═══════════ STEP 2: FINANCIALS (Two-Column Comparison) ═══════════ */
function StepFinancials({fin,sf,calc,sett}){
  const u=k=>v=>sf(p=>({...p,[k]:v}));
  const[scanStatus,setScanStatus]=useState(null);
  const[scanPreview,setScanPreview]=useState(null);
  const[scanTarget,setScanTarget]=useState("both");
  const[rotation,setRotation]=useState(0);
  const[imgBlob,setImgBlob]=useState(null);
  const fileRef=useRef(null);
  const uploadRef=useRef(null);
  const scanning=scanStatus&&!scanStatus.err&&!scanStatus.msg.startsWith("✅");

  const fieldMap=[
    {keys:["closing stock","inventory","stock in trade","stock-in-trade"],field:"avgInv"},
    {keys:["sundry debtors","trade receivable","debtors","receivable"],field:"tradeRecv"},
    {keys:["sundry creditor","trade payable","creditor"],field:"cl_creditors"},
    {keys:["expenses payable","outstanding expense","expense payable"],field:"cl_expenses"},
    {keys:["current assets","total current assets"],field:"ca"},
    {keys:["current liabilit","total current liabilit"],field:"cl"},
    {keys:["fixed asset","total fixed asset","as per annexure"],field:"fixedAssets"},
    {keys:["secured loan","term loan","union bank","bank loan"],field:"ltd"},
    {keys:["capital account","net worth","capital closing","proprietor capital"],field:"tnw"},
    {keys:["opening balance","capital opening"],field:"_capOpening"},
    {keys:["net profit","profit after tax","profit for the year","net profit transferred"],field:"netProfit"},
    {keys:["net sales","revenue","turnover","sales"],field:"netSales"},
    {keys:["interest paid","interest expense","finance cost","interest on loan"],field:"intExp"},
    {keys:["depreciation","dep ","dep."],field:"dep"},
    {keys:["drawing","less drawing","less: drawing"],field:"_drawing"},
    {keys:["cash in hand","cash balance"],field:"_cash"},
    {keys:["bank ","bank a/c","bank sbi","bank balance"],field:"_bank"},
    {keys:["gst credit","gst input","input credit"],field:"_gst"},
    {keys:["tds ","tax deducted"],field:"_tds"},
    {keys:["fdr","fixed deposit"],field:"_fdr"},
    {keys:["loan","advances","loan & advance","hema","dalip"],field:"_loanAdv"},
    {keys:["ebit","operating profit","profit before interest"],field:"ebit"},
  ];
  const matchField=(label)=>{
    const l=label.toLowerCase().trim();
    for(const fm of fieldMap){if(fm.keys.some(k=>l.includes(k)))return fm.field;}
    return null;
  };

  const parseOcrToFields=(ocrText)=>{
    const lines=ocrText.split("\n").filter(l=>l.trim());
    const items=[];
    for(const line of lines){
      const m=line.match(/^[*\-•]?\s*(.+?)[\s:|\-]+?([\d,]+(?:\.\d+)?)\s*(?:[|\s]+?([\d,]+(?:\.\d+)?))?\s*$/);
      if(m){
        const label=m[1].trim();
        const v1=parseFloat(m[2].replace(/,/g,""));
        const v2=m[3]?parseFloat(m[3].replace(/,/g,"")):null;
        const field=matchField(label);
        if(field)items.push({label,field,v1,v2});
      }
    }
    return items;
  };

  const pdfToImage=async(file)=>{
    setScanStatus({msg:"📄 Converting PDF page 1...",err:false});
    if(!window.pdfjsLib){
      await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});
      window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    const data=await file.arrayBuffer();
    const pdf=await window.pdfjsLib.getDocument({data}).promise;
    const page=await pdf.getPage(1);
    const vp=page.getViewport({scale:2});
    const canvas=document.createElement("canvas");canvas.width=vp.width;canvas.height=vp.height;
    await page.render({canvasContext:canvas.getContext("2d"),viewport:vp}).promise;
    return new Promise(res=>canvas.toBlob(res,"image/jpeg",0.85));
  };

  const handleUpload=async(file)=>{
    setRotation(0);
    if(file.type==="application/pdf"){try{const b=await pdfToImage(file);setImgBlob(b);setScanPreview(URL.createObjectURL(b));setScanStatus(null);}catch(e){setScanStatus({msg:"❌ PDF error: "+e.message,err:true});}}
    else{setImgBlob(file);setScanPreview(URL.createObjectURL(file));setScanStatus(null);}
  };
  const handleCamera=(file)=>{setRotation(0);setImgBlob(file);setScanPreview(URL.createObjectURL(file));setScanStatus(null);};

  const rotateImage=async()=>{
    if(!imgBlob)return;
    const newRot=(rotation+90)%360;
    const img=new Image();
    const url=URL.createObjectURL(imgBlob);
    await new Promise(r=>{img.onload=r;img.src=url;});
    const canvas=document.createElement("canvas");
    const swap=newRot===90||newRot===270;
    canvas.width=swap?img.height:img.width;canvas.height=swap?img.width:img.height;
    const ctx=canvas.getContext("2d");
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(newRot*Math.PI/180);
    ctx.drawImage(img,-img.width/2,-img.height/2);
    const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",0.9));
    setRotation(newRot);setImgBlob(blob);setScanPreview(URL.createObjectURL(blob));
    URL.revokeObjectURL(url);
  };

  const doScan=async()=>{
    if(!imgBlob){setScanStatus({msg:"Take a photo or upload a file first.",err:true});return;}
    const hasGroq=!!sett.groqKey;const hasGemini=!!sett.geminiKey;const hasOR=!!sett.openrouterKey;
    const pref=sett.scanProvider||"auto";
    const target=scanTarget;
    if(!hasGroq&&!hasGemini&&!hasOR){setScanStatus({msg:"Add an API key in Settings → AI Scanner.",err:true});return;}

    setScanStatus({msg:"📸 Preparing image...",err:false});
    try{
      let sendBlob=imgBlob;
      // Compress if over 3.5MB
      if(imgBlob.size>3500000){
        const img2=new Image();const url2=URL.createObjectURL(imgBlob);
        await new Promise(r=>{img2.onload=r;img2.src=url2;});
        const max=2200;let w=img2.width,h=img2.height;
        if(w>max||h>max){if(w>h){h=Math.round(h*(max/w));w=max;}else{w=Math.round(w*(max/h));h=max;}}
        const c2=document.createElement("canvas");c2.width=w;c2.height=h;
        c2.getContext("2d").drawImage(img2,0,0,w,h);
        sendBlob=await new Promise(r=>c2.toBlob(r,"image/jpeg",0.88));
        URL.revokeObjectURL(url2);
        setScanStatus({msg:"📸 Compressed "+Math.round(imgBlob.size/1024)+"KB → "+Math.round(sendBlob.size/1024)+"KB",err:false});
      }
      const base64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(sendBlob);});
      const kb=Math.round(sendBlob.size/1024);

      const sysPrompt="You are a financial data extraction specialist for Indian bank credit appraisals. You read balance sheets, profit & loss accounts, and trial balances prepared by Chartered Accountants for small Indian businesses (proprietorship, partnership, Pvt Ltd). These documents use Indian accounting format with absolute rupee amounts using Indian comma notation (e.g., 34,13,091 means thirty-four lakh thirteen thousand ninety-one). Return ONLY a valid JSON object — no markdown, no backticks, no explanation.";
      const jsonPrompt=`Extract financial figures from this balance sheet / P&L statement.

CRITICAL RULES:
1. Return RAW NUMBERS in absolute rupees. Do NOT convert to lakhs. Remove commas. E.g., 34,13,091 → 3413091
2. COLUMN MAPPING: The document may have two year columns.
   - LEFT/OLDER column → prev* keys (previous year)
   - RIGHT/NEWER column → non-prev keys (current year)
   - If SINGLE column only → non-prev keys, set prev* = ""
3. If a value is not found, return ""
4. CALCULATION RULES for Indian BS format:
   - tnw (Net Worth) = Capital Account closing balance (Capital Opening + Net Profit - Drawings)
   - cl (Current Liabilities) = Sundry Creditors + Expenses Payable + other current liabilities
   - tol (Total Outside Liabilities) = cl + Secured Loans + Unsecured Loans (everything EXCEPT capital/net worth)
   - ca (Current Assets) = Closing Stock + Sundry Debtors + Bank Balance + Cash in Hand + FDR + Loans & Advances + GST/TDS credit
   - capEmployed (Capital Employed) = Total Assets - Current Liabilities
   - ebit = Net Profit + Interest Expense + Tax (if shown)
5. READ CAREFULLY: Indian balance sheets often show sub-items indented under headings. Sum the sub-items, don't pick the heading total if sub-items are visible.

JSON format:
{"ca":"","cl":"","tol":"","tnw":"","ltd":"","fixedAssets":"","netSales":"","netProfit":"","ebit":"","intExp":"","dep":"","principalRepay":"","avgInv":"","tradeRecv":"","capEmployed":"","prevCa":"","prevCl":"","prevTol":"","prevTnw":"","prevLtd":"","prevFixedAssets":"","prevNetSales":"","prevNetProfit":"","prevEbit":"","prevIntExp":"","prevDep":"","prevPrincipalRepay":"","prevAvgInv":"","prevTradeRecv":"","prevCapEmployed":""}`;

      const fetchWithRetry = async (url, options, maxRetries = 2) => {
        for (let i = 0; i <= maxRetries; i++) {
          const resp = await fetch(url, options);
          if (resp.status === 429 && i < maxRetries) {
            setScanStatus({msg:`⏳ Rate limited (429). Retrying in ${Math.pow(2, i)}s...`, err:false});
            await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            continue;
          }
          return resp;
        }
      };

      const callGroq=async()=>{
        setScanStatus({msg:"🤖 Groq: Reading document ("+kb+"KB)...",err:false});
        const resp=await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+sett.groqKey},
          body:JSON.stringify({
            model:"llama-3.2-90b-vision-preview",
            messages:[{role:"system",content:sysPrompt},{role:"user",content:[{type:"text",text:jsonPrompt},{type:"image_url",image_url:{url:"data:image/jpeg;base64,"+base64}}]}],
            temperature:0,max_tokens:3000,response_format:{type:"json_object"}
          })
        });
        if(!resp.ok){const e=await resp.text();throw new Error("Groq "+resp.status+": "+e.slice(0,200));}
        return (await resp.json()).choices?.[0]?.message?.content||"";
      };

      const callGemini=async()=>{
        setScanStatus({msg:"🤖 Gemini: Scanning ("+kb+"KB)...",err:false});
        const resp=await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${sett.geminiKey}`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            systemInstruction:{parts:[{text:sysPrompt}]},
            contents:[{parts:[{text:jsonPrompt},{inlineData:{mimeType:"image/jpeg",data:base64}}]}],
            generationConfig:{temperature:0,responseMimeType:"application/json"}
          })
        });
        if(!resp.ok){const e=await resp.text();throw new Error("Gemini "+resp.status+": "+e.slice(0,200));}
        return (await resp.json()).candidates?.[0]?.content?.parts?.[0]?.text||"";
      };

      const callOpenRouter=async()=>{
        setScanStatus({msg:"🤖 OpenRouter: Scanning ("+kb+"KB)...",err:false});
        const resp=await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+sett.openrouterKey},
          body:JSON.stringify({
            model:"google/gemini-2.5-flash",
            messages:[{role:"system",content:sysPrompt},{role:"user",content:[{type:"text",text:jsonPrompt},{type:"image_url",image_url:{url:"data:image/jpeg;base64,"+base64}}]}],
            temperature:0,max_tokens:3000
          })
        });
        if(!resp.ok){const e=await resp.text();throw new Error("OpenRouter "+resp.status+": "+e.slice(0,200));}
        return (await resp.json()).choices?.[0]?.message?.content||"";
      };

      let rawText;
      if(pref==="openrouter"&&hasOR){rawText=await callOpenRouter();}
      else if(pref==="groq"&&hasGroq){rawText=await callGroq();}
      else if(pref==="gemini"&&hasGemini){rawText=await callGemini();}
      else{
        // Auto: Gemini first (works on both web & mobile), then Groq, then OpenRouter
        const chain=[];
        if(hasGemini)chain.push({name:"Gemini",fn:callGemini});
        if(hasGroq)chain.push({name:"Groq",fn:callGroq});
        if(hasOR)chain.push({name:"OpenRouter",fn:callOpenRouter});
        const failures=[];
        for(let i=0;i<chain.length;i++){
          try{
            rawText=await chain[i].fn();
            break;
          }catch(e){
            failures.push(chain[i].name+": "+e.message.slice(0,80));
            console.warn("Scanner: "+chain[i].name+" failed:",e.message);
            if(i===chain.length-1)throw new Error("All providers failed.\n"+failures.join("\n"));
            setScanStatus({msg:"⚠ "+chain[i].name+" failed — trying "+chain[i+1].name+"...",err:false});
          }
        }
      }

      const clean=rawText.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      const debugRows=[];
      const fieldLabels={ca:"Current Assets",cl:"Current Liabilities",tol:"Total Outside Liab",tnw:"Net Worth",ltd:"Long-term Debt",fixedAssets:"Fixed Assets",netSales:"Net Sales",netProfit:"Net Profit",ebit:"EBIT",intExp:"Interest Exp",dep:"Depreciation",principalRepay:"Principal Repay",avgInv:"Inventory",tradeRecv:"Trade Recv",capEmployed:"Capital Employed"};

      const allVals=Object.values(parsed).filter(v=>v!==""&&v!==null&&v!==undefined).map(v=>Math.abs(parseFloat(String(v).replace(/,/g,"")))).filter(v=>!isNaN(v)&&v>0);
      const medianVal=allVals.length>0?allVals.sort((a,b)=>a-b)[Math.floor(allVals.length/2)]:0;
      const needsConversion=medianVal>1000;

      sf(prev=>{
        const next={...prev};
        const applyVal=(targetKey,rawVal)=>{
          let val=parseFloat(String(rawVal).replace(/,/g,""));
          if(isNaN(val))return;
          const origVal=val;
          if(needsConversion)val=val/100000;
          val=Math.round(val*100)/100;
          const baseKey=targetKey.replace(/^prev/,"").replace(/^(.)/,(m,c)=>c.toLowerCase());
          const label=fieldLabels[baseKey]||targetKey;
          debugRows.push({field:targetKey,label,raw:origVal,converted:val,wasConverted:needsConversion});
          next[targetKey]=val;
        };
        if(target==="both"){
          Object.keys(parsed).forEach(k=>{if(parsed[k]!==""&&parsed[k]!==null&&parsed[k]!==undefined&&next.hasOwnProperty(k))applyVal(k,parsed[k]);});
        } else if(target==="curr"){
          bsPlKeys.forEach(k=>{const prevK="prev"+k.charAt(0).toUpperCase()+k.slice(1);const v=parsed[k]!==undefined&&parsed[k]!==""?parsed[k]:(parsed[prevK]!==undefined&&parsed[prevK]!==""?parsed[prevK]:"");if(v!=="")applyVal(k,v);});
        } else if(target==="prev"){
          bsPlKeys.forEach(k=>{const prevK="prev"+k.charAt(0).toUpperCase()+k.slice(1);const v=parsed[k]!==undefined&&parsed[k]!==""?parsed[k]:(parsed[prevK]!==undefined&&parsed[prevK]!==""?parsed[prevK]:"");if(v!==""&&next.hasOwnProperty(prevK))applyVal(prevK,v);});
        }
        return next;
      });
      debugRows.forEach(r=>{
        r.flag="";
        if(r.converted===0)r.flag="Zero value";
        else if(r.converted<0&&!r.field.includes("netProfit"))r.flag="Negative — verify";
        else if(r.raw%100000===0&&r.wasConverted&&r.raw>0)r.flag="Round number — may be estimate";
      });
      const filled=debugRows.length;
      const flagged=debugRows.filter(r=>r.flag).length;
      const targetLabel=target==="curr"?"Current Year":target==="prev"?"Previous Year":"Both Years";
      const convMsg=needsConversion?" (÷1,00,000 → lakhs)":"";
      const flagMsg=flagged>0?` ⚠ ${flagged} need review`:"";
      setScanStatus({msg:"✅ "+filled+" fields → "+targetLabel+convMsg+flagMsg,err:false,debug:debugRows,rawJson:parsed});
    }catch(e){
      console.error(e);
      setScanStatus({msg:"❌ "+(e.message.includes("JSON")?"Could not parse response. Try rotating or a clearer photo.":""+e.message),err:true});
    }
  };
  const bsPlKeys=["ca","cl","tol","tnw","ltd","fixedAssets","netSales","netProfit","ebit","intExp","dep","principalRepay","avgInv","tradeRecv","capEmployed"];
  return(<div className="page">
    <div className="dk-grid-2">
    <Card icon="📷" title="AI Balance Sheet Scanner">
      {(sett.openrouterKey||sett.groqKey||sett.geminiKey)?(
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleCamera(e.target.files[0]);}}/>
          <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);}}/>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <button className="scan-btn" style={{flex:1}} onClick={()=>fileRef.current?.click()} disabled={scanning}>📷 Take Photo</button>
            <button className="scan-btn" style={{flex:1}} onClick={()=>uploadRef.current?.click()} disabled={scanning}>📄 Upload File</button>
          </div>
          {scanPreview&&<div style={{position:"relative",marginBottom:8}}>
            <img src={scanPreview} className="scan-preview" alt="Preview"/>
            <button onClick={rotateImage} style={{position:"absolute",top:8,right:8,width:36,height:36,borderRadius:18,background:"rgba(0,0,0,0.6)",border:"none",color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} title="Rotate 90°">🔄</button>
            {rotation>0&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:10,padding:"3px 8px",borderRadius:8,fontWeight:700}}>Rotated {rotation}°</div>}
          </div>}
          {imgBlob&&<>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text2)",marginBottom:6}}>Fill data into:</div>
              <div style={{display:"flex",gap:6}}>
                {[{k:"both",l:"Both Years"},{k:"curr",l:"Current Year"},{k:"prev",l:"Previous Year"}].map(t=>(
                  <button key={t.k} className={`filter-chip${scanTarget===t.k?" active":""}`} style={{flex:1,textAlign:"center",fontSize:11,padding:"8px 4px"}} onClick={()=>setScanTarget(t.k)}>{t.l}</button>
                ))}
              </div>
            </div>
            <button className="btn" style={{width:"100%"}} onClick={doScan} disabled={scanning}>
              {scanning?<span style={{animation:"scanning 1.2s infinite"}}>🤖 Scanning...</span>:"⚡ Scan & Extract Data"}
            </button>
            <div style={{fontSize:10,color:"var(--text3)",marginTop:4,textAlign:"center"}}>Tip: Rotate image so text reads normally before scanning</div>
          </>}
          {!imgBlob&&<div style={{fontSize:10,color:"var(--text3)",textAlign:"center"}}>Supports JPEG, PNG, PDF</div>}
          {scanStatus&&<div className={`scan-status${scanStatus.err?" err":""}`} style={{marginTop:8}}>{scanStatus.msg}</div>}
          {scanStatus&&scanStatus.debug&&scanStatus.debug.length>0&&<details style={{marginTop:8}}>
            <summary style={{fontSize:11,fontWeight:700,color:"var(--accent)",cursor:"pointer",padding:"6px 0"}}>🔍 View extraction details ({scanStatus.debug.length} fields)</summary>
            <div style={{maxHeight:250,overflow:"auto",marginTop:6,borderRadius:10,border:"1px solid var(--card-border)",background:"var(--input-bg)"}}>
              <table style={{width:"100%",fontSize:10,borderCollapse:"collapse"}}>
                <thead><tr style={{background:"var(--accent-light)"}}>
                  <th style={{padding:"6px 8px",textAlign:"left",fontWeight:800,color:"var(--accent)"}}>Field</th>
                  <th style={{padding:"6px 8px",textAlign:"right",fontWeight:800,color:"var(--accent)"}}>AI Raw</th>
                  <th style={{padding:"6px 8px",textAlign:"right",fontWeight:800,color:"var(--accent)"}}>→ Lakhs</th>
                  <th style={{padding:"6px 4px",textAlign:"center",fontWeight:800,color:"var(--accent)",width:24}}>⚑</th>
                </tr></thead>
                <tbody>{scanStatus.debug.map((r,i)=><tr key={i} style={{borderTop:"1px solid var(--card-border)",background:r.flag?"var(--amber-bg)":"transparent"}}>
                  <td style={{padding:"4px 8px",color:"var(--text2)",fontWeight:600}}>{r.label}<br/><span style={{fontSize:9,color:"var(--text3)"}}>{r.field}</span></td>
                  <td style={{padding:"4px 8px",textAlign:"right",fontFamily:"monospace",color:r.wasConverted?"var(--amber)":"var(--text)"}}>{r.raw.toLocaleString("en-IN")}</td>
                  <td style={{padding:"4px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:700,color:"var(--green)"}}>{r.converted}</td>
                  <td style={{padding:"4px 4px",textAlign:"center",fontSize:9,color:"var(--amber)",fontWeight:700}}>{r.flag?"⚠":""}</td>
                </tr>)}</tbody>
              </table>
              {scanStatus.debug.some(r=>r.flag)&&<div style={{fontSize:10,color:"var(--amber)",marginTop:6,fontWeight:600,lineHeight:1.5}}>⚠ Flagged fields: {scanStatus.debug.filter(r=>r.flag).map(r=>r.label+" ("+r.flag+")").join(", ")}</div>}
            </div>
            {scanStatus.debug[0]?.wasConverted&&<div style={{fontSize:10,color:"var(--amber)",marginTop:4,fontWeight:600}}>⚠ Auto-converted from absolute ₹ to lakhs (÷ 1,00,000)</div>}
          </details>}
        </>
      ):(
        <div className="disabled-hint">To enable AI scanning, add a free API key in ⚙️ Settings → AI Scanner. Recommended: OpenRouter (openrouter.ai) — free, best accuracy.</div>
      )}
    </Card>
    <Card icon="⚡" title="Quick Ratio Entry">
      <p style={{fontSize:12,color:"var(--accent)",marginTop:-8,marginBottom:14,lineHeight:1.5,fontWeight:500}}>Enter ratios directly — or fill Balance Sheet / P&L below to auto-calculate.</p>
      <div className="row"><In label="Current Ratio" value={fin.currentRatio} onChange={u("currentRatio")} type="number" required/><In label="TOL/TNW" value={fin.tolTnw} onChange={u("tolTnw")} type="number" required/></div>
      <div className="row"><In label="DSCR" value={fin.dscr} onChange={u("dscr")} type="number" required/><In label="ICR" value={fin.icr} onChange={u("icr")} type="number"/></div>
      <div className="row"><In label="NPM %" value={fin.npm} onChange={u("npm")} type="number"/><In label="Inv Turnover" value={fin.invTurnover} onChange={u("invTurnover")} type="number"/></div>
      <div className="row"><In label="Recv Days" value={fin.recvDays} onChange={u("recvDays")} type="number"/><In label="ROCE %" value={fin.roce} onChange={u("roce")} type="number"/></div>
      <div className="row"><In label="Debt/Equity" value={fin.debtEquity} onChange={u("debtEquity")} type="number"/><In label="FACR" value={fin.facr} onChange={u("facr")} type="number"/></div>
    </Card>
    </div>
    <div className="dk-grid-2">
    <Card icon="📑" title="Balance Sheet (₹ Lakhs)">
      <div className="fin-grid"><div/><div className="fin-head">Prev Year</div><div className="fin-head">Curr Year</div></div>
      <FinRow label="Current Assets" currKey="ca" prevKey="prevCa" fin={fin} u={u}/>
      <FinRow label="Current Liabilities" currKey="cl" prevKey="prevCl" fin={fin} u={u}/>
      <FinRow label="Total Outside Liab." currKey="tol" prevKey="prevTol" fin={fin} u={u}/>
      <FinRow label="Tangible Net Worth" currKey="tnw" prevKey="prevTnw" fin={fin} u={u}/>
      <FinRow label="Long-term Debt" currKey="ltd" prevKey="prevLtd" fin={fin} u={u}/>
      <FinRow label="Total Fixed Assets" currKey="fixedAssets" prevKey="prevFixedAssets" fin={fin} u={u}/>
      <button className="btn-ghost" style={{width:"100%",marginTop:8,fontSize:11,padding:"8px"}} onClick={()=>{if(window.confirm("Clear all Balance Sheet data?"))sf(p=>{const n={...p};["ca","cl","tol","tnw","ltd","fixedAssets"].forEach(k=>{n[k]="";n["prev"+k.charAt(0).toUpperCase()+k.slice(1)]="";});return n;});}}>🗑 Clear Balance Sheet</button>
    </Card>
    <Card icon="📋" title="Profit & Loss (₹ Lakhs)">
      <div className="fin-grid"><div/><div className="fin-head">Prev Year</div><div className="fin-head">Curr Year</div></div>
      <FinRow label="Net Sales" currKey="netSales" prevKey="prevNetSales" fin={fin} u={u}/>
      <FinRow label="Net Profit" currKey="netProfit" prevKey="prevNetProfit" fin={fin} u={u}/>
      <FinRow label="EBIT" currKey="ebit" prevKey="prevEbit" fin={fin} u={u}/>
      <FinRow label="Interest Expense" currKey="intExp" prevKey="prevIntExp" fin={fin} u={u}/>
      <FinRow label="Depreciation" currKey="dep" prevKey="prevDep" fin={fin} u={u}/>
      <FinRow label="Principal Repay" currKey="principalRepay" prevKey="prevPrincipalRepay" fin={fin} u={u}/>
      <FinRow label="Avg Inventory" currKey="avgInv" prevKey="prevAvgInv" fin={fin} u={u}/>
      <FinRow label="Trade Receivables" currKey="tradeRecv" prevKey="prevTradeRecv" fin={fin} u={u}/>
      <FinRow label="Capital Employed" currKey="capEmployed" prevKey="prevCapEmployed" fin={fin} u={u}/>
      <button className="btn-ghost" style={{width:"100%",marginTop:8,fontSize:11,padding:"8px"}} onClick={()=>{if(window.confirm("Clear all P&L data?"))sf(p=>{const n={...p};["netSales","netProfit","ebit","intExp","dep","principalRepay","avgInv","tradeRecv","capEmployed"].forEach(k=>{n[k]="";n["prev"+k.charAt(0).toUpperCase()+k.slice(1)]="";});return n;});}}>🗑 Clear Profit & Loss</button>
    </Card>
    </div>
    {(()=>{const w=bsValidate(fin);return w.length>0?(<Card icon="⚠️" title="Data Sanity Checks">{w.map((x,i)=><div key={i} className={`xv-warn ${x.severity}`}>⚠ {x.text}</div>)}</Card>):null;})()}
    <button className="btn" onClick={calc}>⚡ Calculate All Ratios</button>
  </div>);
}

/* ═══════════ STEP 3: RATIOS ═══════════ */
function StepRatios({fin,ca,R}){
  const fl=Object.keys(R).filter(k=>fin[k]!==""&&fin[k]!==undefined&&!isNaN(fin[k]));
  const sm={g:0,a:0,r:0};fl.forEach(k=>{const c=rc(k,cls(k,+fin[k],R),R);if(c==="#059669")sm.g++;else if(c==="#d97706")sm.a++;else sm.r++;});
  if(!fl.length)return(<div className="page"><div className="empty-state"><div style={{fontSize:48,marginBottom:12}}>📊</div><div style={{fontSize:17,fontWeight:800,color:"var(--text)"}}>No ratios yet</div><div style={{fontSize:13,color:"var(--text3)",marginTop:6,lineHeight:1.5}}>Go back to Financials and enter your data,<br/>then tap "Calculate All Ratios".</div></div></div>);
  return(<div className="page">
    <div className="card" style={{padding:10}}>
      <div className="s-row">
        <div className="s-pill"><div className="s-num" style={{color:"var(--green)"}}>{sm.g}</div><div className="s-lab" style={{color:"var(--green)"}}>Healthy</div></div>
        <div className="s-pill"><div className="s-num" style={{color:"var(--amber)"}}>{sm.a}</div><div className="s-lab" style={{color:"var(--amber)"}}>Moderate</div></div>
        <div className="s-pill"><div className="s-num" style={{color:"var(--red)"}}>{sm.r}</div><div className="s-lab" style={{color:"var(--red)"}}>Concern</div></div>
      </div>
    </div>
    <div className="ratio-grid">
    {fl.map((k,i)=>{const v=+fin[k],r=R[k],l=cls(k,v,R),col=rc(k,l,R),bg=rbg(col),lb=l==="high"?r.hl:l==="mid"?r.ml:r.ll,c=ca[k];
    return(<div className="r-card" key={k} style={{animationDelay:`${i*.04}s`,borderLeft:`4px solid ${col}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="card-icon" style={{fontSize:15,width:32,height:32}}>{r.icon}</div>
          <div><div style={{fontSize:10.5,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".6px"}}>{r.label}</div><div className="r-val">{fv(k,v,R)}<span className="r-sfx">{fsu(k,R)}</span></div></div>
        </div>
        <span className="r-badge" style={{background:bg,color:col}}>{lb}</span>
      </div>
      <div style={{fontSize:10,color:"var(--text3)",marginTop:2,marginLeft:42}}>{r.formula}</div>
      {c&&c.text&&<div className="comm"><div>{c.text}</div>{c.mit&&<div className="comm-m">↳ {c.mit}</div>}</div>}
    </div>);})}
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════
   STEP 4: SMART REPORT — ALL 6 FIXES APPLIED HERE
   ═══════════════════════════════════════════════════════════════ */
function StepReport({d,fin,ca,sett,R,sd,genDoc}){
  const[cp,scp]=useState(null);const fy=sett.fy;const bk=sett.bank;
  const cpy=(t,id)=>{navigator.clipboard.writeText(t).then(()=>{scp(id);setTimeout(()=>scp(null),2000);});};
  const share=(t)=>{if(navigator.share)navigator.share({title:`Credit Appraisal: ${d.name||"Report"}`,text:t}).catch(()=>{});else{const url=`https://wa.me/?text=${encodeURIComponent(t)}`;window.open(url,"_blank");}};

  const isFresh=d.proposal==="FRESH";const isNew=d.newExisting==="NEW";const isTakeover=d.proposal==="TAKEOVER";
  const isProp=d.constitution==="PROPRIETORSHIP";const isPartner=d.constitution==="PARTNERSHIP";
  const isCompany=d.constitution==="PVT LTD"||d.constitution==="LLP";
  const isOwned=d.premises==="OWNED"||d.premises==="FAMILY OWNED";
  const isRented=d.premises==="RENTED"||d.premises==="LEASED";
  const udyamFull=d.udyamState&&d.udyamDist&&d.udyamNum?"UDYAM-"+d.udyamState+"-"+d.udyamDist+"-"+d.udyamNum:(d.udyam||"___");
  const hasGstTurnover=d.gstAvailable!=="NO"&&d.gst2526;
  const annSalesSrc=hasGstTurnover?+d.gst2526:+d.crSumm2526;
  const annSalesAuto=annSalesSrc&&sett.fy.months>0?Math.round((annSalesSrc/sett.fy.months)*12*100)/100:"";
  const annSales=d.annualisedSales||annSalesAuto||"___";
  const noGst=d.gstAvailable==="NO";
  
  // Turnover trend line for write-up
  const prevTurnover=+d.itrSales||+d.crSumm2425||0;
  const currTurnover=annSales!=="___"?+annSales:0;
  let trendLine="";
  if(prevTurnover>0&&currTurnover>0){
    const growth=((currTurnover-prevTurnover)/prevTurnover*100).toFixed(0);
    trendLine=+growth>=0?` The turnover reflects a growth of approximately ${growth}% over the previous year, indicating positive business momentum.`:` The turnover has declined by approximately ${Math.abs(+growth)}% compared to the previous year.`;
  }

  /* ── FIX #1: Profile — proper "S/o", "D/o", "W/o" for proprietor father name ── */
  const constLabel=isProp?"a proprietorship concern":isPartner?"a partnership firm":d.constitution==="PVT LTD"?"a private limited company":d.constitution==="LLP"?"an LLP":`a ${(d.constitution||"___").toLowerCase()} entity`;
  const promoterVerb=isProp?"The concern is promoted by":isPartner?"The firm is promoted by":"The company is promoted by";

  // Helper: parse father/spouse field to include proper prefix
  const formatFatherName=(raw,propName)=>{
    if(!raw)return"";
    const trimmed=raw.trim();
    // If user already typed S/o, D/o, W/o prefix, use as-is
    if(/^(S\/o|D\/o|W\/o|Son of|Daughter of|Wife of)/i.test(trimmed)){
      return ` ${propName} is ${trimmed}.`;
    }
    // Otherwise, default to "S/o" (most common in Indian banking)
    return ` ${propName} is S/o ${trimmed}.`;
  };

  let pf=`The unit ${d.name||"M/S ___"} is ${constLabel} engaged in ${d.activity||"___"}. The firm commenced commercial operations on ${d.commenced||"___"} and operates from ${(d.premises||"___").toLowerCase()} premises located at ${d.address||"___"}, with favourable logistics connectivity, proximity to raw material suppliers, availability of skilled labour, and access to regional markets.`;
  if(isRented&&d.leaseExpiry)pf+=` The lease tenure is valid till ${d.leaseExpiry}, aligned with the credit facility period.`;
  pf+=`\n\n${promoterVerb} ${d.partners||"___"}, having approximately ${d.experience||"___"} years of relevant industry experience, providing operational stability and business continuity.`;
  if(isPartner&&d.partnershipDeedDate)pf+=` The partnership deed dated ${d.partnershipDeedDate} governs the firm.`;
  if(isCompany&&d.boardResDate)pf+=` Board resolution dated ${d.boardResDate} authorises the borrowing.${d.authorizedCap?` Authorized Capital: ₹${d.authorizedCap}L, Paid-Up: ₹${d.paidUpCap||"___"}L.`:""}`;
  // FIX #1: Proper father/spouse name formatting
  if(isProp&&d.proprietorFather)pf+=formatFatherName(d.proprietorFather,d.partners||"The proprietor");
  pf+=`\n\nThe firm is registered as a MSME vide URN ${udyamFull}${d.gstAvailable==="YES"?` and with GST vide certificate no ${d.gst||"___"}`:" (GST registration not applicable)"}, and compliant with all statutory requirements.`;

  /* FIX #2: Supply chain — only include suppliers/buyers if actually filled */
  let supplyChainText=`\n\nThe firm is engaged in ${d.activity||"___"}`;
  if(d.cateringTo)supplyChainText+=` catering to ${d.cateringTo}`;
  supplyChainText+=".";
  if(d.rawMaterials)supplyChainText+=` The primary raw materials include ${d.rawMaterials}${d.suppliers?", sourced from "+d.suppliers:""}.`;
  else if(d.suppliers)supplyChainText+=` The raw materials are sourced from ${d.suppliers}.`;
  if(d.buyers)supplyChainText+=` Major buyers ${noGst?"include":"as per GST returns are"} ${d.buyers}.`;
  pf+=supplyChainText;

  /* ── FIX #4 & #5: Conduct — reflects overall conduct dropdown + richer CIC remarks ── */
  const il=d.interestRegular==="YES"?"regularly and promptly within":"irregularly within";
  const cic=+d.cicScore||0;
  const cs=cic>=750?"Good":cic>=650?"Satisfactory":cic>=550?"Fair":"Below Average";
  const cicDt=bk.cicDate||new Date().toLocaleDateString("en-IN");

  // FIX #5: Richer CIBIL/CIC remarks based on score ranges
  const buildCicRemarks=()=>{
    let cicText=`CIC score stands at ${d.cicScore||"___"} as on ${cicDt} (${cs}).`;
    if(cic>=750){
      cicText+=` The credit information report reflects a clean track record with no defaults, overdue accounts, or adverse remarks. All existing credit facilities, if any, have been serviced promptly. The credit profile is strong and indicates responsible credit behaviour by the borrower/promoters.`;
    } else if(cic>=650){
      cicText+=` The credit information report is satisfactory with no major defaults or significant adverse remarks. Minor observations, if any, are within acceptable parameters. The overall credit discipline of the borrower/promoters is adequate for the proposed facility.`;
    } else if(cic>=550){
      cicText+=` The credit information report reflects a fair credit history. Some past irregularities or delays in repayment may have been observed, though no serious defaults are currently outstanding. The borrower has shown improvement in recent credit behaviour. Additional comfort is derived from collateral coverage and the promoter's business track record.`;
    } else if(cic>0){
      cicText+=` The credit information report reflects below-average credit history with past irregularities noted. However, the borrower has provided adequate justification for the same and has demonstrated recent improvement in credit discipline. The proposal is supported by strong collateral coverage and the promoter's industry experience.`;
    }
    if(d.npaHistory==="YES")cicText+=` There is a history of NPA classification, which has since been regularised.`;
    return cicText;
  };

  // FIX #4: Conduct-aware text — different language for Satisfactory vs Irregular vs Unsatisfactory
  const conductLabel=(d.overallConduct||"Satisfactory").toLowerCase();
  const buildConductAssessment=(proposalDesc)=>{
    if(conductLabel==="satisfactory"){
      return `Overall conduct of the account is assessed as satisfactory. The borrower has maintained regular operations, timely interest servicing, and adequate business activity through the account. The proposal for ${proposalDesc} is considered justified and is recommended for approval.`;
    } else if(conductLabel==="irregular"){
      return `Overall conduct of the account is assessed as irregular. There have been instances of delayed interest servicing / insufficient credit summations / temporary excesses in the account. However, the borrower has provided satisfactory explanation for the irregularities and has shown recent improvement in account operations. Considering the business viability and collateral coverage, the proposal for ${proposalDesc} is recommended for approval with enhanced monitoring.`;
    } else {
      return `Overall conduct of the account is assessed as unsatisfactory. Persistent irregularities in interest servicing, inadequate turnover routing, and/or frequent excesses have been observed. The borrower has been counselled regarding the same. The proposal for ${proposalDesc} may be considered only with strict conditions, enhanced collateral, and intensive monitoring, subject to the sanctioning authority's discretion.`;
    }
  };

  let cd;
  if(isTakeover){
    cd=`The borrower ${d.name||"M/S ___"} is currently banking with ${d.takeoverBank||"___"} and has approached our branch${bk.branch?` (${bk.branch})`:""} for takeover of existing credit facilities. The outstanding balance with ${d.takeoverBank||"___"} is ₹${d.takeoverOutstanding||"___"} lakhs. NOC status: ${d.takeoverNOC||"___"}. Reason for takeover: ${d.takeoverReason||"Better terms and proximity to branch"}.`;
    cd+=`\n\nDeclared turnover as per ITR for ${fy.prev} is ₹${d.itrSales||"___"} lakhs${noGst?"":", GST ₹"+(d.gst2425||"___")+" lakhs"}. For ${fy.curr}, ${noGst?"credit summations stand at ₹"+(d.crSumm2526||"___")+" lakhs":"GST stands at ₹"+(d.gst2526||"___")+" lakhs"}, annualised to ₹${annSales} lakhs.${trendLine}`;
    cd+=`\n\n${buildCicRemarks()}`;
    cd+=`\n\n${buildConductAssessment("takeover of existing credit facilities")}`;
  } else if(!isFresh){
    const pl=d.proposal==="EXISTING LEVEL"?`renewal of the existing CC limit of ₹${d.currentCC||"___"} lakhs at the current level`:d.proposal==="ENHANCEMENT"?`enhancement of the CC limit from ₹${d.currentCC||"___"} lakhs to ₹${d.enhancedCC||"___"} lakhs`:`reduction of the CC limit from ₹${d.currentCC||"___"} lakhs to ₹${d.reducedCC||"___"} lakhs`;
    cd=`The borrower is presently availing a Cash Credit (CC) facility of ₹${d.currentCC||"___"} lakhs${d.termLoan?`, and a Term Loan of ₹${d.termLoan} lakhs`:""} with our branch${bk.branch?` (${bk.branch})`:""}.The borrower has requested for ${pl}.`;
    cd+=`\n\nThe CC account reflects regular and active business operations. The credit summations for ${fy.prev} stood at ₹${d.crSumm2425||"___"} lakhs. For ${fy.curr}, credit summations up to ${fy.annMonth} (${fy.months} months) stand at ₹${d.crSumm2526||"___"} lakhs, annualised to approximately ₹${annSales} lakhs.${trendLine} Interest serviced ${il} the account.`;
    cd+=noGst
      ?`\n\nThe declared turnover as per ITR for ${fy.prev} is ₹${d.itrSales||"___"} lakhs. The unit is not registered under GST.`
      :`\n\nThe declared turnover as per ITR for ${fy.prev} is ₹${d.itrSales||"___"} lakhs, GST returns ₹${d.gst2425||"___"} lakhs. For ${fy.curr}, GST up to ${fy.annMonth} stands at ₹${d.gst2526||"___"} lakhs, annualised to ₹${annSales} lakhs.`;
    cd+=`\n\n${buildCicRemarks()}`;
    cd+=`\n\n${buildConductAssessment(pl)}`;
  } else {
    /* FIX #6: Fresh proposal — richer recommendation */
    const freshFac=d.freshTL?`CC of ₹${d.freshCC||"___"} lakhs and Term Loan of ₹${d.freshTL} lakhs for ${d.tlPurpose||"___"}`:`CC facility of ₹${d.freshCC||"___"} lakhs`;
    cd=`The borrower ${d.name||"M/S ___"} has approached our branch${bk.branch?` (${bk.branch})`:""} for availment of a ${freshFac}. This is a fresh proposal.`;
    if(d.existingBanker)cd+=` The borrower maintains a current account with ${d.existingBanker}.`;
    if(isNew)cd+=`\n\nThe unit is newly established and does not have a prior banking track record. The appraisal is based on projected financials and the promoter's experience.`;
    cd+=noGst
      ?`\n\nDeclared turnover as per ITR for ${fy.prev} is ₹${d.itrSales||"___"} lakhs. The unit is not registered under GST. Credit summations for ${fy.curr} stand at ₹${d.crSumm2526||"___"} lakhs, annualised to ₹${annSales} lakhs.${trendLine}`
      :`\n\nDeclared turnover as per ITR for ${fy.prev} is ₹${d.itrSales||"___"} lakhs${d.gst2425?", GST ₹"+d.gst2425+" lakhs":""}. For ${fy.curr}, GST stands at ₹${d.gst2526||"___"} lakhs, annualised to ₹${annSales} lakhs.${trendLine}`;
    cd+=`\n\n${buildCicRemarks()}`;
    if(d.freshTL){cd+=`\n\nTotal project cost ₹${d.projectCost||"___"} lakhs, promoter's contribution ₹${d.promoterContrib||"___"} lakhs, bank finance ₹${d.freshTL} lakhs.${d.tlRepayMonths?` Proposed repayment: ${d.tlRepayMonths} months${d.tlMoratorium?` (incl. ${d.tlMoratorium} months moratorium)`:""}.`:""}`;}
    // FIX #6: Richer fresh proposal recommendation
    const freshConductText=conductLabel==="satisfactory"
      ?`\n\nConsidering the promoter's ${d.experience||"___"} years of industry experience, ${cic>=650?"satisfactory CIC score of "+d.cicScore+", ":""}${d.cateringTo?"established market presence catering to "+d.cateringTo+", ":""}${d.collateralSecurity?"adequate collateral security, ":""}${d.cgtmse==="YES"?"CGTMSE/CGFMU coverage, ":""}and the viability of the business activity (${d.activity||"___"}), the fresh proposal for ${freshFac} is considered viable and is recommended for sanction.`
      :conductLabel==="irregular"
      ?`\n\nThe overall conduct is assessed as irregular. However, considering the promoter's ${d.experience||"___"} years of experience, ${d.collateralSecurity?"collateral security offered, ":""}and the nature of business activity, the fresh proposal for ${freshFac} may be considered for sanction with enhanced monitoring and strict conditions.`
      :`\n\nThe overall conduct is assessed as unsatisfactory. The fresh proposal for ${freshFac} requires careful consideration. The proposal may be considered only subject to adequate collateral, strict monitoring conditions, and the sanctioning authority's discretion.`;
    cd+=freshConductText;
  }

  /* ── Security: only if filled ── */
  let secText="";
  if(d.cgtmse==="YES"){
    secText=`The loan is covered under CGTMSE / CGFMU Credit Guarantee Scheme. Collateral security is not required.\nPrimary: ${d.primarySecurity||"Hypothecation of stock & book debts"}`;
  } else if(d.primarySecurity||d.collateralSecurity){
    secText=`Primary: ${d.primarySecurity||"N/A"}\nCollateral: ${d.collateralSecurity||"N/A"}`;
    if(d.collateralValue)secText+=`, valued at ₹${d.collateralValue}L as on ${d.collateralDate||"___"} by ${d.valuerName||"___"}`;
  }
  if(d.insuranceCoverage)secText+=`\nInsurance: ₹${d.insuranceCoverage}L valid till ${d.insuranceValidity||"___"}`;

  const rk=Object.keys(R).filter(k=>fin[k]!==""&&fin[k]!==undefined&&!isNaN(fin[k]));
  
  // Compute previous year ratios for comparison
  const prevRatios={};
  if(fin.prevCa&&fin.prevCl)prevRatios.currentRatio=+(fin.prevCa/fin.prevCl).toFixed(2);
  if(fin.prevTol&&fin.prevTnw)prevRatios.tolTnw=+(fin.prevTol/fin.prevTnw).toFixed(2);
  if(fin.prevNetProfit!==""&&fin.prevDep!==""&&fin.prevIntExp!==""&&fin.prevPrincipalRepay!==""){const a=(+fin.prevNetProfit||0)+(+fin.prevDep||0)+(+fin.prevIntExp||0),b=(+fin.prevPrincipalRepay||0)+(+fin.prevIntExp||0);if(b>0)prevRatios.dscr=+(a/b).toFixed(2);}
  if(fin.prevEbit&&fin.prevIntExp)prevRatios.icr=+(fin.prevEbit/fin.prevIntExp).toFixed(2);
  if(fin.prevNetProfit!==""&&fin.prevNetSales)prevRatios.npm=+((fin.prevNetProfit/fin.prevNetSales)*100).toFixed(1);
  if(fin.prevNetSales&&fin.prevAvgInv)prevRatios.invTurnover=+(fin.prevNetSales/fin.prevAvgInv).toFixed(1);
  if(fin.prevTradeRecv!==""&&fin.prevNetSales)prevRatios.recvDays=+((fin.prevTradeRecv/fin.prevNetSales)*365).toFixed(0);
  if(fin.prevEbit&&fin.prevCapEmployed)prevRatios.roce=+((fin.prevEbit/fin.prevCapEmployed)*100).toFixed(1);
  if(fin.prevLtd!==""&&fin.prevTnw)prevRatios.debtEquity=+(fin.prevLtd/fin.prevTnw).toFixed(2);
  if(fin.prevFixedAssets&&fin.prevLtd!==""&&fin.prevTnw)prevRatios.facr=+(fin.prevFixedAssets/((+fin.prevLtd||0)+(+fin.prevTnw||0))).toFixed(2);

  const prevCompare=(k)=>{
    if(prevRatios[k]===undefined)return"";
    const r=R[k];const curr=+fin[k];const prev=prevRatios[k];
    const currF=fv(k,curr,R);const prevF=fv(k,prev,R);
    if(curr===prev)return` (unchanged from ${fy.prev})`;
    const improved=(r.gd==="high"&&curr>prev)||(r.gd==="low"&&curr<prev)||(r.gd==="mid"&&Math.abs(curr-1)<Math.abs(prev-1));
    return improved?`, improved from ${prevF}${fsu(k,R)} in ${fy.prev}`:`, compared to ${prevF}${fsu(k,R)} in ${fy.prev}`;
  };

  const buildRatioText=()=>{
    if(!rk.length)return"Financial ratios not yet calculated.";
    const groups=[
      {title:"Liquidity",keys:["currentRatio","tolTnw","debtEquity"],join:" Further, "},
      {title:"Debt Servicing",keys:["dscr","icr"],join:" Additionally, "},
      {title:"Profitability",keys:["npm","roce"],join:" Moreover, "},
      {title:"Efficiency",keys:["invTurnover","recvDays"],join:" On the receivables side, "},
      {title:"Asset Coverage",keys:["facr"],join:""},
    ];
    const paras=[];
    for(const g of groups){
      const active=g.keys.filter(k=>rk.includes(k));
      if(!active.length)continue;
      const sentences=active.map(k=>{
        const c=ca[k];if(!c)return null;
        let txt=c.text;
        const cmp=prevCompare(k);
        if(cmp){
          const lastDot=txt.lastIndexOf(".");
          if(lastDot>0)txt=txt.slice(0,lastDot)+cmp+txt.slice(lastDot);
          else txt+=cmp;
        }
        return txt;
      }).filter(Boolean);
      const mitigations=active.map(k=>{const c=ca[k];return c&&c.mit?c.mit:null;}).filter(Boolean);
      if(sentences.length){
        let para=sentences.join(g.join);
        if(mitigations.length)para+="\n"+mitigations[mitigations.length-1];
        paras.push(para);
      }
    }
    const grouped=groups.flatMap(g=>g.keys);
    const remaining=rk.filter(k=>!grouped.includes(k));
    remaining.forEach(k=>{const c=ca[k];if(c){let txt=c.text+prevCompare(k);paras.push(txt+(c.mit?"\n"+c.mit:""));}});
    return paras.join("\n\n")||"Financial ratios not yet calculated.";
  };
  const rt=buildRatioText();

  /* ── MUDRA vs STANDARD write-up ── */
  const isMudra=d.isMudra==="YES";
  let full,sections;

  if(isMudra){
    const isTrading=d.tradingType==="WHOLESALE"||d.tradingType==="RETAIL"||d.tradingType==="WHOLESALE & RETAIL";
    const isMfg=d.tradingType==="MANUFACTURING";
    const loanAmt=d.freshCC||d.freshTL||d.currentCC||"___";
    const premText=d.premises?(d.premises.toLowerCase()+(d.premises==="RENTED"||d.premises==="LEASED"?" (lease valid till "+(d.leaseExpiry||"___")+")":"")):"___";

    const mudraHead=`MUDRA LOAN APPRAISAL\n\nBorrower: ${d.name||"M/S ___"} | Constitution: ${(d.constitution||"___")}\nActivity: ${d.activity||"___"} | Commenced: ${d.commenced||"___"}\nPremises: ${premText} | Address: ${d.address||"___"}\nUDYAM: ${udyamFull}${d.gstAvailable==="YES"?" | GST: "+(d.gst||"___"):""}\nLoan Amount: ₹${loanAmt} Lakhs | Covered under CGFMU`;

    const q1=`Q1. Raw Materials required (if any) and whether they are available easily?\n\nAns. ${isMfg||d.rawMaterials?"The unit requires "+(d.rawMaterials||"various raw materials")+" for its operations"+(d.suppliers?", which are procured from "+d.suppliers:"")+".":" The unit is engaged in "+(d.tradingType||"trading").toLowerCase()+" activities."} ${isMfg?"The raw materials are readily available in the local market and nearby industrial areas. No supply chain constraints or seasonal shortages have been reported by the borrower. Availability is adequate to sustain the projected level of operations.":"Being a "+(d.tradingType||"trading").toLowerCase()+" unit, the finished goods / trading stock are readily available from established suppliers"+(d.suppliers?" including "+d.suppliers:"")+". No procurement difficulties are anticipated."}`;

    const q2=`Q2. Where will the product be sold?\n\nAns. The ${isTrading?"goods":"products"} are ${d.cateringTo?"sold to "+d.cateringTo:"sold in the local market and surrounding areas"}. ${d.buyers?"The major buyers include "+d.buyers+".":"The unit caters to a mix of retail and wholesale customers in the region."} The demand for the ${d.activity||"said"} ${isTrading?"goods":"products/services"} is ${d.newExisting==="NEW"?"expected to be":"currently"} steady in the local market, providing a reliable customer base for sustained operations.`;

    const mudraGstSrc=d.gstAvailable!=="NO"&&d.gst2526?+d.gst2526:+d.crSumm2526;
    const mudraAnnAuto=mudraGstSrc&&sett.fy.months>0?Math.round((mudraGstSrc/sett.fy.months)*12*100)/100:"";
    const mudraAnnSales=d.annualisedSales||mudraAnnAuto||"___";
    const prevSumm=d.crSumm2425;
    const currSumm=d.crSumm2526;
    const itrSales=d.itrSales;
    const growthText=prevSumm&&currSumm&&+prevSumm>0?". The credit summations have "+(+currSumm>=+prevSumm?"shown growth":"reflected activity")+" from ₹"+prevSumm+"L ("+fy.prev+") to ₹"+currSumm+"L ("+fy.curr+" up to "+fy.annMonth+")":"";
    const q3=`Q3. How the anticipated turnover is considered achievable?\n\nAns. The annualised turnover of ₹${mudraAnnSales} lakhs is considered achievable based on ${d.newExisting==="NEW"?"the promoter's prior experience in the trade and projected demand":"the unit's established track record and existing customer base"}${growthText}. ${itrSales?"The declared ITR turnover for "+fy.prev+" of ₹"+itrSales+"L corroborates the business volume. ":""}The unit operates from ${premText}, which provides adequate infrastructure. Considering the nature of activity, market conditions, and the promoter's capabilities, the anticipated turnover is realistic and achievable.`;

    const q4=`Q4. Does the applicant have necessary determination, experience, know-how, market for achieving the anticipated turnover (substantiate)?\n\nAns. ${d.partners||"The promoter"} has approximately ${d.experience||"___"} years of experience in ${d.activity||"the relevant industry"}, demonstrating adequate domain familiarity and understanding of the business operations. The promoter has established relationships with both suppliers${d.suppliers?" ("+d.suppliers+")":""} and buyers${d.buyers?" ("+d.buyers+")":""}, which ensures continuity of business. ${d.newExisting==="EXISTING"?"The unit has been operational since "+d.commenced+" and has demonstrated consistent business activity as reflected in the banking transactions and statutory returns. ":""}The promoter possesses the necessary determination, market knowledge, and operational capability to achieve the projected turnover of ₹${mudraAnnSales} lakhs.`;

    const q5=`Q5. Whether CIBIL / CRIF-Highmark / iProbe report obtained for borrower/promoters. Brief comments.\n\nAns. The CIC/CIBIL report has been obtained for the borrower/promoters as on ${cicDt}. The CIC score stands at ${d.cicScore||"___"} which is classified as "${cs}". ${cic>=750?"No major adverse remarks, defaults, or overdue accounts have been observed in the credit information report. The credit history reflects regular repayment behaviour and responsible credit management.":cic>=650?"Minor observations are noted in the credit history, however no serious defaults are reported. The overall credit profile is considered acceptable for the proposed Mudra facility.":"The credit score is below the preferred threshold. However, considering the nature of Mudra scheme and the promoter's business track record, the proposal is still considered for sanction with appropriate safeguards."} The credit profile is considered ${cs.toLowerCase()} for the proposed PMMY facility of ₹${loanAmt} lakhs under Mudra scheme.`;

    full=`${mudraHead}\n\n\n${q1}\n\n\n${q2}\n\n\n${q3}\n\n\n${q4}\n\n\n${q5}`;
    sections=[
      {title:"Mudra Header",icon:"🏛️",text:mudraHead,id:"mh"},
      {title:"Q1 — Raw Materials",icon:"📦",text:q1,id:"q1"},
      {title:"Q2 — Product Selling",icon:"🏪",text:q2,id:"q2"},
      {title:"Q3 — Turnover Achievability",icon:"📊",text:q3,id:"q3"},
      {title:"Q4 — Experience & Know-How",icon:"👤",text:q4,id:"q4"},
      {title:"Q5 — CIC/CIBIL Report",icon:"📋",text:q5,id:"q5"},
    ];
  } else {
    full=`BRIEF PROFILE OF THE UNIT\n\n${pf}\n\n\nCONDUCT OF THE ACCOUNT\n\n${cd}${secText?`\n\n\nSECURITY DETAILS\n\n${secText}`:""}\n\n\nFINANCIAL RATIO ANALYSIS\n\n${rt}`;
    sections=[
      {title:"Brief Profile",icon:"🏢",text:pf,id:"p"},
      {title:"Account Conduct",icon:"💳",text:cd,id:"c"},
      ...(secText?[{title:"Security Details",icon:"🔒",text:secText,id:"s"}]:[]),
      {title:"Ratio Analysis",icon:"📈",text:rt,id:"r"},
    ];
  }

  const blanks=(full.match(/___/g)||[]).length;
  const charLimit=2000;
  
  const condense=(text)=>{
    let t=text;
    t=t.replace(/Financial Year/g,"FY");
    t=t.replace(/approximately /g,"approx. ");
    t=t.replace(/lakhs/g,"L");
    t=t.replace(/indicating /g,"showing ");
    t=t.replace(/The firm is engaged in/g,"Engaged in");
    t=t.replace(/with favourable logistics connectivity, proximity to raw material suppliers, availability of skilled labour, and access to regional markets/g,"with good connectivity and market access");
    t=t.replace(/providing operational stability and business continuity/g,"ensuring business continuity");
    t=t.replace(/, and compliant with all statutory requirements/g,"");
    t=t.replace(/The primary raw materials include/g,"Raw materials:");
    t=t.replace(/Major buyers as per GST returns are/g,"Buyers:");
    t=t.replace(/The declared turnover as per ITR for/g,"ITR turnover for");
    t=t.replace(/credit summations up to/g,"cr. summ. up to");
    t=t.replace(/credit summations for/g,"cr. summ. for");
    t=t.replace(/annualised to approximately/g,"annualised to");
    t=t.replace(/annualised to ₹/g,"ann. ₹");
    if(t.length>charLimit){
      t=t.replace(/\n(Supported by|Acceptable as|↳)[^\n]*/g,"");
    }
    t=t.replace(/  +/g," ").replace(/\n{3,}/g,"\n\n");
    return t;
  };

  const condensedSections=sections.map(s=>({...s,condensed:s.text.length>charLimit?condense(s.text):null}));
  const overSections=condensedSections.filter(s=>s.text.length>charLimit);

  const Sec=({title,icon,text,condensed,id})=>{
    const[useCondensed,setUseCondensed]=useState(false);
    const displayText=useCondensed&&condensed?condensed:text;
    const len=displayText.length;const over=len>charLimit;
    return(<div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{icon}</span><span style={{fontSize:13,fontWeight:800,color:"var(--accent)",letterSpacing:".2px"}}>{title}</span></div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn-sm" onClick={()=>cpy(displayText,id)}>{cp===id?"✅":"📋"} Copy</button>
        <button className="btn-sm" onClick={()=>share(displayText)}>📤 Share</button>
      </div>
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <span style={{fontSize:10,fontWeight:700,color:over?"var(--red)":"var(--green)"}}>{over?"⚠ OVER LIMIT":"✓ Within limit"}</span>
      <span style={{fontSize:11,fontWeight:800,color:over?"var(--red)":"var(--green)"}}>{len.toLocaleString()} / {charLimit.toLocaleString()}</span>
    </div>
    <div style={{width:"100%",height:3,borderRadius:2,background:over?"rgba(214,48,49,0.12)":"rgba(0,184,148,0.12)",marginBottom:8,overflow:"hidden"}}>
      <div style={{width:Math.min(100,len/charLimit*100)+"%",height:"100%",borderRadius:2,background:over?"var(--red)":"var(--green)",transition:"width .3s"}}/>
    </div>
    {condensed&&<button className="btn-sm" style={{marginBottom:8,fontSize:10,padding:"5px 10px",background:useCondensed?"var(--green-bg)":"var(--amber-bg)",borderColor:useCondensed?"var(--green)":"var(--amber)",color:useCondensed?"var(--green)":"var(--amber)"}} onClick={()=>setUseCondensed(!useCondensed)}>{useCondensed?"📝 Show Full Text":"✂️ Auto-Condense ("+condense(text).length+" chars)"}</button>}
    {over&&!condensed&&<div style={{fontSize:10,color:"var(--red)",fontWeight:600,marginBottom:6}}>Bank software limit is {charLimit} chars per section. Shorten by {(len-charLimit).toLocaleString()} characters.</div>}
    <div className="wu-b">{displayText}</div>
  </div>);};

  return(<div className="page">
    <div className="card" style={{textAlign:"center",background:"var(--accent-light)",borderColor:"var(--accent-mid)"}}>
      <div style={{fontSize:22,marginBottom:4}}>📝</div>
      <div style={{fontSize:15,fontWeight:800,color:"var(--text)"}}>{isMudra?"Mudra Loan Appraisal":"Credit Appraisal Write-Up"}</div>
      <p style={{fontSize:12,color:"var(--text2)",margin:"6px 0 4px",lineHeight:1.5}}>{isMudra?"Mudra Q&A format as per bank guidelines.":"Auto-generated from your inputs. Copy sections or share."}</p>

      {overSections.length>0&&<div style={{margin:"8px 0",padding:"8px 12px",borderRadius:10,background:"var(--red-bg)",border:"1px solid rgba(214,48,49,0.2)",fontSize:11,fontWeight:700,color:"var(--red)"}}>⚠ {overSections.length} section{overSections.length>1?"s":""} over {charLimit}-char limit — tap ✂️ to auto-condense</div>}

      {blanks>0&&<p style={{fontSize:11,color:"var(--amber)",fontWeight:700,margin:"6px 0 12px"}}>⚠ {blanks} blank field{blanks>1?"s":""} remaining (shown as ___)</p>}
      <div style={{display:"flex",gap:8}}>
        <button className="btn" style={{flex:1}} onClick={()=>cpy(full,"all")}>{cp==="all"?"✅ Copied!":"📋 Copy All"}</button>
        <button className="btn" style={{flex:1,background:"linear-gradient(135deg,var(--green),#00cec9)"}} onClick={()=>share(full)}>📤 Share</button>
      </div>
      <button className="docx-btn" onClick={()=>genDoc(d,fin,ca,sett,R,full,sections)}>📄 Export Word Document & Share</button>
    </div>
    <div className="report-sections">
    {condensedSections.map(s=><Sec key={s.id} title={s.title} icon={s.icon} text={s.text} condensed={s.condensed} id={s.id}/>)}
    </div>

    <div className="report-bottom">
    {(()=>{const score=calcScore(fin,R);const risk=calcRiskGrade(score,d.cicScore);return(
      <div className="card" style={{textAlign:"center"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Overall Risk Assessment</div>
        <div className="risk-grade" style={{color:risk.color,fontSize:42}}>{risk.grade}</div>
        <span className="risk-badge" style={{background:risk.color+"18",color:risk.color,margin:"6px auto"}}>{risk.label}</span>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:8}}>Based on CIC Score ({d.cicScore||"—"}) + Ratio Health ({score||0}%)</div>
      </div>);})()}

    <Card icon="✅" title="Pre-Sanction Checklist">
      <div className="chk-grid">
      {["KYC documents verified","Stock audit / inspection done","Property valuation obtained","Insurance coverage in place","CIC report attached","Board resolution / consent obtained","Projected financials reviewed","Site visit conducted","Legal search completed","NOC from existing banker (takeover)"].map((item,i)=>{
        const ck=d.checklist||{};const key="chk_"+i;
        return(<div key={i} className="chk-row" onClick={()=>sd(p=>({...p,checklist:{...p.checklist,[key]:!p.checklist?.[key]}}))}>
          <div className={`chk-box${ck[key]?" on":""}`}>{ck[key]?"✓":""}</div>
          <div className="chk-label">{item}</div>
        </div>);
      })}
      </div>
      <div style={{marginTop:8,fontSize:11,color:"var(--text3)"}}>
        {(()=>{const ck=d.checklist||{};const done=Object.values(ck).filter(Boolean).length;return `${done}/10 items checked`;})()}
      </div>
    </Card>
    </div>
  </div>);
}

/* ═══════════ SETTINGS ═══════════ */
function SettingsView({sett,setSett,onBack,theme,setTheme}){
  const[open,setOpen]=useState({});
  const[saved,setSaved]=useState(false);
  const tog=k=>setOpen(p=>({...p,[k]:!p[k]}));
  const uFy=(k,v)=>setSett(p=>({...p,fy:{...p.fy,[k]:v}}));
  const uBk=(k,v)=>setSett(p=>({...p,bank:{...p.bank,[k]:v}}));
  const uTh=(rk,hl,v)=>setSett(p=>{const n={...p,ratios:{...p.ratios}};n.ratios[rk]={...n.ratios[rk],th:{...n.ratios[rk].th,[hl]:v===""?"":parseFloat(v)}};return n;});
  const uComm=(rk,level,v)=>setSett(p=>{const n={...p,ratios:{...p.ratios}};n.ratios[rk]={...n.ratios[rk],c:{...n.ratios[rk].c,[level]:[v]}};return n;});
  const uMit=(rk,level,v)=>setSett(p=>{const n={...p,ratios:{...p.ratios}};n.ratios[rk]={...n.ratios[rk],m:{...n.ratios[rk].m,[level]:[v]}};return n;});
  const doSave=()=>{ss("ca_settings",sett);setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const doReset=()=>{if(window.confirm("Reset all settings to defaults?")){const def=JSON.parse(JSON.stringify(DEF_SETTINGS));setSett(def);ss("ca_settings",def);}};

  return(<div className="page" style={{paddingBottom:24}}>
    {saved&&<div className="toast">✅ Settings saved!</div>}
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="icon-btn" onClick={onBack}>←</button>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>Settings</div>
    </div>

    <div className="card" style={{padding:"14px 16px",marginBottom:12}}>
      <div style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:10}}>🎨 App Theme</div>
      <div style={{display:"flex",gap:8}}>
        {[{k:"light",l:"☀️ Glass",desc:"Glassmorphism"},{k:"yono",l:"🏦 YONO",desc:"SBI Style"},{k:"dark",l:"🌙 Dark",desc:"Night Mode"}].map(t=>(
          <button key={t.k} onClick={()=>setTheme(t.k)} style={{flex:1,padding:"10px 6px",borderRadius:12,border:theme===t.k?"2px solid var(--accent)":"1.5px solid var(--card-border)",background:theme===t.k?"var(--accent-light)":"var(--card)",cursor:"pointer",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:18,marginBottom:4}}>{t.l.split(" ")[0]}</div>
            <div style={{fontSize:11,fontWeight:700,color:theme===t.k?"var(--accent)":"var(--text2)"}}>{t.desc}</div>
          </button>
        ))}
      </div>
    </div>

    <Accordion icon="📅" title="Financial Year & Dates" open={open.fy} toggle={()=>tog("fy")}>
      <In label="Previous FY Label" value={sett.fy.prev} onChange={v=>uFy("prev",v)}/>
      <In label="Current FY Label" value={sett.fy.curr} onChange={v=>uFy("curr",v)}/>
      <div className="row"><In label="Months Elapsed" value={sett.fy.months} onChange={v=>uFy("months",v)} type="number"/><In label="Annualisation Month" value={sett.fy.annMonth} onChange={v=>uFy("annMonth",v)}/></div>
    </Accordion>
    <Accordion icon="🏦" title="Bank & Branch Details" open={open.bk} toggle={()=>tog("bk")}>
      <In label="Bank Name" value={sett.bank.name} onChange={v=>uBk("name",v)} placeholder="e.g., State Bank of India"/>
      <In label="Branch Name" value={sett.bank.branch} onChange={v=>uBk("branch",v)} placeholder="e.g., Paonta Sahib"/>
      <In label="Officer Name" value={sett.bank.officer} onChange={v=>uBk("officer",v)}/>
      <In label="CIC Report Date" value={sett.bank.cicDate} onChange={v=>uBk("cicDate",v)} placeholder="e.g., 20.03.2026"/>
    </Accordion>
    <Accordion icon="🤖" title="AI Scanner (Balance Sheet)" open={open.ai} toggle={()=>tog("ai")}>
      <p style={{fontSize:11,color:"var(--text3)",marginBottom:10,lineHeight:1.5}}>Add API key(s) to scan balance sheets. All free — no billing required.</p>
      <In label="Provider" value={sett.scanProvider} onChange={v=>setSett(p=>({...p,scanProvider:v}))} options={["auto","openrouter","groq","gemini"]}/>
      <div style={{fontSize:10,color:"var(--text3)",marginBottom:10}}>Auto = tries Gemini first (works everywhere) → Groq → OpenRouter. On desktop web, only Gemini works directly.</div>
      <In label="OpenRouter Key (best for tables)" value={sett.openrouterKey} onChange={v=>setSett(p=>({...p,openrouterKey:v}))} placeholder="sk-or-v1-..."/>
      <div style={{fontSize:10,color:"var(--accent)",marginBottom:8}}>Get free key: <strong>openrouter.ai</strong> → Keys → Create Key (uses NVIDIA Nemotron VL — #1 on OCRBench)</div>
      <In label="Groq API Key" value={sett.groqKey} onChange={v=>setSett(p=>({...p,groqKey:v}))} placeholder="gsk_..."/>
      <div style={{fontSize:10,color:"var(--accent)",marginBottom:8}}>Get free key: <strong>console.groq.com</strong> → API Keys → Create</div>
      <In label="Gemini API Key (backup)" value={sett.geminiKey} onChange={v=>setSett(p=>({...p,geminiKey:v}))} placeholder="AIzaSy..."/>
      <div style={{fontSize:10,color:"var(--accent)",marginBottom:4}}>Get free key: <strong>aistudio.google.com</strong> → Get API Key</div>
      {(sett.openrouterKey||sett.groqKey||sett.geminiKey)&&<div style={{fontSize:11,color:"var(--green)",fontWeight:600,marginTop:6}}>✓ Scanner available in Financials step</div>}
    </Accordion>
    <Accordion icon="📐" title="Ratio Thresholds" open={open.th} toggle={()=>tog("th")}>
      <p style={{fontSize:11,color:"var(--text3)",marginBottom:12,lineHeight:1.5}}>Set HIGH/LOW cutoffs. Above HIGH = "High", between = "Recommended", below LOW = "Low".</p>
      {Object.keys(sett.ratios).map(k=>{const r=sett.ratios[k];return(
        <div key={k} style={{marginBottom:10,padding:"10px 12px",background:"var(--input-bg)",borderRadius:10}}>
          <div style={{fontSize:12,fontWeight:800,color:"var(--text)",marginBottom:6}}>{r.icon} {r.label}</div>
          <div className="row"><In label="High ≥" value={r.th.h} onChange={v=>uTh(k,"h",v)} type="number"/><In label="Low ≥" value={r.th.l} onChange={v=>uTh(k,"l",v)} type="number"/></div>
        </div>);})}
    </Accordion>
    <Accordion icon="💬" title="Commentary Templates (Advanced)" open={open.cm} toggle={()=>tog("cm")}>
      <p style={{fontSize:11,color:"var(--text3)",marginBottom:12,lineHeight:1.5}}>Edit auto-generated text. Use [X] as value placeholder.</p>
      {Object.keys(sett.ratios).map(k=>{const r=sett.ratios[k];return(
        <div key={k} style={{marginBottom:14,padding:12,background:"var(--input-bg)",borderRadius:10}}>
          <div style={{fontSize:12,fontWeight:800,color:"var(--text)",marginBottom:8}}>{r.icon} {r.label}</div>
          {["high","mid","low"].map(lv=>(<div key={lv} style={{marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,color:lv==="high"?"var(--green)":lv==="mid"?"var(--amber)":"var(--red)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>{lv==="high"?r.hl:lv==="mid"?r.ml:r.ll}</div>
            <textarea className="fld-i" value={r.c[lv][0]||""} onChange={e=>uComm(k,lv,e.target.value)} rows={2} style={{fontSize:12,minHeight:52}}/>
            <div style={{fontSize:9.5,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".4px",marginBottom:2,marginTop:4}}>↳ Mitigation</div>
            <textarea className="fld-i" value={r.m[lv][0]||""} onChange={e=>uMit(k,lv,e.target.value)} rows={2} style={{fontSize:12,minHeight:44}}/>
          </div>))}
        </div>);})}
    </Accordion>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
      <button className="btn" onClick={doSave}>💾 Save All Settings</button>
      <button className="btn-danger" onClick={doReset}>🔄 Reset to Defaults</button>
    </div>

    <div style={{marginTop:16}}>
      <div style={{fontSize:14,fontWeight:800,color:"var(--text)",marginBottom:10}}>📦 Data Backup & Restore</div>
      <div className="card" style={{padding:14}}>
        <p style={{fontSize:12,color:"var(--text3)",marginBottom:12,lineHeight:1.5}}>Export all appraisals + settings as a single JSON file. Import to restore on any device.</p>
        <div style={{display:"flex",gap:8}}>
          <button className="btn-sm" style={{flex:1}} onClick={()=>{
            const data={appraisals:ls("ca_appraisals",[]),settings:ls("ca_settings",{}),theme:ls("ca_theme","light"),exportDate:new Date().toISOString()};
            const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
            const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
            a.download=`CA_Backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
          }}>💾 Export All</button>
          <label className="btn-sm" style={{flex:1,cursor:"pointer",justifyContent:"center"}}>
            📂 Import
            <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=ev=>{try{
                const data=JSON.parse(ev.target.result);
                if(data.appraisals)ss("ca_appraisals",data.appraisals);
                if(data.settings)ss("ca_settings",data.settings);
                if(data.theme)ss("ca_theme",data.theme);
                if(data.dark!==undefined&&!data.theme)ss("ca_theme",data.dark?"dark":"light");
                window.location.reload();
              }catch{alert("Invalid backup file format.");}};
              reader.readAsText(file);
            }}/>
          </label>
        </div>
      </div>
    </div>
  </div>);
}

/* ═══════════ DASHBOARD (search, filter, duplicate) ═══════════ */
function Dashboard({appraisals,onNew,onOpen,onDelete,onDuplicate,sett,onCompare,onTemplates,onEmiCalc}){
  const[search,setSearch]=useState("");
  const[filter,setFilter]=useState("all");
  const total=appraisals.length;
  const avgScore=total>0?Math.round(appraisals.reduce((s,a)=>s+(a.score||0),0)/total):0;
  const filtered=appraisals.filter(a=>{
    if(search){const q=search.toLowerCase();if(!(a.name||"").toLowerCase().includes(q)&&!(a.constitution||"").toLowerCase().includes(q))return false;}
    if(filter==="healthy"&&(a.score||0)<60)return false;
    if(filter==="moderate"&&((a.score||0)<30||(a.score||0)>=60))return false;
    if(filter==="concern"&&(a.score||0)>=30)return false;
    return true;
  }).sort((a,b)=>b.updated-a.updated);
  return(<div className="page" style={{paddingBottom:100}}>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.5px"}}>Assessments</div>
      <div style={{fontSize:13,color:"var(--text3)",fontWeight:500,marginTop:2}}>Manage your credit appraisals</div>
    </div>
    <div className="dash-stat">
      <div><div className="dash-stat-n">{total}</div><div className="dash-stat-l">Total</div></div>
      <div><div className="dash-stat-n" style={{color:"var(--green)"}}>{total>0?avgScore+"%":"—"}</div><div className="dash-stat-l">Avg Score</div></div>
      <div><div className="dash-stat-n" style={{color:"var(--accent)"}}>{appraisals.filter(a=>(a.score||0)>=60).length}</div><div className="dash-stat-l">Healthy</div></div>
    </div>
    {total>0&&<>
      <div className="search-wrap"><span className="search-icon">🔍</span><input className="search-i" placeholder="Search by name or constitution..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="filter-row">
        {[{k:"all",l:"All"},{k:"healthy",l:"✓ Healthy"},{k:"moderate",l:"⚠ Moderate"},{k:"concern",l:"✕ Concern"}].map(f=>(
          <button key={f.k} className={`filter-chip${filter===f.k?" active":""}`} onClick={()=>setFilter(f.k)}>{f.l}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:10,marginBottom:16}}>
        <button className="dash-action-btn" onClick={onCompare}>
          <div className="dash-action-icon">📊</div>
          <div>Compare</div>
        </button>
        <button className="dash-action-btn" onClick={onTemplates}>
          <div className="dash-action-icon">📄</div>
          <div>Templates</div>
        </button>
        <button className="dash-action-btn" onClick={onEmiCalc}>
          <div className="dash-action-icon">🧮</div>
          <div>EMI Calc</div>
        </button>
      </div>
    </>}
    {total===0?(<div className="empty-state">
      <div style={{fontSize:52,marginBottom:12}}>📂</div>
      <div style={{fontSize:17,fontWeight:800,color:"var(--text)"}}>No assessments yet</div>
      <div style={{fontSize:13,color:"var(--text3)",marginTop:6,lineHeight:1.6}}>Tap the + button below to start<br/>your first credit appraisal.</div>
    </div>):(filtered.length===0?(<div className="empty-state"><div style={{fontSize:36,marginBottom:8}}>🔍</div><div style={{fontSize:14,fontWeight:700,color:"var(--text3)"}}>No matches found</div></div>):(
      <div className="dash-grid">
      {filtered.map(a=>{
        const scoreCol=(a.score||0)>=60?"var(--green)":(a.score||0)>=30?"var(--amber)":"var(--red)";
        const scoreBg=(a.score||0)>=60?"var(--green-bg)":(a.score||0)>=30?"var(--amber-bg)":"var(--red-bg)";
        return(<div className="dash-item" key={a.id} onClick={()=>onOpen(a.id)}>
          <div className="dash-item-avatar">{(a.name||"?")[0].toUpperCase()}</div>
          <div className="dash-item-info">
            <div className="dash-item-name">{a.name||"Untitled"}</div>
            <div className="dash-item-meta">{a.constitution||"—"} • {new Date(a.updated).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
          </div>
          {a.score!==null&&<div className="dash-score" style={{color:scoreCol,background:scoreBg}}>{a.score}%</div>}
          <button className="dash-dup" title="Duplicate" onClick={e=>{e.stopPropagation();onDuplicate(a.id);}}>📋</button>
          <button className="icon-btn" style={{width:32,height:32,fontSize:13,flexShrink:0}} onClick={e=>{e.stopPropagation();onDelete(a.id);}}>🗑</button>
        </div>);})}
      </div>
    ))}
    <button className="fab" onClick={onNew}>+</button>
  </div>);
}

/* ═══════════ DOCX GENERATION (HTML-based .doc) ═══════════ */
function generateDoc(d,fin,ca,sett,R,fullText,sections){
  const bk=sett.bank;const fy=sett.fy;
  const rk=Object.keys(R).filter(k=>fin[k]!==""&&fin[k]!==undefined&&!isNaN(fin[k]));
  const ratioRows=rk.map(k=>{const r=R[k];const l=cls(k,+fin[k],R);const col=rc(k,l,R);const lb=l==="high"?r.hl:l==="mid"?r.ml:r.ll;return`<tr><td style="padding:6px 10px;border:1px solid #ddd;font-size:12px;">${r.icon} ${r.label}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-weight:bold;font-size:12px;">${fv(k,+fin[k],R)}${fsu(k,R)}</td><td style="padding:6px 10px;border:1px solid #ddd;text-align:center;font-size:11px;color:${col};font-weight:bold;">${lb}</td></tr>`;}).join("");
  const html=`<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:13px;color:#1a1a1a;line-height:1.7;margin:40px;}h1{font-size:18px;text-align:center;color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px;}h2{font-size:14px;color:#1e3a5f;margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:4px;}p{margin:8px 0;text-align:justify;}.header-table{width:100%;border-collapse:collapse;margin-bottom:20px;}.header-table td{padding:4px 8px;font-size:12px;}table.ratios{width:100%;border-collapse:collapse;margin:12px 0;}table.ratios th{background:#1e3a5f;color:#fff;padding:8px 10px;font-size:11px;text-align:left;border:1px solid #1e3a5f;}table.ratios td{border:1px solid #ddd;}.footer{margin-top:40px;font-size:11px;color:#666;border-top:1px solid #ccc;padding-top:12px;}</style></head><body>
<h1>${bk.name||"BANK NAME"}<br/><span style="font-size:13px;font-weight:normal;">${bk.branch?bk.branch+" Branch":""}</span></h1>
<table class="header-table"><tr><td><b>Borrower:</b> ${d.name||"___"}</td><td><b>Constitution:</b> ${d.constitution||"___"}</td></tr><tr><td><b>Activity:</b> ${d.activity||"___"}</td><td><b>Proposal:</b> ${d.proposal||"___"}</td></tr><tr><td><b>UDYAM:</b> ${d.udyamState?"UDYAM-"+d.udyamState+"-"+d.udyamDist+"-"+d.udyamNum:(d.udyam||"___")}</td><td><b>CIC Score:</b> ${d.cicScore||"___"}</td></tr>${d.isMudra==="YES"?`<tr><td colspan="2"><b>Scheme:</b> PMMY Mudra | Covered under CGFMU</td></tr>`:""}</table>
${sections.map(s=>`<h2>${s.title}</h2><p>${s.text.replace(/\n/g,"<br/>")}</p>`).join("")}
${rk.length>0?`<h2>📈 Financial Ratio Analysis</h2><table class="ratios"><tr><th>Ratio</th><th>Value</th><th>Assessment</th></tr>${ratioRows}</table>`:""}
<div class="footer"><p><b>Appraised by:</b> ${bk.officer||"___"} | <b>Branch:</b> ${bk.branch||"___"} | <b>Date:</b> ${new Date().toLocaleDateString("en-IN")}</p></div></body></html>`;
  const blob=new Blob(['\ufeff'+html],{type:"application/msword;charset=utf-8"});
  const fname=`CreditAppraisal_${(d.name||"Report").replace(/[^a-zA-Z0-9]/g,"_")}_${new Date().toISOString().slice(0,10)}.doc`;
  const doDownload=()=>{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fname;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(url),5000);};
  if(navigator.share&&navigator.canShare){
    try{const file=new File([blob],fname,{type:"application/msword"});if(navigator.canShare({files:[file]})){navigator.share({files:[file],title:"Credit Appraisal: "+(d.name||"Report")}).catch(doDownload);}else{doDownload();}}catch(e){doDownload();}
  } else {doDownload();}
}

/* ═══════════ COMPARISON VIEW ═══════════ */
function CompareView({appraisals,onBack,R}){
  const[sel,setSel]=useState([]);
  const toggle=(id)=>setSel(p=>p.includes(id)?p.filter(x=>x!==id):p.length<3?[...p,id]:p);
  const chosen=appraisals.filter(a=>sel.includes(a.id));
  const fields=[["Entity","name"],["Constitution","constitution"],["Proposal","proposal"],["CIC Score","cicScore"],["Annualised Sales","annualisedSales"],["Overall Conduct","overallConduct"]];
  const ratioKeys=Object.keys(R);
  return(<div className="page" style={{paddingBottom:24}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="icon-btn" onClick={onBack}>←</button>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>Compare Appraisals</div>
    </div>
    <p style={{fontSize:12,color:"var(--text3)",marginBottom:12}}>Select 2–3 appraisals to compare side-by-side.</p>
    <div className="cmp-sel">{appraisals.map(a=>(<button key={a.id} className={`cmp-chip${sel.includes(a.id)?" sel":""}`} onClick={()=>toggle(a.id)}>{a.name||"Untitled"}</button>))}</div>
    {chosen.length>=2&&<>
      <Card icon="📋" title="Entity Comparison">
        <div className="cmp-row" style={{gridTemplateColumns:`1.2fr repeat(${chosen.length},1fr)`}}><div/>{chosen.map(a=><div key={a.id} className="cmp-head">{(a.name||"?").slice(0,12)}</div>)}</div>
        {fields.map(([label,key])=>(<div key={key} className="cmp-row" style={{gridTemplateColumns:`1.2fr repeat(${chosen.length},1fr)`}}><div className="cmp-label">{label}</div>{chosen.map(a=><div key={a.id} className="cmp-val">{a.d?.[key]||"—"}</div>)}</div>))}
      </Card>
      <Card icon="📈" title="Ratio Comparison">
        <div className="cmp-row" style={{gridTemplateColumns:`1.2fr repeat(${chosen.length},1fr)`}}><div/>{chosen.map(a=><div key={a.id} className="cmp-head">{(a.name||"?").slice(0,12)}</div>)}</div>
        {ratioKeys.map(k=>{const r=R[k];return(<div key={k} className="cmp-row" style={{gridTemplateColumns:`1.2fr repeat(${chosen.length},1fr)`}}><div className="cmp-label">{r.icon} {r.label}</div>{chosen.map(a=>{const v=a.fin?.[k];const hasV=v!==""&&v!==undefined&&!isNaN(v);return<div key={a.id} className="cmp-val" style={hasV?{color:rc(k,cls(k,+v,R),R)}:{}}>{hasV?fv(k,+v,R)+fsu(k,R):"—"}</div>;})}</div>);})}
      </Card>
      <Card icon="🎯" title="Risk Grade">
        <div className="cmp-row" style={{gridTemplateColumns:`1.2fr repeat(${chosen.length},1fr)`}}><div className="cmp-label">Grade</div>{chosen.map(a=>{const risk=calcRiskGrade(a.score,a.d?.cicScore);return<div key={a.id} className="cmp-val"><span className="risk-badge" style={{background:risk.color+"18",color:risk.color}}>{risk.grade} — {risk.label}</span></div>;})}</div>
      </Card>
    </>}
  </div>);
}

/* ═══════════ EMI CALCULATOR ═══════════ */
function EmiCalculator({onBack}){
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [tenure, setTenure] = useState("");
  
  const p = parseFloat(principal);
  const r = parseFloat(rate) / 12 / 100;
  const n = parseFloat(tenure);
  
  let emi = 0;
  let totalInterest = 0;
  let totalPayment = 0;
  const schedule = [];
  
  if (p > 0 && r > 0 && n > 0) {
    emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    totalPayment = emi * n;
    totalInterest = totalPayment - p;
    
    let balance = p;
    for (let i = 1; i <= Math.min(n, 360); i++) {
      const interest = balance * r;
      const principalPaid = emi - interest;
      balance -= principalPaid;
      if (balance < 0) balance = 0;
      schedule.push({
        month: i,
        emi: Math.round(emi),
        principal: Math.round(principalPaid),
        interest: Math.round(interest),
        balance: Math.round(balance)
      });
    }
  }

  return (<div className="page" style={{paddingBottom:24}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="icon-btn" onClick={onBack}>←</button>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>EMI & Amortization</div>
    </div>
    <Card icon="🧮" title="Loan Details">
      <In label="Loan Amount (₹)" value={principal} onChange={setPrincipal} type="number" placeholder="e.g. 500000" />
      <div className="row">
        <In label="Interest Rate (% p.a.)" value={rate} onChange={setRate} type="number" placeholder="e.g. 10.5" />
        <In label="Tenure (Months)" value={tenure} onChange={setTenure} type="number" placeholder="e.g. 60" />
      </div>
    </Card>
    
    {emi > 0 && (
      <>
        <Card icon="📊" title="Repayment Summary">
          <div className="dash-stat">
            <div>
              <div className="dash-stat-n" style={{color:"var(--accent)", fontSize:18}}>₹{Math.round(emi).toLocaleString("en-IN")}</div>
              <div className="dash-stat-l">Monthly EMI</div>
            </div>
            <div>
              <div className="dash-stat-n" style={{fontSize:15}}>₹{Math.round(totalInterest).toLocaleString("en-IN")}</div>
              <div className="dash-stat-l">Total Interest</div>
            </div>
            <div>
              <div className="dash-stat-n" style={{fontSize:15}}>₹{Math.round(totalPayment).toLocaleString("en-IN")}</div>
              <div className="dash-stat-l">Total Payment</div>
            </div>
          </div>
        </Card>
        <Card icon="📅" title="Amortization Schedule">
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,textAlign:"right"}}>
              <thead>
                <tr style={{borderBottom:"1px solid var(--border)",color:"var(--text3)"}}>
                  <th style={{padding:"8px 4px",textAlign:"center"}}>Month</th>
                  <th style={{padding:"8px 4px"}}>Principal</th>
                  <th style={{padding:"8px 4px"}}>Interest</th>
                  <th style={{padding:"8px 4px"}}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => (
                  <tr key={row.month} style={{borderBottom:"1px solid var(--border-light)"}}>
                    <td style={{padding:"8px 4px",textAlign:"center",color:"var(--text3)"}}>{row.month}</td>
                    <td style={{padding:"8px 4px",color:"var(--green)"}}>₹{row.principal.toLocaleString("en-IN")}</td>
                    <td style={{padding:"8px 4px",color:"var(--amber)"}}>₹{row.interest.toLocaleString("en-IN")}</td>
                    <td style={{padding:"8px 4px",fontWeight:600}}>₹{row.balance.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    )}
  </div>);
}

/* ═══════════ TEMPLATE LIBRARY ═══════════ */
function TemplateView({templates,onUse,onDelete,onSave,onBack,appraisals}){
  const[showSave,setShowSave]=useState(false);
  const[tplName,setTplName]=useState("");
  const[srcId,setSrcId]=useState("");
  const doSave=()=>{if(!tplName||!srcId)return;const src=appraisals.find(a=>a.id===srcId);if(!src)return;const tpl={id:Date.now().toString(36),name:tplName,d:{...src.d,name:"",partners:"",prevPartners:"",proprietorFather:"",cicScore:"",udyam:"",gst:"",address:"",checklist:{}},fin:{...EMPTY_FIN},created:Date.now()};onSave(tpl);setShowSave(false);setTplName("");setSrcId("");};
  return(<div className="page" style={{paddingBottom:24}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="icon-btn" onClick={onBack}>←</button>
      <div style={{fontSize:18,fontWeight:800,color:"var(--text)"}}>Templates</div>
    </div>
    <p style={{fontSize:12,color:"var(--text3)",marginBottom:14,lineHeight:1.5}}>Save appraisals as reusable templates. Entity-specific data is stripped — only structural fields are kept.</p>
    {!showSave?<button className="btn" onClick={()=>setShowSave(true)}>+ Create Template</button>:(
      <div className="card">
        <In label="Template Name" value={tplName} onChange={setTplName} placeholder="e.g., Standard CC Renewal"/>
        <div className="fld"><label className="fld-l">Based On</label>
          <select className="fld-i" value={srcId} onChange={e=>setSrcId(e.target.value)}>
            <option value="">Select appraisal...</option>
            {appraisals.map(a=><option key={a.id} value={a.id}>{a.name||"Untitled"} — {a.constitution||"N/A"}</option>)}
          </select>
        </div>
        <div className="row"><button className="btn" onClick={doSave}>💾 Save Template</button><button className="btn-ghost" onClick={()=>setShowSave(false)}>Cancel</button></div>
      </div>
    )}
    <div style={{marginTop:14}}>{templates.length===0?<div className="empty-state"><div style={{fontSize:36,marginBottom:8}}>📄</div><div style={{fontSize:14,fontWeight:700,color:"var(--text3)"}}>No templates yet</div></div>:(
      templates.map(t=>(<div className="tpl-item" key={t.id} onClick={()=>onUse(t)}>
        <div className="tpl-icon">📄</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}</div>
          <div style={{fontSize:11,color:"var(--text3)"}}>{t.d?.constitution||"—"} • {t.d?.proposal||"—"} • {new Date(t.created).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
        </div>
        <button className="icon-btn" style={{width:32,height:32,fontSize:13,flexShrink:0}} onClick={e=>{e.stopPropagation();onDelete(t.id);}}>🗑</button>
      </div>))
    )}</div>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP — Orchestrator
   ═══════════════════════════════════════════════════════════════ */
const STEPS = [{e:"🏢",l:"Entity"},{e:"📋",l:"Proposal"},{e:"📊",l:"Financials"},{e:"📈",l:"Ratios"},{e:"📝",l:"Report"}];

export default function App(){
  const[theme,setTheme]=useState(()=>ls("ca_theme","light"));
  useEffect(()=>{const oldDark=ls("ca_dark",null);if(oldDark===true&&theme==="light"){setTheme("dark");ss("ca_theme","dark");}},[]);
  const[view,setView]=useState("dashboard");
  const[step,setStep]=useState(0);
  const[appraisals,setAppraisals]=useState(()=>ls("ca_appraisals",[]));
  const[currentId,setCurrentId]=useState(null);
  const[d,sd]=useState({...EMPTY_D});
  const[fin,sf]=useState({...EMPTY_FIN});
  const[ca,sca]=useState({});
  const[sett,setSett]=useState(()=>loadSettings());
  const[templates,setTemplates]=useState(()=>ls("ca_templates",[]));
  const R=sett.ratios;
  const saveTimer=useRef(null);
  const[saveStatus,setSaveStatus]=useState("saved");

  useEffect(()=>{document.documentElement.setAttribute("data-theme",theme);ss("ca_theme",theme);},[theme]);

  useEffect(()=>{if(view==="editor"&&currentId)setSaveStatus("dirty");},[d,fin]);

  useEffect(()=>{
    if(view!=="editor"||!currentId)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    setSaveStatus("dirty");
    saveTimer.current=setTimeout(()=>{
      setSaveStatus("saving");
      setAppraisals(prev=>{
        const score=calcScore(fin,R);
        const next=prev.map(a=>a.id===currentId?{...a,name:d.name||"Untitled",constitution:d.constitution,d:{...d},fin:{...fin},score,updated:Date.now()}:a);
        ss("ca_appraisals",next);
        return next;
      });
      setTimeout(()=>setSaveStatus("saved"),400);
    },2000);
    return()=>{if(saveTimer.current)clearTimeout(saveTimer.current);};
  },[d,fin,view,currentId,R]);

  useEffect(()=>{const nc={};Object.keys(R).forEach(k=>{if(fin[k]!==""&&fin[k]!==undefined&&!isNaN(fin[k])){if(ca[k]&&ca[k]._v===fin[k]&&ca[k]._th===JSON.stringify(R[k].th))nc[k]=ca[k];else{const c=gc(k,+fin[k],R);if(c)nc[k]={...c,_v:fin[k],_th:JSON.stringify(R[k].th)};}}});sca(nc);},[fin,R]);

  const calc=useCallback(()=>{
    const n={...fin};
    if((n.ebit===""||n.ebit===undefined)&&n.netProfit!==""&&n.intExp!==""){
      n.ebit=+((+n.netProfit||0)+(+n.intExp||0)+(+n.dep||0)).toFixed(2);
    }
    if((n.capEmployed===""||n.capEmployed===undefined)&&n.ca!==""&&n.cl!==""){
      n.capEmployed=+((+n.ca||0)+(+n.fixedAssets||0)-(+n.cl||0)).toFixed(2);
    }
    if((n.prevEbit===""||n.prevEbit===undefined)&&n.prevNetProfit!==""&&n.prevIntExp!==""){
      n.prevEbit=+((+n.prevNetProfit||0)+(+n.prevIntExp||0)+(+n.prevDep||0)).toFixed(2);
    }
    if((n.prevCapEmployed===""||n.prevCapEmployed===undefined)&&n.prevCa!==""&&n.prevCl!==""){
      n.prevCapEmployed=+((+n.prevCa||0)+(+n.prevFixedAssets||0)-(+n.prevCl||0)).toFixed(2);
    }
    if(n.ca&&n.cl)n.currentRatio=+(n.ca/n.cl).toFixed(2);
    if(n.tol&&n.tnw)n.tolTnw=+(n.tol/n.tnw).toFixed(2);
    if(n.netProfit!==""&&n.dep!==""&&n.intExp!==""&&n.principalRepay!==""){const a=(+n.netProfit||0)+(+n.dep||0)+(+n.intExp||0),b=(+n.principalRepay||0)+(+n.intExp||0);if(b>0)n.dscr=+(a/b).toFixed(2);}
    if(n.ebit&&n.intExp)n.icr=+(n.ebit/n.intExp).toFixed(2);
    if(n.netProfit!==""&&n.netSales)n.npm=+((n.netProfit/n.netSales)*100).toFixed(1);
    if(n.netSales&&n.avgInv)n.invTurnover=+(n.netSales/n.avgInv).toFixed(1);
    if(n.tradeRecv!==""&&n.netSales)n.recvDays=+((n.tradeRecv/n.netSales)*365).toFixed(0);
    if(n.ebit&&n.capEmployed)n.roce=+((n.ebit/n.capEmployed)*100).toFixed(1);
    if(n.ltd!==""&&n.tnw)n.debtEquity=+(n.ltd/n.tnw).toFixed(2);
    if(n.fixedAssets&&n.ltd!==""&&n.tnw)n.facr=+(n.fixedAssets/((+n.ltd||0)+(+n.tnw||0))).toFixed(2);
    sf(n);
  },[fin]);

  const openNew=()=>{
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const newA={id,name:"",constitution:"",d:{...EMPTY_D},fin:{...EMPTY_FIN},score:null,updated:Date.now()};
    const next=[...appraisals,newA];
    setAppraisals(next);ss("ca_appraisals",next);
    setCurrentId(id);sd({...EMPTY_D});sf({...EMPTY_FIN});sca({});setStep(0);setView("editor");
  };
  const openExisting=(id)=>{
    const a=appraisals.find(x=>x.id===id);
    if(!a)return;
    setCurrentId(id);sd(a.d||{...EMPTY_D});sf(a.fin||{...EMPTY_FIN});sca({});setStep(0);setView("editor");
  };
  const deleteAppraisal=(id)=>{
    if(!window.confirm("Delete this appraisal?"))return;
    const next=appraisals.filter(a=>a.id!==id);
    setAppraisals(next);ss("ca_appraisals",next);
  };
  const duplicateAppraisal=(id)=>{
    const src=appraisals.find(a=>a.id===id);
    if(!src)return;
    const newId=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const dup={...JSON.parse(JSON.stringify(src)),id:newId,name:(src.name||"Untitled")+" (Copy)",updated:Date.now()};
    const next=[...appraisals,dup];
    setAppraisals(next);ss("ca_appraisals",next);
  };
  const saveTemplate=(tpl)=>{const next=[...templates,tpl];setTemplates(next);ss("ca_templates",next);};
  const deleteTemplate=(id)=>{const next=templates.filter(t=>t.id!==id);setTemplates(next);ss("ca_templates",next);};
  const openFromTemplate=(tpl)=>{
    const id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const newA={id,name:"",constitution:tpl.d?.constitution||"",d:{...EMPTY_D,...(tpl.d||{})},fin:{...EMPTY_FIN,...(tpl.fin||{})},score:null,updated:Date.now()};
    const next=[...appraisals,newA];
    setAppraisals(next);ss("ca_appraisals",next);
    setCurrentId(id);sd(newA.d);sf(newA.fin);sca({});setStep(0);setView("editor");
  };
  const backToDash=()=>{
    if(currentId){
      const score=calcScore(fin,R);
      const next=appraisals.map(a=>a.id===currentId?{...a,name:d.name||"Untitled",constitution:d.constitution,d:{...d},fin:{...fin},score,updated:Date.now()}:a);
      setAppraisals(next);ss("ca_appraisals",next);
    }
    setView("dashboard");setCurrentId(null);
  };

  const pct=stepComplete(step,d,fin);
  const pctColor=pct>=80?"var(--green)":pct>=40?"var(--amber)":"var(--red)";

  return(<>
    <style>{CSS}</style>
    <div className="shell">
      <div className="hdr"><div className="hdr-row">
        <div className="hdr-brand">
          {view==="editor"&&<button className="icon-btn" onClick={backToDash} style={{width:34,height:34,fontSize:14}}>←</button>}
          <div className="hdr-logo">CA</div>
          <div><div className="hdr-title">{sett.bank.name||"Credit Appraisal"}</div><div className="hdr-sub">{sett.bank.branch||"Financial Assessment Tool"}</div></div>
        </div>
        <div className="hdr-actions">
          {view==="editor"&&<div style={{fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:8,background:saveStatus==="saved"?"var(--green-bg)":saveStatus==="saving"?"var(--amber-bg)":"transparent",color:saveStatus==="saved"?"var(--green)":saveStatus==="saving"?"var(--amber)":"var(--text3)",transition:"all .3s",whiteSpace:"nowrap"}}>{saveStatus==="saved"?"✓ Saved":saveStatus==="saving"?"Saving...":"●"}</div>}
          <button className="icon-btn" onClick={()=>setTheme(t=>t==="light"?"yono":t==="yono"?"dark":"light")} title={theme==="light"?"Switch to YONO":theme==="yono"?"Switch to Dark":"Switch to Light"}>{theme==="light"?"☀️":theme==="yono"?"🏦":"🌙"}</button>
          <button className="icon-btn" onClick={()=>setView("settings")}>⚙️</button>
        </div>
      </div></div>

      {view==="editor"&&<>
        <div className="stepper">
          {STEPS.map((s,i)=><div key={i} style={{display:"contents"}}>
            <div className={`step-dot${i===step?" active":i<step?" done":""}`} onClick={()=>setStep(i)}>{i<step?"✓":i+1}</div>
            {i<STEPS.length-1&&<div className={`step-line${i<step?" done":""}`}/>}
          </div>)}
        </div>
        <div className="step-title">{STEPS[step].e} {STEPS[step].l}</div>
        {step<3&&<div className="step-pct" style={{color:pctColor}}>{pct}% complete</div>}
      </>}

      {view==="dashboard"&&<Dashboard appraisals={appraisals} onNew={openNew} onOpen={openExisting} onDelete={deleteAppraisal} onDuplicate={duplicateAppraisal} sett={sett} onCompare={()=>setView("compare")} onTemplates={()=>setView("templates")} onEmiCalc={()=>setView("emi")}/>}
      {view==="settings"&&<SettingsView sett={sett} setSett={setSett} onBack={()=>setView(currentId?"editor":"dashboard")} theme={theme} setTheme={setTheme}/>}
      {view==="compare"&&<CompareView appraisals={appraisals} onBack={()=>setView("dashboard")} R={R}/>}
      {view==="templates"&&<TemplateView templates={templates} appraisals={appraisals} onUse={(tpl)=>{openFromTemplate(tpl);}} onDelete={deleteTemplate} onSave={saveTemplate} onBack={()=>setView("dashboard")}/>}
      {view==="emi"&&<EmiCalculator onBack={()=>setView("dashboard")}/>}
      {view==="editor"&&<>
        {step===0&&<StepEntity d={d} s={sd}/>}
        {step===1&&<StepProposal d={d} s={sd} sett={sett}/>}
        {step===2&&<StepFinancials fin={fin} sf={sf} calc={calc} sett={sett}/>}
        {step===3&&<StepRatios fin={fin} ca={ca} R={R}/>}
        {step===4&&<StepReport d={d} fin={fin} ca={ca} sett={sett} R={R} sd={sd} genDoc={generateDoc}/>}

        <div className="nav-row">
          {step>0?<button className="btn-ghost" onClick={()=>setStep(step-1)}>← Back</button>:<button className="btn-ghost" onClick={backToDash}>✕ Close</button>}
          {step<4?<button className="btn" onClick={()=>{if(step===2)calc();setStep(step+1);}}>Next →</button>:<button className="btn" style={{background:"linear-gradient(135deg,var(--green),#00cec9)"}} onClick={backToDash}>✓ Done</button>}
        </div>
      </>}
    </div>
  </>);
}
