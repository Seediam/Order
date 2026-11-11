import sharp from "sharp";
import { test, expect } from "@playwright/test";
test("introdução, cadastro, campanha e privacidade em contextos isolados", async ({
  browser,
}) => {
  test.setTimeout(120000);
  const suffix = Date.now().toString(36),
    a = await browser.newContext(),
    b = await browser.newContext();
  const master = await a.newPage(),
    player = await b.newPage();
  await master.goto("/");
  await expect(
    master.getByRole("button", { name: "Abrir o olho e acessar ORDER" }),
  ).toBeVisible();
  await master
    .getByRole("button", { name: "Abrir o olho e acessar ORDER" })
    .click();
  await master
    .getByRole("button", { name: "Cadastre suas credenciais" })
    .click();
  await master.getByLabel("Nome de usuário").fill(`gm_${suffix}`);
  await master.getByLabel("Nome de exibição").fill("Mestre de teste");
  await master.getByLabel("Senha", { exact: true }).fill("TesteSeguro123");
  await master.getByLabel("Confirme a senha").fill("TesteSeguro123");
  await master.getByRole("button", { name: "Mestre", exact: true }).click();
  await master.getByLabel("Código de autorização do Mestre").fill("4053");
  await master.getByRole("button", { name: "Registrar credenciais" }).click();
  await expect(
    master.getByRole("heading", { name: "Suas sessões" }),
  ).toBeVisible();
  await master
    .getByRole("button", { name: "Criar sessão", exact: true })
    .click();
  await master.getByRole("button", { name: "Criar campanha e entrar" }).click();
  await expect(
    master.getByLabel("Criar personagem", { exact: true }),
  ).toBeVisible();
  await player.goto("/");
  await player.getByRole("button", { name: "Pular introdução" }).click();
  await player
    .getByRole("button", { name: "Cadastre suas credenciais" })
    .click();
  await player.getByLabel("Nome de usuário").fill(`p_${suffix}`);
  await player.getByLabel("Nome de exibição").fill("Jogadora de teste");
  await player.getByLabel("Senha", { exact: true }).fill("TesteSeguro123");
  await player.getByLabel("Confirme a senha").fill("TesteSeguro123");
  await player.getByRole("button", { name: "Registrar credenciais" }).click();
  await player
    .getByRole("button", { name: "Entrar na sessão" })
    .first()
    .click();
  await player.getByLabel("Criar personagem", { exact: true }).click();
  await player.getByLabel("Nome", { exact: true }).fill("Cassandra de teste");
  await player.getByRole("button", { name: "Registrar personagem" }).click();
  await expect(player.locator(".hand-card")).toHaveCount(3);
  await expect(
    master
      .getByText("Cassandra de teste entrou no arquivo de Procuradores.", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  const data = await master.evaluate(async () => {
    const cs = await (await fetch("/api/campaigns")).json();
    return (
      await fetch(
        `/api/campaigns/${cs.find((c: any) => c.name === "O Fabricante de Brinquedos").id}`,
      )
    ).json();
  });
  const c = data.characters.find((c: any) => c.name === "Cassandra de teste");
  expect(c).not.toHaveProperty("hand");
  expect(c).not.toHaveProperty("deck");
  await player.screenshot({
    path: "test-results/tabletop.png",
    fullPage: true,
  });
  // Editor real: nova planta de nove salas, desenho e imagem interna persistidos.
  await master.getByRole("button", { name: "Criar cena", exact: true }).click();
  let dialog = master.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Planta de teste");
  await dialog.getByRole("button", { name: "Criar cena", exact: true }).click();
  await expect(master.locator(".room-list button")).toHaveCount(9);
  await master
    .getByRole("button", { name: "Sala retangular", exact: true })
    .click();
  const box = (await master
    .locator(".board-container canvas")
    .first()
    .boundingBox())!;
  const fit = Math.min(
      (box.width - 70) / (26 * 36),
      (box.height - 70) / (22 * 36),
    ),
    ox = (box.width - 26 * 36 * fit) / 2,
    oy = (box.height - 22 * 36 * fit) / 2;
  await master.mouse.move(box.x + ox + 36 * fit, box.y + oy + 4 * 36 * fit);
  await master.mouse.down();
  await master.mouse.move(
    box.x + ox + 7 * 36 * fit,
    box.y + oy + 9 * 36 * fit,
    { steps: 10 },
  );
  await master.mouse.up();
  await expect
    .poll(() =>
      master.evaluate(async (campaignId) => {
        const d = await (await fetch("/api/campaigns/" + campaignId)).json();
        return d.scenes.find((s: any) => s.name === "Planta de teste").rooms[0]
          .points.length;
      }, data.id),
    )
    .toBe(8);
  await master.getByRole("button", { name: "Editar sala selecionada" }).click();
  dialog = master.getByRole("dialog");
  await dialog
    .getByLabel("Nome", { exact: true })
    .fill("Arquivo de evidências");
  await dialog.getByRole("button", { name: "Escolher arquivo" }).click();
  await dialog.locator("input[type=file]").setInputFiles({
    name: "sala.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#FF2F8E" },
    })
      .png()
      .toBuffer(),
  });
  await expect(dialog.locator(".asset-picker>img")).toBeVisible();
  await dialog.getByRole("button", { name: "Salvar sala" }).click();
  const edited = await master.evaluate(async () => {
    const cs = await (await fetch("/api/campaigns")).json();
    return (await fetch(`/api/campaigns/${cs[0].id}`)).json();
  });
  const room = edited.scenes.find((s: any) => s.name === "Planta de teste")
    .rooms[0];
  expect(room.name).toBe("Arquivo de evidências");
  expect(room.points).toHaveLength(8);
  expect(room.image).toMatch(/^\/media\//);
  await master
    .getByRole("button", { name: "Iniciar combate", exact: true })
    .click();
  await expect(master.locator(".turn-strip")).toBeVisible();
  await expect(player.locator(".turn-strip")).toBeVisible();
  const firstIndex = await master.evaluate(async (campaignId) => {
    const state = await (await fetch("/api/campaigns/" + campaignId)).json();
    return state.combat.index;
  }, data.id);
  await master
    .getByRole("button", { name: "Encerrar turno", exact: true })
    .click();
  await expect
    .poll(() =>
      master.evaluate(async (campaignId) => {
        const state = await (
          await fetch("/api/campaigns/" + campaignId)
        ).json();
        return state.combat.index;
      }, data.id),
    )
    .not.toBe(firstIndex);
  // Uma escolha da Visual Novel altera os recursos e a cena para o segundo navegador.
  await master
    .locator(".scene-list button")
    .filter({ hasText: "Escritório do empresário" })
    .click();
  await player.locator(".novel").waitFor();
  await player.getByRole("button", { name: /Aceitar a oferta/ }).click();
  await expect(player.locator(".novel-caption h2")).toHaveText(
    "Retorno ao Inferno",
  );
  const consequence = await player.evaluate(async () => {
    const cs = await (await fetch("/api/campaigns")).json();
    return (await fetch(`/api/campaigns/${cs[0].id}`)).json();
  });
  const pc = consequence.characters.find(
    (c: any) => c.name === "Cassandra de teste",
  );
  expect(pc.fame).toBe(3);
  expect(pc.sanity).toBe(8);
  expect(consequence.trust).toBe(4);
  await a.close();
  await b.close();
});
