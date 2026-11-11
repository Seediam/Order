import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { audio } from "../audio";
export function Intro({ onEnter }: { onEnter: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 }),
    [opening, setOpening] = useState(false);
  const reduced = useReducedMotion();
  function enter() {
    if (opening) return;
    audio.unlock();
    audio.tone("open");
    setOpening(true);
    setTimeout(onEnter, reduced ? 0 : 1100);
  }
  return (
    <motion.main
      className={`intro ${opening ? "opening" : ""}`}
      exit={{ opacity: 0 }}
      onPointerMove={(e) =>
        setPosition({
          x: (e.clientX / window.innerWidth - 0.5) * 14,
          y: (e.clientY / window.innerHeight - 0.5) * 10,
        })
      }
    >
      <header>
        <span className="eyebrow">DEPARTAMENTO DE JULGAMENTO DE ALMAS</span>
        <button className="text-btn" onClick={enter}>
          Pular introdução <ArrowUpRight size={14} />
        </button>
      </header>
      <div className="intro-serial mono">
        SISTEMA 001
        <br />
        CONEXÃO ESTABELECIDA
      </div>
      <div className="intro-center">
        <span className="eyebrow intro-warning">VOCÊ FOI CONVOCADO.</span>
        <button
          className="eye-button"
          aria-label="Abrir o olho e acessar ORDER"
          onClick={enter}
        >
          <svg viewBox="0 0 600 270" className="supernatural-eye">
            <defs>
              <radialGradient id="iris">
                <stop stopColor="#0C0C10" offset=".15" />
                <stop stopColor="#FF2F8E" offset=".47" />
                <stop stopColor="#FF76C7" offset=".65" />
                <stop stopColor="#2A2A2F" offset="1" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            <ellipse
              cx="300"
              cy="135"
              rx="195"
              ry="58"
              fill="#ff2f8e"
              opacity=".08"
              filter="url(#glow)"
            />
            <path
              className="eye-outline"
              d="M55 135Q300-39 545 135Q300 309 55 135Z"
              fill="#131018"
              stroke="#FF76C7"
              strokeWidth="1.3"
            />
            <g
              className="iris"
              style={{
                transform: `translate(${position.x}px,${position.y}px)`,
              }}
            >
              <circle cx="300" cy="135" r="70" fill="url(#iris)" />
              {Array.from({ length: 60 }, (_, i) => (
                <path
                  key={i}
                  d="M300 69L300 97"
                  stroke={i % 3 === 0 ? "#FF76C7" : "#0C0C10"}
                  opacity=".65"
                  transform={`rotate(${i * 6} 300 135)`}
                />
              ))}
              <circle
                cx="300"
                cy="135"
                r="28"
                fill="#050507"
                className="pupil"
              />
              <circle cx="283" cy="114" r="5" fill="#fff" opacity=".8" />
              <circle cx="315" cy="150" r="2" fill="#ff76c7" />
            </g>
            <path
              d="M55 135Q300-39 545 135"
              fill="none"
              stroke="#FF2F8E"
              strokeWidth="2"
            />
            <path
              d="M24 135H68M532 135H576M300 26V42M300 228V244"
              stroke="#FF2F8E"
              opacity=".5"
            />
          </svg>
          <span className="eye-cross top" />
          <span className="eye-cross bottom" />
        </button>
        <div className="intro-word">
          {"ORDER".split("").map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: opening ? i * 0.12 : 0 }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
        <p>Seu julgamento ainda não terminou.</p>
        <span className="intro-action mono">
          [ CLIQUE NO OLHO PARA CONTINUAR ]
        </span>
      </div>
      <footer>
        <span className="mono">ACESSO RESTRITO A PROCURADORES</span>
        <span className="mono">NENHUMA ALMA FORA DOS REGISTROS.</span>
      </footer>
      <div className="intro-pulse" />
    </motion.main>
  );
}
