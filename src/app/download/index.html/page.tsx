import { redirect } from "next/navigation";

export default function LegacyDownloadRedirect() {
  redirect("/download/");
}
