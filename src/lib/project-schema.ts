import { z } from "zod";
import type { ProjectLocale } from "@/lib/types";

const validationCopy = {
  ru: {
    labels: { letter: "Письмо", title: "Название", sender: "Имя отправителя", recipient: "Имя получателя", intro: "Вступление", button: "Текст кнопки", hint: "Подсказка", final: "Финальное сообщение" },
    min: (label: string, value: number) => `${label}: минимум ${value}`,
    max: (label: string, value: number) => `${label}: максимум ${value}`,
    enabled: "Включите хотя бы одно письмо",
    order: "Порядок писем должен быть уникальным",
  },
  uk: {
    labels: { letter: "Лист", title: "Назва", sender: "Ім’я відправника", recipient: "Ім’я отримувача", intro: "Вступ", button: "Текст кнопки", hint: "Підказка", final: "Фінальне повідомлення" },
    min: (label: string, value: number) => `${label}: мінімум ${value}`,
    max: (label: string, value: number) => `${label}: максимум ${value}`,
    enabled: "Увімкніть хоча б один лист",
    order: "Порядок листів має бути унікальним",
  },
  en: {
    labels: { letter: "Letter", title: "Title", sender: "Sender name", recipient: "Recipient name", intro: "Introduction", button: "Button text", hint: "Hint", final: "Final message" },
    min: (label: string, value: number) => `${label}: minimum ${value}`,
    max: (label: string, value: number) => `${label}: maximum ${value}`,
    enabled: "Enable at least one letter",
    order: "Letter order must be unique",
  },
} as const;

function createLocalizedSchemas(locale: ProjectLocale) {
  const copy = validationCopy[locale];
  const trimmed = (label: string, min: number, max: number) =>
    z.string().trim().min(min, copy.min(label, min)).max(max, copy.max(label, max));
  const letter = z.object({
    id: z.string().uuid(),
    title: z.string().trim().max(80, copy.max(copy.labels.title, 80)).optional(),
    message: trimmed(copy.labels.letter, 1, 1200),
    order: z.number().int().min(0).max(29),
    enabled: z.boolean(),
  });

  return z.object({
    locale: z.literal(locale),
    title: trimmed(copy.labels.title, 1, 80),
    senderName: trimmed(copy.labels.sender, 1, 60),
    recipientName: trimmed(copy.labels.recipient, 1, 60),
    introText: trimmed(copy.labels.intro, 2, 280),
    buttonText: trimmed(copy.labels.button, 1, 40),
    shakeHint: trimmed(copy.labels.hint, 2, 80),
    finalMessage: trimmed(copy.labels.final, 2, 600),
    letters: z.array(letter).min(1).max(30),
  })
  .superRefine((data, context) => {
    if (!data.letters.some((letter) => letter.enabled)) {
      context.addIssue({ code: "custom", path: ["letters"], message: copy.enabled });
    }
    const orders = new Set(data.letters.map((letter) => letter.order));
    if (orders.size !== data.letters.length) {
      context.addIssue({ code: "custom", path: ["letters"], message: copy.order });
    }
  });
}

const localizedProjectSchemas = {
  ru: createLocalizedSchemas("ru"),
  uk: createLocalizedSchemas("uk"),
  en: createLocalizedSchemas("en"),
};

export const projectSchema = z.discriminatedUnion("locale", [localizedProjectSchemas.ru, localizedProjectSchemas.uk, localizedProjectSchemas.en]);

export const patchProjectSchema = z.discriminatedUnion("locale", [
  localizedProjectSchemas.ru.safeExtend({ updatedAt: z.string().datetime() }),
  localizedProjectSchemas.uk.safeExtend({ updatedAt: z.string().datetime() }),
  localizedProjectSchemas.en.safeExtend({ updatedAt: z.string().datetime() }),
]);

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const defaultsByLocale = {
  ru: {
    title: "Письма для тебя",
    senderName: "Саша",
    recipientName: "Юля",
    introText: "Кажется, все мои письма тебе уже не помещаются в почтовый ящик…",
    buttonText: "Посмотреть",
    shakeHint: "Потряси телефон",
    finalMessage: "Кажется, это были все письма… Хотя нет. Для тебя у меня они никогда не закончатся.",
    letters: [
      "Ты делаешь обычные дни особенными.",
      "Рядом с тобой даже тишина становится уютной.",
      "Спасибо, что ты есть в моей жизни.",
    ],
  },
  uk: {
    title: "Листи для тебе",
    senderName: "Саша",
    recipientName: "Юля",
    introText: "Здається, усі мої листи до тебе вже не вміщаються в поштову скриньку…",
    buttonText: "Подивитися",
    shakeHint: "Струси телефон",
    finalMessage: "Здається, це були всі листи… Хоча ні. Для тебе вони в мене ніколи не закінчаться.",
    letters: [
      "Ти робиш звичайні дні особливими.",
      "Поруч із тобою навіть тиша стає затишною.",
      "Дякую, що ти є в моєму житті.",
    ],
  },
  en: {
    title: "Letters for you",
    senderName: "Alex",
    recipientName: "Julia",
    introText: "It seems all my letters to you no longer fit in the mailbox…",
    buttonText: "Take a look",
    shakeHint: "Shake your phone",
    finalMessage: "I think those were all the letters… Then again, for you, I will never run out of them.",
    letters: [
      "You make ordinary days feel special.",
      "Even silence feels warm when I am with you.",
      "Thank you for being part of my life.",
    ],
  },
} as const;

export function createDefaultProject(locale: "ru" | "uk" | "en" = "ru"): ProjectFormValues {
  const source = defaultsByLocale[locale];
  return {
    locale,
    title: source.title,
    senderName: source.senderName,
    recipientName: source.recipientName,
    introText: source.introText,
    buttonText: source.buttonText,
    shakeHint: source.shakeHint,
    finalMessage: source.finalMessage,
    letters: source.letters.map((message, order) => ({
      id: crypto.randomUUID(),
      title: "",
      message,
      order,
      enabled: true,
    })),
  };
}
