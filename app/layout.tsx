import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Renovation Lead Intake Assistant",
  description: "Structured, multi-tenant intake for renovation and home-service leads.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
