import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end tests against the production build (`npm run build` first).
 * Expected values were read from the photographed manufacturer pages noted in the comments.
 */

async function open(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
}

async function configureActros963(page: Page) {
  await page.getByTestId("family-actros").click();
  await page.getByTestId("factory-type").selectOption("963");
  // Axle 1: 385/65 R 22,5 LI 160 single – 01F page 3, 8 000 kg → 8,0 bar
  await page.getByTestId("tire-size-1").selectOption("385/65 R 22,5");
  await page.getByTestId("mounting-1").selectOption("single");
  await page.getByTestId("load-index-1").selectOption("160");
  await page.getByTestId("axle-load-1").fill("8000");
  // Axle 2: 315/80 R 22,5 156/150 twin – 01F page 4, 10 300 kg → 6,25 bar
  await page.getByTestId("tire-size-2").selectOption("315/80 R 22,5");
  await page.getByTestId("mounting-2").selectOption("twin");
  await page.getByTestId("load-index-2").selectOption("156/150");
  await page.getByTestId("axle-load-2").fill("10300");
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!sessionStorage.getItem("e2e-init")) {
      localStorage.clear();
      sessionStorage.setItem("e2e-init", "1");
    }
  });
});

test("selection workflow shows verified pressures per axle with source", async ({ page }) => {
  await open(page);
  await configureActros963(page);

  await expect(page.getByTestId("pressure-1")).toContainText("8,0");
  await expect(page.getByTestId("source-1")).toContainText("AP40.15-W-4060-01F, Seite 3");
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
  await expect(page.getByTestId("source-2")).toContainText("AP40.15-W-4060-01F, Seite 4");
  await expect(page.getByTestId("results-summary")).toContainText("2 von 2 Achsen");
  await expect(page.getByText("Reifendruck bei kalten Reifen prüfen.").first()).toBeVisible();

  // The primary calculator must not scroll horizontally.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("unavailable results are shown per axle without blocking other axles", async ({ page }) => {
  await open(page);
  await configureActros963(page);
  await page.getByTestId("axle-load-2").fill("10350"); // between documented columns
  await expect(page.getByTestId("result-card-2")).toHaveAttribute("data-status", "unavailable");
  await expect(page.getByTestId("no-value-2")).toHaveText("Für diese Kombination liegt kein verifizierter Tabellenwert vor.");
  await expect(page.getByTestId("result-card-2")).toContainText("10.300 kg → 6,25 bar");
  await expect(page.getByTestId("result-card-2")).toContainText("10.400 kg → 6,25 bar"); // 01F p5
  // Axle 1 is unaffected
  await expect(page.getByTestId("pressure-1")).toContainText("8,0");
});

test("unverified (glare-obscured) table cells are refused", async ({ page }) => {
  await open(page);
  await page.getByTestId("family-actros").click();
  await page.getByTestId("factory-type").selectOption("963");
  await page.getByTestId("tire-size-1").selectOption("315/70 R 22,5");
  await page.getByTestId("mounting-1").selectOption("single");
  await page.getByTestId("load-index-1").selectOption("156");
  await page.getByTestId("axle-load-1").fill("4500");
  await expect(page.getByTestId("result-card-1")).toContainText("Tabellenwert nicht verifiziert.");
  await expect(page.getByTestId("pressure-1")).toHaveCount(0);
});

test("source reference and original table values can be inspected", async ({ page }) => {
  await open(page);
  await configureActros963(page);
  const card = page.getByTestId("result-card-1");
  await card.getByText("Originaltabellenwerte anzeigen").click();
  const rows = card.getByTestId("source-rows");
  await expect(rows).toBeVisible();
  await expect(rows).toContainText("385/65 R 22,5");
  await expect(rows).toContainText("AP40.15-W-4060-01F, Seite 3");
  await expect(rows.locator("td.ring-ok")).toHaveText("8,0");
});

