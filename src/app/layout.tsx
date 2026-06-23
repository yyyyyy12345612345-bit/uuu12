import type { Metadata, Viewport } from "next";
import "./globals.css";

// تم تعطيل خطوط Geist وإزالة الاستيراد بالكامل لأنها تسبب تنبيهات preload في الكونسول ولا يتم استخدامها
const geistSans = { variable: "" };
const geistMono = { variable: "" };

export const metadata: Metadata = {
  title: {
    default: "يقين القران | Yaqeen AlQuran - القرآن الكريم | تطبيق إسلامي شامل",
    template: "%s | يقين القران | Yaqeen AlQuran"
  },
  description: "تطبيق يقين القرآن الإسلامي الشامل: مصحف رقمي، مكتبة صوتية بأكثر من 50 قارئ، مواقيت صلاة دقيقة، أذكار، بوصلة قبلة، واستوديو فيديو احترافي لإنشاء محتوى إسلامي. متاح على الويب والأندرويد.",
  authors: [{ name: "يوسف أسامة", url: "https://github.com/youssef" }],
  creator: "يوسف أسامة",
  publisher: "يقين القرآن | Yaqeen AlQuran - Islamic Digital Studio",
  keywords: [
    "يقين القران", "يقين القرآن", "yaqeen alquran", "yaqeen", "quran", "yaqueenalquran", "yaqueen",
    "تطبيق يقين القران", "برنامج يقين القران", "موقع يقين القران", "مصحف يقين",
    "قرآن", "القرآن", "القرآن الكريم", "مصحف", "المصحف", "كتاب الله", "كلام الله",
    "سورة", "سور", "آية", "آيات", "جزء", "أجزاء", "حزب", "ربع", "صفحة",
    "تفسير", "تفسير القرآن", "تدبر", "معنى الآية", "تفسير السعدي", "تفسير ابن كثير", "تفسير الطبري",
    "قراءة", "قراءة القرآن", "ترتيل", "تجويد", "أحكام التجويد", "مخارج الحروف",
    "صوت", "تلاوة", "تلاوات", "شيخ", "قراء", "قارئ", "شيوخ", "مشاري العفاسي",
    "عبدالباسط عبدالصمد", "محمد صديق المنشاوي", "محمود خليل الحصري", "سعد الغامدي",
    "عبدالرحمن السديس", "ماهر المعيقلي", "ياسر الدوسري", "عبدالله الجهني",
    "ناصر القطامي", "عبدالمحسن القاسم", "إسلام صبحي", "هزاع البلوشي",
    "صلاة", "صلوات", "الصلوات الخمس", "الفجر", "الظهر", "العصر", "المغرب", "العشاء",
    "أذان", "آذان", "الأذان", "مؤذن", "مواقيت الصلاة", "التقويم الهجري",
    "التاريخ الهجري", "الساعة الآن", "الوقت", "القبلة", "اتجاه القبلة", "بوصلة القبلة",
    "الكعبة", "الكعبة المشرفة", "مكة", "المدينة", "المسجد الحرام", "المسجد النبوي",
    "أذكار", "الذكر", "أذكار الصباح", "أذكار المساء", "أذكار النوم", "أذكار الاستيقاظ",
    "حصن المسلم", "ورد", "ورد يومي", "تسبيح", "مسابحة", "استغفار", "تهليل", "تكبير", "تحميد",
    "فيديو", "فيديوهات قرآنية", "مونتاج", "مونتاج قرآني", "تصميم فيديو",
    "تيك توك إسلامي", "يوتيوب إسلامي", "انستغرام إسلامي", "شورتس",
    "تطبيق إسلامي", "تطبيق قرآن", "برنامج إسلامي", "أفضل تطبيق إسلامي",
    "إسلام", "مسلم", "مسلمين", "دين", "عبادة", "دعاء", "أدعية",
    "اللهم", "سبحان الله", "الحمد لله", "لا إله إلا الله", "الله أكبر",
    "Quran", "AlQuran", "Quran Karim", "Holy Quran", "Quran Online",
    "Read Quran", "Listen Quran", "Quran Audio", "Quran Recitation",
    "Quran Translation", "Quran Tafsir", "Quran Interpretation",
    "Surah", "Ayah", "Juz", "Hizb", "Islamic App", "Muslim App",
    "Prayer Times", "Salah", "Adhan", "Athkar", "Qibla", "Qibla Compass",
    "Islamic Video Maker", "Quran Video", "Islamic Content Creator",
    "Best Islamic App", "Ramadan", "Fasting", "Sadaqah", "Zakat",
    "Mohamed Seddik El-Menshawy", "Abdulbasit Abdusamad",
    "Mahmoud Khalil Al-Hussary", "Mishary Alafasy", "Saad Al-Ghamdi",
    "Maher Al-Muaiqly", "Yasser Al-Dosari", "Islam Sobhi",
    "يقين قرآن", "موقع يقين", "تطبيق يقين الإسلامي", "yaqeen quran", "yaqeen al quran",
    "موقع إسلامي متكامل", "تطبيق إسلامي بدون إعلانات", "منصة يقين القرآنية",
    "القرآن الكريم كامل", "قراءة القرآن الكريم", "المصحف الإلكتروني المكتوب",
    "قراءة سور القرآن", "مصحف فلاش سريع", "تتبع ختمة القرآن", "مصحف التجويد الإلكتروني",
    "Read Quran online", "Digital Quran free",
    "أذكار الصباح والمساء كاملة", "أذكار النوم والاستيقاظ",
    "سبحة إلكترونية متطورة", "عداد الاستغفار الرقمي", "عداد الصلاة على النبي",
    "التسبيح والاشعارات اليومية", "أذكار المسلم اليومية مكتوبة",
    "Digital Tasbeeh counter", "Online Dhikr counter",
    "مواقيت الصلاة اليوم", "أوقات الصلاة بدقة", "تحديد اتجاه القبلة بالهاتف",
    "بوصلة القبلة الإلكترونية", "حساب وقت الصلاة GPS",
    "Prayer times today", "Accurate Qibla finder",
    "تحديات إسلامية يومية", "لوحة شرف حفظ القرآن", "مسابقات دينية ونقاط",
    "تطبيق تحفيزي للعبادات", "ترتيب المستغفرين والمسبحين",
    "يقين للقرآن الكريم", "القرآن يقين", "موسوعة يقين", "مشروع يقين",
    "استوديو يقين"
  ],
  openGraph: {
    title: "يقين القران | Yaqeen AlQuran - القرآن الكريم",
    description: "تطبيق إسلامي شامل للمصحف، الصلاة، الأذكار، وصناعة الفيديوهات القرآنية",
    url: "https://yaqeenalquran.online",
    siteName: "يقين القران | Yaqeen AlQuran",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/logo/logo.png?v=25",
        width: 512,
        height: 512,
        alt: "شعار يقين القران",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "يقين القران | Yaqeen AlQuran - القرآن الكريم",
    description: "رفيقك اليومي للقرآن والعبادة",
    images: ["/logo/logo.png?v=25"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "يقين القران | Yaqeen AlQuran",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo/logo.png",
  },
  verification: {
    google: "your-google-verification-code",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://yaqeenalquran.online",
  },
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
import { ErrorDebug } from "@/components/ErrorDebug";

const GA_ID = "G-M167S42G7X";

/**
 * Root Layout للتطبيق - يوفر السياق الأساسي لجميع الصفحات
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className="dark h-full antialiased"
      style={{ overflow: 'hidden', width: '100vw', height: '100dvh' }}
      suppressHydrationWarning
    >
      <head>
        {/* Static favicon links for Google crawler and browsers */}
        <link rel="icon" type="image/png" href="/favicon.ico" />
        <link rel="shortcut icon" type="image/png" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo/logo.png" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "يقين القرآن | Yaqeen AlQuran",
              "description": "تطبيق إسلامي شامل للمصحف، الصلاة، الأذكار، وصناعة الفيديوهات القرآنية",
              "url": "https://yaqeenalquran.online",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Android, Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EGP"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              }
            })
          }}
        />
      </head>
      <body 
        className="h-full bg-background text-foreground selection:bg-primary selection:text-primary-foreground"
        style={{ overflow: 'hidden', width: '100%', height: '100dvh', maxWidth: '100%', touchAction: 'pan-y', overscrollBehavior: 'none' }}
        suppressHydrationWarning
      >

        <div className="absolute inset-0 pointer-events-none overflow-hidden w-full h-full" />

        
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;500;600;700&family=Lateef:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700;800&family=Reem+Kufi:wght@400;700&family=Lalezar&family=El+Messiri:wght@500;700&family=Almarai:wght@400;700&family=Aref+Ruqaa&family=Alexandria:wght@400;700&display=block" rel="stylesheet" />

        <Script id="global-errors" strategy="afterInteractive">
          {`
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes('ChunkLoadError')) {
                window.location.reload();
              }
            }, true);
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && e.reason.name === 'ChunkLoadError') {
                window.location.reload();
              }
            });
          `}
        </Script>


        <ThemeProvider>
          <EditorProvider>
            <AppInitializer>
              {children}
            </AppInitializer>
          </EditorProvider>
        </ThemeProvider>
        <ErrorDebug />
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

