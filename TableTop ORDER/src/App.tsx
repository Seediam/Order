import { useEffect, useState, lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
import { api } from "./api";
import { useStore } from "./store";
import { Intro } from "./components/Intro";
import { Auth } from "./components/Auth";
const Dashboard = lazy(() =>
  import("./components/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Tabletop = lazy(() =>
  import("./components/Tabletop").then((m) => ({ default: m.Tabletop })),
);
import { Loading, Toasts } from "./components/UI";
export function App() {
  const user = useStore((s) => s.user),
    setUser = useStore((s) => s.setUser);
  const [loading, setLoading] = useState(true),
    [intro, setIntro] = useState(!sessionStorage.getItem("order:intro")),
    [campaignId, setCampaignId] = useState<string | null>(null);
  useEffect(() => {
    api("/api/auth/me")
      .then((u) => {
        setUser(u);
        setIntro(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setUser]);
  return (
    <>
      <Suspense fallback={<Loading />}>
        {loading ? (
          <Loading />
        ) : user ? (
          campaignId ? (
            <Tabletop id={campaignId} onLeave={() => setCampaignId(null)} />
          ) : (
            <Dashboard onEnter={setCampaignId} />
          )
        ) : (
          <AnimatePresence mode="wait">
            {intro ? (
              <Intro
                key="intro"
                onEnter={() => {
                  sessionStorage.setItem("order:intro", "1");
                  setIntro(false);
                }}
              />
            ) : (
              <Auth key="auth" />
            )}
          </AnimatePresence>
        )}
      </Suspense>
      <Toasts />
    </>
  );
}
