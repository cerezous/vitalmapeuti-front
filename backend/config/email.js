const nodemailer = require('nodemailer');

// Cargar variables de entorno
require('dotenv').config();

// Validación de configuración de correo
function validarConfiguracionCorreo() {
    const configuracionRequerida = {
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS
    };

    const faltantes = Object.keys(configuracionRequerida).filter(
        key => !configuracionRequerida[key]
    );

    if (faltantes.length > 0) {
        console.warn('⚠️ Variables de entorno faltantes para correo:', faltantes);
        return false;
    }

    return true;
}

// Configuración del transporter de correo
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usar servicio Gmail directamente
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER || 'mcerezopr@gmail.com',
        pass: process.env.SMTP_PASS // Contraseña de aplicación de Gmail
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verificar configuración del transporter
async function verificarConexionCorreo() {
    try {
        if (!validarConfiguracionCorreo()) {
            console.warn('⚠️ Configuración de correo incompleta - Correo deshabilitado');
            return false;
        }

        // Verificar si la contraseña es un placeholder
        if (process.env.SMTP_PASS === 'tu-contraseña-app-gmail' || 
            process.env.SMTP_PASS === 'tu_password_de_aplicacion' ||
            process.env.SMTP_PASS === 'disabled') {
            console.warn('⚠️ Contraseña de correo no configurada - Correo deshabilitado');
            return false;
        }

        await transporter.verify();
        console.log('✅ Servicio de correo configurado correctamente');
        return true;
    } catch (error) {
        console.warn('⚠️ Error en configuración de correo:', error.message);
        console.warn('📧 Para habilitar correo, configura SMTP_PASS con contraseña de aplicación de Gmail');
        return false;
    }
}

// Inicializar verificación
verificarConexionCorreo();

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para reintentar envío de correo
async function enviarConReintentos(mailOptions, maxReintentos = 3) {
    for (let intento = 1; intento <= maxReintentos; intento++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId, intentos: intento };
        } catch (error) {
            console.warn(`⚠️ Intento ${intento} de ${maxReintentos} fallido:`, error.message);
            
            if (intento === maxReintentos) {
                console.error('❌ Todos los intentos de envío fallaron');
                return { success: false, error: error.message, intentos: intento };
            }
            
            // Esperar antes del siguiente intento (backoff exponencial)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, intento) * 1000));
        }
    }
}

