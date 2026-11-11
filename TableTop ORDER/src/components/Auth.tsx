import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowLeft,
  LockKeyhole,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { EyeMark, Field, ErrorText, Logo } from "./UI";
import { post } from "../api";
import { useStore } from "../store";
import type { User } from "../../shared/types";
export function Auth() {
  const [mode, setMode] = useState<"welcome" | "login" | "register">("welcome"),
    [role, setRole] = useState<"PLAYER" | "MASTER">("PLAYER"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const setUser = useStore((s) => s.setUser);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form);
    if (mode === "register" && data.password !== data.confirm) {
      setError("As senhas precisam ser iguais.");
      return;
    }
    setBusy(true);
    try {
      const user = await post<User>(`/api/auth/${mode}`, { ...data, role });
      setUser(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="art-grid" />
        <Logo />
        <div className="auth-illustration">
          <EyeMark />
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="orbit three" />
        </div>
        <div className="auth-manifest">
          <span className="eyebrow">A MORTE FOI APENAS A ADMISSÃO.</span>
          <h1>
            Existe uma ordem.
            <br />E ela conhece
            <br />
            <em>o seu nome.</em>
          </h1>
          <p>
            Investigue os vivos. Julgue os culpados.
            <br />
            Preste contas aos mortos.
          </p>
        </div>
        <span className="mono auth-foot">
          DIVISÃO DE CONTRATOS TERRESTRES / EST. ∞
        </span>
      </div>
      <section className="auth-panel">
        <span className="eyebrow">TERMINAL SEGURO · ORDER VTT</span>
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-content"
        >
          {mode === "welcome" ? (
            <>
              <EyeMark className="auth-eye" />
              <h2>O R D E R</h2>
              <p className="subtle">Seu julgamento ainda não terminou.</p>
              <button
                className="btn primary full"
                onClick={() => setMode("login")}
              >
                Entre com suas credenciais <ArrowRight size={17} />
              </button>
              <button
                className="btn secondary full"
                onClick={() => setMode("register")}
              >
                Cadastre suas credenciais <UserRound size={16} />
              </button>
              <div className="security-note">
                <LockKeyhole size={14} />
                <span>Identidade verificada. Destino pendente.</span>
              </div>
            </>
          ) : (
            <>
              <button
                className="text-btn back"
                onClick={() => {
                  setMode("welcome");
                  setError("");
                }}
              >
                <ArrowLeft size={14} /> Voltar
              </button>
              <h2>
                {mode === "login" ? "Identifique-se." : "Abra seu arquivo."}
              </h2>
              <p className="subtle">
                {mode === "login"
                  ? "O departamento aguarda o seu retorno."
                  : "Toda alma precisa de um registro."}
              </p>
              <form onSubmit={submit}>
                <Field label="Nome de usuário">
                  <input
                    name="username"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-zA-Z0-9_]+"
                    placeholder="seu_identificador"
                  />
                </Field>
                {mode === "register" && (
                  <Field label="Nome de exibição">
                    <input
                      name="displayName"
                      required
                      minLength={2}
                      maxLength={50}
                      placeholder="Como devemos chamar você?"
                    />
                  </Field>
                )}
                <Field
                  label="Senha"
                  hint={
                    mode === "register"
                      ? "Pelo menos 10 caracteres, incluindo letras e números."
                      : undefined
                  }
                >
                  <input
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "register" ? 10 : 1}
                  />
                </Field>
                {mode === "register" && (
                  <>
                    <Field label="Confirme a senha">
                      <input
                        name="confirm"
                        type="password"
                        autoComplete="new-password"
                        required
                      />
                    </Field>
                    <div className="role-switch">
                      <button
                        type="button"
                        className={role === "PLAYER" ? "selected" : ""}
                        onClick={() => setRole("PLAYER")}
                      >
                        <UserRound size={17} /> Procurador
                      </button>
                      <button
                        type="button"
                        className={role === "MASTER" ? "selected" : ""}
                        onClick={() => setRole("MASTER")}
                      >
                        <ShieldCheck size={17} /> Mestre
                      </button>
                    </div>
                    {role === "MASTER" && (
                      <Field label="Código de autorização do Mestre">
                        <input
                          name="setupCode"
                          type="password"
                          required
                          autoComplete="off"
                        />
                      </Field>
                    )}
                  </>
                )}
                <ErrorText error={error} />
                <button className="btn primary full" disabled={busy}>
                  {busy
                    ? "Verificando credenciais…"
                    : mode === "login"
                      ? "Acessar o departamento"
                      : "Registrar credenciais"}
                  <ArrowRight size={17} />
                </button>
              </form>
            </>
          )}
        </motion.div>
        <span className="mono auth-copyright">
          ORDER / PROTOCOLO DE ACESSO 0.1
        </span>
      </section>
    </main>
  );
}
