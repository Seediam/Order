import { ORDER_ART, novelPortrait, sceneArtwork } from '../../shared/order-assets';
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Quote } from "lucide-react";
import type { PublicCharacter, Scene } from "../../shared/types";
import type { Perform } from "./Editors";
export function Novel({
  scene,
  character,
  master,
  perform,
}: {
  scene: Scene;
  character?: PublicCharacter;
  master: boolean;
  perform: Perform;
}) {
  const reduced = useReducedMotion(),
    dialogue = scene.dialogues[scene.dialogueIndex],
    text = dialogue?.text || "",
    [count, setCount] = useState(0);
  useEffect(() => {
    setCount(reduced ? text.length : 0);
    if (reduced) return;
    const timer = setInterval(
      () => setCount((c) => Math.min(c + 2, text.length)),
      22,
    );
    return () => clearInterval(timer);
  }, [text, reduced]);
  const playerPortrait = character ? novelPortrait(character.portrait || ORDER_ART.man, scene.mode) : '';
  const guestPortrait = dialogue?.portrait || (/eco do contrato/i.test(dialogue?.speaker || '') ? ORDER_ART.echo : /guardi[aã]o do prazo/i.test(dialogue?.speaker || '') ? ORDER_ART.guardian : /elvira/i.test(dialogue?.speaker || '') ? ORDER_ART.elvira : '');
  const guestArt = guestPortrait ? novelPortrait(guestPortrait, scene.mode) : '';
  return (
    <motion.div
      key={scene.id}
      className="novel"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        className="novel-background"
        style={{
          backgroundImage: `url("${sceneArtwork(scene.background,scene.mode,scene.name)}")`,
        }}
      />
      <div className="novel-vignette" />
      <div className="novel-caption">
        <span className="eyebrow pink">
          {scene.mode} / CENA {scene.id.slice(0, 4).toUpperCase()}
        </span>
        <h2>{scene.name}</h2>
        <p>{scene.description}</p>
      </div>
      {character && <div className="novel-portrait-frame novel-player-frame"><img src={playerPortrait} className="novel-portrait" alt={character.name}/></div>}
      {guestArt && guestArt !== playerPortrait && <div className="novel-portrait-frame"><img src={guestArt} className="novel-portrait" alt={dialogue?.speaker || 'Personagem'}/></div>}
      <div className="dialogue-box">
        <div className="dialogue-speaker">
          <Quote size={16} />
          {dialogue?.speaker || "Narrador"}
          <span className="mono">TRANSMISSÃO ATIVA</span>
        </div>
        <p onClick={() => setCount(text.length)}>
          {text.slice(0, count)}
          {count < text.length && <span className="typing-cursor" />}
        </p>
        {count < text.length ? (
          <button className="text-btn" onClick={() => setCount(text.length)}>
            Revelar fala <ArrowRight size={14} />
          </button>
        ) : master && scene.dialogueIndex < scene.dialogues.length - 1 ? (
          <button
            className="text-btn"
            onClick={() => void perform({ type: "dialogue:next" })}
          >
            Avançar diálogo <ArrowRight size={14} />
          </button>
        ) : (
          <span className="mono muted small-text">
            {master ? "FIM DA SEQUÊNCIA" : "AGUARDANDO O MESTRE"}
          </span>
        )}
        {count >= text.length && scene.dialogueIndex === scene.dialogues.length - 1 &&
          scene.choices.length > 0 && (
            <div className="novel-choices">
              {scene.choices.map((c, i) => (
                <button
                  disabled={!character || scene.chosen.includes(c.id)}
                  key={c.id}
                  onClick={() =>
                    void perform({
                      type: "choice:select",
                      choiceId: c.id,
                      characterId: character?.id,
                    })
                  }
                >
                  <span className="mono">0{i + 1}</span>
                  <div>
                    {c.label}
                    <small>
                      {c.fame > 0 ? "Aumenta sua fama. " : ""}
                      {c.sanity < 0 ? "Cobra um preço da sua mente. " : ""}
                      {c.trust < 0 ? "Abala a confiança. " : ""}
                      {c.combat ? "Inicia um confronto." : ""}
                    </small>
                  </div>
                  <ArrowRight size={16} />
                </button>
              ))}
              {!character && (
                <small className="pink">
                  Crie um Procurador para tomar decisões.
                </small>
              )}
            </div>
          )}
      </div>
    </motion.div>
  );
}
