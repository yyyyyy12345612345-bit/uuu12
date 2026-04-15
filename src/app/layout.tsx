import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "قرآن",
    template: "%s | قرآن"
  },
  description: "استوديو احترافي لتصميم فيديوهات القرآن الكريم، الاستماع للمشايخ، متابعة مواقيت الصلاة، وقراءة الورد اليومي. كل ما تحتاجه في تطبيق واحد وبجودة عالية.",
  authors: [{ name: "قرآن" }],
  creator: "قرآن",
  publisher: "قرآن",
  keywords: [
    "قرآن", "قرآن كريم", "فيديوهات قرآن", "صانع فيديوهات القرآن", "تطبيق قرآن", 
    "مواقيت الصلاة", "المكتبة الصوتية", "العفاسي", "المنشاوي", "تصميم قرآن", "Video Editor",
    "Quran", "Quran Studio", "Quran Video Maker", "Prayer Times", "Islamic App", "Holy Quran"
  ],
  openGraph: {
    title: "قرآن",
    description: "استوديو احترافي لتصميم فيديوهات القرآن الكريم، الاستماع للمشايخ، ومتابعة مواقيت الصلاة.",
    siteName: "قرآن",
    locale: "ar_EG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "قرآن",
    description: "صمم فيديوهات القرآن الخاصة بك وتابع وردك اليومي بسهولة.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "قرآن",
  },
  icons: {
    icon: [
      { url: "/logo/logo.png?v=4" },
      { url: "/logo/logo.png?v=4", sizes: "32x32", type: "image/png" },
    ],
    apple: "/logo/logo.png?v=4",
  }


};


export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { EditorProvider } from "@/store/useEditor";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ overflowX: 'hidden', width: '100vw' }}
    >
      <body 
        className="h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
        style={{ overflowX: 'clip', width: '100%', maxWidth: '100%', touchAction: 'pan-y' }}
      >

        <div className="absolute inset-0 pointer-events-none overflow-hidden w-full h-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] opacity-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] opacity-40" />
        </div>

        <link rel="icon" href="/logo/logo.png?v=4" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo/logo.png?v=4" />


        <EditorProvider>
          {children}
        </EditorProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              const register = () => {
                navigator.serviceWorker.register('/sw.js').then((reg) => {
                  console.log('SW Registered');
                }).catch((err) => {
                  console.log('SW Registration Failed', err);
                });
              };
              if (document.readyState === 'complete') {
                register();
              } else {
                window.addEventListener('load', register);
              }
            }
          `}
        </Script>
        <link rel="apple-touch-icon" href="/icon-192.png" />

      </body>
    </html>
  );
}
