import type { Metadata } from "next";
import WideStudioPage from "./page";

// Secret route — noindex to prevent search engine discovery
export const metadata: Metadata = {
  title: "Studio",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default WideStudioPage;
