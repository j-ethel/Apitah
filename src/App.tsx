import { useRef, useState } from "react";
import { LayoutDashboard, MousePointer2, FileText, Braces, Shapes, Table2, Plus, Upload, Eye, Save, Type, Image as ImageIcon, Square, GripVertical, Trash2, Copy, Pencil, FolderOpen } from "lucide-react";
import type { MouseEvent, DragEvent } from "react";
import type { Section, CanvasElement, DocumentTemplate } from "./types";
import { dynamicFields, initialElements } from "./data";

const nav: [Section, string, any][] = [["dashboard","Tableau de bord",LayoutDashboard],["editor","Éditeur visuel",MousePointer2],["templates","Gestion des modèles",FileText],["fields","Champs dynamiques",Braces],["elements","Éléments du document",Shapes],["excel","Import Excel",Table2]];
const palette = [["text","Texte",Type],["image","Image",ImageIcon],["shape","Forme",Square]];
const CARD_W=425, CARD_H=270, GRID=5;

const starterTemplates: DocumentTemplate[]=[
  {id:"tpl-1",name:"Carte professionnelle",description:"Carte d'identification professionnelle",width:85,height:54,updatedAt:"Aujourd'hui",elements:initialElements},
  {id:"tpl-2",name:"Badge événement",description:"Badge nominatif pour événement",width:85,height:54,updatedAt:"Aujourd'hui",elements:initialElements.slice(0,3)}
];

function App(){
  const [s,setS]=useState<Section>("editor");
  const [e,setE]=useState<CanvasElement[]>(initialElements);
  const [sel,setSel]=useState("e3");
  const [saved,setSaved]=useState(false);
  const [templates,setTemplates]=useState<DocumentTemplate[]>(starterTemplates);
  const [activeTemplate,setActiveTemplate]=useState("tpl-1");
  const add=(type:CanvasElement["type"],label:string,fieldKey?:string,x=100,y=150)=>{
    const id="e"+Date.now();
    setE(v=>[...v,{id,type,label,x,y,width:type==="image"?75:130,height:type==="image"?92:28,fontSize:13,fontWeight:"600",align:"left",fieldKey}]);
    setSel(id);
  };
  const update=(id:string,p:Partial<CanvasElement>)=>setE(v=>v.map(x=>x.id===id?{...x,...p}:x));
  const remove=()=>{setE(v=>v.filter(x=>x.id!==sel));setSel("")};
  const saveTemplate=()=>{
    setTemplates(v=>v.map(t=>t.id===activeTemplate?{...t,elements:e,updatedAt:"À l'instant"}:t));
    setSaved(true);setTimeout(()=>setSaved(false),1500);
  };
  const openTemplate=(id:string)=>{
    const t=templates.find(x=>x.id===id);if(!t)return;
    setActiveTemplate(id);setE(t.elements.map(x=>({...x})));setSel(t.elements[0]?.id??"");setS("editor");
  };
  const createTemplate=()=>{
    const id="tpl-"+Date.now();
    const t:DocumentTemplate={id,name:"Nouveau modèle",description:"Nouveau modèle de document",width:85,height:54,updatedAt:"À l'instant",elements:[]};
    setTemplates(v=>[...v,t]);setActiveTemplate(id);setE([]);setSel("");setS("editor");
  };
  const renameTemplate=(id:string)=>{
    const old=templates.find(t=>t.id===id);if(!old)return;
    const name=window.prompt("Nom du modèle",old.name);
    if(name?.trim())setTemplates(v=>v.map(t=>t.id===id?{...t,name:name.trim(),updatedAt:"À l'instant"}:t));
  };
  const duplicateTemplate=(id:string)=>{
    const source=templates.find(t=>t.id===id);if(!source)return;
    const copy:DocumentTemplate={...source,id:"tpl-"+Date.now(),name:source.name+" — Copie",updatedAt:"À l'instant",elements:source.elements.map(x=>({...x,id:x.id+"-copy"}))};
    setTemplates(v=>[...v,copy]);
  };
  const deleteTemplate=(id:string)=>{
    if(templates.length<=1)return;
    setTemplates(v=>v.filter(t=>t.id!==id));
    if(activeTemplate===id){const next=templates.find(t=>t.id!==id);if(next){setActiveTemplate(next.id);setE(next.elements.map(x=>({...x})));setSel(next.elements[0]?.id??"");}}
  };
  return <div className="app"><aside className="sidebar"><div className="brand"><div className="logo">A</div><div><strong>Apitah</strong><span>Document Studio</span></div></div><nav>{nav.map(([id,label,I])=><button key={id} className={s===id?"nav-item active":"nav-item"} onClick={()=>setS(id)}><I size={18}/><span>{label}</span>{id==="fields"&&<em>{dynamicFields.length}</em>}</button>)}</nav></aside><main><header><div><small>Projets / {templates.find(t=>t.id===activeTemplate)?.name}</small><h1>{nav.find(n=>n[0]===s)?.[1]}</h1></div><div className="actions"><button><Eye size={16}/> Aperçu</button><button className="dark" onClick={saveTemplate}><Save size={16}/>{saved?"Enregistré":"Enregistrer"}</button></div></header>{s==="editor"?<Editor e={e} sel={sel} setSel={setSel} add={add} update={update} remove={remove}/>:s==="templates"?<Templates templates={templates} active={activeTemplate} open={openTemplate} create={createTemplate} rename={renameTemplate} duplicate={duplicateTemplate} remove={deleteTemplate}/>:<Page section={s} add={add}/>}</main></div>
}

