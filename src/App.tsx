import { useState } from "react";
import {
  LayoutDashboard, MousePointer2, FileText, Braces, Shapes, Table2,
  Upload, Plus, Search, ChevronRight, Eye, Save, Undo2, Redo2,
  Type, Image as ImageIcon, Square, GripVertical, MoreHorizontal
} from "lucide-react";
import type { Section, CanvasElement } from "./types";
import { dynamicFields, initialElements } from "./data";

const nav: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "editor", label: "Éditeur visuel", icon: MousePointer2 },
  { id: "templates", label: "Modèles", icon: FileText },
  { id: "fields", label: "Champs dynamiques", icon: Braces },
  { id: "elements", label: "Éléments", icon: Shapes },
  { id: "excel", label: "Import Excel", icon: Table2 }
];

function App() {
  const [section, setSection] = useState<Section>("editor");
  const [elements, setElements] = useState<CanvasElement[]>(initialElements);
  const [selected, setSelected] = useState("e3");
  const [saved, setSaved] = useState(false);

  const addElement = (type: CanvasElement["type"], label: string) => {
    const id = "e" + Date.now();
    setElements(v => [...v, { id, type, label, x: 90, y: 150 + v.length * 8 }]);
    setSelected(id);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="logo">A</div><div><strong>Apitah</strong><span>Document Studio</span></div></div>
        <div className="workspace"><span className="dot"></span> Mon espace <ChevronRight size={14}/></div>
        <nav>
          {nav.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={section === item.id ? "nav-item active" : "nav-item"} onClick={() => setSection(item.id)}>
              <Icon size={18}/><span>{item.label}</span>{item.id === "fields" && <em>{dynamicFields.length}</em>}
            </button>;
          })}
        </nav>
        <div className="sidebar-bottom"><div className="help">?</div><span>Centre d'aide</span><MoreHorizontal size={18}/></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="crumb">Projets <ChevronRight size={13}/> Carte professionnelle</div><h1>{nav.find(n => n.id === section)?.label}</h1></div>
          <div className="top-actions"><button className="icon-btn"><Undo2 size={17}/></button><button className="icon-btn"><Redo2 size={17}/></button><button className="secondary"><Eye size={16}/> Aperçu</button><button className="primary" onClick={() => {setSaved(true); setTimeout(() => setSaved(false), 1800)}}><Save size={16}/> {saved ? "Enregistré" : "Enregistrer"}</button></div>
        </header>

        {section === "editor" ? <Editor elements={elements} selected={selected} setSelected={setSelected} addElement={addElement}/> : <SectionPage section={section} addElement={addElement}/>}
      </main>
    </div>
  );
}

