import { ResponseService } from '../../../utils/response';
import { Response } from 'express';
import { Database } from '../../../database';
import { sendMail } from '../../../services/external/mailer';
import jwt from 'jsonwebtoken';

export class SubscriptionService {
  email: string;
  token: string;
  res: Response;

  constructor(email: string, token: string, res: Response) {
    this.email = email;
    this.token = token;
    this.res = res;
  }

  async subscribe(): Promise<void> {
    try {
      if (!this.email) {
        ResponseService({
          data: null,
          status: 400,
          success: false,
          message: 'Email is required',
          res: this.res,
        });
        return;
      }

      const userName = await Database.User.findOne({
        where: { email: this.email },
        raw: true,
      });
      const subscriber = await Database.Subscriber.findOne({
        where: { email: this.email },
        paranoid: false,
        raw: true,
      });
      if (subscriber?.subscribed === false) {
        await Database.Subscriber.update({ subscribed: true }, { where: { email: this.email } });

        sendMail(
          this.email,
          userName?.username || userName?.name || 'Dear',
          'resubscribed',
          'Welcome back to Menyalo',
        );

        ResponseService({
          data: subscriber,
          status: 200,
          success: true,
          message: 'Subscriber restored',
          res: this.res,
        });
      } else if (subscriber?.subscribed === true) {
        sendMail(
          this.email,
          userName?.username || userName?.name || 'User',
          'existing-subscriber',
          'You are already a cherished member of Menyalo',
        );

        ResponseService({
          data: subscriber,
          status: 200,
          success: true,
          message: 'Subscriber already exists',
          res: this.res,
        });
      } else {
        const newSubscriber = await Database.Subscriber.create({
          email: this.email,
          subscribed: true,
        });
        sendMail(
          this.email,
          userName?.username || userName?.name || 'User',
          'subscribe',
          'You are in! Welcome to Menyalo',
        );

        ResponseService({
          data: newSubscriber,
          status: 200,
          success: true,
          message: 'Subscribed',
          res: this.res,
        });
      }
    } catch (error) {
      const { message, stack } = error as Error;
      ResponseService({
        data: { message, stack },
        success: false,
        status: 500,
        res: this.res,
      });
    }
  }

  async unsubscribe(): Promise<void> {
    try {
      const decoded = jwt.verify(this.token as string, process.env.JWT_SECRET!) as {
        email: string;
      };
      const email = decoded.email;
      const userName = await Database.User.findOne({
        where: { email: email as string },
      });

      await Database.Subscriber.update({ subscribed: false }, { where: { email } });

      ResponseService({
        data: email,
        status: 200,
        success: true,
        message: 'Unsubscribed',
        res: this.res,
      });

      sendMail(
        email,
        userName?.username || userName?.name || 'User',
        'unsubscribe',
        'You have been unsubscribed from Menyalo',
      );
    } catch (error) {
      const { message, stack } = error as Error;
      ResponseService({
        data: { message, stack },
        success: false,
        status: 400,
        message: 'Invalid or expired unsubscribe link.',
        res: this.res,
      });
    }
  }

  async getSubscribers(): Promise<void> {
    try {
      const subscribers = await Database.Subscriber.findAll({
        where: { subscribed: true },
        raw: true,
      });

      if (!subscribers || subscribers.length === 0) {
        ResponseService({
          data: [],
          status: 200,
          success: true,
          message: 'No subscribers found',
          res: this.res,
        });
        return;
      }
      ResponseService({
        data: subscribers,
        status: 200,
        success: true,
        message: `Subscribers: ${subscribers.length}`,
        res: this.res,
      });
    } catch (error) {
      const { message, stack } = error as Error;
      ResponseService({
        data: { message, stack },
        success: false,
        status: 500,
        res: this.res,
      });
    }
  }
}
