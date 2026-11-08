import { useState } from "react";
import { Box, ChevronDown, Cloud, Cuboid, Folder, Gamepad2, Grid2X2, Play, Plus, Search, Settings, Shapes, Move, RotateCw, Scaling, Save, Sparkles } from "lucide-react";

type ObjectItem = { name: string; kind: string };
export default function App() {
  const [project, setProject] = useState("Untitled Experience");
  const [items, setItems] = useState<ObjectItem[]>([{name:"Workspace",kind:"Folder"},{name:"Camera",kind:"Camera"},{name:"Terrain",kind:"Terrain"},{name:"SpawnLocation",kind:"Part"}]);
  const [selected, setSelected] = useState("Workspace");
  const [tool, setTool] = useState("Select");
  const [saved, setSaved] = useState(false);
  const [play, setPlay] = useState(false);
  const addPart = () => { const name = "Part" + (items.filter(x=>x.kind==="Part").length+1); setItems([...items,{name,kind:"Part"}]); setSelected(name); setSaved(false); };
  return <div className="studio">
    <header className="topbar">
      <div className="brand"><div className="mark">KG</div><div><strong>KG Studio</strong><small>KYNTRIC GAMES</small></div></div>
      <div className="project"><Gamepad2 size={16}/><input value={project} onChange={e=>{setProject(e.target.value);setSaved(false)}}/></div>
      <div className="topright"><span className={saved?"saved":"unsaved"}><Cloud size={15}/>{saved?"Saved":"Unsaved changes"}</span><button className="save" onClick={()=>setSaved(true)}><Save size={15}/> Save Project</button><Settings size={17}/></div>
    </header>
    <nav className="menubar">{["File","Edit","View","Model","Test","Help"].map(x=><button key={x}>{x}<ChevronDown size={12}/></button>)}<span>KG Studio Preview</span></nav>
    <div className="toolbar">
      {([["Select",Shapes],["Move",Move],["Scale",Scaling],["Rotate",RotateCw]] as const).map(([label,Icon])=><button className={tool===label?"active":""} key={label} onClick={()=>setTool(label)}><Icon size={16}/>{label}</button>)}
      <i/>
      <button onClick={addPart}><Plus size={16}/> Add Part</button><button><Grid2X2 size={16}/> Grid</button>
      <div className="push"/>
      <button className={play?"stop":"play"} onClick={()=>setPlay(!play)}>{play?"Stop":<><Play size={14} fill="currentColor"/> Play</>}</button>
    </div>
    <div className="mainlayout">
      <aside className="left">
        <div className="paneltitle">Toolbox <Search size={14}/></div><div className="search"><Search size={14}/><input placeholder="Search assets"/></div>
        <div className="tabs"><button className="tabactive">Models</button><button>Images</button><button>Audio</button></div>
        <div className="toolbox"><div className="toolboxicon"><Shapes size={24}/></div><b>Asset Toolbox</b><p>Search and insert models, textures, and other assets.</p><button className="outline">Browse Library</button></div>
        <div className="footnote"><Sparkles size={13}/> Asset library coming soon</div>
      </aside>
      <main className="viewport">
        <div className="viewtitle"><span><Cuboid size={14}/> 3D Viewport</span><span>Perspective · {tool}</span></div>
        <div className="scene">
          <div className="grid"></div><div className="ground"></div><div className="axisx"></div><div className="axisz"></div>
          <div className="cube"><div className="top"></div><div className="front"></div><div className="side"></div></div>
          <div className="scenehint">{play?"Play mode preview":"Select an object to edit"}</div>
          <div className="gizmo"><span className="gy">Y</span><span className="gx">X</span><span className="gz">Z</span><div></div></div>
          <div className="viewbuttons"><button>Top</button><button>Front</button><button>Right</button></div>
        </div>
        <div className="status"><span><em></em> Ready</span><span>Grid: 4 units · {items.length} objects</span></div>
      </main>
      <aside className="right">
        <section><div className="paneltitle">Explorer <button onClick={addPart}><Plus size={14}/></button></div>
          {items.map((it,i)=><div key={it.name} className={"tree "+(selected===it.name?"selected":"")} style={{paddingLeft:12+(i?15:0)}} onClick={()=>setSelected(it.name)}>{it.kind==="Folder"?<Folder size={14}/>:<Box size={14}/>}<span>{it.name}</span></div>)}
        </section>
        <section className="properties"><div className="paneltitle">Properties</div><div className="propertyrow"><span>Name</span><input value={selected} onChange={e=>{setItems(items.map(it=>it.name===selected?{...it,name:e.target.value}:it));setSelected(e.target.value);setSaved(false)}}/></div><div className="propertyrow"><span>Class</span><span>{items.find(x=>x.name===selected)?.kind||"Object"}</span></div><div className="propertyrow"><span>Position</span><span>0, 0, 0</span></div><div className="propertyrow"><span>Anchored</span><span>True</span></div></section>
      </aside>
    </div>
    <footer><span>KG Studio · Early Preview</span><span>All changes are local in this prototype</span></footer>
  </div>;
}