test("form validation for factory type and axle load", async ({ page }) => {
  await open(page);
  await page.getByTestId("family-advanced").click();
  await page.getByTestId("exact-type").fill("12");
  await expect(page.getByText("Kein gültiges Baumuster.", { exact: false })).toBeVisible();
  await page.getByTestId("exact-type").fill("956.264");
  await expect(page.getByText("Für dieses Baumuster liegt keine Reifendrucktabelle vor.")).toBeVisible();
  await page.getByTestId("exact-type").fill("W1T96700910785698");
  await expect(page.getByText("Aus FIN abgeleitet: Baumuster 967.009", { exact: false })).toBeVisible();
  await expect(page.getByTestId("applicable-docs")).toContainText("AP40.15-W-4060-01D");

  await page.getByTestId("tire-size-1").selectOption("245/70 R 17,5");
  await page.getByTestId("axle-load-1").fill("12a");
  await expect(page.getByText("Bitte eine ganze Zahl in kg eingeben.")).toBeVisible();
  await expect(page.getByTestId("result-card-1")).toHaveAttribute("data-status", "incomplete");
});

test("multi-axle: add, copy tyre configuration and remove axles", async ({ page }) => {
  await open(page);
  await configureActros963(page);
  await page.getByTestId("add-axle").click();
  await expect(page.getByTestId("axle-card-3")).toBeVisible();
  await expect(page.getByTestId("role-3")).toHaveValue("trailing");

  await page.getByTestId("copy-axle-2").selectOption({ label: "Achse 3" });
  await expect(page.getByTestId("tire-size-3")).toHaveValue("315/80 R 22,5");
  await expect(page.getByTestId("mounting-3")).toHaveValue("twin");
  await expect(page.getByTestId("load-index-3")).toHaveValue("156/150");
  // Axle load is not copied – each axle needs its own measured load.
  await expect(page.getByTestId("axle-load-3")).toHaveValue("");
  await page.getByTestId("axle-load-3").fill("7200");
  await expect(page.getByTestId("pressure-3")).toContainText("5,0");

  await page.getByTestId("remove-axle-3").click();
  await expect(page.getByTestId("axle-card-3")).toHaveCount(0);
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
});

test("17,5″ front/rear tables are kept separate", async ({ page }) => {
  await open(page);
  await page.getByTestId("family-atego").click();
  await page.getByTestId("factory-type").selectOption("967");
  // Axle 1 (steering) single → VA: 245/70 R 17,5 LI 136, 4 400 kg → 8,3 bar (01C)
  await page.getByTestId("tire-size-1").selectOption("245/70 R 17,5");
  await page.getByTestId("mounting-1").selectOption("single");
  await expect(page.getByTestId("table-axle-1")).toHaveValue("VA");
  await page.getByTestId("axle-load-1").fill("4400");
  await expect(page.getByTestId("pressure-1")).toContainText("8,3");
  // Axle 2 (drive) twin → HA: 6 200 kg → 6,2 bar (01C)
  await page.getByTestId("tire-size-2").selectOption("245/70 R 17,5");
  await page.getByTestId("mounting-2").selectOption("twin");
  await expect(page.getByTestId("table-axle-2")).toHaveValue("HA");
  await page.getByTestId("axle-load-2").fill("6200");
  await expect(page.getByTestId("pressure-2")).toContainText("6,2");
});

test("language switch to English and back", async ({ page }) => {
  await open(page);
  await configureActros963(page);
  await page.getByTestId("lang-en").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Vehicle", exact: true })).toBeVisible();
  await expect(page.getByTestId("pressure-1")).toContainText("8.0");
  await expect(page.getByTestId("source-1")).toContainText("AP40.15-W-4060-01F, page 3");
  await expect(page.getByText("Check tyre pressure when tyres are cold.").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByTestId("lang-de").click();
  await expect(page.getByRole("heading", { name: "Fahrzeug", exact: true })).toBeVisible();
});

test("configuration persists locally and can be shared", async ({ page, context, browserName }, testInfo) => {
  await open(page);
  await configureActros963(page);
  await page.reload();
  await expect(page.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");

  await page.getByTestId("save-vehicle").click();
  await expect(page.getByTestId("saved-list")).toContainText("Fahrzeug 1");

  test.skip(testInfo.project.name !== "desktop" || browserName !== "chromium", "clipboard check on desktop only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("share-link").click();
  await expect(page.getByTestId("action-status")).toContainText("Link in die Zwischenablage kopiert.");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("cfg=");

  const fresh = await context.newPage();
  await fresh.goto(link);
  await expect(fresh.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
  await expect(fresh.getByTestId("pressure-1")).toContainText("8,0");
  await expect(fresh.getByTestId("pressure-2")).toContainText("6,25");
});
