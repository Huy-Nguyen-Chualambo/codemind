import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeMind - AI Code Reviewer",
  description: "AI-powered code review, explanation, and bug fixing with OpenRouter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">{children}</body>
    </html>
  );
}
