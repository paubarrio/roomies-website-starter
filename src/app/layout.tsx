import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roomies",
  description: "Shared calendars • chores • costs • groceries",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
