import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LingoLearn",
  description: "Learn languages through structured courses, vocabulary, and practice.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body>{children}</body>
      </html>
  );
}