import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end tests against the production build (`npm run build` first).
 * Expected values were read from the photographed manufacturer pages noted in the comments.
 */

async function open(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
}

/** Two-axle truck: no model selection – the truck tables apply. */
async function configureTwoAxles(page: Page) {
  // Axle 1: 385/65 R 22,5 LI 160 single – 01F page 3, 8 000 kg → 8,0 bar
  await page.getByTestId("tire-size-1").selectOption("385/65 R 22,5");
  await page.getByTestId("load-index-1").selectOption("160");
  await page.getByTestId("axle-load-1").fill("8000");
  // Axle 2: 315/80 R 22,5 156/150 twin – 01F page 4, 10 300 kg → 6,25 bar
  await page.getByTestId("tire-size-2").selectOption("315/80 R 22,5");
  await page.getByTestId("mounting-2-twin").click();
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

test("search: size → load index → table, axle load optional", async ({ page }) => {
  await open(page);
  await page.getByTestId("size-search").fill("315/80");
  await page.getByTestId("size-suggestions").getByRole("button", { name: "315/80 R 22,5" }).click();
  const options = page.getByTestId("load-index-options");
  await expect(options.getByTestId("li-option")).toHaveCount(4);
  await options.getByRole("button", { name: "156/150" }).click();

  const result = page.getByTestId("series-result");
  // 01F p.3–5, twin 156/150: 5,0 bar (4 600 kg) … 8,5 bar (13 400 kg)
  await expect(result.getByTestId("pressure-range")).toHaveText("5,0 – 8,5 bar");
  const ladder = result.getByTestId("pressure-ladder");
  await expect(ladder).toContainText("4.600 … 8.700");
  await expect(ladder).toContainText("13.400");

  await result.getByTestId("search-axle-load").fill("10300");
  await expect(result.getByTestId("search-exact")).toContainText("6,25");
  await expect(result.getByTestId("search-exact")).toContainText("AP40.15-W-4060-01F, Seite 4");
  await expect(ladder.locator("tr[data-highlight=true]")).toContainText("6,25");

  await result.getByTestId("search-axle-load").fill("10350");
  await expect(result.getByTestId("search-unavailable")).toContainText("Für diese Kombination liegt kein verifizierter Tabellenwert vor.");
});

test("search: full sidewall marking and unverified cells", async ({ page }) => {
  await open(page);
  await page.getByTestId("size-search").fill("385/65 R22.5 160");
  await page.getByTestId("size-search").press("Enter");
  // only one row matches LI 160 → selected automatically
  await expect(page.getByTestId("series-result")).toContainText("385/65 R 22,5");
  await expect(page.getByTestId("pressure-range")).toHaveText("5,0 – 9,0 bar");

  await page.getByTestId("size-search").fill("315/70 R22.5");
  await page.getByTestId("size-search").press("Enter");
  await page.getByTestId("load-index-options").getByRole("button", { name: "156" }).first().click();
  await expect(page.getByTestId("pressure-ladder")).toContainText("nicht verifiziert");
  await page.getByTestId("search-axle-load").fill("4500");
  await expect(page.getByTestId("search-unavailable")).toContainText("Tabellenwert nicht verifiziert.");
});

test("search: Vario sizes are labelled", async ({ page }) => {
  await open(page);
  await page.getByTestId("size-search").fill("185");
  await expect(page.getByTestId("size-suggestions")).toContainText("nur Vario");
});

test("vehicle diagram: verified pressures per axle with source, no model needed", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  await expect(page.getByTestId("pressure-1")).toContainText("8,0");
  await expect(page.getByTestId("source-1")).toContainText("AP40.15-W-4060-01F, Seite 3");
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
  await expect(page.getByTestId("source-2")).toContainText("AP40.15-W-4060-01F, Seite 4");
  await expect(page.getByTestId("results-summary")).toContainText("2 von 2 Achsen");
  await expect(page.getByTestId("truck-diagram")).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("unavailable results are shown per axle without blocking other axles", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  await page.getByTestId("axle-load-2").fill("10350");
  await expect(page.getByTestId("result-card-2")).toHaveAttribute("data-status", "unavailable");
  await expect(page.getByTestId("no-value-2")).toHaveText("Für diese Kombination liegt kein verifizierter Tabellenwert vor.");
  await expect(page.getByTestId("result-card-2")).toContainText("10.300 kg → 6,25 bar");
  await expect(page.getByTestId("result-card-2")).toContainText("10.400 kg → 6,25 bar"); // 01F p5
  await expect(page.getByTestId("pressure-1")).toContainText("8,0");
});

test("source reference and original table values can be inspected", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  const card = page.getByTestId("result-card-1");
  await card.getByText("Originaltabellenwerte anzeigen").click();
  const rows = card.getByTestId("source-rows");
  await expect(rows).toBeVisible();
  await expect(rows).toContainText("385/65 R 22,5");
  await expect(rows).toContainText("AP40.15-W-4060-01F, Seite 3");
  await expect(rows.locator("td.ring-ok")).toHaveText("8,0");
});

test("axle load validation", async ({ page }) => {
  await open(page);
  await page.getByTestId("tire-size-1").selectOption("245/70 R 17,5");
  await page.getByTestId("axle-load-1").fill("12a");
  await expect(page.getByText("Bitte eine ganze Zahl in kg eingeben.").first()).toBeVisible();
  await expect(page.getByTestId("result-card-1")).toHaveAttribute("data-status", "incomplete");
});

