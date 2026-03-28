import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CityOS — askLA Civic Intelligence Platform",
  description: "The City's Memory, Made Accessible. 10,698 meetings. 20.9M words. 18 years of LA city government.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        {children}
      </body>
    </html>
  );
}
