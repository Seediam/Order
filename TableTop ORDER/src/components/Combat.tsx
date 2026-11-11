import { useEffect, useRef, useState } from "react";
import type { Card, Log, PublicCharacter } from "../../shared/types";

/* Menu de decisão no estilo dos JRPGs: faixas inclinadas acima do personagem da vez. */
export function PersonaMenu({
  me, cards, canAct, onCard, onMove, onTest, onSheet, onEnd,
}: {
  me: PublicCharacter;
  cards: Card[];
  canAct: boolean;
  onCard: (c: Card) => void;
  onMove: () => void;
  onTest: () => void;
  onSheet: () => void;
  onEnd: () => void;
}) {
  const [sub, setSub] = useState<"" | "cards">(""),
    [focus, setFocus] = useState(0),
    [hidden, setHidden] = useState(false);
  const items = [
    { k: "A", label: "AÇÃO", hint: `${cards.length} cartas na mão`, run: () => setSub("cards"), off: !cards.length },
    { k: "M", label: "MOVER", hint: `${me.remainingMove} casas`, run: onMove, off: me.remainingMove <= 0 },
    { k: "T", label: "TESTE", hint: "D20 + atributo", run: onTest },
    { k: "F", label: "FICHA", hint: "FOR VIG INT AGI PRE", run: onSheet },
    { k: "P", label: "PASSAR", hint: "encerrar turno", run: onEnd },
  ];
  useEffect(() => { setSub(""); setFocus(0); }, [me.id]);
  useEffect(() => {
    if (!canAct || hidden) return;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,textarea,select")) return;
      const list = sub === "cards" ? cards : items;
      if (e.key === "ArrowDown") { e.preventDefault(); setFocus((f) => (f + 1) % list.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocus((f) => (f - 1 + list.length) % list.length); }
      else if (e.key === "Enter") { e.preventDefault(); if (sub === "cards") { const c = cards[focus]; if (c) onCard(c); } else if (!items[focus].off) items[focus].run(); }
      else if (e.key === "Escape" || e.key === "Backspace") { if (sub) { e.preventDefault(); setSub(""); setFocus(0); } }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });
  if (hidden)
    return <button className="persona-peek" onClick={() => setHidden(false)} aria-label="Abrir menu de ação">▲ AÇÕES</button>;
  return (
    <div className={`persona-menu ${canAct ? "" : "waiting"}`} role="menu" aria-label={`Ações de ${me.name}`}>
      <div className="persona-who">
        <b>{me.name}</b>
        <span>{canAct ? "SUA VEZ" : "AGUARDE"}</span>
        <button className="persona-hide" onClick={() => setHidden(true)} aria-label="Recolher menu">×</button>
      </div>
      {sub === "cards" ? (
        <>
          <button className="persona-item back" onClick={() => { setSub(""); setFocus(0); }}><i>←</i><span>VOLTAR</span></button>
          {cards.map((c, i) => (
            <button key={`${c.id}${i}`} role="menuitem" className={`persona-item card ${focus === i ? "focus" : ""}`} style={{ ["--i" as string]: i }} onMouseEnter={() => setFocus(i)} disabled={!canAct} onClick={() => onCard(c)}>
              <i>{c.dice.join("")}</i>
              <span>{c.name}<small>{c.tags.find((t) => /Reação|Armadilha/.test(t)) || "Ação"} · alcance {c.range}</small></span>
            </button>
          ))}
        </>
      ) : (
        items.map((it, i) => (
          <button key={it.k} role="menuitem" className={`persona-item ${focus === i ? "focus" : ""}`} style={{ ["--i" as string]: i }} onMouseEnter={() => setFocus(i)} disabled={!canAct || it.off} onClick={it.run}>
            <i>{it.k}</i>
            <span>{it.label}<small>{it.hint}</small></span>
          </button>
        ))
      )}
    </div>
  );
}

/* Falas de impacto no meio da luta: mesma tipografia das onomatopeias do livro. */
type Shout = { id: number; text: string; sub?: string; tone: "hit" | "miss" | "heal" | "turn" | "crit" | "info"; x: number; y: number; r: number };
export function CombatCallouts({ logs, characters, enabled }: { logs: Log[]; characters: PublicCharacter[]; enabled: boolean }) {
  const [shouts, setShouts] = useState<Shout[]>([]);
  const seen = useRef<string | null>(null), hp = useRef<Map<string, number>>(new Map()), n = useRef(0);
  function push(text: string, tone: Shout["tone"], sub?: string) {
    const id = ++n.current;
    const s: Shout = { id, text, sub, tone, x: 22 + Math.random() * 56, y: 22 + Math.random() * 40, r: Math.random() * 14 - 7 };
    setShouts((v) => [...v.slice(-3), s]);
    setTimeout(() => setShouts((v) => v.filter((x) => x.id !== id)), 2100);
  }
  useEffect(() => {
    const last = logs[logs.length - 1];
    if (seen.current === null) { seen.current = last?.id ?? ""; return; }
    if (!enabled) { seen.current = last?.id ?? ""; return; }
    const start = logs.findIndex((l) => l.id === seen.current);
    const fresh = start >= 0 ? logs.slice(start + 1) : logs.slice(-1);
    seen.current = last?.id ?? "";
    for (const l of fresh.slice(-3)) {
      const roll = l.rolls?.[0];
      if (/combate iniciado|encontro iniciado|iniciou o combate/i.test(l.text)) push("COMBATE!", "crit");
      else if (/^Turno de (.+?) ·/.test(l.text)) push("SUA VEZ", "turn", l.text.match(/^Turno de (.+?) ·/)![1].toUpperCase());
      else if (roll?.sides === 20 && roll.value === 20) push("CRÍTICO!", "crit", roll.label);
      else if (roll?.sides === 20 && roll.value === 1) push("DESASTRE!", "miss", roll.label);
      else if (/Acerto d20/.test(l.text)) push(roll?.ok ? "ACERTOU!" : "ERROU!", roll?.ok ? "hit" : "miss", roll?.label);
      else if (/ATIVOU/.test(l.text)) push("ATIVOU!", "hit", l.text.match(/usa (.+?) ·/)?.[1]);
      else if (/· FALHOU/.test(l.text)) push("FALHOU…", "miss", l.text.match(/usa (.+?) ·/)?.[1]);
      else if (/mascarado/.test(l.text)) push("CARTA NA MESA", "info", "verso para cima");
      else if (/Encontro encerrado/.test(l.text)) push("FIM DO CONFRONTO", "info");
    }
  }, [logs[logs.length - 1]?.id]);
  useEffect(() => {
    const prev = hp.current;
    if (enabled && prev.size)
      for (const c of characters) {
        const before = prev.get(c.id);
        if (before === undefined || before === c.hp) continue;
        const d = c.hp - before;
        if (c.hp <= 0 && before > 0) push("CAIU!", "crit", c.name.toUpperCase());
        else push(d < 0 ? `${d}` : `+${d}`, d < 0 ? "hit" : "heal", `${c.name.toUpperCase()} · VIDA`);
      }
    hp.current = new Map(characters.map((c) => [c.id, c.hp]));
  }, [characters.map((c) => `${c.id}:${c.hp}`).join("|")]);
  return (
    <div className="callouts" aria-live="polite">
      {shouts.map((s) => (
        <div key={s.id} className={`callout ${s.tone}`} style={{ left: `${s.x}%`, top: `${s.y}%`, ["--r" as string]: `${s.r}deg` }}>
          <b>{s.text}</b>
          {s.sub && <small>{s.sub}</small>}
        </div>
      ))}
    </div>
  );
}
