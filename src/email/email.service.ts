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
@Injectable()
export class EmailService {
  constructor(
    private readonly mailService: MailerService,
    private prisma: PrismaService,
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
      await this.mailService.sendMail({
        to: email,
        from,
        subject,
        template,
        context,
      });
    } catch (error) {
      catchHandle(error);
    }
  }
  async sendEmailVerification(email: string) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tempToken = await this.prisma.temporal_token_pool.create({
        data: {
          token,
          userEmail: email,
          type: 'email_verification',
        },
      });
      if (!tempToken) {
        throw new Error('Error creating token');
      } else {
        await this.sendEmail({
          email,
          subject: 'verifique su correo electronico',
          from: `"Adorador" <${process.env.EMAIL_USERNAME}>`,
          template: 'user-sign_up',
          context: {
            link: `${frontEndUrl}/auth/verify-email?token=${token}`,
          },
        });
      }
    } catch (e) {
      catchHandle(e);
    }
  }
  async sendForgotPasswordEmail(email: string) {
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const tempToken = await this.prisma.temporal_token_pool.create({
        data: {
          token,
          userEmail: email,
          type: 'forgot_password',
        },
      });
      if (!tempToken) {
        throw new Error('Error creating token');
      }
      this.sendEmail({
        email,
        subject: 'Restablecer contraseña',
        from: `"Adorador" <${process.env.EMAIL_USERNAME}>`,
        template: 'forgot-password',
        context: {
          link: `${frontEndUrl}/auth/reset-password?token=${token}`,
        },
      });
    } catch (e) {
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
}
