import { useRef, useState } from "react";
import { LayoutDashboard, MousePointer2, FileText, Braces, Shapes, Table2, Plus, Upload, Eye, Save, Type, Image as ImageIcon, Square, GripVertical, Trash2, Copy, Pencil, FolderOpen, CheckCircle2 } from "lucide-react";
import type { MouseEvent, DragEvent, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import type { Section, CanvasElement, DocumentTemplate, DynamicField } from "./types";
import { dynamicFields as initialFields, initialElements } from "./data";

const nav: [Section,string,any][]=[["dashboard","Tableau de bord",LayoutDashboard],["editor","Éditeur visuel",MousePointer2],["templates","Gestion des modèles",FileText],["fields","Champs dynamiques",Braces],["elements","Éléments du document",Shapes],["excel","Import Excel",Table2]];
const palette=[["text","Texte",Type],["image","Image",ImageIcon],["shape","Forme",Square]];
const MM_PX=5; const CARD_W=425,CARD_H=270,GRID=5;
const CARD_FORMATS=[{id:"business",label:"Carte 85 × 54 mm",width:85,height:54},{id:"badge",label:"Badge 90 × 60 mm",width:90,height:60},{id:"a6",label:"A6 148 × 105 mm",width:148,height:105},{id:"custom",label:"Personnalisé",width:85,height:54}];
const starterTemplates:DocumentTemplate[]=[
{id:"tpl-1",name:"Carte professionnelle",description:"Carte d'identification professionnelle",width:85,height:54,updatedAt:"Aujourd'hui",elements:initialElements},
{id:"tpl-2",name:"Badge événement",description:"Badge nominatif pour événement",width:85,height:54,updatedAt:"Aujourd'hui",elements:initialElements.slice(0,3)}
];

function App(){
 const[s,setS]=useState<Section>("editor");const[e,setE]=useState<CanvasElement[]>(initialElements);const[sel,setSel]=useState("e3");const[saved,setSaved]=useState(false); const[format,setFormat]=useState("business"); const[customW,setCustomW]=useState(85); const[customH,setCustomH]=useState(54);
 const[templates,setTemplates]=useState<DocumentTemplate[]>(starterTemplates);const[activeTemplate,setActiveTemplate]=useState("tpl-1");const[fields,setFields]=useState<DynamicField[]>(initialFields);
 const[rows,setRows]=useState<Record<string,unknown>[]>([]); const activeFormat=CARD_FORMATS.find(f=>f.id===format)??CARD_FORMATS[0]; const cardMmW=format==="custom"?customW:activeFormat.width; const cardMmH=format==="custom"?customH:activeFormat.height;const[fileName,setFileName]=useState("");const[selectedRow,setSelectedRow]=useState(0);const[preview,setPreview]=useState(false);const[bulk,setBulk]=useState(false);const[generated,setGenerated]=useState<Record<string,unknown>[]>([]);
 const add=(type:CanvasElement["type"],label:string,fieldKey?:string,x=100,y=150)=>{const id="e"+Date.now();setE(v=>[...v,{id,type,label,x,y,width:type==="image"?75:130,height:type==="image"?92:28,fontSize:13,fontWeight:"600",align:"left",fieldKey}]);setSel(id)};
 const update=(id:string,p:Partial<CanvasElement>)=>setE(v=>v.map(x=>x.id===id?{...x,...p}:x));const remove=()=>{setE(v=>v.filter(x=>x.id!==sel));setSel("")};
 const saveTemplate=()=>{setTemplates(v=>v.map(t=>t.id===activeTemplate?{...t,elements:e,updatedAt:"À l'instant"}:t));setSaved(true);setTimeout(()=>setSaved(false),1500)};
 const openTemplate=(id:string)=>{const t=templates.find(x=>x.id===id);if(!t)return;setActiveTemplate(id);setE(t.elements.map(x=>({...x})));setSel(t.elements[0]?.id??"");setS("editor")};
 const createTemplate=()=>{const id="tpl-"+Date.now();const t:DocumentTemplate={id,name:"Nouveau modèle",description:"Nouveau modèle de document",width:85,height:54,updatedAt:"À l'instant",elements:[]};setTemplates(v=>[...v,t]);setActiveTemplate(id);setE([]);setSel("");setS("editor")};
 const renameTemplate=(id:string)=>{const old=templates.find(t=>t.id===id);if(!old)return;const name=window.prompt("Nom du modèle",old.name);if(name?.trim())setTemplates(v=>v.map(t=>t.id===id?{...t,name:name.trim(),updatedAt:"À l'instant"}:t))};
 const duplicateTemplate=(id:string)=>{const source=templates.find(t=>t.id===id);if(!source)return;const copy:DocumentTemplate={...source,id:"tpl-"+Date.now(),name:source.name+" — Copie",updatedAt:"À l'instant",elements:source.elements.map(x=>({...x,id:x.id+"-copy"}))};setTemplates(v=>[...v,copy])};
 const deleteTemplate=(id:string)=>{if(templates.length<=1)return;setTemplates(v=>v.filter(t=>t.id!==id));if(activeTemplate===id){const next=templates.find(t=>t.id!==id);if(next){setActiveTemplate(next.id);setE(next.elements.map(x=>({...x})));setSel(next.elements[0]?.id??"")}}};
 const importExcel=(ev:ChangeEvent<HTMLInputElement>)=>{const file=ev.target.files?.[0];if(!file)return;setFileName(file.name);const reader=new FileReader();reader.onload=event=>{try{const data=new Uint8Array(event.target?.result as ArrayBuffer);const wb=XLSX.read(data,{type:"array"});const sheet=wb.Sheets[wb.SheetNames[0]];const json=XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet,{defval:""});setRows(json);const headers=json.length?Object.keys(json[0]):[];const generated:DynamicField[]=headers.map((h,i)=>{const key=h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")||"champ_"+(i+1);const sample=json.find(r=>String(r[h]).trim()!=="")?.[h];const type=typeof sample==="number"?"number":"text";return{id:"excel-"+i+"-"+Date.now(),label:h,key,type}});setFields(prev=>{const map=new Map(prev.map(f=>[f.key,f]));generated.forEach(f=>{if(!map.has(f.key))map.set(f.key,f)});return[...map.values()]});}catch{setRows([])}};reader.readAsArrayBuffer(file);ev.target.value=""};
 return <div className="app"><aside className="sidebar"><div className="brand"><div className="logo">A</div><div><strong>Apitah</strong><span>Document Studio</span></div></div><nav>{nav.map(([id,label,I])=><button key={id} className={s===id?"nav-item active":"nav-item"} onClick={()=>setS(id)}><I size={18}/><span>{label}</span>{id==="fields"&&<em>{fields.length}</em>}</button>)}</nav></aside><main><header><div><small>Projets / {templates.find(t=>t.id===activeTemplate)?.name}</small><h1>{nav.find(n=>n[0]===s)?.[1]}</h1></div><div className="actions"><button onClick={()=>setPreview(true)}><Eye size={16}/> Aperçu</button><button className="bulk-btn" disabled={!rows.length} onClick={()=>{setGenerated(rows.map(row=>({...row})));setBulk(true)}}>Générer toutes les cartes</button><button className="dark" onClick={saveTemplate}><Save size={16}/>{saved?"Enregistré":"Enregistrer"}</button></div></header>{s==="editor"?<Editor e={e} sel={sel} setSel={setSel} add={add} update={update} remove={remove} fields={fields} cardMmW={cardMmW} cardMmH={cardMmH}/>:s==="templates"?<Templates templates={templates} active={activeTemplate} open={openTemplate} create={createTemplate} rename={renameTemplate} duplicate={duplicateTemplate} remove={deleteTemplate}/>:s==="excel"?<ExcelPage fileName={fileName} rows={rows} importExcel={importExcel}/>:<Page section={s} add={add} fields={fields}/>}</main></div>
}

function Editor({e,sel,setSel,add,update,remove,fields}:{e:CanvasElement[];sel:string;setSel:(x:string)=>void;add:(t:CanvasElement["type"],l:string,k?:string,x?:number,y?:number)=>void;update:(id:string,p:Partial<CanvasElement>)=>void;remove:()=>void;fields:DynamicField[]}){
 const cardW=cardMmW*MM_PX,cardH=cardMmH*MM_PX; const drag=useRef<{id:string;ox:number;oy:number}|null>(null),resize=useRef<{id:string;startX:number;startY:number,startW:number,startH:number}|null>(null),dropType=useRef<{type:CanvasElement["type"];label:string;fieldKey?:string}|null>(null);const selected=e.find(x=>x.id===sel);
 const start=(ev:MouseEvent,id:string)=>{ev.stopPropagation();const x=e.find(a=>a.id===id)!;drag.current={id,ox:ev.clientX-x.x,oy:ev.clientY-x.y};setSel(id)};
 const move=(ev:MouseEvent)=>{if(drag.current){const d=drag.current,item=e.find(a=>a.id===d.id);if(item){const x=Math.round((ev.clientX-d.ox)/GRID)*GRID,y=Math.round((ev.clientY-d.oy)/GRID)*GRID;update(d.id,{x:Math.max(0,Math.min(cardW-item.width,x)),y:Math.max(0,Math.min(cardH-item.height,y))})}}if(resize.current){const r=resize.current,item=e.find(a=>a.id===r.id);if(item){const w=Math.max(20,Math.round((r.startW+ev.clientX-r.startX)/GRID)*GRID),h=Math.max(15,Math.round((r.startH+ev.clientY-r.startY)/GRID)*GRID);update(r.id,{width:Math.min(cardW-item.x,w),height:Math.min(cardH-item.y,h)})}}};
 const end=()=>{drag.current=null;resize.current=null};const beginResize=(ev:MouseEvent,id:string)=>{ev.stopPropagation();const x=e.find(a=>a.id===id)!;resize.current={id,startX:ev.clientX,startY:ev.clientY,startW:x.width,startH:x.height};setSel(id)};
 const drop=(ev:DragEvent<HTMLDivElement>)=>{ev.preventDefault();const d=dropType.current;if(!d)return;const rect=ev.currentTarget.getBoundingClientRect(),x=Math.round((ev.clientX-rect.left)/GRID)*GRID,y=Math.round((ev.clientY-rect.top)/GRID)*GRID;add(d.type,d.label,d.fieldKey,Math.max(0,Math.min(cardW-20,x)),Math.max(0,Math.min(cardH-20,y)));dropType.current=null};
 const beginDrop=(type:CanvasElement["type"],label:string,fieldKey?:string)=>(ev:DragEvent)=>{dropType.current={type,label,fieldKey};ev.dataTransfer.effectAllowed="copy";ev.dataTransfer.setData("text/plain",label)};
 return <div className="editor" onMouseMove={move} onMouseUp={end} onMouseLeave={end}><section className="panel"><h3>Éléments du document <Plus size={15}/></h3>{palette.map(([t,l,I])=><div key={t} className="item" draggable onDragStart={beginDrop(t as CanvasElement["type"],l)}><I size={15}/>{l}<GripVertical className="grip" size={14}/></div>)}<hr/><h3>Champs dynamiques</h3>{fields.map(f=><div key={f.id} className="field-item" draggable onDragStart={beginDrop("field","{{"+f.key+"}}",f.key)} onDoubleClick={()=>add("field","{{"+f.key+"}}",f.key)}><Braces size={14}/>{f.label}<small>{f.type}</small></div>)}<p className="hint">Les champs importés depuis Excel apparaissent ici automatiquement.</p></section><section className="workspace"><div className="toolbar"><span>Format de carte</span><select value={format} onChange={ev=>{const id=ev.target.value;setFormat(id);}}><option value="business">Carte 85 × 54 mm</option><option value="badge">Badge 90 × 60 mm</option><option value="a6">A6 148 × 105 mm</option><option value="custom">Personnalisé</option></select>{format==="custom"&&<><input className="format-input" type="number" min="20" value={customW} onChange={ev=>setCustomW(Number(ev.target.value))}/><span>×</span><input className="format-input" type="number" min="20" value={customH} onChange={ev=>setCustomH(Number(ev.target.value))}/><span>mm</span></>}<span>Grille 5 px · 100%</span></div><div className="stage" onClick={()=>setSel("")}><div className="card" style={{width:cardW,height:cardH}} onDragOver={ev=>ev.preventDefault()} onDrop={drop}>{e.map(x=><div key={x.id} onMouseDown={ev=>start(ev,x.id)} className={"canvas-el "+(sel===x.id?"selected ":"")+x.type} style={{left:x.x,top:x.y,width:x.width,height:x.height,fontSize:x.fontSize,fontWeight:x.fontWeight,textAlign:x.align}}>{x.type==="image"?<div className="photo-placeholder"><ImageIcon size={25}/></div>:x.type==="shape"?null:x.label}{sel===x.id&&<span className="resize-handle" onMouseDown={ev=>beginResize(ev,x.id)}/>}</div>)}</div></div><div className="status">Carte {cardMmW} × {cardMmH} mm · {e.length} éléments · grille 5 px</div></section><section className="panel props"><h3>Propriétés {selected&&<Trash2 size={15} onClick={remove} className="delete"/>}</h3>{selected?<><label>Contenu</label><input value={selected.label} onChange={ev=>update(sel,{label:ev.target.value})}/><label>Position (px)</label><div className="tw"><input type="number" value={selected.x} onChange={ev=>update(sel,{x:+ev.target.value})}/><input type="number" value={selected.y} onChange={ev=>update(sel,{y:+ev.target.value})}/></div><label>Taille (px)</label><div className="tw"><input type="number" value={selected.width} onChange={ev=>update(sel,{width:+ev.target.value})}/><input type="number" value={selected.height} onChange={ev=>update(sel,{height:+ev.target.value})}/></div><label>Style</label><div className="styles"><button onClick={()=>update(sel,{fontWeight:"400"})}>A</button><button onClick={()=>update(sel,{fontWeight:"700"})}><b>B</b></button><button onClick={()=>update(sel,{align:"left"})}>≡</button><button onClick={()=>update(sel,{align:"center"})}>≡</button><button onClick={()=>update(sel,{align:"right"})}>≡</button></div></>:<p className="empty">Sélectionnez un élément sur la carte.</p>}</section></div>
}

function Templates({templates,active,open,create,rename,duplicate,remove}:{templates:DocumentTemplate[];active:string;open:(id:string)=>void;create:()=>void;rename:(id:string)=>void;duplicate:(id:string)=>void;remove:(id:string)=>void}){return <div className="page"><div className="heading"><div><h2>Gestion des modèles</h2><p>Créez et gérez les modèles réutilisables d'Apitah.</p></div><button className="dark" onClick={create}><Plus size={16}/> Nouveau modèle</button></div><div className="template-grid">{templates.map(t=><div className={"template-card "+(t.id===active?"active":"")} key={t.id}><div className="template-preview"><div className="mini-card">{t.elements.filter(x=>x.type!=="shape").slice(0,4).map(x=><span key={x.id} style={{left:(x.x/425)*100+"%",top:(x.y/270)*100+"%",fontSize:Math.max(5,x.fontSize/2.2)}}>{x.type==="image"?"▧":x.label}</span>)}</div></div><div className="template-info"><h3>{t.name}</h3><p>{t.description}</p><small>{t.width} × {t.height} mm · Modifié {t.updatedAt}</small></div><div className="template-actions"><button onClick={()=>open(t.id)}><FolderOpen size={14}/> Ouvrir</button><button onClick={()=>rename(t.id)}><Pencil size={14}/></button><button onClick={()=>duplicate(t.id)}><Copy size={14}/></button><button onClick={()=>remove(t.id)}><Trash2 size={14}/></button></div></div>)}</div></div>}

function ExcelPage({fileName,rows,importExcel}:{fileName:string;rows:Record<string,unknown>[];importExcel:(ev:ChangeEvent<HTMLInputElement>)=>void}){const headers=rows.length?Object.keys(rows[0]):[];return <div className="page"><div className="heading"><div><h2>Import Excel</h2><p>Importez les données et transformez automatiquement les colonnes en champs dynamiques.</p></div><label className="dark upload-btn"><Upload size={16}/> Choisir un fichier<input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} hidden/></label></div>{fileName?<div className="import-success"><CheckCircle2 size={18}/><div><b>{fileName}</b><span>{rows.length} ligne(s) · {headers.length} colonne(s) · champs synchronisés</span></div></div>:<div className="upload"><Upload size={32}/><h3>Déposez votre fichier Excel</h3><p>Formats acceptés : .xlsx, .xls, .csv</p><label className="dark upload-btn"><Upload size={16}/> Sélectionner<input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} hidden/></label></div>}{rows.length>0&&<div className="excel-table"><h3>Aperçu des données</h3><div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice(0,8).map((row,i)=><tr key={i}>{headers.map(h=><td key={h}>{String(row[h]??"")}</td>)}</tr>)}</tbody></table></div></div>}</div>}

function Page({section,add,fields}:{section:Section;add:(t:CanvasElement["type"],l:string,k?:string)=>void;fields:DynamicField[]}){return <div className="page"><div className="heading"><div><h2>{nav.find(n=>n[0]===section)?.[1]}</h2><p>Gérez les ressources utilisées pour générer vos documents automatiquement.</p></div><button className="dark" onClick={()=>add("field","{{nouveau_champ}}")}><Plus size={16}/> Ajouter</button></div><div className="grid">{section==="dashboard"&&["Modèles|02","Champs dynamiques|"+String(fields.length).padStart(2,"0"),"Documents générés|128"].map(x=><div className="stat" key={x}><small>{x.split("|")[0]}</small><b>{x.split("|")[1]}</b></div>)}{section==="fields"&&<div className="wide"><h3>Champs dynamiques centralisés</h3>{fields.map(f=><div className="row" key={f.id}><Braces size={14}/><b>{f.label}</b><code>{"{{"+f.key+"}}"}</code><span>{f.type==="select"?"Femme · Homme · Autres":f.type}</span></div>)}</div>}{section==="elements"&&palette.map(([t,l,I])=><div className="stat" key={t}><I size={17}/><small>Élément</small><b>{l}</b></div>)}</div></div>}

export default App;

function Preview({template,rows,rowIndex,setRowIndex,close}:{template:DocumentTemplate;rows:Record<string,unknown>[];rowIndex:number;setRowIndex:(n:number)=>void;close:()=>void}){
 const row=rows[rowIndex]??{};
 const resolve=(el:CanvasElement)=>{
   if(!el.fieldKey)return el.label;
   const value=row[el.fieldKey];
   return value===undefined||value===null||String(value)===""?"—":String(value);
 };
 const validImage=(v:unknown)=>typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://")||v.startsWith("data:image/"));
 return <div className="preview-overlay" style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={close}>
   <div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:720,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}} onClick={ev=>ev.stopPropagation()}>
     <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
       <div><h2 style={{margin:0}}>Aperçu du modèle</h2><small>{template.name} · {rows.length?`Ligne ${rowIndex+1} / ${rows.length}`: "Aucune donnée importée"}</small></div>
       <button onClick={close}>Fermer</button>
     </div>
     {rows.length>0&&<div style={{display:"flex",gap:8,alignItems:"center",marginBottom:18}}>
       <button disabled={rowIndex<=0} onClick={()=>setRowIndex(Math.max(0,rowIndex-1))}>← Précédente</button>
       <button disabled={rowIndex>=rows.length-1} onClick={()=>setRowIndex(Math.min(rows.length-1,rowIndex+1))}>Suivante →</button>
       <select value={rowIndex} onChange={ev=>setRowIndex(Number(ev.target.value))}>{rows.map((_,i)=><option key={i} value={i}>Ligne {i+1}</option>)}</select>
     </div>}
     <div className="stage" style={{minHeight:300,display:"flex",alignItems:"center",justifyContent:"center",background:"#f4f5f7",borderRadius:12}}>
       <div className="card" style={{position:"relative",width:425,height:270,overflow:"hidden"}}>
         {template.elements.map(el=><div key={el.id} className={"canvas-el "+el.type} style={{position:"absolute",left:el.x,top:el.y,width:el.width,height:el.height,fontSize:el.fontSize,fontWeight:el.fontWeight,textAlign:el.align}}>
           {el.type==="image" ? (validImage(row[el.fieldKey??""]) ? <img src={String(row[el.fieldKey??""])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div className="photo-placeholder"><ImageIcon size={25}/></div>) : el.type==="shape" ? null : resolve(el)}
         </div>)}
       </div>
     </div>
     {rows.length===0&&<p style={{margin:"14px 0 0",textAlign:"center",color:"#666"}}>Importez un fichier Excel pour visualiser automatiquement une ligne dans le modèle.</p>}
   </div>
 </div>
}


function resolveElementValue(el:CanvasElement,row:Record<string,unknown>){
 if(!el.fieldKey)return el.label;
 const value=row[el.fieldKey];
 return value===undefined||value===null||String(value)===""?"—":String(value);
}

function RenderCard({template,row}:{template:DocumentTemplate;row:Record<string,unknown>}){
 const validImage=(v:unknown)=>typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://")||v.startsWith("data:image/"));
 return <div className="card generated-card">
   {template.elements.map(el=><div key={el.id} className={"canvas-el "+el.type} style={{left:el.x,top:el.y,width:el.width,height:el.height,fontSize:el.fontSize,fontWeight:el.fontWeight,textAlign:el.align}}>
     {el.type==="image" ? (validImage(row[el.fieldKey??""]) ? <img src={String(row[el.fieldKey??""])} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <div className="photo-placeholder"><ImageIcon size={25}/></div>) : el.type==="shape" ? null : resolveElementValue(el,row)}
   </div>)}
 </div>
}

async function exportCardPng(template:DocumentTemplate,row:Record<string,unknown>,index:number){
 const canvas=document.createElement("canvas");canvas.width=CARD_W*2;canvas.height=CARD_H*2;
 const ctx=canvas.getContext("2d");if(!ctx)return;ctx.scale(2,2);ctx.fillStyle="#fff";ctx.fillRect(0,0,CARD_W,CARD_H);
 const validImage=(v:unknown)=>typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://")||v.startsWith("data:image/"));
 for(const el of template.elements){
   if(el.type==="shape"){ctx.fillStyle="#eef0f3";ctx.fillRect(el.x,el.y,el.width,el.height);continue}
   if(el.type==="image"&&validImage(row[el.fieldKey??""])){
     try{const img=new Image();img.crossOrigin="anonymous";img.src=String(row[el.fieldKey??""]);await new Promise<void>((ok,fail)=>{img.onload=()=>ok();img.onerror=()=>fail();});ctx.drawImage(img,el.x,el.y,el.width,el.height);continue}catch{}
   }
   if(el.type==="image"){ctx.strokeStyle="#b7bdc7";ctx.strokeRect(el.x,el.y,el.width,el.height);continue}
   ctx.fillStyle="#273143";ctx.font=`${el.fontWeight} ${el.fontSize}px Arial`;ctx.textAlign=el.align==="center"?"center":el.align==="right"?"right":"left";
   const value=resolveElementValue(el,row);const tx=el.align==="center"?el.x+el.width/2:el.align==="right"?el.x+el.width:el.x+5;ctx.fillText(value,tx,el.y+el.fontSize+3);
 }
 canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`apitah-carte-${index+1}.png`;a.click();URL.revokeObjectURL(a.href)},"image/png");
}