function Editor({e,sel,setSel,add,update,remove}:{e:CanvasElement[];sel:string;setSel:(x:string)=>void;add:(t:CanvasElement["type"],l:string,k?:string,x?:number,y?:number)=>void;update:(id:string,p:Partial<CanvasElement>)=>void;remove:()=>void}){
  const drag=useRef<{id:string;ox:number;oy:number}|null>(null);const resize=useRef<{id:string;startX:number;startY:number,startW:number,startH:number}|null>(null);const dropType=useRef<{type:CanvasElement["type"];label:string;fieldKey?:string}|null>(null);const selected=e.find(x=>x.id===sel);
  const start=(ev:MouseEvent,id:string)=>{ev.stopPropagation();const x=e.find(a=>a.id===id)!;drag.current={id,ox:ev.clientX-x.x,oy:ev.clientY-x.y};setSel(id)};
  const move=(ev:MouseEvent)=>{if(drag.current){const d=drag.current;const item=e.find(a=>a.id===d.id);if(item){const x=Math.round((ev.clientX-d.ox)/GRID)*GRID,y=Math.round((ev.clientY-d.oy)/GRID)*GRID;update(d.id,{x:Math.max(0,Math.min(CARD_W-item.width,x)),y:Math.max(0,Math.min(CARD_H-item.height,y))})}}if(resize.current){const r=resize.current;const item=e.find(a=>a.id===r.id);if(item){const w=Math.max(20,Math.round((r.startW+ev.clientX-r.startX)/GRID)*GRID),h=Math.max(15,Math.round((r.startH+ev.clientY-r.startY)/GRID)*GRID);update(r.id,{width:Math.min(CARD_W-item.x,w),height:Math.min(CARD_H-item.y,h)})}}};
  const end=()=>{drag.current=null;resize.current=null};const beginResize=(ev:MouseEvent,id:string)=>{ev.stopPropagation();const x=e.find(a=>a.id===id)!;resize.current={id,startX:ev.clientX,startY:ev.clientY,startW:x.width,startH:x.height};setSel(id)};
  const drop=(ev:DragEvent<HTMLDivElement>)=>{ev.preventDefault();const d=dropType.current;if(!d)return;const rect=ev.currentTarget.getBoundingClientRect(),x=Math.round((ev.clientX-rect.left)/GRID)*GRID,y=Math.round((ev.clientY-rect.top)/GRID)*GRID;add(d.type,d.label,d.fieldKey,Math.max(0,Math.min(CARD_W-20,x)),Math.max(0,Math.min(CARD_H-20,y)));dropType.current=null};
  const beginDrop=(type:CanvasElement["type"],label:string,fieldKey?:string)=>(ev:DragEvent)=>{dropType.current={type,label,fieldKey};ev.dataTransfer.effectAllowed="copy";ev.dataTransfer.setData("text/plain",label)};
  return <div className="editor" onMouseMove={move} onMouseUp={end} onMouseLeave={end}><section className="panel"><h3>Éléments du document <Plus size={15}/></h3>{palette.map(([t,l,I])=><div key={t} className="item" draggable onDragStart={beginDrop(t as CanvasElement["type"],l)}><I size={15}/>{l}<GripVertical className="grip" size={14}/></div>)}<hr/><h3>Champs dynamiques</h3>{dynamicFields.map(f=><div key={f.id} className="field-item" draggable onDragStart={beginDrop("field","{{"+f.key+"}}",f.key)} onDoubleClick={()=>add("field","{{"+f.key+"}}",f.key)}><Braces size={14}/>{f.label}<small>{f.type}</small></div>)}<p className="hint">Glissez un élément sur la carte. Déplacez-le à la souris ou redimensionnez-le avec la poignée.</p></section><section className="workspace"><div className="toolbar">Carte professionnelle <span>Grille 5 px · 100%</span></div><div className="stage" onClick={()=>setSel("")}><div className="card" onDragOver={ev=>ev.preventDefault()} onDrop={drop}>{e.map(x=><div key={x.id} onMouseDown={ev=>start(ev,x.id)} className={"canvas-el "+(sel===x.id?"selected ":"")+x.type} style={{left:x.x,top:x.y,width:x.width,height:x.height,fontSize:x.fontSize,fontWeight:x.fontWeight,textAlign:x.align}}>{x.type==="image"?<div className="photo-placeholder"><ImageIcon size={25}/></div>:x.type==="shape"?null:x.label}{sel===x.id&&<span className="resize-handle" onMouseDown={ev=>beginResize(ev,x.id)}/>}</div>)}</div></div><div className="status">Carte 85 × 54 mm · {e.length} éléments · grille 5 px</div></section><section className="panel props"><h3>Propriétés {selected&&<Trash2 size={15} onClick={remove} className="delete"/>}</h3>{selected?<><label>Contenu</label><input value={selected.label} onChange={ev=>update(sel,{label:ev.target.value})}/><label>Position (px)</label><div className="tw"><input type="number" value={selected.x} onChange={ev=>update(sel,{x:+ev.target.value})}/><input type="number" value={selected.y} onChange={ev=>update(sel,{y:+ev.target.value})}/></div><label>Taille (px)</label><div className="tw"><input type="number" value={selected.width} onChange={ev=>update(sel,{width:+ev.target.value})}/><input type="number" value={selected.height} onChange={ev=>update(sel,{height:+ev.target.value})}/></div><label>Style</label><div className="styles"><button onClick={()=>update(sel,{fontWeight:"400"})}>A</button><button onClick={()=>update(sel,{fontWeight:"700"})}><b>B</b></button><button onClick={()=>update(sel,{align:"left"})}>≡</button><button onClick={()=>update(sel,{align:"center"})}>≡</button><button onClick={()=>update(sel,{align:"right"})}>≡</button></div></>:<p className="empty">Sélectionnez un élément sur la carte.</p>}</section></div>
}
function Templates({templates,active,open,create,rename,duplicate,remove}:{templates:DocumentTemplate[];active:string;open:(id:string)=>void;create:()=>void;rename:(id:string)=>void;duplicate:(id:string)=>void;remove:(id:string)=>void}){return <div className="page"><div className="heading"><div><h2>Gestion des modèles</h2><p>Créez et gérez les modèles réutilisables d'Apitah.</p></div><button className="dark" onClick={create}><Plus size={16}/> Nouveau modèle</button></div><div className="template-grid">{templates.map(t=><div className={"template-card "+(t.id===active?"active":"")} key={t.id}><div className="template-preview"><div className="mini-card">{t.elements.filter(x=>x.type!=="shape").slice(0,4).map(x=><span key={x.id} style={{left:(x.x/425)*100+"%",top:(x.y/270)*100+"%",fontSize:Math.max(5,x.fontSize/2.2)}}>{x.type==="image"?"▧":x.label}</span>)}</div></div><div className="template-info"><h3>{t.name}</h3><p>{t.description}</p><small>{t.width} × {t.height} mm · Modifié {t.updatedAt}</small></div><div className="template-actions"><button onClick={()=>open(t.id)}><FolderOpen size={14}/> Ouvrir</button><button onClick={()=>rename(t.id)} title="Renommer"><Pencil size={14}/></button><button onClick={()=>duplicate(t.id)} title="Dupliquer"><Copy size={14}/></button><button onClick={()=>remove(t.id)} title="Supprimer"><Trash2 size={14}/></button></div></div>)}</div></div>}
function Page({section,add}:{section:Section;add:(t:CanvasElement["type"],l:string,k?:string)=>void}){return <div className="page"><div className="heading"><div><h2>{nav.find(n=>n[0]===section)?.[1]}</h2><p>Gérez les ressources utilisées pour générer vos documents automatiquement.</p></div><button className="dark" onClick={()=>add("field","{{nouveau_champ}}")}><Plus size={16}/> Ajouter</button></div><div className="grid">{section==="dashboard"&&["Modèles|"+("0"+2),"Champs dynamiques|06","Documents générés|128"].map(x=><div className="stat" key={x}><small>{x.split("|")[0]}</small><b>{x.split("|")[1]}</b></div>)}{section==="fields"&&<div className="wide"><h3>Champs dynamiques centralisés</h3>{dynamicFields.map(f=><div className="row" key={f.id}><Braces size={14}/><b>{f.label}</b><code>{"{{"+f.key+"}}"}</code><span>{f.type==="select"?"Femme · Homme · Autres":f.type}</span></div>)}</div>}{section==="elements"&&palette.map(([t,l,I])=><div className="stat" key={t}><I size={17}/><small>Élément</small><b>{l}</b></div>)}{section==="excel"&&<div className="upload"><Upload size={32}/><h3>Importez votre fichier Excel</h3><p>Les colonnes pourront devenir des champs dynamiques.</p><button><Upload size={16}/> Choisir un fichier</button></div>}</div></div>}
export default App;