import { test, expect } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

async function serverReachable(): Promise<boolean> {
  try {
    const res = await fetch(baseURL, {
      method: "GET",
      signal: AbortSignal.timeout(2500),
    });
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

test.describe("FairPrice AI smoke", () => {
  test.beforeAll(async () => {
    const up = await serverReachable();
    if (!up) {
      test.skip(true, `No server at ${baseURL} — start with npm run dev`);
    }
  });

  test("home page loads", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.ok() || (res?.status() ?? 500) < 500).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/FairPrice/i).first()).toBeVisible();
  });

  test("marketplace page loads", async ({ page }) => {
    const res = await page.goto("/marketplace");
    expect(res?.ok() || (res?.status() ?? 500) < 500).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });
});
