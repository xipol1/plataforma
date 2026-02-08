export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0, padding: "2rem", background: "#f8fafc" }}>
        {children}
      </body>
    </html>
  );
}
