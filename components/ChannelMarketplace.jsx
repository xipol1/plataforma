import React, { useEffect, useMemo, useState } from 'react';
import Button from './Button';
import apiService from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { demoChannels } from '../services/demoData';

const formatPlatform = (p) => {
  if (!p) return 'Canal';
  const map = {
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
    discord: 'Discord',
    newsletter: 'Newsletter',
  };
  return map[p] || p;
};

const formatCategory = (c) => {
  if (!c) return 'Sin categoría';
  const map = {
    tecnologia: 'Tecnología',
    moda: 'Moda',
    viajes: 'Viajes',
    comida: 'Comida',
    deportes: 'Deportes',
    entretenimiento: 'Entretenimiento',
    educacion: 'Educación',
    negocios: 'Negocios',
    salud: 'Salud',
    gaming: 'Gaming',
    cripto: 'Criptomonedas',
    musica: 'Música',
    arte: 'Arte',
    otros: 'Otros',
  };
  return map[c] || c;
};

const formatNumber = (n) => {
  const value = Number(n || 0);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return String(Math.round(value));
};

const formatPrice = (currency, value) => {
  const amount = Number(value || 0);
  if (currency === 'EUR' || currency === '€') return `${Math.round(amount)}€ / post`;
  if (currency === 'USD' || currency === '$') return `$${Math.round(amount)} / post`;
  return `${currency} ${Math.round(amount)} / post`;
};

const ChannelMarketplace = () => {
  const { isDemoUser } = useAuth();
  const isDemo = isDemoUser === true;
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);

  const params = useMemo(() => {
    const p = {
      limite: 30,
      ordenPor: 'relevancia',
    };
    if (query.trim()) p.q = query.trim();
    if (platform) p.plataforma = platform;
    if (category) p.categoria = category;
    if (verifiedOnly) p.verificado = 'true';
    return p;
  }, [query, platform, category, verifiedOnly]);

  const getDemoChannels = () => {
    return demoChannels.filter((c) => {
      if (verifiedOnly && !c.verificado) return false;
      if (platform && c.plataforma !== platform) return false;
      if (category && c.tematica !== category) return false;
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${c.nombre || ''} ${c.tematica || ''} ${c.plataforma || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    if (isDemo) {
      setChannels(getDemoChannels());
      setLoading(false);
      return;
    }
    try {
      const res = await apiService.searchChannels(params);
      if (res?.success) {
        const next = Array.isArray(res.channels) ? res.channels : [];
        setChannels(next);
        return;
      }
      setChannels(getDemoChannels());
      setError('Usando datos demo');
    } catch (e) {
      setChannels(getDemoChannels());
      setError('Usando datos demo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [params]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">Explorar canales</h1>
          <p className="text-gray-600">Descubre canales disponibles y compra publicaciones.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refrescar
        </Button>
      </div>

      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b mb-6 md:mb-8">
        <div className="flex flex-wrap gap-3 md:gap-4 py-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm min-w-[200px] focus:ring-primary-500 focus:border-primary-500 outline-none"
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Plataforma</option>
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="discord">Discord</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Temática</option>
            <option value="tecnologia">Tecnología</option>
            <option value="gaming">Gaming</option>
            <option value="negocios">Negocios</option>
            <option value="cripto">Criptomonedas</option>
            <option value="salud">Salud</option>
            <option value="viajes">Viajes</option>
            <option value="moda">Moda</option>
            <option value="entretenimiento">Entretenimiento</option>
            <option value="educacion">Educación</option>
            <option value="otros">Otros</option>
          </select>

          <button
            type="button"
            onClick={() => setVerifiedOnly((v) => !v)}
            className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
              verifiedOnly
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Solo verificados
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        </div>
      ) : channels.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center py-10">
            <h3 className="text-lg font-semibold text-gray-900">No hay canales disponibles todavía</h3>
            <p className="text-gray-600 mt-2">Prueba con otros filtros o refresca la búsqueda.</p>
            <div className="mt-4">
              <Button variant="primary" onClick={load}>
                Refrescar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 md:gap-8 overflow-x-auto pb-4 px-2">
          {channels.map((ch) => {
            const platformLabel = formatPlatform(ch.plataforma);
            const categoryLabel = formatCategory(ch.tematica);
            const audience = formatNumber(ch.audiencia);
            const price = Number(ch.precio || 0);
            const currency = ch.moneda || 'USD';
            const engagement = Number(ch.engagement || 0);
            const isVerified = Boolean(ch.verificado);
            
            // Only 2 badges max
            const badges = [];
            badges.push({ label: platformLabel, variant: 'info' });
            if (isVerified) badges.push({ label: 'Verificado', variant: 'success' });

            return (
              <div
                key={String(ch._id ?? ch.id)}
                className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-200 min-w-[280px] md:min-w-[300px] max-w-[320px] shrink-0 hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out"
              >
                <div className="flex flex-col h-full space-y-3">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 leading-tight line-clamp-2">
                      {ch.nombre || 'Canal sin nombre'}
                    </h3>
                  </div>

                  {/* Mid */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {badges.map((b, i) => (
                      <span key={i} className={`px-2 py-1 text-xs rounded-md ${
                        b.variant === 'info' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {b.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1 text-sm text-gray-500 mt-2">
                    <div className="flex items-center justify-between">
                      <span>Audiencia</span>
                      <span className="font-medium text-gray-700">{audience}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span>{categoryLabel}</span>
                      {engagement > 0 && <span>{engagement.toFixed(1)}% eng.</span>}
                    </div>
                  </div>

                  <div className="flex-grow"></div>

                  {/* Bottom */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-gray-900">{formatPrice(currency, price)}</span>
                    <Button size="sm" className="px-4">
                      Ver
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChannelMarketplace;
