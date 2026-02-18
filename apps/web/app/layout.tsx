import "./globals.css";
import HeroFX from "./components/HeroFX";
import NavBar from "./components/NavBar";
import WelcomePop from "./components/WelcomePop";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <title>Plataforma MVP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var d=t? t==='dark' : (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',!!d);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <HeroFX />
        <NavBar />
        <WelcomePop />
        {children}
      </body>
    </html>
  );
}
