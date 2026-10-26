import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const ADMIN = { email: "admin@e2e.test", password: "e2e-password-123" };

async function adminApi(request: APIRequestContext) {
  await request.post("/api/admin/login", { data: ADMIN });
  return request;
}

async function openApplications(request: APIRequestContext) {
  const s = await (await request.get("/api/admin/settings")).json();
  await request.put("/api/admin/settings", { data: { ...s, applications_open: true, applications_close: "31 January 2027" } });
}

async function typeCode(page: Page, code: string) {
  await page.locator(".cm-content").click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  await page.keyboard.insertText(code);
}

test.describe.serial("Akada Labs", () => {
  let token = "";

  test("someone applies through the form", async ({ page, request }) => {
    await openApplications(await adminApi(request));
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Learn AI by/ })).toBeVisible();
    await page.getByRole("link", { name: "Apply free" }).first().click();
    await page.getByLabel("Full name").fill("Ada Obi");
    await page.getByLabel("Email").fill("ada@example.com");
    await page.getByLabel("WhatsApp number").fill("0803 123 4567");
    await page.getByLabel("City").fill("Enugu");
    await page.getByText("Yes, I'm 18 or older").click();
    await page.getByText("University student").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByText("Own laptop").click();
    await page.getByText("Yes, every week").click();
    await page.getByText("2–4 hours").click();
    await page.getByText("Never", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("What problem would you like to solve with AI?").fill("Traders in my market can't see when food prices will rise.");
    await page.getByText("Yes, I commit").click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Please agree to the privacy notice")).toBeVisible();
    await page.locator("#f-consent").check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Send application" }).click();
    await expect(page.getByRole("heading", { name: /Application sent/ })).toBeVisible();
  });

  test("an admin scores and accepts the application", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: /overview/ })).toBeVisible();
    await page.getByRole("link", { name: "Applications" }).first().click();
    await page.getByText("Ada Obi").first().click();
    const panel = page.getByRole("dialog");
    await panel.getByRole("button", { name: "3", exact: true }).click();
    await expect(panel.getByText("10/10")).toBeVisible();
    await panel.getByRole("button", { name: "Accepted", exact: true }).click();
    const link = panel.locator("code", { hasText: "/learn/" });
    await expect(link).toBeVisible();
    token = (await link.innerText()).split("/learn/")[1].trim();
    expect(token.length).toBeGreaterThan(10);
  });

  test("the learner passes a step of the Python lab", async ({ page }) => {
    await page.goto(`/learn/${token}`);
    await expect(page.getByRole("heading", { name: /Ada/ })).toBeVisible();
    await page.goto(`/learn/${token}/lab/2`);
    await expect(page.getByText("Python ready")).toBeVisible({ timeout: 60_000 });
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status")).toContainText("Nothing was printed");
    await typeCode(page, 'print("Hello from Enugu")');
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status")).toContainText("Step passed");
    await expect(page.getByRole("region", { name: "Output" })).toContainText("Hello from Enugu");
  });

  test("the learner makes an AI call through the server", async ({ page }) => {
    await page.goto(`/learn/${token}/lab/7`);
    await expect(page.getByText("Python ready")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/AI calls left/)).toBeVisible();
    await typeCode(page, 'reply = ask("Explain what an API is, in one sentence.")\nprint(reply)');
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status")).toContainText("Step passed");
    await expect(page.getByRole("region", { name: "Output" })).toContainText("Practice reply");
  });

  test("on a phone the lab becomes tabs", async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`/learn/${token}/lab/2`);
    await expect(page.getByRole("tab", { name: "Instructions" })).toBeVisible();
    await page.getByRole("tab", { name: "Code" }).click();
    await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);
    await page.close();
  });
});
