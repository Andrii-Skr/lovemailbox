import type { Metadata } from "next";
import { EditorLoader } from "@/components/builder/editor-loader";

export const metadata: Metadata = { title: "Конструктор", robots: { index: false, follow: false } };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorLoader projectId={id} />;
}
