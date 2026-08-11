import { z } from "zod";

const trimmed = (label: string, min: number, max: number) =>
  z.string().trim().min(min, `${label}: минимум ${min}`).max(max, `${label}: максимум ${max}`);

export const letterSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(80).optional(),
  message: trimmed("Письмо", 1, 1200),
  order: z.number().int().min(0).max(29),
  enabled: z.boolean(),
});

export const projectSchema = z
  .object({
    locale: z.enum(["ru", "uk", "en"]),
    title: trimmed("Название", 1, 80),
    senderName: trimmed("Имя отправителя", 1, 60),
    recipientName: trimmed("Имя получателя", 1, 60),
    introText: trimmed("Вступление", 2, 280),
    buttonText: trimmed("Текст кнопки", 1, 40),
    shakeHint: trimmed("Подсказка", 2, 80),
    finalMessage: trimmed("Финальное сообщение", 2, 600),
    letters: z.array(letterSchema).min(1).max(30),
  })
  .superRefine((data, context) => {
    if (!data.letters.some((letter) => letter.enabled)) {
      context.addIssue({
        code: "custom",
        path: ["letters"],
        message: "Включите хотя бы одно письмо",
      });
    }
    const orders = new Set(data.letters.map((letter) => letter.order));
    if (orders.size !== data.letters.length) {
      context.addIssue({ code: "custom", path: ["letters"], message: "Порядок писем должен быть уникальным" });
    }
  });

export const patchProjectSchema = projectSchema.safeExtend({
  updatedAt: z.string().datetime(),
});

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
