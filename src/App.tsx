
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box, ChevronDown, Cloud, Cuboid, Folder, Gamepad2, Grid2X2,
  Play, Plus, Search, Settings, Shapes, Move, RotateCw,
  Scaling, Save, Sparkles
} from "lucide-react";

type ObjectItem = { name: string; kind: string };

export default function App() {
  const [project, setProject] = useState("Untitled Experience");
  const [items, setItems] = useState<ObjectItem[]>([
    { name: "Workspace", kind: "Folder" },
    { name: "Camera", kind: "Camera" },
    { name: "Terrain", kind: "Terrain" },
    { name: "SpawnLocation", kind: "Part" }
  ]);
  const [selected, setSelected] = useState("SpawnLocation");
  const [tool, setTool] = useState("Select");
  const [saved, setSaved] = useState(false);
  const [play, setPlay] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const sceneRef = useRef<HTMLDivElement>(null);
  const threeSceneRef = useRef<THREE.Scene | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());

  const addPart = () => {
    const name = "Part" + (items.filter(x => x.kind === "Part").length + 1);
    setItems(prev => [...prev, { name, kind: "Part" }]);
    setSelected(name);
    setSaved(false);
  };

  // Initialize Three.js viewport and orbit camera
  useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#171b25");
    threeSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 1000
    );
    camera.position.set(8, 7, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "grab";
    container.prepend(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));

    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(10, 15, 8);
    light.castShadow = true;
    scene.add(light);

    const grid = new THREE.GridHelper(100, 100, 0x65758b, 0x303846);
    grid.name = "KG_GRID";
    scene.add(grid);

    const axes = new THREE.AxesHelper(5);
    axes.name = "KG_AXES";
    scene.add(axes);

    const target = new THREE.Vector3(0, 0, 0);
    let radius = 15;
    let theta = Math.PI / 4;
    let phi = Math.PI / 3;
    let dragging = false;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    const updateCamera = () => {
      camera.position.set(
        target.x + radius * Math.sin(phi) * Math.sin(theta),
        target.y + radius * Math.cos(phi),
        target.z + radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    };
    updateCamera();

    const onPointerDown = (e: PointerEvent) => {
      dragging = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      theta -= dx * 0.006;
      phi = THREE.MathUtils.clamp(phi + dy * 0.006, 0.1, Math.PI - 0.1);
      lastX = e.clientX;
      lastY = e.clientY;
      updateCamera();
    };

    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      renderer.domElement.style.cursor = "grab";

      if (!moved) {
        const rect = renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(
          Array.from(meshesRef.current.values()), false
        );
        if (hits.length) {
          const name = hits[0].object.userData.name;
          if (name) {
            window.dispatchEvent(new CustomEvent("kg-select-object", { detail: name }));
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = THREE.MathUtils.clamp(radius + e.deltaY * 0.01, 3, 80);
      updateCamera();
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resizeObserver = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.clear();
      meshesRef.current.clear();
      threeSceneRef.current = null;
    };
  }, []);

  // Select an object by clicking it in the 3D viewport
  useEffect(() => {
    const handler = (e: Event) => {
      setSelected((e as CustomEvent<string>).detail);
    };
    window.addEventListener("kg-select-object", handler);
    return () => window.removeEventListener("kg-select-object", handler);
  }, []);

  // Create and remove 3D objects when Explorer contents change
  useEffect(() => {
    const scene = threeSceneRef.current;
    if (!scene) return;

    const meshes = meshesRef.current;
    const validNames = new Set(
      items.filter(x => x.kind === "Part" || x.kind === "Terrain").map(x => x.name)
    );

    for (const [name, mesh] of meshes) {
      if (!validNames.has(name)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        meshes.delete(name);
      }
    }

    for (const item of items) {
      if (item.kind !== "Part" && item.kind !== "Terrain") continue;
      if (meshes.has(item.name)) continue;

      const isTerrain = item.kind === "Terrain";
      const geometry = isTerrain
        ? new THREE.BoxGeometry(20, 0.5, 20)
        : new THREE.BoxGeometry(2, 2, 2);

      const material = new THREE.MeshStandardMaterial({
        color: isTerrain ? "#526b4b" : "#4d9be8",
        roughness: 0.65,
        metalness: 0.05
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = item.name;
      mesh.userData.name = item.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (isTerrain) {
        mesh.position.set(0, -1.25, 0);
      } else {
        mesh.position.set((meshes.size % 3) * 3 - 3, 1, 0);
      }

      scene.add(mesh);
      meshes.set(item.name, mesh);
    }
  }, [items]);

  // Highlight the selected object
  useEffect(() => {
    for (const [name, mesh] of meshesRef.current) {
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.emissive.set(name === selected ? "#244d75" : "#000000");
    }
  }, [selected, items]);

  // Grid visibility
  useEffect(() => {
    const grid = threeSceneRef.current?.getObjectByName("KG_GRID");
    if (grid) grid.visible = showGrid;
  }, [showGrid]);

  return <div className="studio">
    <header className="topbar">
      <div className="brand">
        <div className="mark">KG</div>
        <div><strong>KG Studio</strong><small>KYNTRIC GAMES</small></div>
      </div>
      <div className="project">
        <Gamepad2 size={16}/>
        <input value={project} onChange={e => {
          setProject(e.target.value); setSaved(false);
        }}/>
      </div>
      <div className="topright">
        <span className={saved ? "saved" : "unsaved"}>
          <Cloud size={15}/>{saved ? "Saved" : "Unsaved changes"}
        </span>
        <button className="save" onClick={() => setSaved(true)}>
          <Save size={15}/> Save Project
        </button>
        <Settings size={17}/>
      </div>
    </header>

    <nav className="menubar">
      {["File","Edit","View","Model","Test","Help"].map(x =>
        <button key={x}>{x}<ChevronDown size={12}/></button>
      )}
      <span>KG Studio Preview</span>
    </nav>

    <div className="toolbar">
      {([["Select",Shapes],["Move",Move],["Scale",Scaling],["Rotate",RotateCw]] as const).map(([label,Icon]) =>
        <button className={tool === label ? "active" : ""} key={label} onClick={() => setTool(label)}>
          <Icon size={16}/>{label}
        </button>
      )}
      <i/>
      <button onClick={addPart}><Plus size={16}/> Add Part</button>
      <button onClick={() => setShowGrid(v => !v)}><Grid2X2 size={16}/> Grid {showGrid ? "On" : "Off"}</button>
      <div className="push"/>
      <button className={play ? "stop" : "play"} onClick={() => setPlay(!play)}>
        {play ? "Stop" : <><Play size={14} fill="currentColor"/> Play</>}
      </button>
    </div>

    <div className="mainlayout">
      <aside className="left">
        <div className="paneltitle">Toolbox <Search size={14}/></div>
        <div className="search"><Search size={14}/><input placeholder="Search assets"/></div>
        <div className="tabs"><button className="tabactive">Models</button><button>Images</button><button>Audio</button></div>
        <div className="toolbox">
          <div className="toolboxicon"><Shapes size={24}/></div>
          <b>Asset Toolbox</b>
          <p>Search and insert models, textures, and other assets.</p>
          <button className="outline">Browse Library</button>
        </div>
        <div className="footnote"><Sparkles size={13}/> Asset library coming soon</div>
      </aside>

      <main className="viewport">
        <div className="viewtitle">
          <span><Cuboid size={14}/> 3D Viewport</span>
          <span>Perspective · {tool}</span>
        </div>
        <div className="scene" ref={sceneRef}>
          <div className="scenehint">
            {play ? "Play mode preview" : "Drag to orbit · Scroll to zoom · Click to select"}
          </div>
          <div className="gizmo"><span className="gy">Y</span><span className="gx">X</span><span className="gz">Z</span><div/></div>
          <div className="viewbuttons"><button>Perspective</button></div>
        </div>
        <div className="status">
          <span><em></em> Three.js Ready</span>
          <span>Grid: 1 unit · {items.length} objects</span>
        </div>
      </main>

      <aside className="right">
        <section>
          <div className="paneltitle">Explorer <button onClick={addPart}><Plus size={14}/></button></div>
          {items.map((it, i) =>
            <div key={it.name}
              className={"tree " + (selected === it.name ? "selected" : "")}
              style={{paddingLeft: 12 + (i ? 15 : 0)}}
              onClick={() => setSelected(it.name)}>
              {it.kind === "Folder" ? <Folder size={14}/> : <Box size={14}/>}
              <span>{it.name}</span>
            </div>
          )}
        </section>
        <section className="properties">
          <div className="paneltitle">Properties</div>
          <div className="propertyrow"><span>Name</span><input value={selected} onChange={e => {
            const next = e.target.value;
            setItems(items.map(it => it.name === selected ? {...it, name: next} : it));
            setSelected(next); setSaved(false);
          }}/></div>
          <div className="propertyrow"><span>Class</span><span>{items.find(x => x.name === selected)?.kind || "Object"}</span></div>
          <div className="propertyrow"><span>Position</span><span>3D viewport</span></div>
          <div className="propertyrow"><span>Anchored</span><span>True</span></div>
        </section>
      </aside>
    </div>

    <footer>
      <span>KG Studio · Three.js Preview</span>
      <span>Changes are local in this prototype</span>
    </footer>
  </div>;
}