function cardToBlob(template:DocumentTemplate,row:Record<string,unknown>):Promise<Blob|null>{
 return new Promise(resolve=>{const canvas=document.createElement("canvas");canvas.width=CARD_W*2;canvas.height=CARD_H*2;const ctx=canvas.getContext("2d");if(!ctx){resolve(null);return}ctx.scale(2,2);ctx.fillStyle="#fff";ctx.fillRect(0,0,CARD_W,CARD_H);const validImage=(v:unknown)=>typeof v==="string"&&(v.startsWith("http://")||v.startsWith("https://")||v.startsWith("data:image/"));const work=async()=>{for(const el of template.elements){if(el.type==="shape"){ctx.fillStyle="#eef0f3";ctx.fillRect(el.x,el.y,el.width,el.height);continue}if(el.type==="image"&&validImage(row[el.fieldKey??""])){try{const img=new Image();img.crossOrigin="anonymous";img.src=String(row[el.fieldKey??""]);await new Promise<void>((ok,fail)=>{img.onload=()=>ok();img.onerror=()=>fail()});ctx.drawImage(img,el.x,el.y,el.width,el.height);continue}catch{}}if(el.type==="image"){ctx.strokeStyle="#b7bdc7";ctx.strokeRect(el.x,el.y,el.width,el.height);continue}ctx.fillStyle="#273143";ctx.font=`${el.fontWeight} ${el.fontSize}px Arial`;ctx.textAlign=el.align==="center"?"center":el.align==="right"?"right":"left";const tx=el.align==="center"?el.x+el.width/2:el.align==="right"?el.x+el.width:el.x+5;ctx.fillText(resolveElementValue(el,row),tx,el.y+el.fontSize+3)}canvas.toBlob(resolve,"image/png")};work()})}
