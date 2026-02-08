import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Plataforma MVP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <header className="nav">
          <nav className="nav-inner">
            <strong style={{ marginRight: "0.75rem" }}>AdFlow</strong>
            <a href="/">Inicio</a>
            <a href="/login">Login</a>
            <a href="/channels">Canales</a>
            <a href="/campaigns/new">Nueva campaña</a>
            <a href="/campaigns/inbox">Mis campañas</a>
            <a href="/creator">Creador</a>
            <a href="/ops">OPS</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
