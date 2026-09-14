import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClientLogic from "./LayoutClientLogic";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const host = headersList.get("host") || "";
  const isAdminDomain = host.startsWith("admin.");

  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </head>
      <body className={`${inter.className} bg-place-partner antialiased`}>
        <LayoutClientLogic isAdminDomain={isAdminDomain}>
          {children}
        </LayoutClientLogic>
      </body>
    </html>
  );
}