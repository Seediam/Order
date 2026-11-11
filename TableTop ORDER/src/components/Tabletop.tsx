import { sceneArtwork } from '../../shared/order-assets';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { io, type Socket } from "socket.io-client";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  MousePointer2,
  Move,
  SquareDashed,
  Pentagon,
  BrickWall,
  DoorOpen,
  Grid2X2,
  Ruler,
  Pencil,
  Eraser,
  EyeOff,
  MapPin,
  Dices,
  Undo2,
  Redo2,
  Settings2,
  Maximize2,
  Plus,
  Users,
  MessageSquare,
  ScrollText,
  Send,
  Swords,
  Pause,
  Play,
  Square,
  SkipForward,
  Layers3,
  FileText,
  Flame,
  Shield,
  Heart,
  Brain,
  Scale,
  Crosshair,
  BookOpen,
  Edit3,
  Volume2,
  LogOut,
  LockKeyhole,
  Save,
  Eye,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { api, post } from "../api";
import { audio } from "../audio";
import { useStore } from "../store";
import {
  AssetPicker,
  ErrorText,
  EyeMark,
  Field,
  Loading,
  Logo,
  Modal,
} from "./UI";
import { Board, Minimap, type Tool } from "./Board";
import {
  CardEditor,
  CardFace,
  CharacterCreator,
  CharacterSheet,
  NovelEditor,
  RoomEditor,
  SceneEditor,
  type Perform,
} from "./Editors";
import { Novel } from "./Novel";
import { gates } from "../../shared/catalog";
import type {
  Action,
  Card,
  ClientEvents,
  Log,
  Point,
  PublicCharacter,
  Scene,
  ServerEvents,
  ViewState,
} from "../../shared/types";
declare global {
  interface Window {
    Dice3D?: {
      roll: (dice: unknown[], options?: Record<string, unknown>) => Promise<void>;
    };
  }
}
/* Mostra a rolagem do servidor com os dados 3D (public/dice3d.js). */
function rollDice(entry: Log) {
  const rolls = entry.rolls || [];
  if (!rolls.length || !window.Dice3D) return;
  const judged = rolls.filter((r) => r.ok !== undefined),
    allOk = judged.every((r) => r.ok);
  void window.Dice3D.roll(
    rolls.map((r) => ({ sides: r.sides, value: r.value, ok: r.ok })),
    {
      title:
        rolls.map((r) => r.label).filter(Boolean).join(" · ") || entry.author,
      result:
        rolls.map((r) => r.value).join(" · ") +
        (judged.length ? (allOk ? " · SUCESSO" : " · FALHA") : ""),
      detail:
        rolls.map((r) => r.detail).filter(Boolean).join(" — ") || entry.text,
      tone: judged.length ? (allOk ? "good" : "bad") : "",
      hold: 1100,
    },
  );
}
export function Tabletop({ id, onLeave }: { id: string; onLeave: () => void }) {
  const user = useStore((s) => s.user)!,
    state = useStore((s) => s.campaign),
    setState = useStore((s) => s.setCampaign),
    notify = useStore((s) => s.notify),
    connected = useStore((s) => s.connected),
    setConnected = useStore((s) => s.setConnected);
  const socket = useRef<Socket<ServerEvents, ClientEvents> | null>(null),
    lastLog = useRef(""),
    lastTurn = useRef("");
  const [tool, setTool] = useState<Tool>("select"),
    [showGrid, setGrid] = useState(true),
    [selected, setSelected] = useState(""),
    [controlled, setControlled] = useState(""),
    [roomId, setRoom] = useState(""),
    [focus, setFocus] = useState<Point | null>(null),
    [modal, setModal] = useState(""),
    [selectedCard, setSelectedCard] = useState<Card | null>(null),
    [editingCard, setEditingCard] = useState<Card | null>(null),
    [logTab, setLogTab] = useState("all"),
    [chat, setChat] = useState(""),
    [privacy, setPrivacy] = useState(false),
    [inspection, setInspection] = useState<string[]>([]),
    [error, setError] = useState("");
  const logEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    setState(null);
    const s: Socket<ServerEvents, ClientEvents> = io({ autoConnect: false });
    socket.current = s;
    s.on("connect", () => {
      setConnected(true);
      s.emit("campaign:join", id, (r) => {
        if (!r.ok) setError(r.error || "Não foi possível entrar.");
      });
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (e) => setError(e.message));
    s.on("campaign:presence", (online) => {
      const current = useStore.getState().campaign;
      if (current) setState({ ...current, online });
    });
    s.on("campaign:state", (next) => {
      if (!live) return;
      setState(next);
      setError("");
    });
    s.connect();
    return () => {
      live = false;
      s.disconnect();
      socket.current = null;
      audio.stop();
      setState(null);
      setConnected(false);
    };
  }, [id, setState, setConnected]);
  useEffect(() => {
    if (!state) return;
    const mine = state.characters.find((c) => c.ownerId === user.id && !c.npc);
    if (!controlled && mine) setControlled(mine.id);
    if (!selected) setSelected(mine?.id || state.characters[0]?.id || "");
    const scene = state.scenes.find((s) => s.id === state.activeSceneId);
    if (scene && !scene.rooms.some((r) => r.id === roomId))
      setRoom(scene.rooms[0]?.id || "");
    const latest = state.logs.at(-1);
    if (latest && lastLog.current !== latest.id) {
      if (lastLog.current) {
        audio.tone(
          latest.kind === "dice"
            ? "dice"
            : latest.text.startsWith("Turno")
              ? "turn"
              : "click",
        );
        // Dados 3D: todos os clientes animam a mesma rolagem decidida pelo servidor.
        const start = state.logs.findIndex((l) => l.id === lastLog.current);
        for (const entry of state.logs.slice(start + 1))
          if (entry.rolls?.length) rollDice(entry);
      }
      lastLog.current = latest.id;
    }
  }, [state, user.id, controlled, selected, roomId]);
  useEffect(() => {
    if (!state?.combat.active) return;
    const activeId = state.combat.order[state.combat.index];
    if (lastTurn.current === activeId) return;
    lastTurn.current = activeId;
    const c = state.characters.find((c) => c.id === activeId);
    if (c) {
      setFocus(c.position);
      if (c.hand !== undefined) {
        setControlled(c.id);
        setSelected(c.id);
      }
    }
  }, [
    state?.combat.active,
    state?.combat.index,
    state?.combat.round,
    state?.combat.order.join(","),
  ]);
  useEffect(() => {
    if (state) audio.sync(state.audio);
  }, [state?.audio.url, state?.audio.startedAt]);
  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.logs.length, logTab]);
  const perform: Perform = useCallback(
    async (action: Action) => {
      if (!socket.current?.connected) {
        notify("Reconectando ao servidor. Aguarde.", true);
        return false;
      }
      return new Promise<boolean>((resolve) => {
        socket
          .current!.timeout(10000)
          .emit(
            "campaign:action",
            { campaignId: id, action },
            (err: any, r: any) => {
              if (err) {
                notify(
                  "O servidor não confirmou a ação. Aguarde a atualização antes de tentar novamente.",
                  true,
                );
                resolve(false);
              } else if (!r.ok) {
                notify(r.error || "Ação não permitida.", true);
                resolve(false);
              } else {
                audio.tone("click");
                resolve(true);
              }
            },
          );
      });
    },
    [id, notify],
  );
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select") || modal)
        return;
      const allowed: Record<string, Tool> = {
        v: "select",
        m: "move",
        r: "ruler",
      };
      if (e.key.toLowerCase() in allowed) setTool(allowed[e.key.toLowerCase()]);
      if (e.key.toLowerCase() === "g") setGrid((v) => !v);
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [modal]);
  if (!state || state.id !== id)
    return (
      <div className="table-loading">
        <Logo />
        <Loading />
        {error && <ErrorText error={error} />}
        <button className="btn secondary" onClick={onLeave}>
          Voltar ao departamento
        </button>
      </div>
    );
  const master = state.ownerId === user.id,
    scene = state.scenes.find((s) => s.id === state.activeSceneId),
    activeCharacter = state.characters.find(
      (c) => c.id === state.combat.order[state.combat.index],
    ),
    me =
      state.characters.find(
        (c) => c.id === controlled && c.hand !== undefined,
      ) || state.characters.find((c) => c.ownerId === user.id && !c.npc),
    inspected = state.characters.find((c) => c.id === selected) || me,
    room = scene?.rooms.find((r) => r.id === roomId),
    myTurn = !state.combat.active || activeCharacter?.id === me?.id,
    hand = me?.hand || [];
  if (!scene)
    return (
      <div className="table-loading">
        <EyeMark />
        <p>O Mestre está preparando a próxima cena.</p>
        <button className="btn secondary" onClick={onLeave}>
          Voltar ao departamento
        </button>
      </div>
    );
  function selectCharacter(charId: string) {
    setSelected(charId);
    const c = state!.characters.find((c) => c.id === charId);
    if (c?.hand !== undefined) setControlled(charId);
  }
  function patch(p: Partial<Scene>) {
    void perform({ type: "scene:update", sceneId: scene!.id, patch: p });
  }
  async function sendChat(e: FormEvent) {
    e.preventDefault();
    if (!chat.trim()) return;
    if (await perform({ type: "chat", text: chat })) setChat("");
  }
  const tools = [
    { id: "select", icon: MousePointer2, label: "Selecionar (V)" },
    { id: "move", icon: Move, label: "Mover token (M)" },
    { id: "room", icon: SquareDashed, label: "Sala retangular", gm: true },
    { id: "polygon", icon: Pentagon, label: "Sala poligonal", gm: true },
    { id: "wall", icon: BrickWall, label: "Parede", gm: true },
    { id: "door", icon: DoorOpen, label: "Porta", gm: true },
    { id: "grid", icon: Grid2X2, label: "Exibir grade (G)" },
    { id: "ruler", icon: Ruler, label: "Régua (R)" },
    { id: "draw", icon: Pencil, label: "Desenhar", gm: true },
    { id: "erase", icon: Eraser, label: "Células bloqueadas", gm: true },
    { id: "fog", icon: EyeOff, label: "Revelar / ocultar sala", gm: true },
    { id: "mark", icon: MapPin, label: "Marcação", gm: true },
  ] as const;
  return (
    <div className="tabletop">
      <header className="table-header">
        <button
          className="icon-btn"
          aria-label="Voltar às sessões"
          onClick={onLeave}
        >
          <ArrowLeft size={19} />
        </button>
        <Logo small />
        <span className="top-divider" />
        <div className="table-session-title">
          <strong>{state.name}</strong>
          <small className="mono">
            <i className={connected ? "connected-dot" : "disconnected-dot"} />
            {connected ? "SESSÃO SINCRONIZADA" : "RECONECTANDO…"}
          </small>
        </div>
        <div className="table-header-right">
          <span className="mode-badge">{scene.mode}</span>
          <span className="mono">
            <Users size={14} />
            {state.online.length} ONLINE
          </span>
          <button
            className="icon-btn"
            title="Hell of Fame"
            aria-label="Hell of Fame"
            onClick={() => setModal("fame")}
          >
            <Trophy size={17} />
          </button>
          <button
            className="icon-btn"
            title="Passar dispositivo"
            aria-label="Passar dispositivo"
            onClick={() => setPrivacy(true)}
          >
            <LockKeyhole size={17} />
          </button>
          {master && (
            <button
              className="icon-btn"
              aria-label="Configurações da campanha"
              onClick={() => setModal("campaign")}
            >
              <Settings2 size={17} />
            </button>
          )}
          <button
            className="icon-btn"
            aria-label="Tela cheia"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void document.documentElement
                  .requestFullscreen()
                  .catch(() => {});
            }}
          >
            <Maximize2 size={17} />
          </button>
          <div className="avatar small-avatar">
            {user.displayName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>
      <aside className="table-left">
        <div className="scene-current">
          <span className="eyebrow">CENA ATUAL</span>
          <div
            className="scene-thumbnail"
            style={{
              backgroundImage: `url("${sceneArtwork(scene.background,scene.mode,scene.name,"/art/factory.svg")}")`,
            }}
          >
            <span className="mono">
              {scene.type === "board" ? "TABULEIRO" : "VISUAL NOVEL"}
            </span>
          </div>
          <h3>{scene.name}</h3>
          <p>{scene.description || "A verdade não costuma ficar à vista."}</p>
        </div>
        <div className="left-section">
          <div className="panel-label">
            <span>VISÃO TÁTICA</span>
            <Crosshair size={13} />
          </div>
          <Minimap
            scene={scene}
            characters={state.characters}
            onFocus={setFocus}
          />
        </div>
        <div className="left-section">
          <div className="panel-label">
            <span>
              CENAS <small>{state.scenes.length}</small>
            </span>
            {master && (
              <button
                className="icon-btn"
                aria-label="Criar cena"
                onClick={() => setModal("newScene")}
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="scene-list">
            {state.scenes.map((s, i) => (
              <button
                key={s.id}
                className={s.id === scene.id ? "active" : ""}
                disabled={!master && s.id !== scene.id}
                onClick={() => {
                  if (master && s.id !== scene.id)
                    void perform({ type: "scene:activate", sceneId: s.id });
                }}
              >
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                {s.type === "board" ? (
                  <Grid2X2 size={13} />
                ) : (
                  <MessageSquare size={13} />
                )}
                <span>{s.name}</span>
                {s.id === scene.id && <i />}
              </button>
            ))}
          </div>
        </div>
        <div className="left-section rooms-section">
          <div className="panel-label">
            <span>
              SALAS <small>{scene.rooms.length}</small>
            </span>
          </div>
          <div className="room-list">
            {scene.rooms.map((r, i) => (
              <button
                className={r.id === roomId ? "active" : ""}
                key={r.id}
                onClick={() => {
                  setRoom(r.id);
                  if (r.points.length) {
                    const xs = r.points.filter((_, i) => i % 2 === 0),
                      ys = r.points.filter((_, i) => i % 2 === 1);
                    setFocus({
                      x: (Math.min(...xs) + Math.max(...xs)) / 2,
                      y: (Math.min(...ys) + Math.max(...ys)) / 2,
                    });
                  }
                }}
              >
                <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                <span>{r.name}</span>
                {!r.visible ? (
                  <EyeOff size={12} />
                ) : !r.points.length ? (
                  <span className="pink">○</span>
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="trust-meter">
          <div>
            <Scale size={14} />
            <span>CONFIANÇA</span>
            <strong>
              {state.trust}
              <small>/10</small>
            </strong>
          </div>
          <div className="resource-track">
            <i style={{ width: `${state.trust * 10}%` }} />
          </div>
        </div>
      </aside>
      <main
        className="table-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const card = state.cards.find(
            (c) => c.id === e.dataTransfer.getData("text/plain"),
          );
          if (card && hand.includes(card.id)) {
            setSelectedCard(card);
            setModal("play");
          }
        }}
      >
        <div className="hotbar" aria-label="Ferramentas da mesa">
          {tools
            .filter((t) => !("gm" in t) || master)
            .map((t) => (
              <button
                key={t.id}
                className={
                  (t.id === "grid" ? showGrid : tool === t.id) ? "active" : ""
                }
                title={t.label}
                data-tip={t.label}
                aria-label={t.label}
                onClick={() =>
                  t.id === "grid" ? setGrid(!showGrid) : setTool(t.id as Tool)
                }
              >
                <t.icon size={17} />
              </button>
            ))}
          <span />
          <button
            title="Rolar dados"
            aria-label="Rolar dados"
            onClick={() => setModal("dice")}
          >
            <Dices size={18} />
          </button>
          {master && (
            <>
              <button
                title="Desfazer edição administrativa"
                aria-label="Desfazer edição administrativa"
                onClick={() => void perform({ type: "admin:undo" })}
              >
                <Undo2 size={17} />
              </button>
              <button
                title="Refazer edição administrativa"
                aria-label="Refazer edição administrativa"
                onClick={() => void perform({ type: "admin:redo" })}
              >
                <Redo2 size={17} />
              </button>
              <button
                title="Configurações da cena"
                aria-label="Configurações da cena"
                onClick={() => setModal("scene")}
              >
                <Settings2 size={17} />
              </button>
            </>
          )}
        </div>
        {scene.type === "board" ? (
          <Board
            scene={scene}
            characters={state.characters}
            selected={selected}
            onSelect={selectCharacter}
            tool={tool}
            showGrid={showGrid}
            master={master}
            onMove={(characterId, position, override) =>
              void perform({
                type: "token:move",
                characterId,
                position,
                override: master && override,
              })
            }
            onPatch={patch}
            roomId={roomId}
            onRoom={setRoom}
            focus={focus}
          />
        ) : (
          <Novel
            scene={scene}
            character={me?.npc ? undefined : me}
            master={master}
            perform={perform}
          />
        )}
        {state.combat.active && (
          <div className="turn-strip">
            <span className="mono round">
              RODADA {String(state.combat.round).padStart(2, "0")}
            </span>
            <div className="initiative">
              {state.combat.order.map((id, i) => {
                const c = state.characters.find((c) => c.id === id);
                return c ? (
                  <button
                    key={id}
                    className={`${i === state.combat.index ? "active" : ""} ${c.npc ? "npc" : ""} ${c.hp <= 0 ? "down" : ""}`}
                    title={`${c.name} · Vida ${c.hp}/${c.maxHp}`}
                    onClick={() => {
                      selectCharacter(id);
                      setFocus(c.position);
                    }}
                  >
                    <span className="init-order">{i + 1}</span>
                    <span className="init-face">
                      {c.portrait ? <img src={c.portrait} alt="" /> : <EyeMark />}
                    </span>
                    <span className="init-name">{c.name}</span>
                    <span className="init-hp">
                      <i style={{ width: `${Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100))}%` }} />
                    </span>
                  </button>
                ) : null;
              })}
            </div>
            {state.combat.paused && <span className="pink mono">PAUSADO</span>}
          </div>
        )}
        {me && <DiceTray me={me} perform={perform} />}
        <div className="scene-toolbar">
          <span className="mono">
            {scene.type === "board"
              ? "PLANTA OPERACIONAL"
              : "TRANSMISSÃO NARRATIVA"}{" "}
            <span className="pink">/</span> {scene.name.toUpperCase()}
          </span>
          {master && (
            <div className="row">
              {scene.type === "novel" && (
                <button className="text-btn" onClick={() => setModal("novel")}>
                  <Edit3 size={13} />
                  Editar roteiro
                </button>
              )}
              <button
                className="text-btn"
                onClick={() => setModal("character")}
              >
                <Plus size={13} />
                Personagem / NPC
              </button>
              <button className="text-btn" onClick={() => setModal("cards")}>
                <Layers3 size={13} />
                Cartas
              </button>
              <button className="text-btn" onClick={() => setModal("audio")}>
                <Volume2 size={13} />
                Ambiente
              </button>
            </div>
          )}
        </div>
      </main>
      <aside className="table-right">
        <div className="context-profile">
          <div className="panel-label">
            <span>ARQUIVO EM FOCO</span>
            <button
              className="icon-btn"
              aria-label="Criar personagem"
              onClick={() => setModal("character")}
            >
              <Plus size={14} />
            </button>
          </div>
          {inspected ? (
            <>
              <div className="context-identity">
                <div className="character-portrait">
                  {inspected.portrait ? (
                    <img src={inspected.portrait} alt="" />
                  ) : (
                    <EyeMark />
                  )}
                  <span className="mono">
                    {inspected.npc ? "NPC" : "SEARCHER"}
                  </span>
                </div>
                <div>
                  <span className="eyebrow pink">{inspected.sector}</span>
                  <h3>{inspected.name}</h3>
                  <small>{inspected.sin}</small>
                  <button
                    className="text-btn"
                    onClick={() => setModal("sheet")}
                  >
                    Abrir ficha <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="resource-bars">
                <Resource
                  icon={Heart}
                  label="VIDA"
                  value={inspected.hp}
                  max={inspected.maxHp}
                />
                <Resource
                  icon={Scale}
                  label="MORAL"
                  value={inspected.moral}
                  max={inspected.maxMoral}
                />
                <Resource
                  icon={Brain}
                  label="SANIDADE"
                  value={inspected.sanity}
                  max={inspected.maxSanity}
                />
              </div>
              <div className="character-stats">
                <span>
                  <Shield size={13} />
                  {inspected.defense}
                  <small>DEFESA</small>
                </span>
                <span>
                  <Move size={13} />
                  {inspected.remainingMove}
                  <small>MOVIMENTO</small>
                </span>
                <span>
                  <Flame size={13} />
                  {inspected.fame}
                  <small>FAME</small>
                </span>
              </div>
              {inspected.effects.length > 0 && (
                <div className="effect-tags">
                  {inspected.effects.map((e, i) => (
                    <span key={i}>{e}</span>
                  ))}
                </div>
              )}
              {master && inspected.hand === undefined && (
                <button
                  className="btn secondary compact full"
                  onClick={async () => {
                    try {
                      const r = await api(
                        `/api/campaigns/${id}/inspect/${inspected.id}`,
                      );
                      setInspection(r.hand);
                      setModal("inspect");
                    } catch (e) {
                      notify((e as Error).message, true);
                    }
                  }}
                >
                  <Eye size={13} />
                  Inspecionar mão (registrado)
                </button>
              )}
            </>
          ) : (
            <div className="context-empty">
              <FileText size={25} />
              <p>Nenhum Procurador registrado.</p>
              <button
                className="btn secondary compact"
                onClick={() => setModal("character")}
              >
                Criar personagem
              </button>
            </div>
          )}
        </div>
        {room && (
          <div className="context-room">
            <div className="panel-label">
              <span>SALA EM FOCO</span>
              {master && (
                <button
                  className="icon-btn"
                  aria-label="Editar sala selecionada"
                  onClick={() => setModal("room")}
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
            {room.image && <img src={room.image} alt={room.name} />}
            <strong>{room.name}</strong>
            <p>{room.description || "Nenhum registro adicional."}</p>
            {scene.doors
              .filter(
                (d) =>
                  room.points.length &&
                  d.x >=
                    Math.min(...room.points.filter((_, i) => i % 2 === 0)) &&
                  d.x <=
                    Math.max(...room.points.filter((_, i) => i % 2 === 0)) &&
                  d.y >=
                    Math.min(...room.points.filter((_, i) => i % 2 === 1)) &&
                  d.y <= Math.max(...room.points.filter((_, i) => i % 2 === 1)),
              )
              .map((d, i) => (
                <button
                  className="text-btn"
                  key={d.id}
                  onClick={() =>
                    void perform({
                      type: "door:toggle",
                      doorId: d.id,
                      characterId: me?.id,
                    })
                  }
                >
                  <DoorOpen size={13} />
                  Porta {i + 1} · {d.open ? "Aberta" : "Fechada"}
                </button>
              ))}
          </div>
        )}
        <div className="activity-panel">
          <div className="tabs">
            <button
              className={logTab === "all" ? "active" : ""}
              onClick={() => setLogTab("all")}
            >
              <ScrollText size={13} />
              Registro
            </button>
            <button
              className={logTab === "chat" ? "active" : ""}
              onClick={() => setLogTab("chat")}
            >
              <MessageSquare size={13} />
              Chat
            </button>
          </div>
          <div className="activity-feed">
            {state.logs
              .filter((l) => logTab === "all" || l.kind === "chat")
              .map((l) => (
                <div key={l.id} className={`log-entry ${l.kind}`}>
                  <span className="log-time mono">
                    {new Date(l.time).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {l.kind === "chat" ? (
                    <p>
                      <strong>{l.author}</strong>
                      {l.text}
                    </p>
                  ) : l.rolls?.length ? (
                    <div className="roll-card">
                      <div className="roll-dice">
                        {l.rolls.map((r, i) => (
                          <span
                            key={i}
                            className={`roll-die d${r.sides} ${r.ok === true ? "ok" : r.ok === false ? "fail" : ""}`}
                            title={r.label}
                          >
                            <b>{r.value}</b>
                            <small>d{r.sides}</small>
                          </span>
                        ))}
                      </div>
                      <div className="roll-text">
                        <strong>{l.rolls.map((r) => r.label).filter(Boolean).join(" · ") || l.author}</strong>
                        <p>{l.rolls.map((r) => r.detail).filter(Boolean).join(" — ") || l.text}</p>
                      </div>
                      <button
                        className="roll-replay"
                        title="Ver rolagem em 3D"
                        aria-label="Ver rolagem em 3D"
                        onClick={() => rollDice(l)}
                      >
                        <Dices size={13} />
                      </button>
                    </div>
                  ) : (
                    <p>{l.text}</p>
                  )}
                </div>
              ))}
            <div ref={logEnd} />
          </div>
          <form className="chat-form" onSubmit={sendChat}>
            <input
              aria-label="Mensagem para a sessão"
              placeholder="Mensagem para a mesa…"
              value={chat}
              maxLength={1000}
              onChange={(e) => setChat(e.target.value)}
            />
            <button
              type="submit"
              aria-label="Enviar mensagem"
              disabled={!connected || !chat.trim()}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </aside>
      <section className="hand-area">
        <div className="hand-status">
          <div>
            <span className="eyebrow">
              {me ? `ARQUIVO DE ${me.name.toUpperCase()}` : "SEU ARQUIVO"}
            </span>
            <h3>
              Sua mão<span className="count">{hand.length}</span>
              <LockKeyhole size={12} />
            </h3>
          </div>
          <div className="hand-piles">
            <span>
              <Layers3 size={17} />
              <strong>{me?.drawCount || 0}</strong>
              <small>COMPRA</small>
            </span>
            <span>
              <FileText size={17} />
              <strong>{me?.discardCount || 0}</strong>
              <small>DESCARTE</small>
            </span>
            <span>
              <Flame size={17} />
              <strong>{me?.banishedCount || 0}</strong>
              <small>BANIDAS</small>
            </span>
          </div>
          {me && (
            <button
              className="text-btn"
              onClick={() => {
                setSelected(me.id);
                setModal("sheet");
              }}
            >
              Montar deck <ArrowRight size={13} />
            </button>
          )}
        </div>
        <div className="cards-zone">
          {hand.length ? (
            hand.map((cardId, i) => {
              const card = state.cards.find((c) => c.id === cardId);
              return card ? (
                <motion.button
                  key={`${cardId}-${i}`}
                  className="hand-card"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={
                    {
                      "--rotation": `${(i - (hand.length - 1) / 2) * 2}deg`,
                    } as React.CSSProperties
                  }
                  draggable
                  onDragStartCapture={(e) =>
                    e.dataTransfer.setData("text/plain", cardId)
                  }
                  onClick={() => {
                    setSelectedCard(card);
                    setModal("play");
                  }}
                >
                  <CardFace card={card} mode={scene.mode} />
                </motion.button>
              ) : null;
            })
          ) : (
            <div className="empty-hand">
              <EyeMark />
              <p>
                {me
                  ? "Seu deck está nos arquivos."
                  : "Toda sentença precisa de um Procurador."}
              </p>
              <button
                className="text-btn"
                onClick={() => (me ? setModal("sheet") : setModal("character"))}
              >
                {me ? "Abrir ficha e montar deck" : "Criar meu Searcher"}
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="turn-actions">
          {me && (
            <>
              <div className="equipment-row">
                <span
                  title={
                    me.weapon === "PISTOLA"
                      ? "Alcance 2 · dano fixo +2"
                      : "Arma equipada"
                  }
                >
                  <Crosshair size={15} />
                  {me.weapon === "PISTOLA"
                    ? "Pistola"
                    : me.weapon === "FACA"
                      ? "Faca"
                      : "Desarmado"}
                </span>
                {me.instrument && (
                  <button
                    disabled={
                      !myTurn ||
                      !state.combat.active ||
                      me.ownTurns < me.cooldown
                    }
                    onClick={() =>
                      void perform({
                        type: "equipment:use",
                        characterId: me.id,
                      })
                    }
                  >
                    <FileText size={14} />
                    Papel e Caneta
                    {me.ownTurns < me.cooldown && (
                      <small>
                        {Math.max(0, me.cooldown - me.ownTurns - 1)}T
                      </small>
                    )}
                  </button>
                )}
              </div>
              <div className="formation-row">
                <span className="eyebrow">
                  FORMAÇÃO · {me.formationHand?.length || 0}
                </span>
                <div>
                  {me.formationHand?.map((skill, i) => (
                    <span className="formation-item" key={`${skill}-${i}`}>
                      <button
                        title="Testar perícia com Formação +2"
                        onClick={() =>
                          void perform({
                            type: "dice:roll",
                            characterId: me.id,
                            sides: 20,
                            skill,
                            training: true,
                            difficulty: 13,
                          })
                        }
                      >
                        {skill}
                      </button>
                      <button
                        aria-label={`Descartar Formação ${skill}`}
                        onClick={() =>
                          void perform({
                            type: "card:discard",
                            characterId: me.id,
                            cardId: skill,
                            training: true,
                          })
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
          {state.combat.active ? (
            <div className="row">
              <button
                className="btn primary full"
                disabled={(!myTurn && !master) || state.combat.paused}
                onClick={() => void perform({ type: "turn:end" })}
              >
                Encerrar turno
                <SkipForward size={15} />
              </button>
              {master && (
                <>
                  <button
                    className="icon-btn framed"
                    aria-label={
                      state.combat.paused ? "Retomar combate" : "Pausar combate"
                    }
                    onClick={() => void perform({ type: "combat:pause" })}
                  >
                    {state.combat.paused ? (
                      <Play size={16} />
                    ) : (
                      <Pause size={16} />
                    )}
                  </button>
                  <button
                    className="icon-btn framed"
                    aria-label="Encerrar encontro"
                    onClick={() => void perform({ type: "combat:end" })}
                  >
                    <Square size={14} />
                  </button>
                </>
              )}
            </div>
          ) : master ? (
            <button
              className="btn primary full"
              onClick={() => void perform({ type: "combat:start" })}
            >
              <Swords size={16} />
              Iniciar combate
            </button>
          ) : (
            <span className="mono muted">AGUARDANDO O MESTRE</span>
          )}
          <span className="private-note mono">
            <LockKeyhole size={11} /> VISÍVEL SOMENTE PARA VOCÊ
          </span>
        </div>
      </section>
      {modal === "character" && (
        <CharacterCreator perform={perform} onClose={() => setModal("")} />
      )}
      {modal === "sheet" && inspected && (
        <CharacterSheet
          character={inspected}
          state={state}
          perform={perform}
          master={master}
          onClose={() => setModal("")}
        />
      )}
      {modal === "scene" && (
        <SceneEditor
          scene={scene}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "room" && room && (
        <RoomEditor
          scene={scene}
          roomId={roomId}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "novel" && (
        <NovelEditor
          scene={scene}
          scenes={state.scenes}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "newScene" && (
        <Modal title="Criar nova cena" onClose={() => setModal("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await perform({
                  type: "scene:create",
                  name: f.get("name"),
                  sceneType: f.get("sceneType"),
                  rooms: Number(f.get("rooms")),
                })
              )
                setModal("");
            }}
          >
            <Field label="Nome">
              <input name="name" required minLength={1} />
            </Field>
            <Field label="Tipo">
              <select name="sceneType">
                <option value="board">Tabuleiro</option>
                <option value="novel">Visual Novel</option>
              </select>
            </Field>
            <Field label="Quantidade inicial de salas">
              <input
                name="rooms"
                type="number"
                defaultValue={9}
                min="0"
                max="30"
              />
            </Field>
            <button className="btn primary full">
              <Plus size={16} />
              Criar cena
            </button>
          </form>
        </Modal>
      )}
      {modal === "dice" && (
        <Modal title="Mesa de dados" onClose={() => setModal("")}>
          <div className="dice-table">
            <Dices size={64} />
            <p>Resultados gerados e registrados pelo servidor.</p>
            <div className="row">
              <button
                className="btn primary"
                disabled={!me}
                onClick={() =>
                  void perform({
                    type: "dice:roll",
                    characterId: me?.id,
                    sides: 6,
                  })
                }
              >
                Rolar d6
              </button>
              <button
                className="btn secondary"
                disabled={!me}
                onClick={() =>
                  void perform({
                    type: "dice:roll",
                    characterId: me?.id,
                    sides: 20,
                    difficulty: 13,
                  })
                }
              >
                Rolar d20 · DT13
              </button>
            </div>
          </div>
          <div className="dice-history">
            {state.logs
              .filter((l) => l.kind === "dice")
              .slice(-6)
              .reverse()
              .map((l) => (
                <p key={l.id}>{l.text}</p>
              ))}
          </div>
        </Modal>
      )}
      {modal === "play" && selectedCard && me && (
        <PlayCard
          card={selectedCard}
          state={state}
          me={me}
          targetId={selected !== me.id ? selected : ""}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "cards" && (
        <Modal title="Biblioteca de cartas" wide onClose={() => setModal("")}>
          <div className="row spread">
            <span className="subtle">
              {state.cards.length} registros · efeitos Hells e Cómum
            </span>
            <button
              className="btn primary compact"
              onClick={() => {
                setEditingCard({
                  ...state.cards[0],
                  id: crypto.randomUUID(),
                  name: "Nova carta",
                  dice: [1, 3, 6],
                });
                setModal("cardEditor");
              }}
            >
              <Plus size={15} />
              Nova carta
            </button>
          </div>
          <div className="card-browser">
            {state.cards.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setEditingCard(c);
                  setModal("cardEditor");
                }}
              >
                <CardFace card={c} mode={scene.mode} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {modal === "cardEditor" && editingCard && (
        <CardEditor
          card={editingCard}
          state={state}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "audio" && (
        <AudioPanel perform={perform} onClose={() => setModal("")} />
      )}
      {modal === "campaign" && (
        <CampaignPanel
          state={state}
          perform={perform}
          onClose={() => setModal("")}
        />
      )}
      {modal === "fame" && (
        <Modal title="Hell of Fame" onClose={() => setModal("")} wide>
          <div className="fame-banner">
            <Flame size={35} />
            <div>
              <h3>Sua promoção é sua caçada.</h3>
              <p>Quanto mais alto o nome, mais perto os rivais.</p>
            </div>
          </div>
          <div className="fame-ranking">
            {state.characters
              .filter((c) => !c.npc)
              .sort((a, b) => b.fame - a.fame)
              .map((c, i) => {
                const gate = [...gates].reverse().find((g) => c.fame >= g.min)!;
                return (
                  <div key={c.id}>
                    <span className="mono">0{i + 1}</span>
                    <strong>{c.name}</strong>
                    <span>{gate.title}</span>
                    <b>{c.fame} FAME</b>
                  </div>
                );
              })}
          </div>
          <div className="gate-list">
            {gates.map((g) => (
              <div key={g.min}>
                <span className="eyebrow pink">{g.min}+ FAME</span>
                <h3>{g.name}</h3>
                <p>{g.threat}</p>
                <small>Rival: {g.enemy}</small>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {modal === "inspect" && (
        <Modal
          title="Inspeção administrativa registrada"
          onClose={() => setModal("")}
        >
          <p className="subtle">
            Esta consulta está no registro de auditoria da campanha.
          </p>
          {inspection.map((id, i) => (
            <p key={i}>{state.cards.find((c) => c.id === id)?.name}</p>
          ))}
        </Modal>
      )}
      {privacy && (
        <div className="privacy-screen">
          <LockKeyhole size={48} />
          <h1>Mãos protegidas.</h1>
          <p>
            Passe o dispositivo. A próxima pessoa precisa entrar com suas
            próprias credenciais.
          </p>
          <button
            className="btn primary"
            onClick={async () => {
              await post("/api/auth/logout", {});
              useStore.getState().setUser(null);
            }}
          >
            Trocar de conta <LogOut size={16} />
          </button>
          <button className="text-btn" onClick={() => setPrivacy(false)}>
            Voltar à minha sessão
          </button>
        </div>
      )}
    </div>
  );
}
/* Bandeja de dados flutuante (estilo Roll20): d6 de ativação, d20 contra DT, Formação +2. */
function DiceTray({ me, perform }: { me: PublicCharacter; perform: Perform }) {
  const [open, setOpen] = useState(false),
    [dt, setDt] = useState(13),
    [skill, setSkill] = useState("");
  const forms = [...new Set(me.formationHand || [])];
  return (
    <div className={`dice-tray ${open ? "open" : ""}`}>
      <button
        className="dice-tray-toggle"
        title="Bandeja de dados"
        aria-label="Bandeja de dados"
        onClick={() => setOpen(!open)}
      >
        <Dices size={20} />
      </button>
      {open && (
        <div className="dice-tray-body">
          <span className="eyebrow">ROLAR COMO {me.name.toUpperCase()}</span>
          <div className="dice-tray-row">
            <button
              className="die-btn d6"
              onClick={() =>
                void perform({ type: "dice:roll", characterId: me.id, sides: 6 })
              }
            >
              D6
            </button>
            <button
              className="die-btn d20"
              onClick={() =>
                void perform({
                  type: "dice:roll",
                  characterId: me.id,
                  sides: 20,
                  difficulty: dt,
                  ...(skill ? { skill, training: true } : {}),
                })
              }
            >
              D20
            </button>
            <label className="dt-input">
              DT
              <input
                type="number"
                min={1}
                max={40}
                value={dt}
                onChange={(e) => setDt(Number(e.target.value) || 13)}
              />
            </label>
          </div>
          <div className="dt-presets">
            {[10, 13, 16, 19, 22].map((v) => (
              <button
                key={v}
                className={dt === v ? "active" : ""}
                onClick={() => setDt(v)}
                title={{ 10: "Acessível", 13: "Padrão", 16: "Difícil", 19: "Extrema", 22: "Sobrenatural" }[v]}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            aria-label="Jogar Formação"
          >
            <option value="">Sem Formação</option>
            {forms.map((f) => (
              <option key={f} value={f}>
                Formação: {f} (+2)
              </option>
            ))}
          </select>
          <small>Resultados sorteados pelo servidor e vistos por toda a mesa.</small>
        </div>
      )}
    </div>
  );
}
function Resource({
  icon: Icon,
  label,
  value,
  max,
}: {
  icon: typeof Heart;
  label: string;
  value: number;
  max: number;
}) {
  return (
    <div className="resource">
      <div>
        <span>
          <Icon size={12} />
          {label}
        </span>
        <strong>
          {value}
          <small>/{max}</small>
        </strong>
      </div>
      <div className="resource-track">
        <i
          style={{
            width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}
function PlayCard({
  card,
  state,
  me,
  targetId,
  perform,
  onClose,
}: {
  card: Card;
  state: ViewState;
  me: PublicCharacter;
  targetId: string;
  perform: Perform;
  onClose: () => void;
}) {
  const [target, setTarget] = useState(
      card.target === "self" ? me.id : targetId,
    ),
    [masked, setMasked] = useState(false);
  return (
    <Modal title="Preparar ação" onClose={onClose}>
      <div className="play-card-preview">
        <CardFace
          card={card}
          mode={state.scenes.find((s) => s.id === state.activeSceneId)!.mode}
        />
        <div>
          <span className="eyebrow pink">{card.sector}</span>
          <h3>{card.name}</h3>
          <p className="subtle">{card.description}</p>
          <p className="mono">
            D6 / {card.dice.join(" · ")}
            <br />
            CUSTO / {card.cost} MORAL
            <br />
            ALCANCE / {card.range} CASAS
          </p>
        </div>
      </div>
      <Field label="Alvo">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Selecione um alvo</option>
          {state.characters
            .filter((c) =>
              masked
                ? c.id !== me.id
                : card.target === "self"
                  ? c.id === me.id
                  : card.target === "enemy"
                    ? c.id !== me.id
                    : true,
            )
            .map((c) => (
              <option value={c.id} key={c.id}>
                {c.name} ·{" "}
                {Math.abs(c.position.x - me.position.x) +
                  Math.abs(c.position.y - me.position.y)}{" "}
                casas
              </option>
            ))}
        </select>
      </Field>
      <label className="check-field">
        <input
          type="checkbox"
          checked={masked}
          onChange={(e) => {
            setMasked(e.target.checked);
            setTarget("");
          }}
        />
        Preparar ataque mascarado (efeito impresso não é usado)
      </label>
      <div className="modal-actions">
        <button
          className="btn primary"
          disabled={!target || !state.combat.active}
          onClick={async () => {
            if (
              await perform({
                type: "card:play",
                characterId: me.id,
                cardId: card.id,
                targetId: target,
                masked,
              })
            )
              onClose();
          }}
        >
          Confirmar ação <ArrowRight size={15} />
        </button>
        <button
          className="btn secondary"
          disabled={!state.combat.active}
          onClick={async () => {
            if (
              await perform({
                type: "card:burn",
                characterId: me.id,
                cardId: card.id,
              })
            )
              onClose();
          }}
        >
          <Flame size={14} />
          Queimar
        </button>
        <button
          className="text-btn"
          onClick={async () => {
            if (
              await perform({
                type: "card:discard",
                characterId: me.id,
                cardId: card.id,
              })
            )
              onClose();
          }}
        >
          Descartar
        </button>
      </div>
    </Modal>
  );
}
function AudioPanel({
  perform,
  onClose,
}: {
  perform: Perform;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(""),
    [volume, setVolume] = useState(audio.ambient);
  return (
    <Modal title="Ambiente compartilhado" onClose={onClose}>
      <Field label="Áudio da biblioteca">
        <AssetPicker value={url} onChange={setUrl} audioOnly />
      </Field>
      <Field label="Seu volume local">
        <input
          type="range"
          min="0"
          max="1"
          step=".05"
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            audio.set("ambient", v);
          }}
        />
      </Field>
      <div className="row">
        <button
          className="btn primary"
          disabled={!url}
          onClick={() => {
            audio.unlock();
            void perform({ type: "audio:play", url });
          }}
        >
          <Play size={15} />
          Reproduzir para a mesa
        </button>
        <button
          className="btn secondary"
          onClick={() => void perform({ type: "audio:play", url: "" })}
        >
          <Square size={14} />
          Parar
        </button>
      </div>
    </Modal>
  );
}
function CampaignPanel({
  state,
  perform,
  onClose,
}: {
  state: ViewState;
  perform: Perform;
  onClose: () => void;
}) {
  const [proofs, setProofs] = useState(state.proofs.join("\n")),
    [banner, setBanner] = useState(
      state.banner.startsWith("/media/") ? state.banner : "",
    );
  const notify = useStore((s) => s.notify);
  return (
    <Modal title="Controle da campanha" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          try {
            await api(`/api/campaigns/${state.id}`, {
              method: "PUT",
              body: JSON.stringify({
                name: f.get("name"),
                description: f.get("description"),
                banner,
              }),
            });
            notify("Dados da campanha atualizados.");
          } catch (e) {
            notify((e as Error).message, true);
          }
        }}
      >
        <Field label="Nome">
          <input name="name" defaultValue={state.name} minLength={3} required />
        </Field>
        <Field label="Descrição">
          <textarea name="description" defaultValue={state.description} />
        </Field>
        <Field label="Banner">
          <AssetPicker value={banner} onChange={setBanner} />
        </Field>
        <button className="btn secondary compact">
          <Save size={14} />
          Salvar dados da campanha
        </button>
      </form>
      <hr />
      <Field label="Confiança coletiva">
        <input
          type="number"
          min="0"
          max="10"
          defaultValue={state.trust}
          onBlur={(e) =>
            void perform({
              type: "campaign:settings",
              patch: { trust: Number(e.target.value) },
            })
          }
        />
      </Field>
      <Field label="Provas registradas (uma por linha)">
        <textarea
          rows={4}
          value={proofs}
          onChange={(e) => setProofs(e.target.value)}
        />
      </Field>
      <button
        className="btn secondary compact"
        onClick={() =>
          void perform({
            type: "campaign:settings",
            patch: {
              proofs: proofs
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            },
          })
        }
      >
        Registrar provas
      </button>
      <label className="check-field">
        <input
          type="checkbox"
          checked={state.allowHandInspection}
          onChange={(e) =>
            void perform({
              type: "campaign:settings",
              patch: { allowHandInspection: e.target.checked },
            })
          }
        />
        Permitir inspeção administrativa de mãos
        <small>Cada consulta é registrada.</small>
      </label>
      <Field label="Estado da sessão">
        <select
          value={state.status}
          onChange={(e) =>
            void perform({
              type: "campaign:settings",
              patch: { status: e.target.value },
            })
          }
        >
          <option value="open">Aberta</option>
          <option value="active">Em andamento</option>
          <option value="closed">Encerrada</option>
        </select>
      </Field>
    </Modal>
  );
}
