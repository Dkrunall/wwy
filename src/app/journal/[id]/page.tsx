import { redirect } from "next/navigation";

// See app/journal/page.tsx.
export default function JournalEntryPage() {
  redirect("/story");
}
