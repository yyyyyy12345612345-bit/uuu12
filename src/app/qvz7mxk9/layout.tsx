import type { Metadata } from "next";

// Secret route — noindex to prevent search engine discovery
export const metadata: Metadata = {
  title: "استوديو يوتيوب العريض | يقين القرآن",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
