import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/prisma.service';
import * as crypto from 'crypto';
import {
  frontEndUrl,
  groupCampainEmailService,
  tokenCampainEmailService,
} from 'config/constants';
import { catchHandle } from 'src/chore/utils/catchHandle';
import { TemporalTokenPoolService } from 'src/temporal-token-pool/temporal-token-pool.service';
@Injectable()
export class EmailService {
  constructor(
    private readonly mailService: MailerService,
    private prisma: PrismaService,
    private readonly tempTokenPoolService: TemporalTokenPoolService,
  ) {}
  async sendEmail({
    email,
    from,
    subject,
    template,
    context,
  }: {
    email: string;
    from?: string;
    subject: string;
    template: string;
    context?: Record<string, any>;
  }): Promise<void> {
    try {
      console.log(`[EMAIL] Sending email to: ${email}, subject: ${subject}`);
      console.log(`[EMAIL] From: ${from || process.env.EMAIL_USERNAME}`);
      console.log(`[EMAIL] Template: ${template}`);

      // Crear un timeout para evitar esperas largas
      const sendPromise = this.mailService.sendMail({
        to: email,
        from,
        subject,
        template,
        context,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Email timeout - servidor SMTP no responde')),
          15000,
        ); // 15 segundos - más rápido para prod
      });

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[EMAIL] Email sent successfully to: ${email}`);
    } catch (error) {
      // Log específico para diferentes tipos de errores
      console.error(`[EMAIL] Error sending email to ${email}:`, {
        message: error.message,
        code: error.code,
        response: error.response,
        stack: error.stack?.split('\n')[0],
      });

      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        console.error(`[EMAIL] Timeout para ${email}: ${error.message}`);
        throw new Error(
          'Servidor de correo no disponible temporalmente. Intenta de nuevo en unos minutos.',
        );
      } else if (error.code === 'ECONNREFUSED') {
        console.error(
          `[EMAIL] Conexión rechazada para ${email}: ${error.message}`,
        );
        throw new Error('Servicio de correo temporalmente no disponible.');
      } else if (error.code === 'EAUTH') {
        console.error(
          `[EMAIL] Error de autenticación para ${email}: ${error.message}`,
        );
        throw new Error('Error de autenticación del servidor de correo.');
      } else if (error.responseCode) {
        console.error(
          `[EMAIL] SMTP Error ${error.responseCode} para ${email}: ${error.response}`,
        );
        throw new Error(`Error del servidor de correo: ${error.responseCode}`);
      } else {
        console.error(`[EMAIL] Error desconocido para ${email}:`, error);
        throw new Error('Error interno del servidor de correo.');
      }
    }
  }
  async sendEmailVerification(email: string) {
    let token: string;
    try {
      console.log(`[EMAIL] Starting verification email for: ${email}`);
      token = crypto.randomBytes(32).toString('hex');
      const tempToken = await this.tempTokenPoolService.createToken(
        token,
        email,
        'verify_email',
      );
      if (!tempToken) {
        throw new Error('Error creating token');
      } else {
        console.log(
          `[EMAIL] Token created, attempting to send email to: ${email}`,
        );
        await this.sendEmail({
          email,
          subject: 'verifique su correo electronico',
          from: `"Adorador" <${process.env.EMAIL_USERNAME}>`,
          template: 'user-sign_up',
          context: {
            link: `${frontEndUrl}/auth/verify-email?token=${token}`,
          },
        });
        console.log(
          `[EMAIL] Verification email sent successfully to: ${email}`,
        );
      }
    } catch (e) {
      console.error(
        `[EMAIL] Failed to send verification email to ${email}:`,
        e.message,
      );
      console.error(`[EMAIL] Full error:`, e);
      // If email sending failed, clean up the token
      if (token) {
        try {
          await this.tempTokenPoolService.removeTokenFromGlobalPool(
            email,
            'verify_email',
          );
          console.log(`[EMAIL] Cleaned up token for: ${email}`);
        } catch (cleanupError) {
          console.error('Error cleaning up verification token:', cleanupError);
        }
      }
      throw e; // Re-throw the original error
    }
  }
  async sendForgotPasswordEmail(email: string) {
    let tokenCreated = false;
    let token: string;

    try {
      token = crypto.randomBytes(32).toString('hex');
      const tempToken = await this.tempTokenPoolService.createToken(
        token,
        email,
        'forgot_password',
      );
      tokenCreated = true;

      if (!tempToken) {
        throw new Error('Error creating token');
      }

      // Intentar enviar el correo con timeout más corto
      await this.sendEmail({
        email,
        subject: 'Restablecer contraseña',
        from: `"Adorador" <${process.env.EMAIL_USERNAME}>`,
        template: 'forgot-password',
        context: {
          link: `${frontEndUrl}/auth/reset-password?token=${token}`,
        },
      });
    } catch (e) {
      // Si el correo falló después de crear el token, limpiar el token
      if (tokenCreated && token) {
        try {
          await this.tempTokenPoolService.removeTokenFromGlobalPool(
            email,
            'forgot_password',
          );
        } catch (cleanupError) {
          console.error(
            'Error limpiando token tras falla de correo:',
            cleanupError,
          );
        }
      }
      catchHandle(e);
    }
  }

  async subscribeToNewsLetter(email: string) {
    try {
      const response = await fetch(
        `https://api.hubapi.com/contacts/v1/contact/email/${email}/profile`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenCampainEmailService}`,
            'Content-Type': 'application/json',
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        const vid = data.vid;
        const subscribeInfo = data.properties.subscribed_to.value;
        let formatedSubscribeInfo = null;
        if (subscribeInfo.includes(';')) {
          formatedSubscribeInfo = subscribeInfo.split(';');
        } else {
          formatedSubscribeInfo = [subscribeInfo];
        }
        if (!formatedSubscribeInfo.includes(groupCampainEmailService)) {
          formatedSubscribeInfo.push(groupCampainEmailService);
          const response2 = await fetch(
            `https://api.hubapi.com/contacts/v1/contact/vid/${vid}/profile`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenCampainEmailService}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                properties: [
                  {
                    property: 'subscribed_to',
                    value: formatedSubscribeInfo.join(';'),
                  },
                ],
              }),
            },
          );
          if (response2.ok) {
            return {
              message: 'Subscribed successfully',
            };
          }
        }
        return {
          message: 'Already subscribed',
        };
      } else {
        const response3 = await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenCampainEmailService}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              properties: {
                email,
                subscribed_to: groupCampainEmailService,
              },
            }),
          },
        );
        if (response3.ok) {
          return {
            message: 'Subscribed successfully',
          };
        }
      }
    } catch (error) {
      return new Response(JSON.stringify({ message: 'Unknow Error' }), {
        status: 500,
        headers: {
          'content-type': 'application/json',
        },
      });
    }
  }

  // Método para probar la conectividad del servicio de correo
  async testEmailService(): Promise<boolean> {
    try {
      // Crear una promesa de timeout para el test
      const testPromise = this.mailService.sendMail({
        to: 'test-connectivity@example.com',
        from: `"Adorador Test" <${process.env.EMAIL_USERNAME}>`,
        subject: 'Connectivity Test',
        text: 'This is a connectivity test',
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), 10000); // 10 segundos para el test
      });

      await Promise.race([testPromise, timeoutPromise]);
      return true;
    } catch (error) {
      // Si el error es de conectividad, el servicio no está disponible
      if (
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('timeout')
      ) {
        return false;
      }
      // Otros errores (como email inválido) significan que el servicio responde
      return true;
    }
  }
}
