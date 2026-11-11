import { sceneArtwork } from '../../shared/order-assets';
import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Text,
  Circle,
  Group,
  Image as KonvaImage,
} from "react-konva";
import type Konva from "konva";
import type { Point, PublicCharacter, Scene } from "../../shared/types";
import { Crosshair, Minus, Plus, Maximize2 } from "lucide-react";
export type Tool =
  | "select"
  | "move"
  | "room"
  | "polygon"
  | "wall"
  | "door"
  | "grid"
  | "ruler"
  | "draw"
  | "erase"
  | "fog"
  | "mark";
function useImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    setImage(undefined);
    if (!src) return;
    const i = new window.Image();
    i.onload = () => setImage(i);
    i.src = src;
  }, [src]);
  return image;
}
function Portrait({ src, size }: { src: string; size: number }) {
  const image = useImage(src);
  const side = image ? Math.min(image.width, image.height) : 0;
  const builtIn = src.startsWith("/art/order/characters/");
  const crop = image ? (builtIn ? {x:image.width*.3,y:image.height*.015,width:image.width*.46,height:image.width*.46} : {x:(image.width-side)/2,y:(image.height-side)/2,width:side,height:side}) : undefined;
  return image ? (
    <KonvaImage
      image={image}
      crop={crop}
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
    />
  ) : null;
}
export function Board({
  scene,
  characters,
  selected,
  onSelect,
  tool,
  showGrid,
  master,
  onMove,
  onPatch,
  roomId,
  onRoom,
  focus,
}: {
  scene: Scene;
  characters: PublicCharacter[];
  selected: string;
  onSelect: (id: string) => void;
  tool: Tool;
  showGrid: boolean;
  master: boolean;
  onMove: (id: string, p: Point, override?: boolean) => void;
  onPatch: (p: Partial<Scene>) => void;
  roomId: string;
  onRoom: (id: string) => void;
  focus: Point | null;
}) {
  const ref = useRef<HTMLDivElement>(null),
    stage = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 800, height: 600 }),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [space, setSpace] = useState(false),
    [start, setStart] = useState<Point | null>(null),
    [end, setEnd] = useState<Point | null>(null),
    [polygon, setPolygon] = useState<number[]>([]),
    [line, setLine] = useState<number[]>([]),
    [panning, setPanning] = useState(false);
  const background = useImage(sceneArtwork(scene.background,scene.mode,scene.name,""));
  const grid = scene.grid,
    worldW = scene.width * grid,
    worldH = scene.height * grid,
    fit = Math.min((size.width - 70) / worldW, (size.height - 70) / worldH),
    scale = fit * zoom,
    ox = (size.width - worldW * scale) / 2 + pan.x,
    oy = (size.height - worldH * scale) / 2 + pan.y;
  useEffect(() => {
    const obs = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height }),
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setStart(null);
    setPolygon([]);
  }, [scene.id]);
  useEffect(() => {
    if (focus) {
      setPan({
        x: (scene.width / 2 - focus.x) * grid * scale,
        y: (scene.height / 2 - focus.y) * grid * scale,
      });
    }
  }, [focus]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setSpace(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpace(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  function pointer() {
    const p = stage.current?.getPointerPosition();
    return p
      ? {
          x: Math.max(0, Math.min(scene.width, (p.x - ox) / scale / grid)),
          y: Math.max(0, Math.min(scene.height, (p.y - oy) / scale / grid)),
        }
      : null;
  }
  function roomAt(p: Point) {
    return scene.rooms.find((r) => {
      let inside = false;
      for (
        let i = 0, j = r.points.length - 2;
        i < r.points.length;
        j = i, i += 2
      )
        if (
          r.points[i + 1] > p.y !== r.points[j + 1] > p.y &&
          p.x <
            ((r.points[j] - r.points[i]) * (p.y - r.points[i + 1])) /
              (r.points[j + 1] - r.points[i + 1]) +
              r.points[i]
        )
          inside = !inside;
      return inside;
    });
  }
  function patchRoom(points: number[]) {
    if (!roomId) return;
    onPatch({
      rooms: scene.rooms.map((r) => (r.id === roomId ? { ...r, points } : r)),
    });
  }
  function down(e: Konva.KonvaEventObject<PointerEvent>) {
    const p = pointer();
    if (!p) return;
    if (space || e.evt.button === 1) {
      setPanning(true);
      return;
    }
    if (tool === "room" || tool === "wall" || tool === "ruler") {
      setStart({ x: Math.round(p.x), y: Math.round(p.y) });
      setEnd(p);
    }
    if (tool === "draw") setLine([p.x, p.y]);
  }
  function move(e: Konva.KonvaEventObject<PointerEvent>) {
    if (panning) {
      setPan((v) => ({ x: v.x + e.evt.movementX, y: v.y + e.evt.movementY }));
      return;
    }
    const p = pointer();
    if (p) {
      if (start) setEnd(p);
      if (line.length) setLine((l) => [...l, p.x, p.y]);
    }
  }
  function up() {
    setPanning(false);
    if (start && end && master) {
      const a = { x: Math.round(start.x), y: Math.round(start.y) },
        b = { x: Math.round(end.x), y: Math.round(end.y) };
      if (tool === "room" && a.x !== b.x && a.y !== b.y)
        patchRoom([a.x, a.y, b.x, a.y, b.x, b.y, a.x, b.y]);
      if (tool === "wall" && (a.x !== b.x || a.y !== b.y))
        onPatch({ walls: [...scene.walls, [a.x, a.y, b.x, b.y]] });
    }
    if (line.length > 3 && master)
      onPatch({ drawings: [...scene.drawings, line] });
    setLine([]);
    if (tool !== "ruler") {
      setStart(null);
      setEnd(null);
    }
  }
  function click(e: Konva.KonvaEventObject<MouseEvent>) {
    if (panning || space) return;
    const p = pointer();
    if (!p) return;
    if (tool === "move" && selected)
      onMove(
        selected,
        {
          x: Math.min(scene.width - 1, Math.floor(p.x)),
          y: Math.min(scene.height - 1, Math.floor(p.y)),
        },
        master && e.evt.shiftKey,
      );
    if (tool === "select") {
      const r = roomAt(p);
      if (r) onRoom(r.id);
    }
    if (!master) return;
    if (tool === "polygon")
      setPolygon((v) => [...v, Math.round(p.x), Math.round(p.y)]);
    if (tool === "door")
      onPatch({
        doors: [
          ...scene.doors,
          {
            id: crypto.randomUUID(),
            x: Math.floor(p.x) + 0.5,
            y: Math.round(p.y),
            open: true,
          },
        ],
      });
    if (tool === "fog") {
      const r = roomAt(p);
      if (r)
        onPatch({
          rooms: scene.rooms.map((v) =>
            v.id === r.id ? { ...v, visible: !v.visible } : v,
          ),
        });
    }
    if (tool === "mark")
      onPatch({
        drawings: [
          ...scene.drawings,
          [
            p.x - 0.25,
            p.y,
            p.x + 0.25,
            p.y,
            p.x,
            p.y,
            p.x,
            p.y - 0.25,
            p.x,
            p.y + 0.25,
          ],
        ],
      });
    if (tool === "erase") {
      const cell = { x: Math.floor(p.x), y: Math.floor(p.y) };
      onPatch({
        blocked: scene.blocked.some((b) => b.x === cell.x && b.y === cell.y)
          ? scene.blocked.filter((b) => b.x !== cell.x || b.y !== cell.y)
          : [...scene.blocked, cell],
      });
    }
  }
  const me = characters.find((c) => c.id === selected);
  return (
    <div
      ref={ref}
      className={`board-container tool-${tool}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="board-texture" />
      <Stage
        ref={stage}
        width={size.width}
        height={size.height}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onClick={click}
        onDblClick={() => {
          if (tool === "polygon" && polygon.length >= 6) {
            patchRoom(polygon);
            setPolygon([]);
          }
        }}
        onWheel={(e) => {
          e.evt.preventDefault();
          setZoom((z) =>
            Math.min(3.5, Math.max(0.4, z * (e.evt.deltaY > 0 ? 0.92 : 1.08))),
          );
        }}
      >
        <Layer x={ox} y={oy} scaleX={scale} scaleY={scale}>
          <Rect
            width={worldW}
            height={worldH}
            fill="#141419"
            stroke="#47454f"
            strokeWidth={1}
          />
          {background && (
            <KonvaImage
              image={background}
              x={
                (worldW -
                  background.width *
                    Math.min(
                      worldW / background.width,
                      worldH / background.height,
                    )) /
                2
              }
              y={
                (worldH -
                  background.height *
                    Math.min(
                      worldW / background.width,
                      worldH / background.height,
                    )) /
                2
              }
              width={
                background.width *
                Math.min(worldW / background.width, worldH / background.height)
              }
              height={
                background.height *
                Math.min(worldW / background.width, worldH / background.height)
              }
              opacity={0.85}
            />
          )}
          {scene.rooms
            .filter((r) => r.points.length >= 6)
            .map((r, i) => (
              <Group key={r.id}>
                <Line
                  points={r.points.map((v) => v * grid)}
                  closed
                  fill={
                    background
                      ? r.id === roomId
                        ? "rgba(255,47,142,0.14)"
                        : r.visible
                          ? "rgba(12,8,14,0.03)"
                          : "rgba(8,6,10,0.9)"
                      : r.id === roomId
                        ? "#34212e"
                        : r.visible
                          ? "#24232a"
                          : "#121216"
                  }
                  stroke={
                    r.id === roomId
                      ? "#FF2F8E"
                      : background
                        ? "rgba(255,118,199,0.18)"
                        : "#55525d"
                  }
                  strokeWidth={r.id === roomId ? 2 : 1}
                  dash={!r.visible ? [8, 5] : undefined}
                />
                {!background && r.points.length === 8 && (
                  <Group opacity={0.45} listening={false}>
                    <Rect
                      x={
                        (Math.min(...r.points.filter((_, i) => i % 2 === 0)) +
                          1.5) *
                        grid
                      }
                      y={
                        (Math.min(...r.points.filter((_, i) => i % 2 === 1)) +
                          2.6) *
                        grid
                      }
                      width={grid * 2.7}
                      height={grid * 0.8}
                      fill="#37303e"
                      stroke="#746078"
                      strokeWidth={1}
                    />
                    <Line
                      points={[
                        (Math.min(...r.points.filter((_, i) => i % 2 === 0)) +
                          1.8) *
                          grid,
                        (Math.min(...r.points.filter((_, i) => i % 2 === 1)) +
                          2.85) *
                          grid,
                        (Math.min(...r.points.filter((_, i) => i % 2 === 0)) +
                          3.8) *
                          grid,
                        (Math.min(...r.points.filter((_, i) => i % 2 === 1)) +
                          2.85) *
                          grid,
                      ]}
                      stroke="#ad728e"
                      strokeWidth={1}
                    />
                    <Circle
                      x={
                        (Math.min(...r.points.filter((_, i) => i % 2 === 0)) +
                          2.8) *
                        grid
                      }
                      y={
                        (Math.min(...r.points.filter((_, i) => i % 2 === 1)) +
                          3.8) *
                        grid
                      }
                      radius={grid * 0.22}
                      fill="#38303e"
                      stroke="#746078"
                      strokeWidth={1}
                    />
                  </Group>
                )}
                <Text
                  x={
                    Math.min(...r.points.filter((_, i) => i % 2 === 0)) * grid +
                    12
                  }
                  y={
                    Math.min(...r.points.filter((_, i) => i % 2 === 1)) * grid +
                    12
                  }
                  text={String(i + 1).padStart(2, "0")}
                  fontSize={Math.max(11, 8 / scale)}
                  fill="#FF76C7"
                  fontFamily="monospace"
                />
                <Text
                  x={
                    Math.min(...r.points.filter((_, i) => i % 2 === 0)) * grid +
                    12
                  }
                  y={
                    (Math.min(...r.points.filter((_, i) => i % 2 === 1)) + 1) *
                    grid
                  }
                  text={r.name.toUpperCase()}
                  visible={!background}
                  width={Math.max(
                    80,
                    (Math.max(...r.points.filter((_, i) => i % 2 === 0)) -
                      Math.min(...r.points.filter((_, i) => i % 2 === 0))) *
                      grid -
                      24,
                  )}
                  fontSize={Math.max(12, 8 / scale)}
                  fill={r.visible ? "#bebbc7" : "#625b69"}
                  fontFamily="monospace"
                  lineHeight={1.5}
                />
              </Group>
            ))}
          {showGrid && (
            <Group opacity={scene.gridOpacity}>
              {Array.from({ length: scene.width + 1 }, (_, i) => (
                <Line
                  key={`x${i}`}
                  points={[i * grid, 0, i * grid, worldH]}
                  stroke="#9d98a8"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: scene.height + 1 }, (_, i) => (
                <Line
                  key={`y${i}`}
                  points={[0, i * grid, worldW, i * grid]}
                  stroke="#9d98a8"
                  strokeWidth={0.5}
                />
              ))}
            </Group>
          )}
          {tool === "move" && me && (
            <Group opacity={0.08}>
              {Array.from({ length: scene.width * scene.height }, (_, i) => {
                const x = i % scene.width,
                  y = Math.floor(i / scene.width);
                return Math.abs(x - me.position.x) +
                  Math.abs(y - me.position.y) <=
                  me.remainingMove ? (
                  <Rect
                    key={i}
                    x={x * grid}
                    y={y * grid}
                    width={grid}
                    height={grid}
                    fill="#FF2F8E"
                  />
                ) : null;
              })}
            </Group>
          )}
          {scene.walls.map((w, i) => (
            <Line
              key={`w${i}`}
              points={w.map((v) => v * grid)}
              stroke="#a8a2b0"
              strokeWidth={4}
              lineCap="square"
            />
          ))}
          {scene.doors.map((d) => (
            <Group key={d.id}>
              <Line
                points={[
                  (d.x - 0.48) * grid,
                  d.y * grid,
                  (d.x + 0.48) * grid,
                  d.y * grid,
                ]}
                stroke="#141419"
                strokeWidth={7}
              />
              <Line
                points={[
                  (d.x - 0.45) * grid,
                  d.y * grid,
                  (d.x + 0.45) * grid,
                  d.y * grid,
                ]}
                stroke={d.open ? "#FF76C7" : "#FF2F8E"}
                strokeWidth={3}
                dash={d.open ? [3, 5] : undefined}
              />
            </Group>
          ))}
          {scene.blocked.map((b, i) => (
            <Group key={`b${i}`}>
              <Rect
                x={b.x * grid}
                y={b.y * grid}
                width={grid}
                height={grid}
                fill="#FF2F8E"
                opacity={0.12}
              />
              <Line
                points={[
                  (b.x + 0.2) * grid,
                  (b.y + 0.2) * grid,
                  (b.x + 0.8) * grid,
                  (b.y + 0.8) * grid,
                ]}
                stroke="#FF76C7"
                strokeWidth={1}
              />
            </Group>
          ))}
          {scene.drawings.map((p, i) => (
            <Line
              key={`p${i}`}
              points={p.map((v) => v * grid)}
              stroke="#FF76C7"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {line.length > 1 && (
            <Line
              points={line.map((v) => v * grid)}
              stroke="#FF76C7"
              strokeWidth={2}
            />
          )}
          {polygon.length > 1 && (
            <Line
              points={polygon.map((v) => v * grid)}
              stroke="#FF2F8E"
              strokeWidth={2}
              dash={[4, 3]}
            />
          )}
          {start && end && (
            <Group>
              {tool === "room" ? (
                <Rect
                  x={Math.min(start.x, end.x) * grid}
                  y={Math.min(start.y, end.y) * grid}
                  width={Math.abs(start.x - end.x) * grid}
                  height={Math.abs(start.y - end.y) * grid}
                  fill="#FF2F8E"
                  opacity={0.3}
                  stroke="#FF2F8E"
                />
              ) : (
                <>
                  <Line
                    points={[
                      start.x * grid,
                      start.y * grid,
                      end.x * grid,
                      end.y * grid,
                    ]}
                    stroke="#FF76C7"
                    strokeWidth={2}
                    dash={[5, 4]}
                  />
                  {tool === "ruler" && (
                    <Text
                      x={end.x * grid + 5}
                      y={end.y * grid}
                      text={`${Math.round(Math.abs(end.x - start.x) + Math.abs(end.y - start.y))} casas`}
                      fill="#FF76C7"
                      fontSize={13}
                    />
                  )}
                </>
              )}
            </Group>
          )}
          {characters.map((c) => (
            <Group
              key={c.id}
              x={(c.position.x + 0.5) * grid}
              y={(c.position.y + 0.5) * grid}
              draggable={tool === "move" && (master || c.hand !== undefined)}
              onClick={(e) => {
                e.cancelBubble = true;
                onSelect(c.id);
              }}
              onDragEnd={(e) => {
                const p = {
                  x: Math.max(
                    0,
                    Math.min(scene.width - 1, Math.floor(e.target.x() / grid)),
                  ),
                  y: Math.max(
                    0,
                    Math.min(scene.height - 1, Math.floor(e.target.y() / grid)),
                  ),
                };
                e.target.position({
                  x: (c.position.x + 0.5) * grid,
                  y: (c.position.y + 0.5) * grid,
                });
                onMove(c.id, p, master && e.evt.shiftKey);
              }}
            >
              <Circle
                radius={grid * 0.42}
                fill={c.npc ? "#29212c" : "#131318"}
                stroke={
                  selected === c.id ? "#FF2F8E" : c.npc ? "#9d879b" : "#D7D7DE"
                }
                strokeWidth={selected === c.id ? 3 : 1.5}
                shadowColor="#FF2F8E"
                shadowBlur={selected === c.id ? 18 : 0}
              />
              {c.portrait ? (
                <Group
                  clipFunc={(ctx) => {
                    ctx.arc(0, 0, grid * 0.37, 0, Math.PI * 2);
                  }}
                >
                  <Portrait src={c.portrait} size={grid * 0.75} />
                </Group>
              ) : (
                <Text
                  x={-grid * 0.4}
                  y={-6}
                  width={grid * 0.8}
                  align="center"
                  text={c.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                  fill={selected === c.id ? "#FF76C7" : "#D7D7DE"}
                  fontSize={11}
                  fontStyle="bold"
                />
              )}
              <Rect
                x={-grid * 0.3}
                y={grid * 0.39}
                width={grid * 0.6}
                height={3}
                fill="#2A2A2F"
              />
              <Rect
                x={-grid * 0.3}
                y={grid * 0.39}
                width={(grid * 0.6 * c.hp) / c.maxHp}
                height={3}
                fill="#FF2F8E"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
      <div className="board-coordinates mono">
        {scene.width} × {scene.height} / {scene.grid}px
        <span>
          {tool === "room"
            ? "ARRASTE PARA DEFINIR A SALA"
            : tool === "polygon"
              ? "CLIQUE NOS VÉRTICES · DUPLO CLIQUE PARA CONCLUIR"
              : tool === "erase"
                ? "CLIQUE PARA BLOQUEAR / LIBERAR CÉLULA"
                : tool === "wall"
                  ? "ARRASTE PARA DESENHAR PAREDE"
                  : tool === "move"
                    ? "SELECIONE UM TOKEN E CLIQUE NO DESTINO"
                    : "ESPAÇO + ARRASTAR: CÂMERA · SHIFT + MOVER: CORREÇÃO DO MESTRE"}
        </span>
      </div>
      <div className="zoom-controls">
        <button
          aria-label="Diminuir zoom"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
        >
          <Minus size={15} />
        </button>
        <span className="mono">{Math.round(zoom * 100)}%</span>
        <button
          aria-label="Aumentar zoom"
          onClick={() => setZoom((z) => Math.min(3.5, z + 0.15))}
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Enquadrar tabuleiro"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}
export function Minimap({
  scene,
  characters,
  onFocus,
}: {
  scene: Scene;
  characters: PublicCharacter[];
  onFocus: (p: Point) => void;
}) {
  return (
    <svg
      className="minimap"
      preserveAspectRatio="none"
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      role="img"
      aria-label="Minimapa interativo"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onFocus({
          x: ((e.clientX - r.left) / r.width) * scene.width,
          y: ((e.clientY - r.top) / r.height) * scene.height,
        });
      }}
    >
      <rect width={scene.width} height={scene.height} fill="#111116" />
      {scene.rooms
        .filter((r) => r.points.length >= 6)
        .map((r) => (
          <polygon
            key={r.id}
            points={r.points.reduce(
              (s, n, i) => s + `${n}${i % 2 ? " " : ","}`,
              "",
            )}
            fill="#302731"
            stroke="#736475"
            strokeWidth=".15"
          />
        ))}
      {characters.map((c) => (
        <circle
          key={c.id}
          cx={c.position.x + 0.5}
          cy={c.position.y + 0.5}
          r=".4"
          fill={c.npc ? "#D7D7DE" : "#FF2F8E"}
        />
      ))}
      <rect
        x=".5"
        y=".5"
        width={scene.width - 1}
        height={scene.height - 1}
        fill="none"
        stroke="#FF2F8E"
        strokeWidth=".2"
        opacity=".5"
      />
    </svg>
  );
}
