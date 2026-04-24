import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evalyn | AI LinkedIn Post Generator",
  description: "AI-Powered LinkedIn Post Architect",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
