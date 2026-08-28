// End-to-end flows against the seeded demo database. The webServer command reseeds
// before starting, so these tests are deterministic and re-runnable.
import { expect, test } from "@playwright/test";

const PASSWORD = "demo1234";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/dashboard|admin|seller/);
}

test.describe("public marketplace", () => {
  test("homepage shows hero and live listings", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Sponsor anything/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sponsor Aaron at a \$200/ })).toBeVisible();
  });

  test("browse filters by search term", async ({ page }) => {
    await page.goto("/browse?q=poker");
    await expect(page.getByRole("link", { name: /Poker Tournament/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Dog-Walking/ })).toHaveCount(0);
  });

  test("poker listing shows all three packages with correct pricing", async ({ page }) => {
    await page.goto("/listings/aaron-denver-poker-tournament");
    await expect(page.getByRole("heading", { name: "Basic Placement" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Placement + Content" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Exclusive Activation" })).toBeVisible();
    await expect(page.getByText("$787.50")).toBeVisible(); // 5% fee on $750
    await expect(page.getByText("No share of winnings", { exact: false }).first()).toBeVisible();
  });

  test("unauthenticated dashboard access redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/login/);
  });
});

test.describe("buyer booking flow", () => {
  test("buyer books the poker Basic Placement package end-to-end", async ({ page }) => {
    await login(page, "buyer@sponsorthis.demo");
    await page.goto("/listings/aaron-denver-poker-tournament");
    await page
      .locator("div")
      .filter({ has: page.getByRole("heading", { name: "Basic Placement" }) })
      .getByRole("button", { name: "Sponsor this" })
      .first()
      .click();
    await page.waitForURL(/checkout/);
    await expect(page.getByText("Order summary")).toBeVisible();
    await expect(page.getByText("$472.50").first()).toBeVisible(); // $450 + 5%
    await page.getByLabel(/I accept the campaign agreement/).check();
    await page.getByRole("button", { name: /Pay \$472\.50/ }).click();
    await page.waitForURL(/campaigns\/.+booked=1/);
    await expect(page.getByText("Booked. Payment captured", { exact: false })).toBeVisible();
    await expect(page.getByText("booked", { exact: true }).first()).toBeVisible();
  });
});

test.describe("admin console", () => {
  test("admin sees the ops console and moderation queue", async ({ page }) => {
    await login(page, "admin@sponsorthis.demo");
    await expect(page.getByText("Marketplace overview")).toBeVisible();
    await page.goto("/admin/moderation");
    await expect(page.getByText(/14er Summit Attempt/)).toBeVisible();
  });

  test("buyer cannot open the admin console", async ({ page }) => {
    await login(page, "agency@sponsorthis.demo");
    await page.goto("/admin");
    await page.waitForURL(/dashboard/);
  });
});
