export type ProjectLocale = "ru" | "uk" | "en";

export type LoveLetterInput = {
  id: string;
  title?: string;
  message: string;
  order: number;
  enabled: boolean;
};

export type LoveProjectInput = {
  locale: ProjectLocale;
  title: string;
  senderName: string;
  recipientName: string;
  introText: string;
  buttonText: string;
  shakeHint: string;
  finalMessage: string;
  letters: LoveLetterInput[];
};

export type PublicLoveProject = LoveProjectInput & {
  id: string;
  slug: string;
  expiresAt: string;
};

export type EditableLoveProject = PublicLoveProject & {
  updatedAt: string;
};

export type MotionCapability = "unknown" | "granted" | "denied" | "unsupported";
