"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken } from "../lib/auth";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    clearToken();
    router.replace("/login");
  }, [router]);
  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Cerrando sesión…</h1>
        <p className="subtitle">Redirigiendo a la página de acceso.</p>
      </section>
    </main>
  );
}