test("multi-axle: add, copy tyre configuration and remove axles", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  await page.getByTestId("add-axle").click();
  await expect(page.getByTestId("axle-card-3")).toBeVisible();
  await expect(page.getByTestId("role-3")).toHaveValue("trailing");

  await page.getByTestId("copy-axle-2").selectOption({ label: "Achse 3" });
  await expect(page.getByTestId("tire-size-3")).toHaveValue("315/80 R 22,5");
  await expect(page.getByTestId("mounting-3-twin").locator("input")).toBeChecked();
  await expect(page.getByTestId("load-index-3")).toHaveValue("156/150");
  await expect(page.getByTestId("axle-load-3")).toHaveValue("");
  await page.getByTestId("axle-load-3").fill("7200");
  await expect(page.getByTestId("pressure-3")).toContainText("5,0");

  await page.getByTestId("remove-axle-3").click();
  await expect(page.getByTestId("axle-card-3")).toHaveCount(0);
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
});

test("17,5″ front/rear tables are kept separate", async ({ page }) => {
  await open(page);
  // Axle 1 (steering) single → VA: 245/70 R 17,5 LI 136, 4 400 kg → 8,3 bar (01C)
  await page.getByTestId("tire-size-1").selectOption("245/70 R 17,5");
  await expect(page.getByTestId("mounting-1-single").locator("input")).toBeChecked();
  await expect(page.getByTestId("table-axle-1")).toHaveCount(0); // only VA exists for single → no choice needed
  await page.getByTestId("axle-load-1").fill("4400");
  await expect(page.getByTestId("pressure-1")).toContainText("8,3");
  // Axle 2 (drive) twin → HA: 6 200 kg → 6,2 bar (01C)
  await page.getByTestId("tire-size-2").selectOption("245/70 R 17,5");
  await page.getByTestId("mounting-2-twin").click();
  await page.getByTestId("axle-load-2").fill("6200");
  await expect(page.getByTestId("pressure-2")).toContainText("6,2");
});

test("Vario tables only when selected", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("tire-size-1").locator("option", { hasText: "185 R 14 C" })).toHaveCount(0);
  await page.getByTestId("group-vario").click();
  await page.getByTestId("application-ambulance").click();
  // D-01C ambulance rear axle 215/75 R 16 C, 2 800 kg → 3,0 bar
  await page.getByTestId("tire-size-2").selectOption("215/75 R 16 C");
  await page.getByTestId("axle-load-2").fill("2800");
  await expect(page.getByTestId("pressure-2")).toContainText("3,0");
});

test("language switch to English and back", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  await page.getByTestId("lang-en").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Tyre pressure by tyre size" })).toBeVisible();
  await expect(page.getByTestId("pressure-1")).toContainText("8.0");
  await expect(page.getByTestId("source-1")).toContainText("AP40.15-W-4060-01F, page 3");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByTestId("lang-de").click();
  await expect(page.getByRole("heading", { name: "Reifendruck nach Reifengröße" })).toBeVisible();
});

test("Russian language", async ({ page }) => {
  await open(page);
  await configureTwoAxles(page);
  await page.getByTestId("lang-ru").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { name: "Давление по размеру шины" })).toBeVisible();
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
  await expect(page.getByTestId("source-2")).toContainText("AP40.15-W-4060-01F, стр. 4");
  await expect(page.getByTestId("result-card-2")).toContainText("кг");
});

test("quick entry from the tyre sidewall marking in the diagram", async ({ page }) => {
  await open(page);
  await page.getByTestId("tire-code-2").fill("315/80 R22.5 156/150 L");
  await expect(page.getByTestId("tire-size-2")).toHaveValue("315/80 R 22,5");
  await page.getByTestId("mounting-2-twin").click();
  await expect(page.getByTestId("load-index-2")).toHaveValue("156/150");
  await page.getByTestId("axle-load-2").fill("10300");
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");
  await page.getByTestId("tire-code-1").fill("999/99 R22.5 160");
  await expect(page.getByTestId("axle-card-1")).toContainText("ist nicht in diesen Tabellen");
});

test("axle layout templates and same tyres as previous axle", async ({ page }) => {
  await open(page);
  await page.getByTestId("layout-6x2-trailing").click();
  await expect(page.getByTestId("role-3")).toHaveValue("trailing");
  await page.getByTestId("tire-size-2").selectOption("315/70 R 22,5");
  await page.getByTestId("mounting-2-twin").click();
  await page.getByTestId("load-index-2").selectOption("150");
  await page.getByTestId("same-as-previous-3").click();
  await expect(page.getByTestId("tire-size-3")).toHaveValue("315/70 R 22,5");
  await expect(page.getByTestId("load-index-3")).toHaveValue("150");
  await page.getByTestId("layout-8x4").click();
  await expect(page.getByTestId("role-2")).toHaveValue("steering");
  await page.getByTestId("layout-4x2").click();
  await expect(page.getByTestId("axle-card-3")).toHaveCount(0);
});

test("configuration persists, saved vehicles load from the top, share link", async ({ page, context }, testInfo) => {
  await open(page);
  await configureTwoAxles(page);
  await page.reload();
  await expect(page.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");

  await page.getByTestId("save-vehicle").click();
  await page.getByTestId("reset").click();
  await expect(page.getByTestId("tire-size-1")).toHaveValue("");
  await page.getByTestId("quick-load").getByRole("button", { name: "Fahrzeug 1" }).click();
  await expect(page.getByTestId("pressure-2")).toContainText("6,25");

  test.skip(testInfo.project.name !== "desktop", "clipboard check on desktop only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("share-link").click();
  await expect(page.getByTestId("action-status")).toContainText("Link in die Zwischenablage kopiert.");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const fresh = await context.newPage();
  await fresh.goto(link);
  await expect(fresh.getByTestId("calculator")).toHaveAttribute("data-hydrated", "true");
  await expect(fresh.getByTestId("pressure-1")).toContainText("8,0");
  await expect(fresh.getByTestId("pressure-2")).toContainText("6,25");
});
