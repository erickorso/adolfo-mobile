import * as Clipboard from "expo-clipboard";
import { Linking } from "react-native";

import type { CoachCourseRef, CoachJobRef } from "./api";

export type CoachShareRefs = {
  jobs: CoachJobRef[];
  courses: CoachCourseRef[];
};

export type CoachShareLabels = {
  title: string;
  question: string;
  answer: string;
  refs: string;
  job: string;
  course: string;
  footer: string;
  emailSubject: string;
};

const DEFAULT_LABELS: CoachShareLabels = {
  title: "Career Coach — Adolfo",
  question: "Pregunta:",
  answer: "Respuesta:",
  refs: "Referencias:",
  job: "Job",
  course: "Course",
  footer: "— adolfo-nine.vercel.app",
  emailSubject: "Career Coach — Adolfo",
};

export function formatCoachShare(input: {
  question: string | null;
  answer: string;
  refs?: CoachShareRefs | null;
  labels?: Partial<CoachShareLabels>;
}): string {
  const labels = { ...DEFAULT_LABELS, ...input.labels };
  const question = (input.question ?? "").trim();
  const answer = input.answer.trim();
  const parts = [labels.title, ""];

  if (question) {
    parts.push(labels.question, question, "");
  }
  parts.push(labels.answer, answer);

  const jobs = input.refs?.jobs.slice(0, 4) ?? [];
  const courses = input.refs?.courses.slice(0, 4) ?? [];
  if (jobs.length > 0 || courses.length > 0) {
    parts.push("", labels.refs);
    for (const j of jobs) {
      parts.push(`- ${labels.job}: ${j.title} — ${j.url}`);
    }
    for (const c of courses) {
      parts.push(`- ${labels.course}: ${c.title} — ${c.url}`);
    }
  }

  parts.push("", labels.footer);
  return parts.join("\n");
}

export async function shareCoachCopy(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export async function shareCoachWhatsApp(text: string): Promise<void> {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error("WhatsApp unavailable");
  }
  await Linking.openURL(url);
}

export async function shareCoachEmail(
  text: string,
  subject = DEFAULT_LABELS.emailSubject,
): Promise<void> {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (!can) {
    throw new Error("Mail unavailable");
  }
  await Linking.openURL(url);
}
