import { expect, test } from "@playwright/test";

test("builder keeps the only save action at the bottom", async ({ page }) => {
  await page.goto("/create");

  await expect(page.getByRole("button", { name: "Сохранить", exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Копировать ссылку" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Открыть" })).toHaveCount(0);
  await expect(page.locator("header").getByLabel("Язык истории")).toHaveValue("ru");
  await expect(page.locator("form").getByLabel("Язык истории")).toHaveCount(0);
});

test("builder explains why a required field cannot be saved", async ({ page }) => {
  await page.goto("/create");
  await expect(page.locator("main[data-hydrated='true']")).toBeVisible();
  const title = page.getByLabel("Название проекта");
  await title.fill("");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();

  await expect(page.getByText("Название: минимум 1")).toBeVisible();
  await expect(title).toHaveAttribute("aria-invalid", "true");
});

test("builder preview releases and opens exactly one letter", async ({ page }, testInfo) => {
  await page.goto("/create");
  await expect(page.getByLabel("Название проекта")).toHaveValue("Письма для тебя");
  await expect(page.getByLabel("От кого")).toHaveValue("Саша");
  await expect(page.getByLabel("Для кого")).toHaveValue("Юля");

  if (testInfo.project.name === "mobile") await page.getByRole("button", { name: "Предпросмотр" }).click();
  await page.getByRole("button", { name: "Выпустить письмо" }).click();
  await expect(page.getByRole("button", { name: "Открой письмо" })).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole("button", { name: "Открой письмо" })).toHaveCount(1);
  await page.getByRole("button", { name: "Открой письмо" }).click();
  await expect(page.locator(".letter-overlay[role='dialog']")).toContainText("Ты делаешь обычные дни особенными.");
});

test("mobile builder exposes a full-screen preview", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only behavior");
  await page.goto("/create");
  await page.getByRole("button", { name: "Предпросмотр" }).click();
  await expect(page.getByRole("button", { name: "Закрыть предпросмотр" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Нажми на ящик" }).last()).toBeVisible();
});

test("desktop preview keeps the final message inside the phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Desktop phone preview regression");
  await page.goto("/create");

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Выпустить письмо" }).click();
    await page.getByRole("button", { name: "Открой письмо" }).click({ timeout: 4000 });
    await page.getByRole("button", { name: "Закрыть письмо" }).last().click();
    await page.waitForTimeout(250);
  }

  const message = page.locator(".phone-preview .final-message");
  await expect(message).toBeVisible();
  expect(await message.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeLessThanOrEqual(32);
  await expect(page.locator(".phone-preview .final-restart")).toBeVisible();
});
