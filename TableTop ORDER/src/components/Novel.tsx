import { BUILT_IN_ASSETS, ORDER_ART, novelPortrait, sceneArtwork } from "../../shared/order-assets";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowRight, ImageIcon, X } from "lucide-react";
import type { PublicCharacter, Scene } from "../../shared/types";
import type { Perform } from "./Editors";

/* Visual novel como página de livro: o cenário atravessa a página dupla,
   Searchers à esquerda, NPCs à direita, a fala embaixo como legenda de quadrinho. */
const BACKGROUNDS = BUILT_IN_ASSETS.filter((a) => a.url.includes("/backgrounds/") && !a.url.endsWith("church-map.webp"));
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
function guestArt(speaker: string, portrait: string) {
  if (portrait) return portrait;
  if (/eco do contrato/i.test(speaker)) return ORDER_ART.echo;
  if (/guardi[aã]o do prazo/i.test(speaker)) return ORDER_ART.guardian;
  if (/elvira/i.test(speaker)) return ORDER_ART.elvira;
  return "";
}
export function Novel({
  scene, character, characters, master, perform, onBackground,
}: {
  scene: Scene;
  character?: PublicCharacter;
  characters: PublicCharacter[];
  master: boolean;
  perform: Perform;
  onBackground?: (url: string) => void;
}) {
  const reduced = useReducedMotion(),
    dialogue = scene.dialogues[scene.dialogueIndex],
    text = dialogue?.text || "",
    speaker = dialogue?.speaker || "Narrador",
    [count, setCount] = useState(0),
    [picker, setPicker] = useState(false);
  useEffect(() => {
    setCount(reduced ? text.length : 0);
    if (reduced) return;
    const timer = setInterval(() => setCount((c) => Math.min(c + 2, text.length)), 24);
    return () => clearInterval(timer);
  }, [text, reduced]);
  const players = characters.filter((c) => !c.npc && !c.hidden).slice(0, 4);
  const npcs = characters.filter((c) => c.npc && !c.hidden).slice(0, 3);
  const speakerChar = characters.find((c) => fold(c.name) === fold(speaker));
  const extra = !speakerChar && !/narrador/i.test(speaker) ? guestArt(speaker, dialogue?.portrait || "") : "";
  const right: { id: string; name: string; art: string }[] = [
    ...(extra ? [{ id: "guest", name: speaker, art: novelPortrait(extra, scene.mode) }] : []),
    ...npcs.map((c) => ({ id: c.id, name: c.name, art: novelPortrait(c.portrait || ORDER_ART.echo, scene.mode) })),
  ].slice(0, 3);
  const left = players.map((c) => ({ id: c.id, name: c.name, art: novelPortrait(c.portrait || ORDER_ART.man, scene.mode) }));
  const speaking = (id: string, name: string) => (speakerChar ? speakerChar.id === id : fold(name) === fold(speaker));
  const someoneSpeaks = !!speakerChar || !!extra;
  const side = speakerChar ? (speakerChar.npc ? "right" : "left") : extra ? "right" : "center";
  const done = count >= text.length;
  const last = scene.dialogueIndex >= scene.dialogues.length - 1;
  return (
    <div className={`novel novel-book-wrap ${scene.mode === "HELLS" ? "hells" : ""}`}>
      <div key={scene.id} className="novel-book">
        <div className="nb-page nb-left" />
        <div className="nb-page nb-right" />
        <div className="nb-spine" />
        <header className="nb-head">
          <span>{scene.mode === "HELLS" ? "HELLS" : "CÓMUM"} · Cena {String(scene.dialogueIndex + 1).padStart(2, "0")}/{String(scene.dialogues.length).padStart(2, "0")}</span>
          <b>{scene.name}</b>
        </header>
        <div className="nb-panel" style={{ backgroundImage: `url("${sceneArtwork(scene.background, scene.mode, scene.name)}")` }}>
          <div className="nb-panel-shade" />
          <div className="nb-cast left">
            {left.map((c, i) => (
              <figure key={c.id} className={`nb-actor ${speaking(c.id, c.name) ? "speaking" : someoneSpeaks ? "dim" : ""}`} style={{ ["--i" as string]: i }}>
                <img src={c.art} alt={c.name} />
                <figcaption>{c.name}</figcaption>
              </figure>
            ))}
          </div>
          <div className="nb-cast right">
            {right.map((c, i) => (
              <figure key={c.id} className={`nb-actor ${speaking(c.id, c.name) || c.id === "guest" ? "speaking" : someoneSpeaks ? "dim" : ""}`} style={{ ["--i" as string]: i }}>
                <img src={c.art} alt={c.name} />
                <figcaption>{c.name}</figcaption>
              </figure>
            ))}
          </div>
          {scene.description && <p className="nb-caption">{scene.description}</p>}
        </div>
        <div className={`nb-dialogue ${side}`} onClick={() => setCount(text.length)}>
          <span className="nb-speaker">{speaker}</span>
          <p>
            {text.slice(0, count)}
            {!done && <span className="typing-cursor" />}
          </p>
        </div>
        <div className="nb-side">
          {!done ? (
            <button className="nb-next" onClick={() => setCount(text.length)}>Revelar fala <ArrowRight size={14} /></button>
          ) : master && !last ? (
            <button className="nb-next" onClick={() => void perform({ type: "dialogue:next" })}>Virar a página <ArrowRight size={14} /></button>
          ) : !last ? (
            <span className="nb-wait">O Mestre vira a página…</span>
          ) : scene.choices.length > 0 ? (
            <ol className="nb-choices">
              {scene.choices.map((c) => (
                <li key={c.id}>
                  <button
                    disabled={!character || scene.chosen.includes(c.id)}
                    onClick={() => void perform({ type: "choice:select", choiceId: c.id, characterId: character?.id })}
                  >
                    {c.label}
                    <small>
                      {c.fame > 0 ? "Aumenta sua fama. " : ""}
                      {c.sanity < 0 ? "Cobra um preço da sua mente. " : ""}
                      {c.trust < 0 ? "Abala a confiança. " : ""}
                      {c.combat ? "Inicia um confronto." : ""}
                    </small>
                  </button>
                </li>
              ))}
              {!character && <small className="nb-wait">Crie um Searcher para decidir.</small>}
            </ol>
          ) : (
            <span className="nb-wait">Fim da sequência.</span>
          )}
        </div>
        <span className="nb-folio left">{scene.dialogueIndex * 2 + 1}</span>
        <span className="nb-folio right">{scene.dialogueIndex * 2 + 2}</span>
      </div>
      {master && onBackground && (
        <div className={`nb-bg-picker ${picker ? "open" : ""}`}>
          <button className="nb-bg-toggle" onClick={() => setPicker(!picker)} aria-expanded={picker}>
            {picker ? <X size={14} /> : <ImageIcon size={14} />} {picker ? "Fechar" : "Fundo da cena"}
          </button>
          {picker && (
            <div className="nb-bg-list">
              {BACKGROUNDS.map((b) => (
                <button key={b.url} className={scene.background === b.url ? "active" : ""} onClick={() => onBackground(b.url)} title={b.name}>
                  <img src={b.thumbnail || b.url} alt="" />
                  <small>{b.name}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