async function exportAllZip(template:DocumentTemplate,rows:Record<string,unknown>[]){const zip=new JSZip();for(let i=0;i<rows.length;i++){const blob=await cardToBlob(template,rows[i]);if(blob)zip.file(`carte-${String(i+1).padStart(3,"0")}.png`,blob)}const out=await zip.generateAsync({type:"blob"});const url=URL.createObjectURL(out);const a=document.createElement("a");a.href=url;a.download="apitah-cartes.zip";a.click();URL.revokeObjectURL(url)}
function printBulk(template:DocumentTemplate,rows:Record<string,unknown>[],columns:number,gap:number,margin:number,orientation:"portrait"|"landscape"){
 const cards=rows.map(row=>`<div class="print-card">${template.elements.map(el=>el.type==="shape"?'<div class="print-shape"></div>':`<div class="print-el" style="left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;font-size:${el.fontSize}px;font-weight:${el.fontWeight};text-align:${el.align}">${el.type==="image"?"":resolveElementValue(el,row)}</div>`).join("")}</div>`).join("");
 const w=window.open("","_blank");if(!w)return;w.document.write(`<!doctype html><html><head><title>Apitah - cartes</title><style>@page{size:A4 ${orientation};margin:${margin}mm}body{font-family:Arial;margin:0;display:grid;grid-template-columns:repeat(${columns},1fr);gap:${gap}mm;align-content:start}.print-card{width:85mm;height:54mm;position:relative;border:1px solid #ddd;break-inside:avoid;overflow:hidden}.print-el,.print-shape{position:absolute;box-sizing:border-box;padding:3px 5px;overflow:hidden}.print-shape{left:0;top:0;width:100%;height:100%;background:#eef0f3;z-index:-1}</style></head><body>${cards}</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),250);
}

function BulkPreview({template,rows,close}:{template:DocumentTemplate;rows:Record<string,unknown>[];close:()=>void}){
 const[columns,setColumns]=useState(2);const[gap,setGap]=useState(8);const[margin,setMargin]=useState(10);const[orientation,setOrientation]=useState<"portrait"|"landscape">("portrait");
 return <div className="preview-overlay" style={{position:"fixed",inset:0,zIndex:1001,background:"rgba(0,0,0,.55)",padding:24,overflow:"auto"}} onClick={close}>
   <div style={{background:"#fff",borderRadius:16,padding:24,width:"100%",minHeight:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}} onClick={ev=>ev.stopPropagation()}>
     <div className="bulk-header">
       <div><h2 style={{margin:0}}>Génération en masse</h2><small>{template.name} · {rows.length} carte(s) générée(s)</small></div>
       <div className="actions"><span className="generated-count">✓ {rows.length} générées</span><button disabled={!rows.length} onClick={()=>printBulk(template,rows,columns,gap,margin,orientation)}>Exporter PDF</button><button disabled={!rows.length} onClick={()=>exportAllZip(template,rows)}>PNG / ZIP</button><button onClick={close}>Fermer</button></div>
     </div>
     <div className="export-settings"><strong>Format : 85 × 54 mm</strong><label>Orientation <select value={orientation} onChange={ev=>setOrientation(ev.target.value as "portrait"|"landscape")}><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select></label><label>Colonnes <select value={columns} onChange={ev=>setColumns(Number(ev.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label><label>Espacement <input type="number" min="0" max="30" value={gap} onChange={ev=>setGap(Number(ev.target.value))}/> mm</label><label>Marge <input type="number" min="0" max="30" value={margin} onChange={ev=>setMargin(Number(ev.target.value))}/> mm</label></div>
     <div className={`a4-sheet ${orientation}`} style={{padding:`${margin}mm`,gap:`${gap}mm`,gridTemplateColumns:`repeat(${columns},85mm)`}}>{rows.map((row,i)=><div className="a4-card" key={i}><RenderCard template={template} row={row}/><span>Carte {i+1}</span></div>)}</div>
     {rows.length===0?<p>Aucune ligne de données à générer.</p>:<div className="generated-grid">{rows.map((row,i)=><div className="generated-item" key={i}><RenderCard template={template} row={row}/><span>Carte {i+1}</span></div>)}</div>}
   </div>
 </div>
}
