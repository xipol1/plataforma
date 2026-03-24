import React, { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import { demoChannels } from './services/demoData';

const LandingPage = () => {
  const carouselRef = useRef(null);
  const heroStack = useMemo(() => demoChannels.slice(0, 4), []);
  const marketplaceChannels = useMemo(() => demoChannels.slice(0, 6), []);
  const [currentChannelIdx, setCurrentChannelIdx] = React.useState(0);
  const dynamicChannels = [
    { nombre: "Crypto Alpha", categoria: "Crypto", audiencia: "120k", precio: "450€", ctr: "3.2%" },
    { nombre: "Gaming Deals Hub", categoria: "Gaming", audiencia: "150k", precio: "650€", ctr: "3.9%" },
    { nombre: "Startup Weekly", categoria: "Startup", audiencia: "45k", precio: "220€", ctr: "2.7%" },
    { nombre: "Ecom Growth", categoria: "Ecommerce", audiencia: "80k", precio: "300€", ctr: "3.1%" },
    { nombre: "Fitness Pro Tips", categoria: "Fitness", audiencia: "60k", precio: "180€", ctr: "2.5%" },
    { nombre: "AI Insider", categoria: "Tech", audiencia: "200k", precio: "1200€", ctr: "4.1%" }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChannelIdx((prev) => (prev + 1) % dynamicChannels.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const flowCards = [
    { 
      title: 'Explorar canales', 
      subtitle: `${dynamicChannels[currentChannelIdx].audiencia} audiencia`, 
      price: dynamicChannels[currentChannelIdx].precio, 
      badge: '🔍',
      ctr: dynamicChannels[currentChannelIdx].ctr,
      cpc: '1.25€',
      tag: dynamicChannels[currentChannelIdx].categoria,
      desc: 'Accede a métricas detalladas y verifica la autenticidad del canal.',
      dynamicName: dynamicChannels[currentChannelIdx].nombre
    },
    { 
      title: 'Seleccionar canal', 
      subtitle: dynamicChannels[currentChannelIdx].nombre, 
      price: dynamicChannels[currentChannelIdx].precio, 
      badge: '✅',
      ctr: '4.1%',
      cpc: '0.95€',
      tag: 'Premium',
      desc: 'Compara opciones y elige el canal que mejor se adapte a tu nicho.',
      dynamicName: null
    },
    { 
      title: 'Comprar publicación', 
      subtitle: 'Pago seguro', 
      price: 'Procesando...', 
      badge: '💳',
      ctr: '-',
      cpc: '-',
      tag: 'Seguro',
      desc: 'Transacción protegida mediante escrow hasta que se publique el anuncio.',
      dynamicName: null
    },
    { 
      title: 'Ver resultados', 
      subtitle: `CTR ${dynamicChannels[currentChannelIdx].ctr}`, 
      price: 'Completado', 
      badge: '📊',
      ctr: '3.8%',
      cpc: '1.10€',
      tag: 'Analíticas',
      desc: 'Mide el impacto real con datos actualizados y optimiza tu próxima compra.',
      dynamicName: null
    },
  ];

  const formatPlatform = (p) => {
    const map = {
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      instagram: 'Instagram',
      facebook: 'Facebook',
      discord: 'Discord',
      newsletter: 'Newsletter',
    };
    return map[p] || p || 'Canal';
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
    return `${currency} ${Math.round(amount)}€ / post`;
  };

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({ left: direction * 300, behavior: 'smooth' });
  };

  const Card = ({ ch, motionDelay = 0 }) => {
    const ctr = Number(ch.ctr ?? ch.engagement ?? 0);
    const cpc = Number(ch.cpc ?? 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: motionDelay }}
        className="min-w-[280px] max-w-[300px] shrink-0 snap-start bg-white rounded-xl border p-5 shadow-sm hover:scale-105 hover:shadow-xl transition-all duration-300 ease-out cursor-pointer"
      >
        <div className="flex justify-between items-center gap-6">
          <div className="font-semibold text-gray-900">{ch.nombre}</div>
          <span className="bg-gray-100 text-xs px-2 py-1 rounded">{formatPlatform(ch.plataforma)}</span>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <div className="text-sm text-gray-500">{formatNumber(ch.audiencia)} audiencia</div>
          <div className="text-sm">CTR {ctr ? `${ctr.toFixed(1)}%` : '—'}</div>
          <div className="text-sm text-gray-500">CPC {cpc ? `${cpc.toFixed(2)}€` : '—'}</div>
        </div>

        <div className="inline-flex gap-2 mt-2 flex-wrap">
          <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">🔥 Top canal</span>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">💎 Premium</span>
          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">🟢 Alta conversión</span>
        </div>

        <div className="mt-3">
          <div className="text-xl font-bold text-gray-900">{formatPrice(ch.moneda, ch.precio)}</div>
          <button
            type="button"
            className="bg-blue-600 text-white rounded-lg w-full py-2 mt-3 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 ease-out"
          >
            Comprar publicación
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
        <div className="absolute w-[500px] h-[500px] bg-blue-400 opacity-20 blur-3xl -top-40 -left-40" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center py-24 px-6 relative">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Compra anuncios en canales de Whatsapp, Telegram, Discord y comunidades privadas
            </h1>
            <p className="text-lg text-white/80 mt-4">Accede a audiencias reales sin agencias ni negociación manual</p>
            <div className="flex items-center gap-6 mt-6">
              <a
                href="#marketplace"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-out inline-block"
              >
                Explorar canales
              </a>
              <a
                href="/auth"
                className="border border-white/30 text-white px-6 py-3 rounded-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-out inline-block"
              >
                Soy creador
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="px-6 md:px-8">
              <div className="space-y-6">
                {heroStack.map((ch, idx) => {
                  const xOffsets = ['translate-x-0', 'translate-x-4', '-translate-x-2', 'translate-x-6'];
                  const rotates = ['rotate-[3deg]', '-rotate-[2deg]', 'rotate-[2deg]', '-rotate-[3deg]'];
                  const shadows = ['shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-lg'];
                  const scales = ['scale-95', 'scale-100', 'scale-105', 'scale-100'];

                  return (
                    <motion.div
                      key={ch.id}
                      animate={{ y: [0, -12, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }}
                      className={`bg-white rounded-xl p-4 ${shadows[idx] || 'shadow-lg'} ${scales[idx] || 'scale-100'} ${rotates[idx] || ''} ${
                        xOffsets[idx] || ''
                      }`}
                    >
                      <div className="flex justify-between items-center gap-6">
                        <div className="font-semibold text-gray-900">{ch.nombre}</div>
                        <span className="bg-gray-100 text-xs px-2 py-1 rounded">{formatPlatform(ch.plataforma)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-sm text-gray-500">{formatNumber(ch.audiencia)} audiencia</div>
                        <div className="text-xl font-bold text-gray-900">{formatPrice(ch.moneda, ch.precio)}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50" id="marketplace">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-7xl mx-auto px-6 mb-6">
            <div className="flex items-center gap-6 bg-white border rounded-lg px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-600">🔥 3 campañas compradas hoy</div>
              <div className="text-sm text-gray-600">⚡ Último anuncio hace 2h</div>
            </div>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto gap-6 pb-4 scroll-smooth snap-x snap-mandatory scrollbar-none"
            >
              {marketplaceChannels.map((ch, idx) => (
                <Card key={ch.id} ch={ch} motionDelay={idx * 0.08} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              aria-label="Scroll izquierda"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full shadow-md p-2 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              aria-label="Scroll derecha"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-48 max-w-7xl mx-auto px-8">
        <div className="text-center mb-28">
          <h2 className="text-5xl md:text-6xl font-semibold tracking-tight text-gray-900">
            Así funciona una campaña en AdFlow
          </h2>
          <p className="text-xl text-gray-500 mt-6">
            Explora, compra y lanza campañas en segundos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-28 items-center">
          <div className="space-y-16">
            <div className="border-l-2 border-gray-200 pl-6 hover:border-blue-500 transition-colors duration-300">
              <div className="text-blue-600 font-bold text-sm tracking-widest">01</div>
              <h3 className="text-2xl font-semibold mt-2">Explorar canal</h3>
              <p className="text-gray-500 mt-2 text-lg">
                Navega entre miles de audiencias reales segmentadas por temática, tamaño y rendimiento.
              </p>
            </div>
            <div className="border-l-2 border-gray-200 pl-6 hover:border-blue-500 transition-colors duration-300">
              <div className="text-blue-600 font-bold text-sm tracking-widest">02</div>
              <h3 className="text-2xl font-semibold mt-2">Seleccionar canal</h3>
              <p className="text-gray-500 mt-2 text-lg">
                Revisa métricas clave como CTR y CPC antes de tomar una decisión.
              </p>
            </div>
            <div className="border-l-2 border-gray-200 pl-6 hover:border-blue-500 transition-colors duration-300">
              <div className="text-blue-600 font-bold text-sm tracking-widest">03</div>
              <h3 className="text-2xl font-semibold mt-2">Comprar publicación</h3>
              <p className="text-gray-500 mt-2 text-lg">
                Reserva tu espacio publicitario de forma segura, sin intermediarios.
              </p>
            </div>
            <div className="border-l-2 border-gray-200 pl-6 hover:border-blue-500 transition-colors duration-300">
              <div className="text-blue-600 font-bold text-sm tracking-widest">04</div>
              <h3 className="text-2xl font-semibold mt-2">Ver resultados</h3>
              <p className="text-gray-500 mt-2 text-lg">
                Accede a métricas transparentes del rendimiento de tu campaña.
              </p>
            </div>
          </div>

          <div className="relative h-[650px] w-full flex flex-col gap-6 md:block overflow-visible group mt-16 md:mt-0">
            <div className="absolute w-[400px] h-[400px] bg-blue-400 opacity-15 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block" />

            {/* Línea de conexión opcional */}
            <div className="hidden md:block absolute left-[30%] top-[10%] bottom-[10%] w-0.5 bg-gradient-to-b from-blue-100 via-blue-300 to-blue-100 -z-10" />

            {flowCards.map((card, idx) => {
              const positions = [
                { top: '0%', left: '10%' },
                { top: '25%', left: '25%' },
                { top: '50%', left: '40%' },
                { top: '75%', left: '55%' }
              ];
              const delays = [0, 0.7, 1.2, 1.8];

              return (
                <motion.div
                  key={card.title}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: delays[idx],
                  }}
                  style={{
                    position: 'absolute',
                    ...positions[idx],
                  }}
                  className={`hidden md:block bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl p-6 min-w-[320px] transition-all duration-300 ease-out cursor-pointer hover:scale-110 hover:shadow-2xl hover:z-20 hover:!opacity-100 group-hover:opacity-70 group-hover:![animation-play-state:paused]`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg text-xl">
                      {card.badge}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {card.dynamicName ? (
                      <motion.span
                        key={card.dynamicName}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block"
                      >
                        {card.dynamicName}
                      </motion.span>
                    ) : (
                      card.title
                    )}
                  </h3>
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <motion.span 
                      key={card.subtitle}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-500"
                    >
                      {card.subtitle}
                    </motion.span>
                    <motion.span 
                      key={card.price}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-bold text-blue-600"
                    >
                      {card.price}
                    </motion.span>
                  </div>

                  {/* Contenido expandido al hacer hover */}
                  <div className="overflow-hidden max-h-0 opacity-0 group-hover/card:max-h-40 group-hover/card:opacity-100 group-hover/card:mt-4 transition-all duration-300 ease-out"
                       style={{ '.group-hover:hover &': { maxHeight: '160px', opacity: 1, marginTop: '16px' } }}>
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex gap-4 text-sm mb-3">
                        <div>
                           <span className="text-gray-500 block text-xs">CTR</span>
                           <motion.span 
                             key={card.ctr}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="font-medium text-gray-900 inline-block"
                           >
                             {card.ctr}
                           </motion.span>
                         </div>
                         <div>
                           <span className="text-gray-500 block text-xs">CPC</span>
                           <span className="font-medium text-gray-900">{card.cpc}</span>
                         </div>
                      </div>
                      <motion.span 
                        key={card.tag}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium mb-2"
                      >
                        {card.tag}
                      </motion.span>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Versión Mobile (Stack vertical sin absolute) */}
             {flowCards.map((card, idx) => (
                <div key={`mob-${card.title}`} className="md:hidden bg-white border border-gray-100 rounded-2xl shadow-md p-5 relative">
                   <div className="flex justify-between items-start mb-3">
                     <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg text-xl">
                       {card.badge}
                     </div>
                     <motion.span 
                       key={`mob-price-${card.price}`}
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       className="font-bold text-blue-600"
                     >
                       {card.price}
                     </motion.span>
                   </div>
                   <h3 className="font-semibold text-gray-900 text-lg">
                     {card.dynamicName ? (
                       <motion.span
                         key={`mob-name-${card.dynamicName}`}
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                       >
                         {card.dynamicName}
                       </motion.span>
                     ) : (
                       card.title
                     )}
                   </h3>
                   <motion.p 
                     key={`mob-sub-${card.subtitle}`}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-gray-500 text-sm mt-1 mb-3"
                   >
                     {card.subtitle}
                   </motion.p>
                   
                   <div className="pt-3 border-t border-gray-100">
                     <div className="flex gap-4 text-sm mb-2">
                       <div>
                         <span className="text-gray-500 text-xs mr-1">CTR:</span>
                         <motion.span 
                           key={`mob-ctr-${card.ctr}`}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           className="font-medium text-gray-900"
                         >
                           {card.ctr}
                         </motion.span>
                       </div>
                       <div>
                         <span className="text-gray-500 text-xs mr-1">CPC:</span>
                         <span className="font-medium text-gray-900">{card.cpc}</span>
                       </div>
                     </div>
                     <p className="text-gray-500 text-xs mt-2">{card.desc}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 py-28 text-center relative overflow-hidden"
      >
        <div className="absolute w-[680px] h-[680px] bg-white opacity-10 blur-3xl -top-56 left-1/2 -translate-x-1/2" />
        <div className="absolute w-[520px] h-[520px] bg-blue-400 opacity-20 blur-3xl -bottom-56 left-16" />
        <div className="relative max-w-4xl mx-auto px-6">
          <h3 className="text-5xl font-semibold text-white">Empieza a comprar anuncios hoy</h3>
          <p className="text-white/80 mt-4 text-lg">Sin fricción. Sin barreras. Acceso directo a audiencias.</p>

          <div className="flex justify-center gap-4 mt-10">
            <a
              href="#marketplace"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-medium shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-out inline-block"
            >
              Explorar canales
            </a>
            <a
              href="/auth"
              className="border border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-300 ease-out inline-block"
            >
              Crear cuenta
            </a>
          </div>
        </div>
      </motion.section>
    </MainLayout>
  );
};

export default LandingPage;
