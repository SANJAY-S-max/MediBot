import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MediBot — AI Healthcare Assistant",
  description: "Multilingual AI healthcare assistant for symptom checking, health reports, telemedicine, and medication reminders.",
  keywords: "healthcare, AI, symptom checker, telemedicine, medical assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
