import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Hammer, Eraser, RotateCw, Minus, Plus, Maximize2, X } from "lucide-react";
import { MATERIALS, PROPS, type Material, type Point, type Prop, type PropKind, type PublicCharacter, type Scene } from "../../shared/types";

/* Mesa isométrica em papel: piso por material, objetos de cena e tokens como recortes de papel em pé.
   Coordenadas da grade iguais às da planta 2D: o servidor valida movimento e regras do mesmo jeito. */
const TW = 64, TH = 32;
const iso = (x: number, y: number) => ({ x: (x - y) * (TW / 2), y: (x + y) * (TH / 2) });
const key = (x: number, y: number) => `${x},${y}`;
export const MATERIAL_INFO: Record<Material, { name: string; base: string; ink: string; light: string }> = {
  madeira: { name: "Madeira", base: "#8a5a34", ink: "#53321a", light: "#b07a4c" },
  terra: { name: "Terra", base: "#6b4a2e", ink: "#43301d", light: "#8f6a44" },
  pedra: { name: "Pedra", base: "#8d8781", ink: "#57524d", light: "#b1aca5" },
  tapete: { name: "Tapete", base: "#7a1424", ink: "#3d0810", light: "#c9a14a" },
  roxo: { name: "Roxo infernal", base: "#47205f", ink: "#24102f", light: "#a067c8" },
  vermelho: { name: "Vermelho carne", base: "#7d1a22", ink: "#3f0a0f", light: "#c2474f" },
  agua: { name: "Água", base: "#1f3f55", ink: "#10222f", light: "#6c9cbd" },
  grama: { name: "Grama", base: "#3e5a2c", ink: "#24361a", light: "#76944c" },
  osso: { name: "Ossos", base: "#d4c6a8", ink: "#8d7c5c", light: "#f1e8d2" },
  vazio: { name: "Abismo", base: "#120b10", ink: "#000000", light: "#2a1a24" },
};
export const PROP_INFO: Record<PropKind, { name: string; blocks: boolean }> = {
  barril: { name: "Barril", blocks: true }, armario: { name: "Armário", blocks: true }, mesa: { name: "Mesa", blocks: true },
  cadeira: { name: "Cadeira", blocks: false }, caixa: { name: "Caixa", blocks: true }, estante: { name: "Estante", blocks: true },
  banco: { name: "Banco de igreja", blocks: true }, vela: { name: "Velas", blocks: false }, altar: { name: "Altar", blocks: true },
  cama: { name: "Cama", blocks: true }, pilar: { name: "Pilar", blocks: true }, porta: { name: "Porta", blocks: false },
  cruz: { name: "Cruz", blocks: false }, espelho: { name: "Espelho", blocks: true },
};
function inside(x: number, y: number, pts: number[]) {
  let hit = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i], yi = pts[i + 1], xj = pts[j], yj = pts[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
/** Material efetivo da casa: o pintado pelo Mestre, ou um padrão por sala/corredor. */
export function floorAt(scene: Scene, x: number, y: number, blocked: Set<string>): Material | null {
  const t = scene.tiles?.[key(x, y)];
  if (t) return t;
  if (blocked.has(key(x, y))) return null;
  const hells = scene.mode === "HELLS";
  const room = scene.rooms.some((r) => r.points.length > 4 && inside(x + 0.5, y + 0.5, r.points));
  return room ? (hells ? "vermelho" : "madeira") : hells ? "roxo" : "pedra";
}

/* ---------- desenho ---------- */
function Box({ w, d, h, top, left, right, z = 0, ox = 0, oy = 0, children }: { w: number; d: number; h: number; top: string; left: string; right: string; z?: number; ox?: number; oy?: number; children?: ReactNode }) {
  // caixa isométrica centrada na casa: w no eixo x, d no eixo y, h em pixels
  const a = iso(-w / 2 + ox, -d / 2 + oy), b = iso(w / 2 + ox, -d / 2 + oy), c = iso(w / 2 + ox, d / 2 + oy), e = iso(-w / 2 + ox, d / 2 + oy);
  const up = (p: { x: number; y: number }, k = h + z) => `${p.x},${p.y - k}`;
  const dn = (p: { x: number; y: number }) => `${p.x},${p.y - z}`;
  return (
    <g className="iso-box">
      <polygon points={`${dn(e)} ${dn(c)} ${up(c)} ${up(e)}`} fill={left} />
      <polygon points={`${dn(c)} ${dn(b)} ${up(b)} ${up(c)}`} fill={right} />
      <polygon points={`${up(a)} ${up(b)} ${up(c)} ${up(e)}`} fill={top} />
      {children}
    </g>
  );
}
function Cyl({ r, h, body, top, band, z = 0 }: { r: number; h: number; body: string; top: string; band?: string; z?: number }) {
  const rx = r * TW * 0.5, ry = r * TH * 0.5;
  return (
    <g className="iso-cyl">
      <path d={`M${-rx},${-z} L${-rx},${-z - h} A${rx},${ry} 0 0 0 ${rx},${-z - h} L${rx},${-z} A${rx},${ry} 0 0 1 ${-rx},${-z}Z`} fill={body} />
      {band && [0.25, 0.75].map((f) => <path key={f} d={`M${-rx},${-z - h * f} A${rx},${ry} 0 0 0 ${rx},${-z - h * f}`} fill="none" stroke={band} strokeWidth={2.4} />)}
      <ellipse cx={0} cy={-z - h} rx={rx} ry={ry} fill={top} />
    </g>
  );
}
export function PropSprite({ kind, rot = 0, hells = false }: { kind: PropKind; rot?: 0 | 1; hells?: boolean }) {
  const W = (a: number, b: number) => (rot ? [b, a] : [a, b]) as [number, number];
  const wood = { top: "#a8744a", left: "#6e4426", right: "#8a5a34" };
  const dark = { top: "#5a3a26", left: "#2e1c12", right: "#432a1a" };
  switch (kind) {
    case "barril":
      return <Cyl r={0.5} h={30} body="#7a4a26" top="#a0683a" band="#2b2b2b" />;
    case "caixa": {
      const [w, d] = W(0.62, 0.62);
      return <Box w={w} d={d} h={22} {...wood}><path d={`M${iso(-w / 2, d / 2).x},${iso(-w / 2, d / 2).y - 22} L${iso(w / 2, d / 2).x},${iso(w / 2, d / 2).y}`} stroke="#4a2c16" strokeWidth={1.5} /></Box>;
    }
    case "armario": {
      const [w, d] = W(0.8, 0.42);
      return <Box w={w} d={d} h={58} {...dark}><line x1={iso(0, d / 2).x - 1} y1={iso(0, d / 2).y - 4} x2={iso(0, d / 2).x - 1} y2={iso(0, d / 2).y - 54} stroke="#1a0f08" strokeWidth={1.4} /><circle cx={iso(0.08, d / 2).x} cy={iso(0.08, d / 2).y - 30} r={1.6} fill="#c9a14a" /></Box>;
    }
    case "estante": {
      const [w, d] = W(0.86, 0.36);
      const books = ["#7a1424", "#2f4f6b", "#c9a14a", "#47205f", "#3e5a2c"];
      return (
        <Box w={w} d={d} h={56} {...dark}>
          {[12, 28, 44].map((hh, i) => (
            <g key={hh}>{books.map((_, j) => { const t0 = -w / 2 + 0.06 + (j * (w - 0.12)) / 5, t1 = t0 + (w - 0.12) / 5 - 0.03; const a = rot ? iso(d / 2, t0) : iso(t0, d / 2), b = rot ? iso(d / 2, t1) : iso(t1, d / 2); const bh = 9 + ((i + j) % 3); return <polygon key={j} points={`${a.x},${a.y - hh} ${b.x},${b.y - hh} ${b.x},${b.y - hh - bh} ${a.x},${a.y - hh - bh}`} fill={books[(j + i) % 5]} />; })}</g>
          ))}
        </Box>
      );
    }
    case "mesa": {
      const [w, d] = W(0.9, 0.6);
      return (
        <g>
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => { const p = iso((sx * w) / 2.4, (sy * d) / 2.4); return <rect key={i} x={p.x - 1.5} y={p.y - 18} width={3} height={18} fill="#3a2414" />; })}
          <Box w={w} d={d} h={4} z={18} {...wood} />
        </g>
      );
    }
    case "cadeira": {
      const back = rot ? iso(0.22, 0) : iso(0, -0.22);
      return (
        <g>
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy], i) => { const p = iso(sx * 0.16, sy * 0.16); return <rect key={i} x={p.x - 1} y={p.y - 12} width={2} height={12} fill="#3a2414" />; })}
          <Box w={0.42} d={0.42} h={3} z={12} {...wood} />
          <Box w={rot ? 0.06 : 0.42} d={rot ? 0.42 : 0.06} h={18} z={15} ox={rot ? 0.18 : 0} oy={rot ? 0 : -0.18} {...dark} />
          <circle cx={back.x} cy={back.y} r={0} />
        </g>
      );
    }
    case "banco": {
      const [w, d] = W(0.96, 0.34);
      return <g><Box w={w} d={d} h={4} z={10} {...wood} /><Box w={rot ? 0.06 : w} d={rot ? d : 0.06} ox={rot ? 0.15 : 0} oy={rot ? 0 : -0.15} h={16} z={10} {...dark} /><Box w={rot ? 0.2 : 0.08} d={rot ? 0.08 : 0.2} h={10} ox={rot ? 0 : -w / 2.3} oy={rot ? -w / 2.3 : 0} {...dark} /><Box w={rot ? 0.2 : 0.08} d={rot ? 0.08 : 0.2} h={10} ox={rot ? 0 : w / 2.3} oy={rot ? w / 2.3 : 0} {...dark} /></g>;
    }
    case "vela":
      return (
        <g className="iso-candles">
          {[[-6, 2, 14], [4, -2, 20], [9, 5, 10]].map(([x, y, h], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x={-2} y={-h} width={4} height={h} fill="#efe4cf" />
              <ellipse className="flame" cx={0} cy={-h - 4} rx={2.4} ry={4.6} fill="#ffcf6b" />
              <circle cx={0} cy={-h - 4} r={9} fill="#ff9a3c" opacity={0.18} />
            </g>
          ))}
        </g>
      );
    case "altar": {
      const [w, d] = W(0.96, 0.6);
      return <Box w={w} d={d} h={24} top="#e9dcc2" left="#8d1b2b" right="#a3122f"><polygon points={`${iso(-0.12, -d / 2).x},${iso(-0.12, -d / 2).y - 24} ${iso(0.12, -d / 2).x},${iso(0.12, -d / 2).y - 24} ${iso(0.12, d / 2).x},${iso(0.12, d / 2).y - 24} ${iso(-0.12, d / 2).x},${iso(-0.12, d / 2).y - 24}`} fill="#c9a14a" opacity={0.8} /></Box>;
    }
    case "cama": {
      const [w, d] = W(0.62, 0.96);
      return <g><Box w={w} d={d} h={14} top="#d9cdb4" left="#5a3a26" right="#6e4426" /><Box w={rot ? 0.3 : w * 0.8} d={rot ? w * 0.8 : 0.24} ox={rot ? -0.3 : 0} oy={rot ? 0 : -0.32} h={5} z={14} top="#f4ecdc" left="#b9ab90" right="#cdbfa3" /></g>;
    }
    case "pilar":
      return <g><Box w={0.7} d={0.7} h={8} top="#b1aca5" left="#6d6863" right="#8d8781" /><Cyl r={0.42} h={66} z={8} body="#9a948d" top="#c8c2ba" /><Box w={0.74} d={0.74} h={7} z={74} top="#c8c2ba" left="#6d6863" right="#8d8781" /></g>;
    case "porta": {
      const [w, d] = W(0.9, 0.1);
      return <Box w={w} d={d} h={54} top="#3a2414" left="#5a3a26" right="#6e4426"><circle cx={iso(rot ? 0 : 0.28, rot ? 0.28 : 0).x} cy={iso(rot ? 0 : 0.28, rot ? 0.28 : 0).y - 26} r={2} fill="#c9a14a" /></Box>;
    }
    case "cruz":
      return <g><rect x={-2.5} y={-58} width={5} height={58} fill={hells ? "#a3122f" : "#3a2414"} /><rect x={-13} y={-46} width={26} height={5} fill={hells ? "#a3122f" : "#3a2414"} /></g>;
    case "espelho":
      return <g><rect x={-2} y={-14} width={4} height={14} fill="#3a2414" /><ellipse cx={0} cy={-34} rx={14} ry={21} fill="#c9a14a" /><ellipse cx={0} cy={-34} rx={11} ry={17.5} fill="#9fb3c2" /><path d="M-5,-44 L4,-28" stroke="#e8f2f8" strokeWidth={2} opacity={0.7} /><path d="M-6,-30 L2,-40 M0,-24 L6,-36" stroke="#2a1a24" strokeWidth={0.8} opacity={0.6} /></g>;
  }
}
function MaterialPatterns() {
  const m = MATERIAL_INFO;
  const P = ({ id, children }: { id: Material; children: ReactNode }) => (
    <pattern id={`mat-${id}`} width={64} height={64} patternUnits="userSpaceOnUse" patternTransform="matrix(.5,.25,-.5,.25,0,0)">
      <rect width={64} height={64} fill={m[id].base} />
      {children}
    </pattern>
  );
  return (
    <defs>
      <P id="madeira">{[0, 16, 32, 48].map((y, i) => <g key={y}><rect y={y + 1} width={64} height={14} fill={i % 2 ? m.madeira.base : m.madeira.light} opacity={0.35} /><line x1={0} y1={y} x2={64} y2={y} stroke={m.madeira.ink} strokeWidth={2} /><line x1={(i * 23) % 64} y1={y} x2={(i * 23) % 64} y2={y + 16} stroke={m.madeira.ink} strokeWidth={1.6} /></g>)}</P>
      <P id="terra">{Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 37) % 64} cy={(i * 23) % 64} r={1 + (i % 3)} fill={i % 2 ? m.terra.ink : m.terra.light} opacity={0.7} />)}</P>
      <P id="pedra"><path d="M0,0H64V64H0Z M0,32H64 M32,0V32 M16,32V64 M48,32V64" fill="none" stroke={m.pedra.ink} strokeWidth={2.2} /><rect x={3} y={3} width={26} height={26} fill={m.pedra.light} opacity={0.25} /></P>
      <P id="tapete"><rect x={6} y={6} width={52} height={52} fill="none" stroke={m.tapete.light} strokeWidth={3} /><path d="M32,14 L50,32 L32,50 L14,32Z" fill="none" stroke={m.tapete.light} strokeWidth={2} opacity={0.8} /></P>
      <P id="roxo"><path d="M0,40 C14,30 22,52 36,38 S58,20 64,26 M10,0 C16,14 4,22 14,34" fill="none" stroke={m.roxo.light} strokeWidth={2.4} opacity={0.75} /><circle cx={44} cy={14} r={3} fill={m.roxo.light} opacity={0.5} /></P>
      <P id="vermelho"><path d="M0,22 C18,12 26,36 44,24 S60,40 64,34 M20,64 C24,50 40,54 46,42" fill="none" stroke={m.vermelho.light} strokeWidth={3} opacity={0.6} /><circle cx={12} cy={48} r={4} fill={m.vermelho.ink} opacity={0.6} /></P>
      <P id="agua"><path d="M0,16 q8,-6 16,0 t16,0 t16,0 t16,0 M0,44 q8,-6 16,0 t16,0 t16,0 t16,0" fill="none" stroke={m.agua.light} strokeWidth={2} opacity={0.8} /></P>
      <P id="grama">{Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${(i * 29) % 64},${(i * 17) % 64 + 6} l2,-7 l2,7`} fill="none" stroke={i % 3 ? m.grama.light : m.grama.ink} strokeWidth={1.6} />)}</P>
      <P id="osso">{[[10, 12, 20], [36, 40, -30], [44, 10, 60], [14, 46, 10]].map(([x, y, r], i) => <g key={i} transform={`translate(${x},${y}) rotate(${r})`}><rect x={-8} y={-2} width={16} height={4} fill={m.osso.light} /><circle cx={-8} cy={-2} r={2.6} fill={m.osso.light} /><circle cx={-8} cy={2} r={2.6} fill={m.osso.light} /><circle cx={8} cy={-2} r={2.6} fill={m.osso.light} /><circle cx={8} cy={2} r={2.6} fill={m.osso.light} /></g>)}<rect width={64} height={64} fill="none" stroke={m.osso.ink} strokeWidth={1} opacity={0.4} /></P>
      <P id="vazio"><circle cx={32} cy={32} r={20} fill="#000" opacity={0.4} /></P>
      <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={4} result="n" />
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .08  0 0 0 .55 0" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="paper-shadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx={0} dy={14} stdDeviation={12} floodColor="#000" floodOpacity={0.7} />
      </filter>
      <linearGradient id="card-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b0d22" /><stop offset="1" stopColor="#14060d" /></linearGradient>
    </defs>
  );
}
function Standee({ c, selected, active, pending, onClick, master }: { c: PublicCharacter; selected: boolean; active: boolean; pending: boolean; onClick: () => void; master: boolean }) {
  const p = iso(c.position.x + 0.5, c.position.y + 0.5);
  const hp = Math.max(0, Math.min(1, c.hp / Math.max(1, c.maxHp)));
  const clip = `clip-${c.id}`;
  return (
    <g className={`iso-standee ${selected ? "selected" : ""} ${active ? "active" : ""} ${c.npc ? "npc" : ""} ${c.hp <= 0 ? "down" : ""} ${c.hidden ? "ghost" : ""}`} style={{ transform: `translate(${p.x}px,${p.y}px)` }} onPointerDown={(e) => { e.stopPropagation(); onClick(); }}>
      <ellipse className="standee-ring" cx={0} cy={0} rx={26} ry={13} />
      <ellipse cx={0} cy={2} rx={20} ry={8} fill="#000" opacity={0.45} />
      <g className="standee-body">
        <ellipse cx={0} cy={0} rx={15} ry={6} fill={c.npc ? "#3b0d22" : "#1c1418"} stroke="#000" strokeWidth={1} />
        <rect x={-19} y={-70} width={38} height={66} rx={2} fill="#efe4cf" stroke="#2a1a10" strokeWidth={1} />
        <clipPath id={clip}><rect x={-16} y={-67} width={32} height={60} /></clipPath>
        {c.portrait ? <image href={c.portrait} x={-28} y={-69} width={56} height={84} preserveAspectRatio="xMidYMin slice" clipPath={`url(#${clip})`} /> : <rect x={-16} y={-67} width={32} height={60} fill="#2a1a24" />}
        <rect x={-16} y={-67} width={32} height={60} fill="none" stroke={c.npc ? "#a3122f" : "#2a1a10"} strokeWidth={1.5} />
        <path d="M19,-70 L22,-67 L22,-1 L19,-4Z" fill="#b9ab90" />
      </g>
      <g className="standee-hp" transform="translate(-18,-80)">
        <rect width={36} height={4} fill="#000" opacity={0.7} />
        <rect width={36 * hp} height={4} fill={hp > 0.5 ? "#7bd88f" : hp > 0.25 ? "#e5bd77" : "#ff2f8e"} />
      </g>
      {pending && (
        <g className="standee-card" transform="translate(0,-112)">
          <rect x={-13} y={-18} width={26} height={36} rx={3} fill="url(#card-back)" stroke="#e5bd77" strokeWidth={1.4} />
          <ellipse cx={0} cy={0} rx={7} ry={4.4} fill="none" stroke="#ff86c8" strokeWidth={1.4} />
          <circle cx={0} cy={0} r={2} fill="#ff86c8" />
        </g>
      )}
      <text className="standee-name" y={20} textAnchor="middle">{c.name}{master && c.hidden ? " (oculto)" : ""}</text>
    </g>
  );
}

