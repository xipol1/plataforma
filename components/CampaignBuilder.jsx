import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Users, Settings, ArrowRight, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import Card from './Card';
import Input from './Input';
import Button from './Button';
import Badge from './Badge';
import apiService from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { demoChannels } from '../services/demoData';

const CampaignBuilder = ({ onNavigate }) => {
  const { addNotification } = useNotifications();
  const { isDemoUser } = useAuth();
  
  // Basic states
  const [budget, setBudget] = useState(100);
  const [category, setCategory] = useState('');
  const [mode, setMode] = useState('automatic'); // automatic, my-channels, manual
  const [listId, setListId] = useState('');
  const [content, setContent] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  
  // Data states
  const [userLists, setUserLists] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Fetch user lists for "My Channels" mode
  useEffect(() => {
    const fetchLists = async () => {
      try {
        if (isDemoUser === true) {
          setNotice(null);
          const list = {
            _id: 'demo-list-1',
            name: 'Canales demo',
            channels: demoChannels.map((c) => c.id),
          };
          setUserLists([list]);
          setListId(list._id);
          return;
        }
        const res = await apiService.getMyLists();
        if (res.success && Array.isArray(res.data)) {
          setNotice(null);
          setUserLists(res.data);
          if (res.data.length > 0) {
            setListId(res.data[0]._id);
          }
          return;
        }
        setNotice('Usando datos demo');
        const list = {
          _id: 'demo-list-1',
          name: 'Canales demo',
          channels: demoChannels.map((c) => c.id),
        };
        setUserLists([list]);
        setListId(list._id);
      } catch (err) {
        setNotice('Usando datos demo');
        const list = {
          _id: 'demo-list-1',
          name: 'Canales demo',
          channels: demoChannels.map((c) => c.id),
        };
        setUserLists([list]);
        setListId(list._id);
      }
    };
    fetchLists();
  }, [isDemoUser]);

  // Optimization logic
  const handleOptimize = useCallback(async (currentBudget, currentCategory, currentListId, currentMode) => {
    if (currentMode === 'manual') return;
    
    setLoading(true);
    setError(null);
    try {
      if (isDemoUser === true) {
        const normalizedCategory = currentCategory ? String(currentCategory).toLowerCase() : '';
        const base = demoChannels.filter((c) => {
          if (currentMode === 'my-channels' && currentListId && currentListId !== 'demo-list-1') return false;
          if (normalizedCategory && c.tematica !== normalizedCategory) return false;
          return c.verificado === true;
        });

        const picked = (base.length ? base : demoChannels.filter((c) => c.verificado === true)).slice(0, 6);
        const avgBudget = Math.max(10, Number(currentBudget || 0));
        const per = picked.length ? avgBudget / picked.length : avgBudget;
        const allocation = picked.map((c) => {
          const price = Math.min(Number(c.precio || 0), per);
          const expectedClicks = Math.max(1, Math.round((Number(c.audiencia || 0) * (Number(c.ctr || 0) / 100)) * 0.02));
          return {
            channelId: c.id,
            name: c.nombre,
            price,
            expectedClicks,
          };
        });
        const totalBudgetUsed = allocation.reduce((acc, a) => acc + Number(a.price || 0), 0);
        const expectedClicks = allocation.reduce((acc, a) => acc + Number(a.expectedClicks || 0), 0);
        setResults({ allocation, totalBudgetUsed, expectedClicks });
        return;
      }
      const res = await apiService.optimizeCampaign({
        budget: currentBudget,
        category: currentCategory || undefined,
        listId: currentMode === 'my-channels' ? currentListId : undefined,
      });

      if (res.success) {
        setResults(res.data);
      } else {
        setError('No se pudo conectar con el servidor');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }, [isDemoUser]);

  // Debounced live optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (budget >= 10) {
        handleOptimize(budget, category, listId, mode);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [budget, category, listId, mode, handleOptimize]);

  const handleLaunch = async () => {
    if (!content || !targetUrl) {
      if (addNotification) {
        addNotification({
          tipo: 'error', 
          titulo: 'Faltan datos', 
          mensaje: 'Por favor ingresa el contenido y la URL de destino.'
        });
      }
      return;
    }

    setLaunching(true);
    try {
      if (isDemoUser === true) {
        setSuccess(true);
        if (addNotification) {
          addNotification({
            tipo: 'success',
            titulo: '¡Campaña lanzada!',
            mensaje: `Se han creado ${results?.allocation?.length || 0} campañas.`
          });
        }
        setTimeout(() => {
          setSuccess(false);
          setContent('');
          setTargetUrl('');
          setResults(null);
        }, 5000);
        return;
      }
      const res = await apiService.launchAutoCampaign({
        budget,
        category: category || undefined,
        listId: mode === 'my-channels' ? listId : undefined,
        content,
        targetUrl
      });

      if (res.success) {
        setSuccess(true);
        if (addNotification) {
          addNotification({
            tipo: 'success', 
            titulo: '¡Campaña lanzada!', 
            mensaje: `Se han creado ${res.data.campaignsCreated} campañas.`
          });
        }
        // Reset after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          setContent('');
          setTargetUrl('');
          setResults(null);
        }, 5000);
      }
    } catch (err) {
      if (addNotification) {
        addNotification({
          tipo: 'error', 
          titulo: 'Error al lanzar', 
          mensaje: 'No se pudo conectar con el servidor'
        });
      }
    } finally {
      setLaunching(false);
    }
  };

  const getChannelLabel = (channel) => {
    if (channel.expectedClicks > (budget / (results?.allocation?.length || 1)) * 1.5) return "Alto rendimiento";
    if (channel.price < (budget / (results?.allocation?.length || 1)) * 0.7) return "Mejor valor";
    return "Recomendado";
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-bold text-gray-900">¡Campaña lanzada con éxito! 🚀</h2>
          <p className="text-gray-600 text-lg">
            Tu campaña ya está en marcha. Hemos distribuido tu presupuesto en los mejores canales disponibles.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Campañas creadas</p>
              <p className="text-2xl font-bold text-primary-600">{results?.allocation?.length || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-sm text-gray-500">Presupuesto usado</p>
              <p className="text-2xl font-bold text-primary-600">{results?.totalBudgetUsed?.toFixed(2)}€</p>
            </div>
          </div>

          <Button onClick={() => setSuccess(false)} variant="primary" size="lg">
            Crear otra campaña
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">Auto-Buy</h1>
          <p className="text-gray-600">Optimización inteligente de presupuesto para maximizar tus resultados.</p>
        </div>
      </div>

      {notice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Configuration */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Step 1: Budget & Category */}
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-primary-600 px-6 py-4">
              <h3 className="text-white font-semibold flex items-center">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Configuración básica
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presupuesto total</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">€</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    min="10"
                  />
                </div>
                <input
                  type="range"
                  min="10"
                  max="2000"
                  step="10"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full mt-4 accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10€</span>
                  <span>2000€+</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría del producto</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Todas las categorías</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="moda">Moda</option>
                  <option value="gaming">Gaming</option>
                  <option value="negocios">Negocios</option>
                  <option value="salud">Salud</option>
                  <option value="viajes">Viajes</option>
                  <option value="cripto">Criptomonedas</option>
                </select>
                {results && !loading && (
                  <p className="mt-4 text-sm font-medium text-primary-700 bg-primary-50 p-3 rounded-lg flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Con {budget}€ estimamos ~{results.expectedClicks} clicks
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Step 2: Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setMode('automatic')}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center group ${
                mode === 'automatic' 
                ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-100' 
                : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                mode === 'automatic' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Automático</h4>
              <p className="text-xs text-gray-500 mb-2">Nosotros elegimos los mejores canales por ti</p>
              <div className="relative">
                <Info className="w-4 h-4 text-gray-300 hover:text-primary-500 cursor-help" />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Seleccionamos canales basados en rendimiento, alcance y precio para maximizar tu ROI.
                </div>
              </div>
            </div>

            <div 
              onClick={() => setMode('my-channels')}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center group ${
                mode === 'my-channels' 
                ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-100' 
                : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                mode === 'my-channels' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Mis canales</h4>
              <p className="text-xs text-gray-500 mb-2">Elige tus canales favoritos y optimizamos dentro</p>
              {mode === 'my-channels' && userLists.length > 0 && (
                <select 
                  value={listId} 
                  onChange={(e) => setListId(e.target.value)}
                  className="mt-2 text-xs border-gray-300 rounded p-1 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {userLists.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                </select>
              )}
            </div>

            <div 
              onClick={() => setMode('manual')}
              className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center text-center group ${
                mode === 'manual' 
                ? 'border-primary-600 bg-primary-50 ring-4 ring-primary-100' 
                : 'border-gray-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                mode === 'manual' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
              }`}>
                <Settings className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Manual</h4>
              <p className="text-xs text-gray-500 mb-2">Selecciona canales uno a uno en el marketplace</p>
              <button 
                className="mt-2 text-[10px] text-primary-600 font-bold uppercase tracking-wider hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate?.('explore');
                }}
              >
                Ir al marketplace
              </button>
            </div>
          </div>

          {/* Step 3: Content */}
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-primary-600 px-6 py-4">
              <h3 className="text-white font-semibold flex items-center">
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Contenido del anuncio
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Texto de la campaña</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escribe el mensaje que verán los usuarios..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">URL de destino</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://tu-sitio.com/oferta"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Results & Launch */}
        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-xl bg-gray-900 text-white overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-lg font-bold flex items-center">
                Resultados Estimados
                {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin text-primary-400" />}
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Presupuesto usado</span>
                <span className="text-xl font-bold">{results?.totalBudgetUsed?.toFixed(2) || '0.00'}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Clicks esperados</span>
                <span className="text-xl font-bold text-primary-400">~{results?.expectedClicks || '0'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">CPC estimado</span>
                <span className="text-xl font-bold">{(results?.totalBudgetUsed / results?.expectedClicks || 0).toFixed(3)}€</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full font-semibold group"
                onClick={handleLaunch}
                disabled={loading || launching || !results || !content || !targetUrl}
              >
                {launching ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Lanzando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Lanzar campaña
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </Card>

          {results && results.allocation && (
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Canales seleccionados</h4>
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
                {results.allocation.map((ch, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{ch.name}</p>
                      <Badge variant="info" className="text-[10px] py-0 px-1 mt-1">
                        {getChannelLabel(ch)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary-600">{ch.price.toFixed(2)}€</p>
                      <p className="text-[10px] text-gray-400">{ch.expectedClicks} clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          
          {loading && !results && (
            <div className="text-center py-10">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary-500 mb-4" />
              <p className="text-gray-500 font-medium italic">Optimizando tu campaña...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;