// Función para enviar correo de bienvenida
async function enviarCorreoBienvenida(usuario, contraseña) {
    // Verificar si el correo está habilitado
    const correoHabilitado = await verificarConexionCorreo();
    if (!correoHabilitado) {
        console.log('📧 Correo deshabilitado - Saltando envío de bienvenida');
        return { success: true, message: 'Correo deshabilitado - Usuario creado sin notificación' };
    }

    // Validar email del destinatario
    const emailDestinatario = usuario.correo || usuario.email;
    if (!emailDestinatario || !validarEmail(emailDestinatario)) {
        return { success: false, error: `Dirección de correo inválida: ${emailDestinatario}` };
    }

    const mailOptions = {
        from: `"VitalMape UTI" <${process.env.SMTP_USER || 'mcerezopr@gmail.com'}>`,
        to: emailDestinatario,
        subject: 'Bienvenido a VitalMape - Sistema de Gestión UTI',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4f46e5; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 2rem;">
                        <i style="margin-right: 10px;">🏥</i>
                        VitalMape
                    </h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Sistema de Gestión UTI</p>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333; margin-bottom: 20px;">¡Bienvenido/a ${usuario.nombres}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Tu cuenta ha sido creada exitosamente en VitalMape. A continuación encontrarás 
                        tus credenciales de acceso:
                    </p>
                    
                    <div style="background: white; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #333; margin-bottom: 15px;">Credenciales de Acceso</h3>
                        <p style="margin: 5px 0;"><strong>Usuario:</strong> ${usuario.usuario}</p>
                        <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${contraseña}</p>
                        <p style="margin: 5px 0;"><strong>Estamento:</strong> ${usuario.estamento}</p>
                    </div>
                    
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                           style="background: #4f46e5; 
                                  color: white; 
                                  padding: 12px 30px; 
                                  text-decoration: none; 
                                  display: inline-block;
                                  font-weight: bold;">
                            Acceder al Sistema
                        </a>
                    </div>
                </div>
                
                <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 0.9rem;">
                    <p style="margin: 0;">
                        Este es un correo automático del sistema VitalMape. 
                        Por favor, no respondas a este mensaje.
                    </p>
                </div>
            </div>
        `
    };

    return await enviarConReintentos(mailOptions);
}

// Función para enviar correo de recuperación de contraseña
async function enviarCorreoRecuperacion(usuario, token) {
    // Verificar si el correo está habilitado
    const correoHabilitado = await verificarConexionCorreo();
    if (!correoHabilitado) {
        console.log('📧 Correo deshabilitado - Saltando envío de recuperación');
        return { success: true, message: 'Correo deshabilitado - Token generado sin notificación' };
    }

    // Validar email del destinatario
    const emailDestinatario = usuario.correo || usuario.email;
    if (!emailDestinatario || !validarEmail(emailDestinatario)) {
        return { success: false, error: `Dirección de correo inválida: ${emailDestinatario}` };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: `"VitalMape UTI" <${process.env.SMTP_USER || 'mcerezopr@gmail.com'}>`,
        to: emailDestinatario,
        subject: 'Recuperación de Contraseña - VitalMape',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4f46e5; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 2rem;">
                        <i style="margin-right: 10px;">🔐</i>
                        Recuperación de Contraseña
                    </h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hola ${usuario.nombres},</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Has solicitado recuperar tu contraseña en VitalMape. 
                        Haz clic en el botón de abajo para restablecer tu contraseña:
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: #4f46e5; 
                                  color: white; 
                                  padding: 12px 30px; 
                                  text-decoration: none; 
                                  display: inline-block;
                                  font-weight: bold;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    
                    <div style="background: #fef3c7; padding: 15px; margin: 20px 0;">
                        <p style="color: #92400e; margin: 0;">
                            <strong>⏰ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
                        </p>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9rem;">
                        Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                    </p>
                </div>
                
                <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 0.9rem;">
                    <p style="margin: 0;">
                        Este es un correo automático del sistema VitalMape. 
                        Por favor, no respondas a este mensaje.
                    </p>
                </div>
            </div>
        `
    };

    return await enviarConReintentos(mailOptions);
}

// Función para enviar notificaciones generales
async function enviarNotificacion(destinatarios, asunto, mensaje) {
    // Verificar si el correo está habilitado
    const correoHabilitado = await verificarConexionCorreo();
    if (!correoHabilitado) {
        console.log('📧 Correo deshabilitado - Saltando envío de notificación');
        return { success: true, message: 'Correo deshabilitado - Notificación no enviada' };
    }

    // Validar que hay destinatarios
    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
        return { success: false, error: 'No se han proporcionado destinatarios válidos' };
    }

    // Validar emails de destinatarios
    const destinatariosValidos = destinatarios.filter(email => validarEmail(email));
    if (destinatariosValidos.length === 0) {
        return { success: false, error: 'No se encontraron direcciones de correo válidas' };
    }

    if (destinatariosValidos.length < destinatarios.length) {
        console.warn(`⚠️ Algunos destinatarios tienen emails inválidos. Válidos: ${destinatariosValidos.length}/${destinatarios.length}`);
    }

    const mailOptions = {
        from: `"VitalMape UTI" <${process.env.SMTP_USER || 'mcerezopr@gmail.com'}>`,
        to: destinatariosValidos.join(', '),
        subject: asunto,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #4f46e5; color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 2rem;">
                        <i style="margin-right: 10px;">📢</i>
                        ${asunto}
                    </h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <div style="background: white; padding: 20px;">
                        ${mensaje}
                    </div>
                </div>
                
                <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 0.9rem;">
                    <p style="margin: 0;">
                        Sistema VitalMape - Gestión UTI
                    </p>
                </div>
            </div>
        `
    };

    return await enviarConReintentos(mailOptions);
}

module.exports = {
    enviarCorreoBienvenida,
    enviarCorreoRecuperacion,
    enviarNotificacion,
    verificarConexionCorreo
};
