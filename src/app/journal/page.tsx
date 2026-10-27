import { redirect } from "next/navigation";

// The journal is not live. Its drafts made claims we have not cleared (living food, drinks), so
// visitors go to the Story page. New flavours and updates are announced on Instagram instead.
export default function JournalPage() {
  redirect("/story");
}
