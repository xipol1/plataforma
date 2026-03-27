const nodemailer = require('nodemailer');
const config = require('../config/config');
const fs = require('fs').promises;
const path = require('path');

/**
 * Servicio de envío de emails
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.inicializar();
  }

  /**
   * Inicializar el transportador de email
   */
  async inicializar() {
    try {
      // Configuración del transportador según el proveedor
      if (config.email.service === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.email.user,
            pass: config.email.password
          },
          secure: true,
          tls: {
            rejectUnauthorized: false
          }
        });
      } else if (config.email.service === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.password
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      } else {
        // Configuración para desarrollo (Ethereal Email)
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        console.log('📧 Usando Ethereal Email para desarrollo');
        console.log('Usuario:', testAccount.user);
        console.log('Contraseña:', testAccount.pass);
      }

      // Crear plantillas por defecto si no existen
      await this.crearPlantillasDefecto();

      // Verificar la conexión
      if (config.server.env !== 'test') {
        await this.verificarConexion();
      }
    } catch (error) {
      console.error('Error al inicializar el servicio de email:', error);
      this.transporter = null;
    }
  }

  /**
   * Verificar conexión con el servidor de email
   */
  async verificarConexion() {
    try {
      if (!this.transporter) {
        throw new Error('Transportador de email no inicializado');
      }

      await this.transporter.verify();
      console.log('✅ Conexión con servidor de email establecida');
      return true;
    } catch (error) {
      console.error('❌ Error al conectar con servidor de email:', error.message);
      return false;
    }
  }

  /**
   * Enviar email genérico
   */
  async enviarEmail(opciones) {
    try {
      if (!this.transporter) {
        throw new Error('Servicio de email no disponible');
      }

      const opcionesEmail = {
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to: opciones.para,
        subject: opciones.asunto,
        html: opciones.html,
        text: opciones.texto,
        attachments: opciones.adjuntos || []
      };

      const resultado = await this.transporter.sendMail(opcionesEmail);
      
      // En desarrollo, mostrar URL de previsualización
      if (config.server.env === 'development' && config.email.service === 'ethereal') {
        console.log('📧 Email enviado:', nodemailer.getTestMessageUrl(resultado));
      }

      return {
        exito: true,
        messageId: resultado.messageId,
        previewUrl: config.server.env === 'development' ? nodemailer.getTestMessageUrl(resultado) : null
      };
    } catch (error) {
      console.error('Error al enviar email:', error);
      throw new Error('Error al enviar email: ' + error.message);
    }
  }

  /**
   * Cargar plantilla de email
   */
  async cargarPlantilla(nombrePlantilla, variables = {}) {
    try {
      const rutaPlantilla = path.join(__dirname, '..', 'templates', 'emails', `${nombrePlantilla}.html`);
      let contenido = await fs.readFile(rutaPlantilla, 'utf8');

      // Reemplazar variables en la plantilla
      Object.keys(variables).forEach(variable => {
        const regex = new RegExp(`{{${variable}}}`, 'g');
        contenido = contenido.replace(regex, variables[variable]);
      });

      // Reemplazar variables de configuración
      contenido = contenido.replace(/{{APP_NAME}}/g, config.app.nombre);
      contenido = contenido.replace(/{{APP_URL}}/g, config.frontend.url);
      contenido = contenido.replace(/{{SUPPORT_EMAIL}}/g, config.email.support);
      contenido = contenido.replace(/{{CURRENT_YEAR}}/g, new Date().getFullYear());

      return contenido;
    } catch (error) {
      console.error(`Error al cargar plantilla ${nombrePlantilla}:`, error);
      // Retornar plantilla básica si no se puede cargar
      return this.generarPlantillaBasica(variables);
    }
  }

  /**
   * Generar plantilla básica cuando no se puede cargar desde archivo
   */
  generarPlantillaBasica(variables) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${config.app.nombre}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${config.app.nombre}</h1>
          </div>
          <div class="content">
            ${variables.contenido || 'Contenido del email'}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${config.app.nombre}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Enviar email de verificación
   */
  async enviarEmailVerificacion(email, nombre, token) {
    try {
      const urlVerificacion = `${config.frontend.url}/verificar-email/${token}`;
      
      const contenido = await this.cargarPlantilla('verificacion', {
        nombre,
        urlVerificacion,
        token
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Verifica tu cuenta en ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async enviarEmailRecuperacion(email, nombre, token) {
    try {
      const urlRecuperacion = `${config.frontend.url}/restablecer-password/${token}`;
      
      const contenido = await this.cargarPlantilla('recuperacion', {
        nombre,
        urlRecuperacion,
        token,
        tiempoExpiracion: '1 hora'
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Recupera tu contraseña - ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de verificación
   */
  async enviarEmailVerificacion(email, nombre, token) {
    try {
      const urlVerificacion = `${config.frontend.url}/verificar-email/${token}`;
      
      const contenido = await this.cargarPlantilla('verificacion', {
        nombre,
        urlVerificacion
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Verifica tu cuenta - ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar email de verificación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async enviarEmailRecuperacion(email, nombre, token) {
    try {
      const urlRecuperacion = `${config.frontend.url}/restablecer-password/${token}`;
      
      const contenido = await this.cargarPlantilla('recuperacion', {
        nombre,
        urlRecuperacion,
        tiempoExpiracion: '1 hora'
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Restablecer contraseña - ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar email de recuperación:', error);
      throw error;
    }
  }

  /**
   * Enviar email de bienvenida
   */
  async enviarEmailBienvenida(email, nombre) {
    try {
      const contenido = await this.cargarPlantilla('bienvenida', {
        nombre,
        urlDashboard: `${config.frontend.url}/dashboard`,
        urlSoporte: `${config.frontend.url}/soporte`
      });

      return await this.enviarEmail({
        para: email,
        asunto: `¡Bienvenido a ${config.app.nombre}!`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar email de bienvenida:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de nuevo anuncio
   */
  async enviarNotificacionAnuncio(email, nombre, anuncio) {
    try {
      const contenido = await this.cargarPlantilla('nuevo-anuncio', {
        nombre,
        tituloAnuncio: anuncio.titulo,
        descripcionAnuncio: anuncio.descripcion,
        presupuesto: anuncio.presupuesto,
        urlAnuncio: `${config.frontend.url}/anuncios/${anuncio._id}`,
        fechaLimite: anuncio.fechaLimite ? new Date(anuncio.fechaLimite).toLocaleDateString('es-ES') : 'No especificada'
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Nuevo anuncio disponible: ${anuncio.titulo}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar notificación de anuncio:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de aprobación de anuncio
   */
  async enviarNotificacionAprobacion(email, nombre, anuncio, aprobado) {
    try {
      const estado = aprobado ? 'aprobado' : 'rechazado';
      const contenido = await this.cargarPlantilla('aprobacion-anuncio', {
        nombre,
        tituloAnuncio: anuncio.titulo,
        estado,
        urlAnuncio: `${config.frontend.url}/anuncios/${anuncio._id}`,
        comentarios: anuncio.comentariosAprobacion || ''
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Tu anuncio ha sido ${estado} - ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar notificación de aprobación:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación de pago
   */
  async enviarNotificacionPago(email, nombre, transaccion) {
    try {
      const contenido = await this.cargarPlantilla('notificacion-pago', {
        nombre,
        montoTransaccion: transaccion.monto,
        tipoTransaccion: transaccion.tipo,
        fechaTransaccion: new Date(transaccion.fechaCreacion).toLocaleDateString('es-ES'),
        idTransaccion: transaccion._id,
        urlTransaccion: `${config.frontend.url}/transacciones/${transaccion._id}`
      });

      return await this.enviarEmail({
        para: email,
        asunto: `Confirmación de ${transaccion.tipo} - ${config.app.nombre}`,
        html: contenido
      });
    } catch (error) {
      console.error('Error al enviar notificación de pago:', error);
      throw error;
    }
  }

  /**
   * Enviar email de contacto/soporte
   */
  async enviarEmailContacto(datosContacto) {
    try {
      const contenido = await this.cargarPlantilla('contacto', {
        nombre: datosContacto.nombre,
        email: datosContacto.email,
        asunto: datosContacto.asunto,
        mensaje: datosContacto.mensaje,
        fecha: new Date().toLocaleDateString('es-ES')
      });

      return await this.enviarEmail({
        para: config.email.support,
        asunto: `Nuevo mensaje de contacto: ${datosContacto.asunto}`,
        html: contenido,
        replyTo: datosContacto.email
      });
    } catch (error) {
      console.error('Error al enviar email de contacto:', error);
      throw error;
    }
  }

  /**
   * Enviar email masivo (newsletter, anuncios)
   */
  async enviarEmailMasivo(destinatarios, asunto, contenido) {
    try {
      const resultados = [];
      const loteSize = 50; // Enviar en lotes de 50
      
      for (let i = 0; i < destinatarios.length; i += loteSize) {
        const lote = destinatarios.slice(i, i + loteSize);
        
        const promesas = lote.map(async (destinatario) => {
          try {
            const contenidoPersonalizado = contenido.replace(/{{nombre}}/g, destinatario.nombre);
            
            const resultado = await this.enviarEmail({
              para: destinatario.email,
              asunto,
              html: contenidoPersonalizado
            });
            
            return { email: destinatario.email, exito: true, messageId: resultado.messageId };
          } catch (error) {
            console.error(`Error al enviar email a ${destinatario.email}:`, error);
            return { email: destinatario.email, exito: false, error: error.message };
          }
        });
        
        const resultadosLote = await Promise.allSettled(promesas);
        resultados.push(...resultadosLote.map(r => r.value || r.reason));
        
        // Pausa entre lotes para evitar límites de rate
        if (i + loteSize < destinatarios.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const exitosos = resultados.filter(r => r.exito).length;
      const fallidos = resultados.filter(r => !r.exito).length;
      
      console.log(`📧 Email masivo completado: ${exitosos} exitosos, ${fallidos} fallidos`);
      
      return {
        total: destinatarios.length,
        exitosos,
        fallidos,
        resultados
      };
    } catch (error) {
      console.error('Error en envío masivo:', error);
      throw error;
    }
  }

  /**
   * Validar dirección de email
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Obtener estadísticas de emails enviados
   */
  async obtenerEstadisticas() {
    // Esta función podría conectarse a una base de datos para obtener estadísticas reales
    return {
      emailsEnviados: 0,
      emailsExitosos: 0,
      emailsFallidos: 0,
      tasaExito: 0,
      ultimoEnvio: null
    };
  }

  /**
   * Crear plantillas de email por defecto
   */
  async crearPlantillasDefecto() {
    const plantillas = {
      'verificacion.html': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verificar Email - {{APP_NAME}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
              <h1>{{APP_NAME}}</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2>¡Hola {{nombre}}!</h2>
              <p>Gracias por registrarte en {{APP_NAME}}. Para completar tu registro, necesitas verificar tu dirección de email.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{urlVerificacion}}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">Verificar Email</a>
              </p>
              <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666;">{{urlVerificacion}}</p>
              <p><strong>Este enlace expirará en 24 horas.</strong></p>
            </div>
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>&copy; {{CURRENT_YEAR}} {{APP_NAME}}. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'recuperacion.html': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Recuperar Contraseña - {{APP_NAME}}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1>{{APP_NAME}}</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2>¡Hola {{nombre}}!</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="{{urlRecuperacion}}" style="display: inline-block; padding: 12px 24px; background: #dc3545; color: white; text-decoration: none; border-radius: 4px;">Restablecer Contraseña</a>
              </p>
              <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #666;">{{urlRecuperacion}}</p>
              <p><strong>Este enlace expirará en {{tiempoExpiracion}}.</strong></p>
              <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            </div>
            <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>&copy; {{CURRENT_YEAR}} {{APP_NAME}}. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const directorioTemplates = path.join(__dirname, '..', 'templates', 'emails');
      
      // Crear directorio si no existe
      await fs.mkdir(directorioTemplates, { recursive: true });
      
      // Crear plantillas
      for (const [nombre, contenido] of Object.entries(plantillas)) {
        const rutaArchivo = path.join(directorioTemplates, nombre);
        await fs.writeFile(rutaArchivo, contenido.trim());
      }
      
      console.log('✅ Plantillas de email creadas exitosamente');
    } catch (error) {
      console.error('Error al crear plantillas de email:', error);
    }
  }
}

// Crear instancia singleton
const emailService = new EmailService();

module.exports = emailService;