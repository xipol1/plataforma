 "use client";
import React, { useEffect, useMemo, useState } from "react";

export type MarketplaceCardProps = {
  imageUrl?: string;
  category: string;
  name: string;
  platform: string;
  members: number;
  totalAds: number | null;
  engagementLabel?: string;
  price: number;
  description?: string;
};

const defaultImageForCategory: Record<string, string> = {
  Startups:
    "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1200&auto=format&fit=crop",
  Deportes:
    "/images/deportes.svg",
  Lifestyle:
    "/images/lifestyle.svg",
  Ecommerce:
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
};

function formatMembers(n: number) {
  return new Intl.NumberFormat("es-ES").format(n);
}

function Card(props: MarketplaceCardProps) {
  const fallback = defaultImageForCategory[props.category] || defaultImageForCategory["Lifestyle"];
  const img = props.imageUrl || fallback;
  return (
    <div className="channel-compact group">
      <div className="channel-img-wrap">
        <img
          src={img}
          alt={props.category}
          className="channel-img"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== fallback) target.src = fallback;
          }}
        />
      </div>
      <div className="channel-pills">
        <span className="pill violet">{props.category}</span>
        <span className="pill violet">{props.platform}</span>
      </div>
      <div className="channel-card-title">{props.name}</div>
      <div className="channel-card-meta">
        {props.platform} · {formatMembers(props.members)} miembros ·{" "}
        {props.totalAds != null ? formatMembers(props.totalAds) : "—"} anuncios
      </div>
      {props.engagementLabel && <div className="channel-card-eng">{props.engagementLabel}</div>}
      {props.description && <div className="channel-card-desc line-clamp-2">{props.description}</div>}
      <div className="channel-bottom">
        <div className="channel-price">
          <div className="amount">{props.price} €</div>
          <div className="label">por publicación</div>
        </div>
        <div className="channel-cta">
          <a href="/channels" className="btn btn-primary cta-gradient">Comprar espacio</a>
        </div>
      </div>
    </div>
  );
}

export default function AppPreview({ items }: { items?: MarketplaceCardProps[] }) {
  const data =
    items ??
    [
      {
        category: "Startups",
        name: "Startup Builders Weekly",
        platform: "Telegram",
        members: 42300,
        totalAds: 43,
        engagementLabel: "Engagement alto",
        price: 120,
        description: "Boletín semanal con oportunidades, herramientas y debates prácticos para builders.",
        imageUrl: "/adflow/Startup.opt.jpg",
      },
    ];
  const current = data[0];

  return (
    <Card {...current} />
  );
}
