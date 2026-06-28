import "./globals.css";
import Header from "@/app/components/Header";
import BottomNav from "@/app/components/BottomNav";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "V-Tuune",
  description: "気分に合わせたVTuber音楽をシェアしよう",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Header />
        <div className="pb-20 sm:pb-0 min-h-screen">
          {children}
        </div>
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1e1b4b",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: {
              style: {
                background: "#5b21b6",
              },
              iconTheme: {
                primary: "#c4b5fd",
                secondary: "#fff",
              },
            },
            error: {
              style: {
                background: "#be123c",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
