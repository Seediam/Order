import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir(".runtime", { recursive: true });
await page.goto(process.env.ORDER_TEST_URL || "http://127.0.0.1:3100");
await page.screenshot({ path: ".runtime/intro.png" });
await page.getByRole("button", { name: "Pular introdução" }).click();
await page.screenshot({ path: ".runtime/auth.png" });
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.resolve(".runtime/e2e/order.db").replaceAll("\\", "/")}`,
    },
  },
});
try {
  const user = await prisma.user.findFirst({
    where: { role: "MASTER" },
    orderBy: { createdAt: "desc" },
    select: { username: true },
  });
  console.log(JSON.stringify({ qaAccountFound: !!user }));
  if (user) {
    const login = await page.request.post(
      new URL("/api/auth/login", page.url()).href,
      { data: { username: user.username, password: "TesteSeguro123" } },
    );
    if (!login.ok())
      throw new Error(
        "Falha de login QA: " + login.status() + " " + (await login.text()),
      );
    if (login.ok()) {
      await page.goto(process.env.ORDER_TEST_URL || "http://127.0.0.1:3100");
      await page.locator(".dashboard").waitFor();
      await page.screenshot({ path: ".runtime/dashboard.png", fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: ".runtime/dashboard-mobile.png",
        fullPage: true,
      });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw new Error("Overflow horizontal no Dashboard mobile");
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.locator(".campaign-enter").first().click();
      await page.locator(".tabletop").waitFor();
      await page
        .locator(".scene-list button")
        .filter({ hasText: "Recepção · Planta da fábrica" })
        .click();
      await page.locator(".board-container canvas").first().waitFor();
      await page.screenshot({ path: ".runtime/tabletop-desktop.png" });
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.screenshot({ path: ".runtime/tabletop-large.png" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({ path: ".runtime/tabletop-mobile.png" });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw new Error("Overflow horizontal na mesa mobile");
    }
  }
} finally {
  await prisma.$disconnect();
}
console.log(JSON.stringify({ title: await page.title(), errors }));
await browser.close();
