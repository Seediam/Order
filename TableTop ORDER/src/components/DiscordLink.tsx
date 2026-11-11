import { useEffect, useState } from "react";
import { Link2, RefreshCw } from "lucide-react";
import { api, post } from "../api";
import { ErrorText, Loading } from "./UI";

type LinkStatus = { configured: boolean; linked: boolean; syncedAt?: string };
export function DiscordLink({ campaignId, characterId }: { campaignId: string; characterId: string }) {
  const base = `/api/campaigns/${encodeURIComponent(campaignId)}/discord/${encodeURIComponent(characterId)}`;
  const [status, setStatus] = useState<LinkStatus | null>(null);
  const [code, setCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<LinkStatus>(base).then(value => { if (active) setStatus(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [base]);
  async function refresh() {
    setBusy(true); setError("");
    try { const next = await api<LinkStatus>(base); setStatus(next); if (next.linked) setCode(null); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function createCode() {
    setBusy(true); setError("");
    try { setCode(await post(base + "/code", {})); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="discord-link-panel">
    <h3><Link2 size={21} /> Seu contrato no Discord</h3>
    <p>Vincule este Searcher à sua ficha privada do bot ORDER. Vida, Moral, Sanidade, Confiança coletiva e Hell of Fame passam a acompanhar os valores da mesa.</p>
    <ErrorText error={error} />
    {!status && !error && <Loading />}
    {status && !status.configured && <p className="subtle">A ponte ainda precisa ser ativada pelo anfitrião desta mesa.</p>}
    {status?.configured && <>
      <p className="stamp">{status.linked ? "CONTRATO VINCULADO" : "AGUARDANDO VÍNCULO"}</p>
      {status.linked ? <>
        <p>Consulte os valores atuais com <code>/minha_ficha</code> no Discord. Sua história e seu retrato continuam na ficha.</p>
        {status.syncedAt && <p className="subtle">Última sincronização: {new Date(status.syncedAt).toLocaleString("pt-BR")}</p>}
        <p className="subtle">Para interromper a sincronização, use <code>/desvincular_tabletop</code> no Discord.</p>
      </> : <>
        <ol><li>Crie sua ficha no Discord com <code>/criar_ficha</code>.</li><li>Gere o código abaixo e use <code>/vincular_tabletop</code> no servidor ORDER.</li><li>Volte aqui e confirme o vínculo.</li></ol>
        <button className="btn primary" type="button" disabled={busy} onClick={() => void createCode()}>{code ? "Gerar outro código" : "Gerar código de vínculo"}</button>
      </>}
      {code && <div className="discord-link-code"><strong className="mono">{code.code}</strong><p>Use como argumento de <code>/vincular_tabletop</code>. Válido até {new Date(code.expiresAt).toLocaleTimeString("pt-BR")}. Compartilhe apenas com sua própria conta do Discord.</p></div>}
    </>}
    <button className="btn secondary" type="button" disabled={busy} onClick={() => void refresh()}><RefreshCw size={16} /> Confirmar vínculo / atualizar</button>
  </section>;
}
