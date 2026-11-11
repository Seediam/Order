import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Settings2,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  Radio,
  BookOpen,
  ShieldCheck,
  Clock3,
  FileText,
  Fingerprint,
  X,
  Upload,
  Trash2,
  Pencil,
  Music,
  Volume2,
} from "lucide-react";
import { api, post } from "../api";
import { useStore } from "../store";
import { audio } from "../audio";
import {
  AssetPicker,
  ErrorText,
  EyeMark,
  Field,
  Loading,
  Logo,
  Modal,
} from "./UI";
import type { Asset, CampaignSummary } from "../../shared/types";
type Tab = "sessions" | "library" | "characters" | "settings";
export function Dashboard({ onEnter }: { onEnter: (id: string) => void }) {
  const user = useStore((s) => s.user)!,
    setUser = useStore((s) => s.setUser),
    notify = useStore((s) => s.notify);
  const [tab, setTab] = useState<Tab>("sessions"),
    [campaigns, setCampaigns] = useState<CampaignSummary[]>([]),
    [loading, setLoading] = useState(true),
    [create, setCreate] = useState(false),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("all");
  const load = useCallback(async () => {
    try {
      setCampaigns(await api("/api/campaigns"));
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setLoading(false);
    }
  }, [notify]);
  useEffect(() => {
    void load();
  }, [load]);
  async function enter(c: CampaignSummary) {
    try {
      audio.unlock();
      audio.tone();
      if (!c.joined) await post(`/api/campaigns/${c.id}/join`, {});
      onEnter(c.id);
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function logout() {
    await post("/api/auth/logout", {});
    setUser(null);
  }
  const tabs = [
    { id: "sessions", name: "Minhas sessões", icon: LayoutDashboard },
    { id: "characters", name: "Procuradores", icon: Users },
    { id: "library", name: "Biblioteca", icon: FolderOpen },
    { id: "settings", name: "Configurações", icon: Settings2 },
  ] as const;
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Logo />
        <div className="department-label mono">
          DIVISÃO DE CONTRATOS
          <br />
          <span>TERRESTRES E INFERNAIS</span>
        </div>
        <span className="nav-caption eyebrow">DEPARTAMENTO</span>
        <nav>
          {tabs.map((t) => (
            <button
              className={tab === t.id ? "active" : ""}
              key={t.id}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={18} />
              <span>{t.name}</span>
              {tab === t.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <EyeMark />
          <span className="eyebrow">LEMBRE-SE</span>
          <p>
            Você não está aqui
            <br />
            para ser perdoado.
          </p>
          <div className="tiny-line" />
        </div>
        <div className="sidebar-bottom">
          <div className="connection">
            <i /> SERVIDOR LOCAL
          </div>
          <div className="user-profile">
            <div className="avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="" />
              ) : (
                user.displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <strong>{user.displayName}</strong>
              <small>
                {user.role === "MASTER"
                  ? "MESTRE / AUTORIDADE"
                  : "PROCURADOR / SEARCHER"}
              </small>
            </div>
            <button
              className="icon-btn"
              title="Sair"
              aria-label="Sair"
              onClick={() => void logout()}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-top">
          <div className="breadcrumb">
            ORDER <span>/</span> {tabs.find((t) => t.id === tab)?.name}
          </div>
          <div className="row">
            <span className="mono muted">PROTOCOLO 0.1</span>
            <span className="top-divider" />
            <ShieldCheck size={15} />
            <span className="mono">ACESSO AUTORIZADO</span>
          </div>
        </header>
        {tab === "sessions" ? (
          <>
            <section className="dashboard-hero">
              <div className="hero-grid" />
              <div className="hero-ornament">
                <EyeMark />
                <div className="hero-orbit" />
              </div>
              <div className="hero-copy">
                <span className="eyebrow pink">
                  SUA PRÓXIMA SENTENÇA COMEÇA AQUI
                </span>
                <h1>
                  O trabalho
                  <br />
                  ainda <em>não acabou.</em>
                </h1>
                <p>
                  Contratos aguardam. Almas devem respostas.
                  <br />
                  Escolha uma sessão e retome o seu julgamento.
                </p>
                <div className="row">
                  <div className="hero-stat">
                    <span>
                      {String(
                        campaigns.filter((c) => c.joined).length,
                      ).padStart(2, "0")}
                    </span>
                    <small>SESSÕES NO ARQUIVO</small>
                  </div>
                  <span className="stat-divider" />
                  <div className="hero-stat">
                    <span>
                      {String(
                        campaigns.filter((c) => c.status === "active").length,
                      ).padStart(2, "0")}
                    </span>
                    <small>EM ANDAMENTO</small>
                  </div>
                </div>
              </div>
              <div className="hero-footer mono">
                <span>
                  <i className="tiny-dot" /> REGISTROS SINCRONIZADOS
                </span>
                <span>NENHUMA DÍVIDA É ESQUECIDA.</span>
              </div>
            </section>
            <section className="session-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">ARQUIVO DE OPERAÇÕES</span>
                  <h2>
                    Suas sessões
                    <span className="count">
                      {String(campaigns.length).padStart(2, "0")}
                    </span>
                  </h2>
                </div>
                {user.role === "MASTER" && (
                  <button
                    className="btn primary"
                    onClick={() => setCreate(true)}
                  >
                    <Plus size={17} /> Criar sessão
                  </button>
                )}
              </div>
              <div className="session-filters">
                <div className="tabs">
                  <button
                    className={filter === "all" ? "active" : ""}
                    onClick={() => setFilter("all")}
                  >
                    Todas as sessões
                  </button>
                  <button
                    className={filter === "joined" ? "active" : ""}
                    onClick={() => setFilter("joined")}
                  >
                    Meus contratos
                  </button>
                  <button
                    className={filter === "active" ? "active" : ""}
                    onClick={() => setFilter("active")}
                  >
                    Em andamento
                  </button>
                </div>
                <div className="search-field">
                  <Search size={16} />
                  <input
                    placeholder="Buscar nos arquivos…"
                    aria-label="Buscar sessões"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <kbd>/</kbd>
                </div>
              </div>
              {loading ? (
                <Loading />
              ) : campaigns.length === 0 ? (
                <div className="empty-campaign">
                  <div className="empty-symbol">
                    <FileText size={40} />
                    <span>001</span>
                  </div>
                  <div>
                    <span className="eyebrow pink">
                      UM ARQUIVO AINDA EM BRANCO
                    </span>
                    <h3>Todo contrato precisa de uma primeira assinatura.</h3>
                    <p>
                      {user.role === "MASTER"
                        ? "Abra uma campanha ou comece com O Fabricante de Brinquedos, uma operação demonstrativa jogável."
                        : "O Mestre precisa abrir uma sessão neste servidor. Ela aparecerá aqui assim que for criada."}
                    </p>
                    {user.role === "MASTER" && (
                      <button
                        className="btn secondary"
                        onClick={() => setCreate(true)}
                      >
                        Abrir o primeiro contrato <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="campaign-list">
                  {campaigns
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(q.toLowerCase()) &&
                        (filter === "all" ||
                          (filter === "joined" && c.joined) ||
                          (filter === "active" && c.status === "active")),
                    )
                    .map((c, i) => (
                      <motion.article
                        key={c.id}
                        className="campaign-card"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <div
                          className="campaign-image"
                          style={{ backgroundImage: `url("${c.banner}")` }}
                        >
                          <span className="campaign-number mono">
                            OPERAÇÃO {String(i + 1).padStart(3, "0")}
                          </span>
                          <span
                            className={`status-pill ${c.status === "active" ? "live" : ""}`}
                          >
                            <i />
                            {c.status === "active"
                              ? "EM ANDAMENTO"
                              : c.status === "closed"
                                ? "ENCERRADA"
                                : "SESSÃO ABERTA"}
                          </span>
                        </div>
                        <div className="campaign-info">
                          <span className="eyebrow">
                            CONTRATO TERRESTRE /{" "}
                            {c.joined ? "SEU ARQUIVO" : "DISPONÍVEL"}
                          </span>
                          <h3>{c.name}</h3>
                          <p>
                            {c.description ||
                              "Um novo julgamento aguarda os Procuradores."}
                          </p>
                          <div className="campaign-meta">
                            <span>
                              <ShieldCheck size={14} />
                              {c.owner}
                            </span>
                            <span>
                              <Users size={14} />
                              {c.members}{" "}
                              {c.members === 1 ? "membro" : "membros"} ·{" "}
                              {c.online} online
                            </span>
                            <span>
                              <Clock3 size={14} />
                              {new Date(c.updatedAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </div>
                        </div>
                        <button
                          className="campaign-enter"
                          onClick={() => void enter(c)}
                        >
                          <span>
                            {c.joined ? "Continuar sessão" : "Entrar na sessão"}
                          </span>
                          <ArrowUpRight size={21} />
                        </button>
                      </motion.article>
                    ))}
                </div>
              )}
              <div className="archive-footer">
                <Fingerprint size={17} />
                <span>Os registros permanecem. Mesmo quando você sai.</span>
                <span className="mono">ARMAZENAMENTO LOCAL / SQLITE</span>
              </div>
            </section>
          </>
        ) : tab === "library" ? (
          <Library />
        ) : tab === "settings" ? (
          <Settings />
        ) : (
          <section className="inner-page">
            <span className="eyebrow">ARQUIVOS CONFIDENCIAIS</span>
            <h1>Procuradores</h1>
            <p className="subtle">
              As fichas pertencem às campanhas. Entre em uma sessão para criar e
              gerenciar seus Searchers.
            </p>
            <div className="character-directory">
              {campaigns
                .filter((c) => c.joined)
                .map((c) => (
                  <button key={c.id} onClick={() => void enter(c)}>
                    <Users size={24} />
                    <div>
                      <strong>{c.name}</strong>
                      <small>Abrir fichas desta campanha</small>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
            </div>
          </section>
        )}
        <footer className="dashboard-footer">
          <span className="mono">
            ORDER © 2026 · TODAS AS ALMAS DEVIDAMENTE REGISTRADAS.
          </span>
          <span className="mono">O JULGAMENTO CONTINUA.</span>
        </footer>
      </main>
      {create && (
        <CreateCampaign
          onClose={() => setCreate(false)}
          onCreated={(id) => {
            setCreate(false);
            void load();
            onEnter(id);
          }}
        />
      )}
    </div>
  );
}
function CreateCampaign({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [banner, setBanner] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [demo, setDemo] = useState(true);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(e.currentTarget);
      const c = await post("/api/campaigns", {
        name: form.get("name"),
        description: form.get("description"),
        banner,
        demo,
      });
      onCreated(c.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Abrir novo contrato" onClose={onClose}>
      <form onSubmit={submit}>
        <Field label="Nome da campanha">
          <input
            name="name"
            defaultValue="O Fabricante de Brinquedos"
            required
            minLength={3}
            maxLength={100}
          />
        </Field>
        <Field label="Descrição">
          <textarea
            name="description"
            defaultValue="Um contrato vencido. Trinta almas inocentes. Uma decisão que não pode ser arquivada."
            rows={3}
          />
        </Field>
        <Field label="Banner da campanha">
          <AssetPicker value={banner} onChange={setBanner} />
        </Field>
        <label className="check-field">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
          />
          <div>
            Incluir campanha demonstrativa
            <small>
              7 cenas, mapa com 9 salas, Augusto Vilar e cartas de teste.
            </small>
          </div>
        </label>
        <ErrorText error={error} />
        <button className="btn primary full" disabled={busy}>
          {busy ? "Abrindo arquivo…" : "Criar campanha e entrar"}
          <ArrowRight size={17} />
        </button>
      </form>
    </Modal>
  );
}
export function Library() {
  const [assets, setAssets] = useState<Asset[]>([]),
    [q, setQ] = useState(""),
    [category, setCategory] = useState("Todos"),
    [busy, setBusy] = useState(false);
  const notify = useStore((s) => s.notify);
  const categories = [
    "Todos",
    "Backgrounds",
    "Salas",
    "Retratos",
    "Tokens",
    "Cartas",
    "Equipamentos",
    "Sons",
    "Músicas",
    "Efeitos",
    "Banners",
    "Objetos",
  ];
  const load = useCallback(
    () =>
      api<Asset[]>("/api/assets")
        .then(setAssets)
        .catch((e) => notify(e.message, true)),
    [notify],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function upload(file: File) {
    setBusy(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("category", category === "Todos" ? "Backgrounds" : category);
      await api("/api/assets", { method: "POST", body: data });
      await load();
      notify("Arquivo incorporado à biblioteca.");
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function remove(a: Asset) {
    try {
      await api(`/api/assets/${a.id}`, { method: "DELETE" });
      void load();
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function rename(a: Asset) {
    const name = prompt("Nome do arquivo", a.name);
    if (!name) return;
    try {
      await api(`/api/assets/${a.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, category: a.category }),
      });
      void load();
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <section className="inner-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">PATRIMÔNIO DO DEPARTAMENTO</span>
          <h1>Biblioteca de recursos</h1>
          <p className="subtle">
            Imagens e sons guardados neste servidor. Até 20 MB por arquivo.
          </p>
        </div>
        <label className="btn primary">
          <Upload size={16} />
          {busy ? "Enviando…" : "Enviar arquivo"}
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,audio/ogg"
            disabled={busy}
            onChange={(e) => {
              if (e.target.files?.[0]) void upload(e.target.files[0]);
            }}
          />
        </label>
      </div>
      <div className="row library-filters">
        <select
          aria-label="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder="Buscar recurso…"
            aria-label="Buscar recurso"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="library-grid">
        {assets
          .filter(
            (a) =>
              (category === "Todos" || a.category === category) &&
              a.name.toLowerCase().includes(q.toLowerCase()),
          )
          .map((a) => (
            <article key={a.id}>
              <div className="asset-preview">
                {a.mime.startsWith("image/") ? (
                  <img src={a.thumbnail || a.url} alt={a.name} />
                ) : (
                  <audio controls src={a.url} />
                )}
              </div>
              <div className="asset-description">
                <span className="eyebrow">{a.category}</span>
                <strong>{a.name}</strong>
                <small>{(a.size / 1024).toFixed(0)} KB</small>
                <div className="row">
                  <button
                    className="icon-btn"
                    aria-label={`Renomear ${a.name}`}
                    onClick={() => void rename(a)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Excluir ${a.name}`}
                    onClick={() => void remove(a)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>
      {!assets.length && (
        <div className="empty-simple">
          <FolderOpen size={35} />
          <p>Seu acervo ainda está vazio.</p>
          <small>Envie backgrounds, retratos e sons para suas sessões.</small>
        </div>
      )}
    </section>
  );
}
export function Settings() {
  const user = useStore((s) => s.user)!,
    setUser = useStore((s) => s.setUser),
    notify = useStore((s) => s.notify);
  const [avatar, setAvatar] = useState(user.avatar),
    [volumes, setVolumes] = useState({
      effects: audio.effects,
      music: audio.music,
      ambient: audio.ambient,
    });
  async function profile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const u = await api("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          displayName: new FormData(e.currentTarget).get("name"),
          avatar,
        }),
      });
      setUser(u);
      notify("Perfil atualizado.");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  async function setup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          enabled: f.get("enabled") === "on",
          code: f.get("code") || undefined,
        }),
      });
      notify("Autorização de novos Mestres atualizada.");
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  return (
    <section className="inner-page settings-page">
      <span className="eyebrow">PREFERÊNCIAS DO TERMINAL</span>
      <h1>Configurações</h1>
      <div className="settings-grid">
        <form className="settings-card" onSubmit={profile}>
          <h3>
            <Users size={18} /> Seu registro
          </h3>
          <Field label="Nome de exibição">
            <input
              name="name"
              defaultValue={user.displayName}
              required
              minLength={2}
            />
          </Field>
          <Field label="Avatar">
            <AssetPicker value={avatar} onChange={setAvatar} />
          </Field>
          <button className="btn secondary">Salvar perfil</button>
        </form>
        <div className="settings-card">
          <h3>
            <Volume2 size={18} /> Áudio do terminal
          </h3>
          {(["effects", "ambient"] as const).map((key, i) => (
            <Field
              key={key}
              label={["Efeitos de interação", "Ambiente compartilhado"][i]}
            >
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={volumes[key]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolumes({ ...volumes, [key]: v });
                  audio.set(key, v);
                }}
              />
            </Field>
          ))}
          <button
            className="btn secondary"
            onClick={() => {
              audio.unlock();
              audio.tone("turn");
            }}
          >
            Testar som
          </button>
        </div>
        {user.role === "MASTER" && (
          <form className="settings-card" onSubmit={setup}>
            <h3>
              <ShieldCheck size={18} /> Cadastro de Mestres
            </h3>
            <p className="subtle">
              Altere ou desative o código inicial. A sua senha pessoal permanece
              independente.
            </p>
            <label className="check-field">
              <input type="checkbox" name="enabled" />
              Permitir novos cadastros de Mestre
            </label>
            <Field label="Novo código de autorização">
              <input
                name="code"
                type="password"
                minLength={4}
                autoComplete="new-password"
              />
            </Field>
            <button className="btn secondary">Atualizar autorização</button>
          </form>
        )}
        <div className="settings-card">
          <h3>
            <Radio size={18} /> Servidor e persistência
          </h3>
          <p className="subtle">
            Os dados e uploads ficam na pasta <code>data/</code> do anfitrião.
            Faça uma cópia dessa pasta com o servidor desligado.
          </p>
          <p className="mono">
            PORTA PADRÃO / 3000
            <br />
            ENDEREÇO / IPv4 DO HAMACHI
          </p>
          <p className="subtle">
            Consulte HAMACHI_SETUP.md no projeto para a configuração de rede.
          </p>
        </div>
      </div>
    </section>
  );
}
