import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "Puddle",
  description: "Know if the rain is actually coming your way.",
  icons: {
    icon: "/mascot/puddle-mascot-refined.png",
    apple: "/mascot/puddle-mascot-refined.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
