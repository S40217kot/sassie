import "./globals.css";

export const metadata = {
  title: "Sassie",
  description: "言葉になる前の、静かな痕跡。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
