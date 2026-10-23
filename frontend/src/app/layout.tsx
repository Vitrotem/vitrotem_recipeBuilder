import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitroTEM Protocol Builder",
  description: "Graphene liquid cell protocol builder for cryo-EM and room-temperature EM",
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
