import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PagTracker v4.0 - Gateway de Pagamento Unificado",
    template: "%s | PagTracker"
  },
  description: "Sistema subadquirente multi-gateway unificado para PIX, cartão e boleto. API RESTful, dashboard analítico e checkout inteligente.",
  keywords: ["pagamento", "pix", "gateway", "api", "checkout", "boleto", "cartão"],
  authors: [{ name: "PagTracker Team" }],
  creator: "PagTracker",
  publisher: "PagTracker",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://pagtracker.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://pagtracker.com',
    title: 'PagTracker v4.0 - Gateway de Pagamento Unificado',
    description: 'Sistema subadquirente multi-gateway unificado para PIX, cartão e boleto.',
    siteName: 'PagTracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PagTracker - Gateway de Pagamento',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PagTracker v4.0 - Gateway de Pagamento Unificado',
    description: 'Sistema subadquirente multi-gateway unificado para PIX, cartão e boleto.',
    images: ['/og-image.png'],
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