function Editor({ elements, selected, setSelected, addElement }: { elements: CanvasElement[]; selected: string; setSelected: (s:string)=>void; addElement:(t:CanvasElement["type"],l:string)=>void }) {
  return <div className="editor-layout">
    <aside className="panel left-panel">
      <div className="panel-title">Éléments du document <button className="mini-add" onClick={() => addElement("text","Nouveau texte")}><Plus size={15}/></button></div>
      <div className="search"><Search size={15}/><input placeholder="Rechercher..." /></div>
      <div className="element-list">
        <ElementRow icon={<Square size={16}/>} label="Fond de carte" />
        <ElementRow icon={<ImageIcon size={16}/>} label="Photo" />
        <ElementRow icon={<Type size={16}/>} label="Nom complet" />
        <ElementRow icon={<Braces size={16}/>} label="Fonction" />
        <ElementRow icon={<Braces size={16}/>} label="Matricule" />
      </div>
      <div className="drag-tip"><GripVertical size={18}/><div><strong>Glissez-déposez</strong><small>un élément sur la carte</small></div></div>
    </aside>

    <section className="canvas-area">
      <div className="canvas-toolbar"><span>Carte professionnelle</span><div><button>−</button><b>100%</b><button>+</button></div></div>
      <div className="stage">
        <div className="card">
          {elements.map(el => <div key={el.id} onClick={() => setSelected(el.id)} className={"canvas-el " + (selected === el.id ? "selected " : "") + el.type} style={{left: el.x, top: el.y}}>
            {el.type === "image" ? <><div className="photo-placeholder"><ImageIcon size={25}/></div></> : el.type === "shape" ? null : el.label}
            {selected === el.id && <span className="handle nw"></span>}
          </div>)}
        </div>
      </div>
      <div className="statusbar"><span>Carte 85 × 54 mm</span><span>Grille activée</span></div>
    </section>

    <aside className="panel properties">
      <div className="panel-title">Propriétés</div>
      <div className="property-preview"><div className="tiny-card"><div className="tiny-photo"></div><b>Nom complet</b><small>Fonction</small></div></div>
      <label>Contenu</label><div className="field-input"><Braces size={15}/><input value={elements.find(e=>e.id===selected)?.label ?? ""} readOnly /></div>
      <label>Position</label><div className="grid-2"><input placeholder="X  126 px"/><input placeholder="Y  42 px"/></div>
      <label>Style</label><div className="style-buttons"><button className="selected-style">A</button><button>B</button><button><Type size={15}/></button><button><MoreHorizontal size={15}/></button></div>
      <label>Alignement</label><div className="align-buttons"><button>≡</button><button>≡</button><button>≡</button></div>
    </aside>
  </div>;
}

function ElementRow({icon,label}:{icon:React.ReactNode;label:string}) {
  return <div className="element-row" draggable><span>{icon}</span>{label}<GripVertical className="grip" size={15}/></div>;
}

function SectionPage({section, addElement}:{section:Section;addElement:(t:CanvasElement["type"],l:string)=>void}) {
  const titles: Record<Section,string> = {
    dashboard:"Tableau de bord", templates:"Gestion des modèles", fields:"Champs dynamiques centralisés", elements:"Éléments du document", excel:"Import Excel", editor:"Éditeur visuel"
  };
  return <div className="page">
    <div className="page-heading"><div><h2>{titles[section]}</h2><p>Gérez les ressources utilisées pour générer vos documents automatiquement.</p></div><button className="primary" onClick={() => addElement("field","{{nouveau_champ}}")}><Plus size={16}/> Ajouter</button></div>
    <div className="cards">
      {section === "fields" && <><Stat title="Champs disponibles" value="06"/><Stat title="Types" value="05"/><Stat title="Options personnalisées" value="03"/></>}
      {section === "templates" && <TemplateCard name="Carte professionnelle" meta="85 × 54 mm · Modèle actif"/><TemplateCard name="Badge événement" meta="90 × 60 mm · Brouillon"/></>}
      {section === "excel" && <div className="upload-card"><Upload size={30}/><h3>Importez votre fichier Excel</h3><p>Les colonnes seront proposées comme champs dynamiques.</p><button className="secondary"><Upload size={16}/> Choisir un fichier</button></div>}
      {section === "elements" && <><ElementRow icon={<Type size={16}/>} label="Texte"/><ElementRow icon={<ImageIcon size={16}/>} label="Image"/><ElementRow icon={<Braces size={16}/>} label="Champ dynamique"/><ElementRow icon={<Square size={16}/>} label="Forme"/></>}
      {section === "dashboard" && <><Stat title="Modèles" value="02"/><Stat title="Champs dynamiques" value="06"/><Stat title="Documents générés" value="128"/></>}
    </div>
  </div>;
}
function Stat({title,value}:{title:string;value:string}) { return <div className="stat"><span>{title}</span><strong>{value}</strong><small>Prêt à utiliser</small></div>; }
function TemplateCard({name,meta}:{name:string;meta:string}) { return <div className="template-card"><div className="template-thumb"><div className="thumb-photo"></div><div><b>{name}</b><small>{meta}</small></div></div><button className="secondary">Modifier</button></div>; }

export default App;