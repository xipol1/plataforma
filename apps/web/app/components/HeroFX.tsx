 "use client";
 
 import { useEffect } from "react";
 
 export default function HeroFX() {
   useEffect(() => {
     const root = document.documentElement;
 
     const onMouse = (e: MouseEvent) => {
       const mx = (e.clientX / window.innerWidth) * 100;
       const my = (e.clientY / window.innerHeight) * 100;
       root.style.setProperty("--mx", mx.toFixed(2));
       root.style.setProperty("--my", my.toFixed(2));
     };
 
     const onScroll = () => {
       root.style.setProperty("--scroll", String(window.scrollY || 0));
     };
 
     const observer = new IntersectionObserver(
       (entries) => {
         entries.forEach((entry) => {
           const target = entry.target as HTMLElement;
           if (entry.isIntersecting) {
             target.classList.add("in");
           }
         });
       },
       { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
     );
 
     document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => observer.observe(el));
 
     window.addEventListener("mousemove", onMouse);
     window.addEventListener("scroll", onScroll, { passive: true });
     onScroll();
 
     return () => {
       window.removeEventListener("mousemove", onMouse);
       window.removeEventListener("scroll", onScroll);
       observer.disconnect();
     };
   }, []);
 
   return <div className="hero-bg" aria-hidden="true" />;
 }
