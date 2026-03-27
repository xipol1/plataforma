import { useState, useEffect, useContext, createContext } from 'react';
import { io } from 'socket.io-client';
import apiService from '../services/api';
import { useAuth } from './useAuth';

// Crear contexto de notificaciones
const NotificationsContext = createContext();

// Provider de notificaciones
export const NotificationsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  // Configurar Socket.IO cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user]);

  /**
   * Inicializar conexión Socket.IO
   */
  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    
    const newSocket = io('/', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Conectado al servidor de notificaciones');
      // Unirse a la sala del usuario
      newSocket.emit('join-user-room', user.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor de notificaciones');
    });

    // Escuchar nuevas notificaciones
    newSocket.on('nueva_notificacion', (data) => {
      addNotification(data.datos);
    });

    // Escuchar actualizaciones de anuncios
    newSocket.on('anuncio-actualizado', (data) => {
      const notificacion = {
        id: Date.now(),
        tipo: 'anuncio_actualizado',
        titulo: 'Anuncio Actualizado',
        mensaje: `El anuncio "${data.titulo}" ha sido ${data.estado}`,
        fecha: new Date(),
        leida: false,
        datos: data
      };
      addNotification(notificacion);
    });

    // Escuchar nuevos pagos
    newSocket.on('pago-recibido', (data) => {
      const notificacion = {
        id: Date.now(),
        tipo: 'pago',
        titulo: 'Pago Recibido',
        mensaje: `Has recibido un pago de $${data.monto}`,
        fecha: new Date(),
        leida: false,
        datos: data
      };
      addNotification(notificacion);
    });

    // Escuchar mensajes del sistema
    newSocket.on('mensaje-sistema', (data) => {
      const notificacion = {
        id: Date.now(),
        tipo: 'sistema',
        titulo: data.titulo || 'Mensaje del Sistema',
        mensaje: data.mensaje,
        fecha: new Date(),
        leida: false,
        datos: data
      };
      addNotification(notificacion);
    });

    setSocket(newSocket);
  };

  /**
   * Desconectar Socket.IO
   */
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  /**
   * Cargar notificaciones del servidor
   */
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      
      if (response.success) {
        setNotifications(response.notificaciones);
        setUnreadCount(response.notificaciones.filter(n => !n.leida).length);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
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
      console.error('Error marcando notificación como leída:', error);
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
      console.error('Error marcando todas las notificaciones como leídas:', error);
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
      console.error('Error eliminando notificación:', error);
    }
  };

  /**
   * Limpiar todas las notificaciones
   */
  const clearAllNotifications = async () => {
    try {
      const response = await apiService.clearAllNotifications();
      
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error limpiando notificaciones:', error);
    }
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
    }
  }, [isAuthenticated]);

  const value = {
    notifications,
    unreadCount,
    loading,
    socket,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    requestNotificationPermission,
    sendCustomNotification,
    isConnected: socket?.connected || false
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