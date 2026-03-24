import { useState, useEffect, useContext, createContext } from 'react';
import apiService from '../services/api';
import { useAuth } from './useAuth';
import { demoAdvertiserDashboard, demoCreatorDashboard } from '../services/demoData';

// Crear contexto de notificaciones
const NotificationsContext = createContext();

// Provider de notificaciones
export const NotificationsProvider = ({ children }) => {
  const { user, isAuthenticated, isDemoUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  /**
   * Cargar notificaciones del servidor
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);
      if (isDemoUser === true) {
        const source = user?.role === 'creator' ? demoCreatorDashboard.recentActivities : demoAdvertiserDashboard.recentActivities;
        const demoNotifications = source.map((a) => ({
          id: `${a.type}-${a.timestamp}-${a.content}`,
          tipo: a.type || 'info',
          titulo: 'Demo',
          mensaje: a.content,
          fecha: new Date(),
          leida: false,
        }));
        setNotifications(demoNotifications);
        setUnreadCount(demoNotifications.length);
        setIsConnected(true);
        return;
      }

      const response = await apiService.getMyNotifications({ limit: 50 });
      if (response.success) {
        const list = Array.isArray(response.data) ? response.data : [];
        const normalized = list.map((n) => ({
          ...n,
          id: n.id ?? n._id ?? n.notificationId,
          tipo: n.tipo ?? n.type ?? 'info',
          titulo: n.titulo ?? n.title ?? 'Notificación',
          mensaje: n.mensaje ?? n.message ?? '',
          fecha: n.fecha ?? n.createdAt ?? new Date(),
          leida: n.leida ?? n.read ?? false,
        }));
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n) => !n.leida).length);
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Agregar nueva notificación
   */
  const addNotification = (notificacion) => {
    setNotifications(prev => [notificacion, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Mostrar notificación del navegador si está permitido
    if (Notification.permission === 'granted') {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: '/favicon.ico'
      });
    }
  };

  /**
   * Marcar notificación como leída
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, leida: true }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  /**
   * Marcar todas las notificaciones como leídas
   */
  const markAllAsRead = async () => {
    try {
      const response = await apiService.markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, leida: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  /**
   * Eliminar notificación
   */
  const deleteNotification = async (notificationId) => {
    try {
      const response = await apiService.deleteNotification(notificationId);
      
      if (response.success) {
        const notification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        if (notification && !notification.leida) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  /**
   * Limpiar todas las notificaciones
   */
  const clearAllNotifications = async () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  /**
   * Solicitar permisos de notificación del navegador
   */
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  /**
   * Enviar notificación personalizada
   */
  const sendCustomNotification = (titulo, mensaje, tipo = 'info') => {
    const notificacion = {
      id: Date.now(),
      tipo,
      titulo,
      mensaje,
      fecha: new Date(),
      leida: false
    };
    addNotification(notificacion);
  };

  // Cargar notificaciones al inicializar
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
    }
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestNotificationPermission,
    sendCustomNotification,
    isConnected
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Hook para usar el contexto de notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider');
  }
  
  return context;
};

export default useNotifications;
