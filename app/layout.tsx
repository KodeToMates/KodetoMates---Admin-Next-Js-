import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/Theme/ThemeContext";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Identity Admin Portal",
  description: "Manage applications, CRM leads, and Identity Entitlements.",
  icons: {
    icon: [
      { url: '/Image_v1/favicon_io/favicon.ico?v=2' },
      { url: '/Image_v1/favicon_io/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/Image_v1/favicon_io/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Image_v1/favicon_io/favicon.ico?v=2',
    apple: [
      { url: '/Image_v1/favicon_io/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/Image_v1/favicon_io/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/Image_v1/favicon_io/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/Image_v1/favicon_io/favicon-32x32.png?v=2" type="image/png" sizes="32x32" />
        <link rel="icon" href="/Image_v1/favicon_io/favicon-16x16.png?v=2" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/Image_v1/favicon_io/apple-touch-icon.png?v=2" />
        <link rel="manifest" href="/Image_v1/favicon_io/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${poppins.className} ${poppins.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
