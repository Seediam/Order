import { ORDER_ART } from '../../shared/order-assets';
import { useState, type FormEvent } from "react";
import {
  Plus,
  Minus,
  Save,
  Shield,
  Crosshair,
  Flame,
  Heart,
  FileText,
  Layers3,
  ArrowRight,
  Eye,
  Trash2,
} from "lucide-react";
import { AssetPicker, ErrorText, Field, Modal } from "./UI";
import type {
  Action,
  Card,
  PublicCharacter,
  Scene,
  ViewState,
  Effect,
} from "../../shared/types";
import { SECTORS, SKILLS, SINS, ATTRIBUTES, ATTRIBUTE_INFO, ATTRIBUTE_MAX, ATTRIBUTE_POINTS, type Attributes } from "../../shared/types";
import { sectorInfo } from "../../shared/catalog";
import { api, post } from "../api";
import { DiscordLink } from "./DiscordLink";
export type Perform = (action: Action) => Promise<boolean>;
/** Ficha FOR · VIG · INT · AGI · PRE: 7 pontos, cada um de 0 a 3. */
export function AttributeEditor({ value, onChange, disabled }: { value: Attributes; onChange?: (v: Attributes) => void; disabled?: boolean }) {
  const total = ATTRIBUTES.reduce((n, a) => n + (value[a] ?? 0), 0), left = ATTRIBUTE_POINTS - total;
  return (
    <div className="attr-sheet">
      <div className="attr-head"><span className="eyebrow">ATRIBUTOS</span><b className={left === 0 ? "ok" : "warn"}>{left === 0 ? "7/7 pontos" : left > 0 ? `faltam ${left}` : `sobram ${-left}`}</b></div>
      <div className="attr-row">
        {ATTRIBUTES.map((a) => (
          <div className="attr-box" key={a} title={ATTRIBUTE_INFO[a].hint}>
            <span className="attr-key">{a}</span>
            <strong>{value[a] ?? 0}</strong>
            <small>{ATTRIBUTE_INFO[a].name}</small>
            {onChange && !disabled && (
              <div className="attr-btns">
                <button type="button" aria-label={`Diminuir ${ATTRIBUTE_INFO[a].name}`} disabled={(value[a] ?? 0) <= 0} onClick={() => onChange({ ...value, [a]: (value[a] ?? 0) - 1 })}><Minus size={12} /></button>
                <button type="button" aria-label={`Aumentar ${ATTRIBUTE_INFO[a].name}`} disabled={(value[a] ?? 0) >= ATTRIBUTE_MAX || left <= 0} onClick={() => onChange({ ...value, [a]: (value[a] ?? 0) + 1 })}><Plus size={12} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="attr-help">Some o atributo ao D20 nos testes. VIG também dá +1 de Vida máxima por ponto.</p>
    </div>
  );
}
export function CharacterCreator({
  perform,
  onClose,
}: {
  perform: Perform;
  onClose: () => void;
}) {
  const [sector, setSector] = useState<(typeof SECTORS)[number]>("JUSTIÇA"),
    [npc, setNpc] = useState(false),
    [appearance, setAppearance] = useState<"homem" | "mulher" | "">("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      await perform({
        type: "character:create",
        name: new FormData(e.currentTarget).get("name"),
        sector,
        npc,
        portrait: appearance === "mulher" ? ORDER_ART.woman : ORDER_ART.man,
      })
    )
      onClose();
  }
  const state = useStore((s) => s.campaign)!,
    user = useStore((s) => s.user)!;
  return (
    <Modal title={appearance ? "Seu Searcher" : "Escolha seu Searcher"} onClose={onClose} wide={!appearance} className={!appearance ? "identity-modal" : ""}>
      {!appearance ? <div className="order-identity-selection"><p>Selecione o personagem para continuar.</p><div className="order-portrait-choices">{([['homem', ORDER_ART.man, 'HOMEM'], ['mulher', ORDER_ART.woman, 'MULHER']] as const).map(([value,src,label])=><button type="button" className="order-portrait-choice" key={value} onClick={()=>setAppearance(value)} aria-label={'Escolher Searcher '+label.toLowerCase()}><img src={src} alt={'Searcher '+label.toLowerCase()+' de corpo inteiro'}/><span>{label}<small>SELECIONAR →</small></span></button>)}</div></div> : <form onSubmit={submit}>
        <div className="identity-selected"><img src={appearance==='mulher'?ORDER_ART.woman:ORDER_ART.man} alt="Aparência selecionada"/><div><strong>Identidade escolhida</strong><button type="button" onClick={()=>setAppearance('')}>Trocar personagem</button></div></div>
        <Field label="Nome">
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            placeholder="Nome do Procurador"
          />
        </Field>
        <Field label="Setor">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value as typeof sector)}
          >
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <div className="sector-description">
          <Shield size={23} />
          <strong>{sectorInfo[sector].role}</strong>
          <p>{sectorInfo[sector].description}</p>
        </div>
        {state.ownerId === user.id && (
          <label className="check-field">
            <input
              type="checkbox"
              checked={npc}
              onChange={(e) => setNpc(e.target.checked)}
            />
            Personagem não jogável / controlado pelo Mestre
          </label>
        )}
        <p className="subtle small-text">
          Inclui o deck pronto do Setor (20 Ações ilustradas, cap. 11.3), 16 Formações,
          Pistola e Papel e Caneta. Passivas condicionais ficam com o Mestre.
        </p>
        <button className="btn primary full">
          Registrar personagem
          <ArrowRight size={16} />
        </button>
      </form>}
    </Modal>
  );
}
import { useStore } from "../store";
export function CharacterSheet({
  character: c,
  state,
  perform,
  onClose,
  master,
}: {
  character: PublicCharacter;
  state: ViewState;
  perform: Perform;
  onClose: () => void;
  master: boolean;
}) {
  const [tab, setTab] = useState("identity"),
    [portrait, setPortrait] = useState(c.portrait),
    [attributes, setAttributes] = useState<Attributes>(c.attributes || { FOR: 1, VIG: 1, INT: 2, AGI: 2, PRE: 1 }),
    [skills, setSkills] = useState(c.skills),
    [deck, setDeck] = useState(c.deck || []),
    [filter, setFilter] = useState(""),
    [compact, setCompact] = useState(false);
  const own = !!c.hand;
  const user = useStore(s => s.user)!;
  const [error, setError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (
      await perform({
        type: "character:update",
        characterId: c.id,
        patch: {
          name: f.get("name"),
          portrait,
          age: Number(f.get("age")),
          sin: f.get("sin"),
          story: f.get("story"),
          death: f.get("death"),
          skills,
          attributes,
          weapon: f.get("weapon"),
          instrument: f.get("instrument") === "on",
        },
      })
    )
      onClose();
  }
  async function resources(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const patch = Object.fromEntries(
      [
        "hp",
        "moral",
        "sanity",
        "fame",
        "maxHp",
        "maxMoral",
        "maxSanity",
        "defense",
        "movement",
      ].map((k) => [k, Number(f.get(k))]),
    );
    await perform({
      type: "character:resources",
      characterId: c.id,
      patch: {
        ...patch,
        effects: String(f.get("effects") || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hidden: f.get("hidden") === "on",
      },
    });
  }
  const cards = state.cards.filter(
    (card) =>
      (card.sector === c.sector || card.sector === "UNIVERSAL") &&
      card.name.toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <Modal title={`Arquivo · ${c.name}`} onClose={onClose} wide>
      <div className="file-strip">
        <span className="mono">{c.id.slice(0, 8).toUpperCase()}</span>
        <span>
          {c.sector} / {c.sin}
        </span>
        <span className="stamp">CONFIDENCIAL</span>
      </div>
      <div className="tabs editor-tabs">
        {c.ownerId === user.id && !c.npc && <button type="button" className={tab === "discord" ? "active" : ""} onClick={() => setTab("discord")}>Discord</button>}
        <button
          className={tab === "identity" ? "active" : ""}
          onClick={() => setTab("identity")}
        >
          Identidade
        </button>
        {own && (
          <button
            className={tab === "deck" ? "active" : ""}
            onClick={() => setTab("deck")}
          >
            Deck de Ação <span>{deck.length}/20</span>
          </button>
        )}
        {master && (
          <button
            className={tab === "resources" ? "active" : ""}
            onClick={() => setTab("resources")}
          >
            Recursos e efeitos
          </button>
        )}
      </div>
      {tab === "discord" ? <DiscordLink campaignId={state.id} characterId={c.id} /> : tab === "identity" ? (
        <form onSubmit={save}>
          <div className="form-grid">
            <div>
              <Field label="Nome">
                <input
                  name="name"
                  defaultValue={c.name}
                  required
                  minLength={2}
                  disabled={!own && !master}
                />
              </Field>
              <div className="form-grid">
                <Field label="Idade aparente">
                  <input
                    name="age"
                    type="number"
                    min="1"
                    max="300"
                    defaultValue={c.age}
                  />
                </Field>
                <Field label="Pecado">
                  <select name="sin" defaultValue={c.sin}>
                    {SINS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="História">
                <textarea name="story" rows={3} defaultValue={c.story} />
              </Field>
              <Field label="Causa da morte">
                <textarea name="death" rows={2} defaultValue={c.death} />
              </Field>
            </div>
            <div>
              <Field label="Retrato">
                <AssetPicker value={portrait} onChange={setPortrait} kind="portraits" />
              </Field>
              <Field label="Arma equipada">
                <select name="weapon" defaultValue={c.weapon}>
                  <option value="PISTOLA">Pistola · alcance 2 · dano +2</option>
                  <option value="FACA">Faca · alcance 1 · dano +1</option>
                  <option value="NENHUMA">Sem arma · alcance 1</option>
                </select>
              </Field>
              <label className="check-field">
                <input
                  name="instrument"
                  type="checkbox"
                  defaultChecked={c.instrument}
                />
                Equipar Papel e Caneta
              </label>
              <div className="info-box">
                {sectorInfo[c.sector].description}
                <small>{sectorInfo[c.sector].passive}</small>
              </div>
            </div>
          </div>
          <AttributeEditor value={attributes} onChange={setAttributes} disabled={!own && !master} />
          <Field
            label={`Perícias principais · ${skills.length}/3 · Formação ${10 + skills.length * 2} cartas`}
          >
            <div className="skill-grid">
              {SKILLS.map((s) => (
                <label key={s} className={skills.includes(s) ? "selected" : ""}>
                  <input
                    type="checkbox"
                    checked={skills.includes(s)}
                    onChange={(e) => {
                      if (e.target.checked && skills.length < 3)
                        setSkills([...skills, s]);
                      else if (!e.target.checked)
                        setSkills(skills.filter((v) => v !== s));
                    }}
                  />
                  {s}
                  <small>{skills.includes(s) ? "3 cópias" : "1 cópia"}</small>
                </label>
              ))}
            </div>
          </Field>
          {(own || master) && (
            <button className="btn primary" disabled={state.combat.active}>
              <Save size={16} />
              Salvar ficha
            </button>
          )}
        </form>
      ) : tab === "deck" ? (
        <>
          <div className="deck-summary">
            <div>
              <Layers3 />
              <span>
                <strong>{deck.length} / 20</strong> CARTAS DE AÇÃO
              </span>
            </div>
            <div>
              <strong>
                {
                  deck.filter(
                    (id) =>
                      state.cards.find((c) => c.id === id)?.sector === c.sector,
                  ).length
                }
                /12
              </strong>
              <small>MÍNIMO DO SETOR</small>
            </div>
            <button
              className="btn secondary compact"
              onClick={() => setCompact(!compact)}
            >
              {compact ? "Miniaturas" : "Lista compacta"}
            </button>
            <button
              className="btn primary compact"
              disabled={deck.length !== 20 || state.combat.active}
              onClick={async () => {
                if (
                  await perform({ type: "deck:save", characterId: c.id, deck })
                )
                  onClose();
              }}
            >
              <Save size={15} />
              Salvar deck
            </button>
          </div>
          <input
            className="full"
            placeholder="Filtrar cartas por nome…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className={`deck-library ${compact ? "compact-list" : ""}`}>
            {cards.map((card) => {
              const count = deck.filter((id) => id === card.id).length;
              return (
                <div className="deck-item" key={card.id}>
                  <CardFace
                    card={card}
                    mode={
                      state.scenes.find((s) => s.id === state.activeSceneId)!
                        .mode
                    }
                    compact={compact}
                  />
                  <div className="quantity">
                    <button
                      disabled={count === 0}
                      onClick={() => {
                        const copy = [...deck];
                        copy.splice(copy.indexOf(card.id), 1);
                        setDeck(copy);
                      }}
                      aria-label={`Remover ${card.name}`}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{count}</span>
                    <button
                      disabled={count >= 2 || deck.length >= 20}
                      onClick={() => setDeck([...deck, card.id])}
                      aria-label={`Adicionar ${card.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <form onSubmit={resources}>
          <div className="form-grid">
            {[
              ["hp", "Vida", c.hp],
              ["maxHp", "Vida máxima", c.maxHp],
              ["moral", "Moral", c.moral],
              ["maxMoral", "Moral máxima", c.maxMoral],
              ["sanity", "Sanidade", c.sanity],
              ["maxSanity", "Sanidade máxima", c.maxSanity],
              ["fame", "Hell of Fame", c.fame],
              ["defense", "Defesa", c.defense],
              ["movement", "Movimento", c.movement],
            ].map(([key, label, value]) => (
              <Field label={String(label)} key={key}>
                <input
                  name={String(key)}
                  type="number"
                  min="0"
                  max="999"
                  defaultValue={value}
                />
              </Field>
            ))}
          </div>
          <Field label="Efeitos ativos (separados por vírgula)">
            <input name="effects" defaultValue={c.effects.join(", ")} />
          </Field>
          <label className="check-field">
            <input name="hidden" type="checkbox" defaultChecked={c.hidden} />
            Ocultar personagem dos jogadores
          </label>
          <button className="btn primary">
            <Save size={16} />
            Atualizar recursos
          </button>
        </form>
      )}
      <ErrorText error={error} />
    </Modal>
  );
}
export function CardFace({
  card,
  mode,
  compact = false,
}: {
  card: Card;
  mode: "HELLS" | "CÓMUM";
  compact?: boolean;
}) {
  const effects = mode === "HELLS" ? card.hells : card.common;
  const labels: Record<Effect["kind"], string> = {
    damage: "Dano",
    heal: "Cura",
    shield: "Escudo",
    moral: "Moral",
    sanity: "Sanidade",
    move: "Movimento",
    draw: "Compra",
    incision: "Incisão",
  };
  // Cartas ilustradas já trazem nome, textos Hells/Cómum e faces do D6 na arte.
  if (card.art.startsWith("/art/order/cards/"))
    return (
      <div
        className={`card-face illustrated ${compact ? "compact" : ""}`}
        title={`${card.name}\n${card.description}`}
      >
        <img src={card.art} alt={card.name} draggable={false} loading="lazy" />
      </div>
    );
  return (
    <div className={`card-face ${compact ? "compact" : ""}`} data-rarity={card.tags.some(tag => /^lend[aá]ri[ao]$/i.test(tag)) ? "legendary" : undefined}>
      <div className="card-top">
        <span>{card.sector === "UNIVERSAL" ? "UNIVERSAL" : card.sector}</span>
        <span>
          {card.cost} <Flame size={10} />
        </span>
      </div>
      <div
        className="card-art"
        style={card.art ? { backgroundImage: `url("${card.art}")` } : undefined}
      >
        {!card.art && (
          <>
            <div className="card-orbit" />
            {effects.some((e) => e.kind === "damage") ? (
              <Crosshair />
            ) : effects.some((e) => e.kind === "heal") ? (
              <Heart />
            ) : effects.some((e) => e.kind === "shield") ? (
              <Shield />
            ) : (
              <Eye />
            )}
            <span className="card-rune">
              {card.id.slice(0, 2).toUpperCase()}
            </span>
          </>
        )}
      </div>
      <h4>{card.name}</h4>
      <div className="card-effects">
        {effects.map((e, i) => (
          <span key={i}>
            {labels[e.kind]} <b>{e.amount}</b>
          </span>
        ))}
      </div>
      <div className="card-bottom">
        <span className="dice-pips">{card.dice.join(" · ")}</span>
        <small>
          {mode} / ALC. {card.range}
        </small>
      </div>
    </div>
  );
}
export function SceneEditor({
  scene: s,
  perform,
  onClose,
}: {
  scene: Scene;
  perform: Perform;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(structuredClone(s));
  function change(p: Partial<Scene>) {
    setDraft((d) => ({ ...d, ...p }));
  }
  return (
    <Modal title="Configurações da cena" onClose={onClose} wide>
      <div className="form-grid">
        <div>
          <Field label="Nome">
            <input
              value={draft.name}
              onChange={(e) => change({ name: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Modalidade">
              <select
                value={draft.type}
                onChange={(e) =>
                  change({ type: e.target.value as Scene["type"] })
                }
              >
                <option value="board">Tabuleiro</option>
                <option value="novel">Visual Novel</option>
              </select>
            </Field>
            <Field label="Território">
              <select
                value={draft.mode}
                onChange={(e) =>
                  change({ mode: e.target.value as Scene["mode"] })
                }
              >
                <option>CÓMUM</option>
                <option>HELLS</option>
              </select>
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              rows={3}
              value={draft.description}
              onChange={(e) => change({ description: e.target.value })}
            />
          </Field>
          <label className="check-field">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(e) => change({ visible: e.target.checked })}
            />
            Visível aos jogadores
          </label>
        </div>
        <div>
          <Field label="Background (ajuste sem cortar o original)">
            <AssetPicker
              kind="backgrounds"
              value={draft.background}
              onChange={(v) => change({ background: v })}
            />
          </Field>
          <div className="form-grid">
            {(["width", "height", "grid"] as const).map((k, i) => (
              <Field
                key={k}
                label={["Largura (casas)", "Altura (casas)", "Grade (px)"][i]}
              >
                <input
                  type="number"
                  min={k === "grid" ? 16 : 8}
                  max={k === "grid" ? 100 : 80}
                  value={draft[k]}
                  onChange={(e) => change({ [k]: Number(e.target.value) })}
                />
              </Field>
            ))}
          </div>
          <Field label="Opacidade da grade">
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={draft.gridOpacity}
              onChange={(e) => change({ gridOpacity: Number(e.target.value) })}
            />
          </Field>
        </div>
      </div>
      <button
        className="btn primary"
        onClick={async () => {
          if (
            await perform({
              type: "scene:update",
              sceneId: s.id,
              patch: {
                name: draft.name,
                description: draft.description,
                type: draft.type,
                mode: draft.mode,
                visible: draft.visible,
                background: draft.background,
                width: draft.width,
                height: draft.height,
                grid: draft.grid,
                gridOpacity: draft.gridOpacity,
              },
            })
          )
            onClose();
        }}
      >
        <Save size={16} />
        Salvar cena
      </button>
    </Modal>
  );
}
export function RoomEditor({
  scene,
  roomId,
  perform,
  onClose,
}: {
  scene: Scene;
  roomId: string;
  perform: Perform;
  onClose: () => void;
}) {
  const r = scene.rooms.find((r) => r.id === roomId)!;
  const [draft, setDraft] = useState({ ...r });
  return (
    <Modal title={`Editar sala · ${r.name}`} onClose={onClose}>
      <Field label="Nome">
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </Field>
      <Field label="Descrição">
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={4}
        />
      </Field>
      <Field label="Imagem interna">
        <AssetPicker
          kind="backgrounds"
          value={draft.image}
          onChange={(image) => setDraft({ ...draft, image })}
        />
      </Field>
      <label className="check-field">
        <input
          type="checkbox"
          checked={draft.visible}
          onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
        />
        Sala revelada aos jogadores
      </label>
      <p className="subtle">
        Defina a região com as ferramentas retângulo ou polígono sobre o
        tabuleiro.
      </p>
      <button
        className="btn primary"
        onClick={async () => {
          if (
            await perform({
              type: "scene:update",
              sceneId: scene.id,
              patch: {
                rooms: scene.rooms.map((r) => (r.id === roomId ? draft : r)),
              },
            })
          )
            onClose();
        }}
      >
        <Save size={16} />
        Salvar sala
      </button>
    </Modal>
  );
}
export function NovelEditor({
  scene,
  scenes,
  perform,
  onClose,
}: {
  scene: Scene;
  scenes: Scene[];
  perform: Perform;
  onClose: () => void;
}) {
  const [dialogues, setDialogues] = useState(structuredClone(scene.dialogues)),
    [choices, setChoices] = useState(structuredClone(scene.choices));
  return (
    <Modal title="Roteiro e consequências" onClose={onClose} wide>
      <h3>Sequência de falas</h3>
      {dialogues.map((d, i) => (
        <div className="script-item" key={d.id}>
          <span className="mono">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <Field label="Quem fala">
              <input
                value={d.speaker}
                onChange={(e) =>
                  setDialogues(
                    dialogues.map((v) =>
                      v.id === d.id ? { ...v, speaker: e.target.value } : v,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Fala">
              <textarea
                rows={3}
                value={d.text}
                onChange={(e) =>
                  setDialogues(
                    dialogues.map((v) =>
                      v.id === d.id ? { ...v, text: e.target.value } : v,
                    ),
                  )
                }
              />
            </Field>
            <AssetPicker
              kind="portraits"
              value={d.portrait}
              onChange={(portrait) =>
                setDialogues(
                  dialogues.map((v) =>
                    v.id === d.id ? { ...v, portrait } : v,
                  ),
                )
              }
            />
          </div>
          <button
            className="icon-btn"
            aria-label="Remover fala"
            disabled={dialogues.length === 1}
            onClick={() => setDialogues(dialogues.filter((v) => v.id !== d.id))}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button
        className="btn secondary compact"
        onClick={() =>
          setDialogues([
            ...dialogues,
            {
              id: crypto.randomUUID(),
              speaker: "Narrador",
              text: "Nova fala.",
              portrait: "",
            },
          ])
        }
      >
        <Plus size={15} />
        Adicionar fala
      </button>
      <h3 className="mt">Escolhas e consequências</h3>
      {choices.map((c) => (
        <div className="choice-editor" key={c.id}>
          <Field label="Texto da escolha">
            <input
              value={c.label}
              onChange={(e) =>
                setChoices(
                  choices.map((v) =>
                    v.id === c.id ? { ...v, label: e.target.value } : v,
                  ),
                )
              }
            />
          </Field>
          <div className="form-grid three">
            {(["sanity", "fame", "trust"] as const).map((k, i) => (
              <Field
                label={["Sanidade +/−", "Fame +/−", "Confiança +/−"][i]}
                key={k}
              >
                <input
                  type="number"
                  min="-100"
                  max="100"
                  value={c[k]}
                  onChange={(e) =>
                    setChoices(
                      choices.map((v) =>
                        v.id === c.id
                          ? { ...v, [k]: Number(e.target.value) }
                          : v,
                      ),
                    )
                  }
                />
              </Field>
            ))}
          </div>
          <div className="form-grid">
            <Field label="Próxima cena">
              <select
                value={c.nextScene}
                onChange={(e) =>
                  setChoices(
                    choices.map((v) =>
                      v.id === c.id ? { ...v, nextScene: e.target.value } : v,
                    ),
                  )
                }
              >
                <option value="">Permanecer nesta cena</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Condição">
              <select
                value={c.condition}
                onChange={(e) =>
                  setChoices(
                    choices.map((v) =>
                      v.id === c.id
                        ? {
                            ...v,
                            condition: e.target.value as typeof v.condition,
                          }
                        : v,
                    ),
                  )
                }
              >
                <option value="always">Sempre disponível</option>
                <option value="proofs">Requer duas provas</option>
                <option value="moral">Requer 2 Moral</option>
              </select>
            </Field>
          </div>
          <div className="row spread">
            <label className="check-field">
              <input
                type="checkbox"
                checked={c.combat}
                onChange={(e) =>
                  setChoices(
                    choices.map((v) =>
                      v.id === c.id ? { ...v, combat: e.target.checked } : v,
                    ),
                  )
                }
              />
              Iniciar combate
            </label>
            <button
              className="icon-btn"
              aria-label="Remover escolha"
              onClick={() => setChoices(choices.filter((v) => v.id !== c.id))}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
      <button
        className="btn secondary compact"
        onClick={() =>
          setChoices([
            ...choices,
            {
              id: crypto.randomUUID(),
              label: "Nova escolha",
              sanity: 0,
              fame: 0,
              trust: 0,
              nextScene: "",
              combat: false,
              condition: "always",
              once: true,
            },
          ])
        }
      >
        <Plus size={15} />
        Adicionar escolha
      </button>
      <div className="modal-actions">
        <button
          className="btn primary"
          onClick={async () => {
            if (
              await perform({
                type: "scene:update",
                sceneId: scene.id,
                patch: { dialogues, choices },
              })
            )
              onClose();
          }}
        >
          <Save size={16} />
          Salvar roteiro
        </button>
      </div>
    </Modal>
  );
}
export function CardEditor({
  card,
  state,
  perform,
  onClose,
}: {
  card: Card;
  state: ViewState;
  perform: Perform;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(structuredClone(card)),
    [result, setResult] = useState("");
  const kinds = [
    "damage",
    "heal",
    "shield",
    "moral",
    "sanity",
    "move",
    "draw",
    "incision",
  ] as const;
  const labels = [
    "Dano",
    "Cura",
    "Escudo",
    "Moral",
    "Sanidade",
    "Movimento",
    "Compra",
    "Incisão",
  ];
  return (
    <Modal title="Laboratório de cartas" onClose={onClose} wide>
      <div className="form-grid">
        <div>
          <Field label="Nome da carta">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Setor">
              <select
                value={draft.sector}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sector: e.target.value as Card["sector"],
                  })
                }
              >
                {[...SECTORS, "UNIVERSAL"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Alvo válido">
              <select
                value={draft.target}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    target: e.target.value as Card["target"],
                  })
                }
              >
                <option value="enemy">Adversário</option>
                <option value="ally">Você ou aliado</option>
                <option value="self">Somente você</option>
              </select>
            </Field>
          </div>
          <Field label="Descrição">
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </Field>
          <Field label="Resultados de ativação d6">
            <div className="dice-choices">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  className={draft.dice.includes(n) ? "selected" : ""}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      dice: draft.dice.includes(n)
                        ? draft.dice.filter((v) => v !== n)
                        : [...draft.dice, n].sort(),
                    })
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </Field>
          <div className="form-grid">
            <Field label="Custo de Moral (Cómum)">
              <input
                type="number"
                min="0"
                max="8"
                value={draft.cost}
                onChange={(e) =>
                  setDraft({ ...draft, cost: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Alcance em casas">
              <input
                type="number"
                min="0"
                max="20"
                value={draft.range}
                onChange={(e) =>
                  setDraft({ ...draft, range: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Arte">
            <AssetPicker
              value={draft.art}
              onChange={(art) => setDraft({ ...draft, art })}
            />
          </Field>
        </div>
        <div className="card-editor-preview">
          <CardFace card={draft} mode="HELLS" />
          <Field label="Tags (inclua Arma para aplicar o bônus da arma equipada)">
            <input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  tags: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
        </div>
      </div>
      {(["hells", "common"] as const).map((mode, i) => (
        <div className="effect-editor" key={mode}>
          <h3>{i ? "CÓMUM" : "HELLS"} · Efeitos declarativos</h3>
          {draft[mode].map((effect, index) => (
            <div className="row" key={index}>
              <select
                value={effect.kind}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [mode]: draft[mode].map((v, j) =>
                      j === index
                        ? { ...v, kind: e.target.value as Effect["kind"] }
                        : v,
                    ),
                  })
                }
              >
                {kinds.map((k, i) => (
                  <option key={k} value={k}>
                    {labels[i]}
                  </option>
                ))}
              </select>
              <input
                aria-label="Valor do efeito"
                type="number"
                min="0"
                max="30"
                value={effect.amount}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [mode]: draft[mode].map((v, j) =>
                      j === index
                        ? { ...v, amount: Number(e.target.value) }
                        : v,
                    ),
                  })
                }
              />
              <button
                className="icon-btn"
                aria-label="Remover efeito"
                onClick={() =>
                  setDraft({
                    ...draft,
                    [mode]: draft[mode].filter((_, j) => j !== index),
                  })
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            className="btn secondary compact"
            onClick={() =>
              setDraft({
                ...draft,
                [mode]: [...draft[mode], { kind: "damage", amount: 1 }],
              })
            }
          >
            <Plus size={14} />
            Adicionar efeito
          </button>
        </div>
      ))}
      <div className="modal-actions">
        <button
          className="btn primary"
          onClick={async () => {
            if (await perform({ type: "card:save", card: draft })) onClose();
          }}
        >
          <Save size={16} />
          Salvar carta
        </button>
        <button
          className="btn secondary"
          onClick={async () => {
            try {
              const r = await post(`/api/campaigns/${state.id}/test-card`, {
                card: draft,
              });
              setResult(r.result);
            } catch (e) {
              setResult((e as Error).message);
            }
          }}
        >
          Testar em cópia da cena
        </button>
      </div>
      {result && <pre className="test-result">{result}</pre>}
    </Modal>
  );
}
