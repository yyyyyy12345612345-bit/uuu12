import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// تم تعطيل خطوط Geist لأنها تسبب تنبيهات في الكونسول ولا يتم استخدامها
const geistSans = { variable: "" };
const geistMono = { variable: "" };

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
      { url: "/logo/logo.png?v=12", sizes: "32x32", type: "image/png" },
      { url: "/logo/logo.png?v=12", sizes: "192x192", type: "image/png" },
      { url: "/logo/logo.png?v=12", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo/logo.png?v=12",
    apple: "/logo/logo.png?v=12",
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
import { ThemeProvider } from "@/components/ThemeProvider";
import AppInitializer from "@/components/AppInitializer";
import Script from "next/script";

const GA_ID = "G-M167S42G7X";

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
      <head>
        {/* Scripts moved to body */}
      </head>
      <body 
        className="h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
        style={{ overflowX: 'clip', width: '100%', maxWidth: '100%', touchAction: 'pan-y' }}
      >

        <div className="absolute inset-0 pointer-events-none overflow-hidden w-full h-full">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] opacity-40 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] opacity-40" />
        </div>

        <link rel="icon" href="/logo/logo.png?v=12" type="image/png" sizes="32x32" />
        <link rel="shortcut icon" href="/logo/logo.png?v=12" type="image/png" />
        <link rel="apple-touch-icon" href="/logo/logo.png?v=12" />
        
        {/* Arabic Video Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&family=Lateef:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700;800&display=block" rel="stylesheet" />


        <ThemeProvider>
          <EditorProvider>
            <AppInitializer>
              {children}
            </AppInitializer>
          </EditorProvider>
        </ThemeProvider>
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
        
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>

      </body>
    </html>
  );
}