type BuildTool = { kind: "material"; value: Material } | { kind: "prop"; value: PropKind } | { kind: "erase" } | null;
export function IsoBoard({
  scene, characters, selected, onSelect, master, canControl, onMove, onPatch, focus, pendingActors, activeId, actionMenu,
}: {
  scene: Scene;
  characters: PublicCharacter[];
  selected: string;
  onSelect: (id: string) => void;
  master: boolean;
  canControl: (c: PublicCharacter) => boolean;
  onMove: (id: string, p: Point, override?: boolean) => void;
  onPatch: (p: Partial<Scene>) => void;
  focus: Point | null;
  pendingActors: string[];
  activeId?: string;
  actionMenu?: { characterId: string; node: ReactNode } | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 900, height: 600 }),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [hover, setHover] = useState<Point | null>(null),
    [build, setBuild] = useState<BuildTool>(null),
    [builderOpen, setBuilderOpen] = useState(false),
    [rot, setRot] = useState<0 | 1>(0),
    [draft, setDraft] = useState<{ tiles: Record<string, Material>; props: Prop[] } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean; paint: boolean } | null>(null);
  useEffect(() => {
    const obs = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => { setPan({ x: 0, y: 0 }); setZoom(1); setDraft(null); }, [scene.id]);
  const W = scene.width, H = scene.height;
  const bounds = { minX: -H * (TW / 2), maxX: W * (TW / 2), minY: -90, maxY: (W + H) * (TH / 2) };
  const fit = Math.min((size.width - 40) / (bounds.maxX - bounds.minX), (size.height - 40) / (bounds.maxY - bounds.minY)) || 1;
  const scale = fit * zoom;
  const ox = size.width / 2 - ((bounds.minX + bounds.maxX) / 2) * scale + pan.x;
  const oy = size.height / 2 - ((bounds.minY + bounds.maxY) / 2) * scale + pan.y;
  useEffect(() => {
    if (!focus) return;
    const p = iso(focus.x + 0.5, focus.y + 0.5), c = iso(W / 2, H / 2);
    setPan({ x: (c.x - p.x) * scale, y: (c.y - p.y) * scale });
  }, [focus]);
  const tiles = draft?.tiles ?? scene.tiles ?? {}, props = draft?.props ?? scene.props ?? [];
  const blocked = useMemo(() => new Set(scene.blocked.map((b) => key(b.x, b.y))), [scene.blocked]);
  const view = { ...scene, tiles };
  const floor = useMemo(() => {
    const out: { x: number; y: number; m: Material | null }[] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.push({ x, y, m: floorAt(view, x, y, blocked) });
    return out;
  }, [scene.rooms, scene.mode, tiles, blocked, W, H]);
  const walk = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && !!floor[y * W + x]?.m && floor[y * W + x].m !== "vazio";
  const hells = scene.mode === "HELLS";
  const wallTop = hells ? "#4a1830" : "#e2d3b6", wallL = hells ? "#24081a" : "#a8936e", wallR = hells ? "#35102a" : "#c4b08a";
  // objetos ordenados por profundidade: blocos de parede, divisórias, móveis
  const items: { d: number; k: string; node: ReactNode }[] = [];
  for (const f of floor) {
    if (f.m) continue;
    const near = walk(f.x - 1, f.y) || walk(f.x + 1, f.y) || walk(f.x, f.y - 1) || walk(f.x, f.y + 1) || walk(f.x + 1, f.y + 1) || walk(f.x - 1, f.y - 1);
    if (!near) continue;
    const p = iso(f.x + 0.5, f.y + 0.5);
    items.push({ d: f.x + f.y + 0.3, k: `b${f.x},${f.y}`, node: <g transform={`translate(${p.x},${p.y})`}><Box w={1} d={1} h={20} top={wallTop} left={wallL} right={wallR} /></g> });
  }
  for (const [x1, y1, x2, y2] of scene.walls) {
    const horiz = y1 === y2;
    if (!Number.isInteger(x1) || !Number.isInteger(y1)) continue;
    const both = horiz ? walk(x1, y1 - 1) && walk(x1, y1) : walk(x1 - 1, y1) && walk(x1, y1);
    if (!both) continue;
    const a = iso(x1, y1), b = iso(x2, y2), h = 30;
    items.push({ d: Math.min(x1, x2) + Math.min(y1, y2) - 0.2, k: `w${x1},${y1},${x2},${y2}`, node: <polygon className="iso-wall" points={`${a.x},${a.y} ${b.x},${b.y} ${b.x},${b.y - h} ${a.x},${a.y - h}`} fill={horiz ? wallR : wallL} /> });
  }
  for (const pr of props) {
    const p = iso(pr.x + 0.5, pr.y + 0.5);
    items.push({ d: pr.x + pr.y + 0.4, k: pr.id, node: <g className="iso-prop" transform={`translate(${p.x},${p.y})`}><PropSprite kind={pr.kind} rot={pr.rot} hells={hells} /></g> });
  }
  items.sort((a, b) => a.d - b.d);
  const visibleChars = characters.filter((c) => master || !c.hidden).slice().sort((a, b) => a.position.x + a.position.y - (b.position.x + b.position.y));
  const sel = characters.find((c) => c.id === selected);
  const reach = sel && canControl(sel) ? sel.remainingMove ?? sel.movement : 0;
  function cellAt(clientX: number, clientY: number): Point | null {
    const r = ref.current!.getBoundingClientRect();
    const sx = (clientX - r.left - ox) / scale, sy = (clientY - r.top - oy) / scale;
    const fx = (sx / (TW / 2) + sy / (TH / 2)) / 2, fy = (sy / (TH / 2) - sx / (TW / 2)) / 2;
    const x = Math.floor(fx), y = Math.floor(fy);
    return x >= 0 && y >= 0 && x < W && y < H ? { x, y } : null;
  }
  function paint(p: Point) {
    if (!build) return;
    setDraft((d) => {
      const cur = d ?? { tiles: { ...(scene.tiles ?? {}) }, props: [...(scene.props ?? [])] };
      const k = key(p.x, p.y);
      if (build.kind === "material") { if (cur.tiles[k] === build.value) return cur; return { ...cur, tiles: { ...cur.tiles, [k]: build.value } }; }
      if (build.kind === "erase") {
        const hasProp = cur.props.some((v) => v.x === p.x && v.y === p.y);
        if (hasProp) return { ...cur, props: cur.props.filter((v) => !(v.x === p.x && v.y === p.y)) };
        if (!(k in cur.tiles)) return cur;
        const t = { ...cur.tiles }; delete t[k]; return { ...cur, tiles: t };
      }
      if (cur.props.some((v) => v.x === p.x && v.y === p.y)) return cur;
      return { ...cur, props: [...cur.props, { id: crypto.randomUUID(), kind: build.value, x: p.x, y: p.y, rot }] };
    });
  }
  function commit() {
    if (!draft) return;
    onPatch({ tiles: draft.tiles, props: draft.props });
    setTimeout(() => setDraft(null), 400);
  }
  const menuChar = actionMenu ? characters.find((c) => c.id === actionMenu.characterId) : undefined;
  const menuPos = menuChar ? (() => { const p = iso(menuChar.position.x + 0.5, menuChar.position.y + 0.5); const cl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v)); return { left: cl(ox + p.x * scale, 150, size.width - 150), top: cl(oy + (p.y - 84) * scale, 330, size.height - 8) }; })() : null;
  return (
    <div
      ref={ref}
      className={`iso-board ${build ? "building" : ""}`}
      onWheel={(e) => setZoom((z) => Math.max(0.4, Math.min(3.2, z * (e.deltaY > 0 ? 0.9 : 1.1))))}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        const paintMode = !!build && e.button === 0;
        drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false, paint: paintMode };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        if (paintMode) { const c = cellAt(e.clientX, e.clientY); if (c) paint(c); }
      }}
      onPointerMove={(e) => {
        setHover(cellAt(e.clientX, e.clientY));
        const d = drag.current;
        if (!d) return;
        if (d.paint) { if (build?.kind === "material" || build?.kind === "erase") { const c = cellAt(e.clientX, e.clientY); if (c) paint(c); } return; }
        if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
        if (d.moved) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (!d) return;
        if (d.paint) { commit(); return; }
        if (d.moved || e.button !== 0) return;
        const c = cellAt(e.clientX, e.clientY);
        if (c && sel && canControl(sel) && (c.x !== sel.position.x || c.y !== sel.position.y)) onMove(sel.id, c, master && e.shiftKey);
      }}
      onPointerLeave={() => setHover(null)}
    >
      <div key={scene.id} className="iso-unfold">
        <svg width={size.width} height={size.height} className="iso-svg">
          <MaterialPatterns />
          <g transform={`translate(${ox},${oy}) scale(${scale})`}>
            {/* folha de papel */}
            {(() => {
              const pad = 0.7, a = iso(-pad, -pad), b = iso(W + pad, -pad), c = iso(W + pad, H + pad), d = iso(-pad, H + pad);
              return (
                <g filter="url(#paper-shadow)">
                  <polygon points={`${d.x},${d.y} ${c.x},${c.y} ${c.x},${c.y + 7} ${d.x},${d.y + 7}`} fill="#b9a98a" />
                  <polygon points={`${c.x},${c.y} ${b.x},${b.y} ${b.x},${b.y + 7} ${c.x},${c.y + 7}`} fill="#cdbd9c" />
                  <polygon className="iso-sheet" points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={hells ? "#2a1420" : "#e8dcc4"} />
                  <line x1={iso(W / 2, -pad).x} y1={iso(W / 2, -pad).y} x2={iso(W / 2, H + pad).x} y2={iso(W / 2, H + pad).y} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
                  <line x1={iso(-pad, H / 2).x} y1={iso(-pad, H / 2).y} x2={iso(W + pad, H / 2).x} y2={iso(W + pad, H / 2).y} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
                </g>
              );
            })()}
            <g className="iso-floor">
              {floor.map((f) => {
                if (!f.m) return null;
                const a = iso(f.x, f.y), b = iso(f.x + 1, f.y), c = iso(f.x + 1, f.y + 1), d = iso(f.x, f.y + 1);
                return <polygon key={`${f.x},${f.y}`} points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} fill={`url(#mat-${f.m})`} stroke={MATERIAL_INFO[f.m].ink} strokeOpacity={0.35} strokeWidth={0.8} />;
              })}
              {(() => { const a = iso(0, 0), b = iso(W, 0), c = iso(W, H), d = iso(0, H); return <polygon points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} filter="url(#paper-grain)" fill="#fff" opacity={0.5} pointerEvents="none" />; })()}
            </g>
            {reach > 0 && sel && (
              <g className="iso-reach">
                {floor.filter((f) => f.m && f.m !== "vazio" && Math.abs(f.x - sel.position.x) + Math.abs(f.y - sel.position.y) <= reach && !(f.x === sel.position.x && f.y === sel.position.y)).map((f) => {
                  const a = iso(f.x, f.y), b = iso(f.x + 1, f.y), c = iso(f.x + 1, f.y + 1), d = iso(f.x, f.y + 1);
                  return <polygon key={`r${f.x},${f.y}`} points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} />;
                })}
              </g>
            )}
            {hover && (() => { const a = iso(hover.x, hover.y), b = iso(hover.x + 1, hover.y), c = iso(hover.x + 1, hover.y + 1), d = iso(hover.x, hover.y + 1); return <polygon className="iso-hover" points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`} />; })()}
            <g className="iso-objects">{items.map((i) => <g key={i.k}>{i.node}</g>)}</g>
            <g className="iso-tokens">
              {visibleChars.map((c) => (
                <Standee key={c.id} c={c} master={master} selected={c.id === selected} active={c.id === activeId} pending={pendingActors.includes(c.id)} onClick={() => onSelect(c.id)} />
              ))}
            </g>
          </g>
        </svg>
      </div>
      {menuPos && actionMenu && (
        <div className="persona-anchor" style={{ left: menuPos.left, top: menuPos.top }} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          {actionMenu.node}
        </div>
      )}
      <div className="iso-zoom" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
        <button aria-label="Aproximar" onClick={() => setZoom((z) => Math.min(3.2, z * 1.2))}><Plus size={15} /></button>
        <button aria-label="Afastar" onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}><Minus size={15} /></button>
        <button aria-label="Centralizar" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 size={14} /></button>
      </div>
      {master && (
        <div className={`iso-builder ${builderOpen ? "open" : ""}`} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}>
          <button className="iso-builder-tab" onClick={() => { setBuilderOpen(!builderOpen); if (builderOpen) setBuild(null); }} aria-expanded={builderOpen}>
            {builderOpen ? <X size={15} /> : <Hammer size={15} />} <span>{builderOpen ? "Fechar" : "Construir mapa"}</span>
          </button>
          {builderOpen && (
            <div className="iso-builder-body">
              <span className="eyebrow">PISO · arraste para pintar</span>
              <div className="mat-grid">
                {MATERIALS.map((m) => (
                  <button key={m} title={MATERIAL_INFO[m].name} className={build?.kind === "material" && build.value === m ? "active" : ""} onClick={() => setBuild({ kind: "material", value: m })}>
                    <svg viewBox="-32 -16 64 32" width={44} height={22}><polygon points="0,-16 32,0 0,16 -32,0" fill={`url(#mat-${m})`} stroke="#2a1a10" strokeWidth={1} /></svg>
                    <small>{MATERIAL_INFO[m].name}</small>
                  </button>
                ))}
              </div>
              <span className="eyebrow">OBJETOS · clique para pôr</span>
              <div className="prop-grid">
                {PROPS.map((p) => (
                  <button key={p} title={PROP_INFO[p].name} className={build?.kind === "prop" && build.value === p ? "active" : ""} onClick={() => setBuild({ kind: "prop", value: p })}>
                    <svg viewBox="-36 -86 72 100" width={42} height={50}><PropSprite kind={p} rot={rot} hells={hells} /></svg>
                    <small>{PROP_INFO[p].name}</small>
                  </button>
                ))}
              </div>
              <div className="builder-actions">
                <button className={build?.kind === "erase" ? "active" : ""} onClick={() => setBuild({ kind: "erase" })}><Eraser size={14} /> Apagar</button>
                <button onClick={() => setRot(rot ? 0 : 1)}><RotateCw size={14} /> Girar ({rot ? "↘" : "↙"})</button>
                <button onClick={() => setBuild(null)}>Mão livre</button>
              </div>
              <small className="builder-help">Objetos sólidos (barril, armário, mesa…) bloqueiam o caminho dos tokens.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
