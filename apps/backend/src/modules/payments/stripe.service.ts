import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe | null = null;
  private readonly logger = new Logger(StripeService.name);
  private enabled = false;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.get('STRIPE_SECRET_KEY');

    if (!secretKey || secretKey.startsWith('sk_test_your')) {
      this.logger.warn('Stripe not configured - payment features will be disabled. Set STRIPE_SECRET_KEY to enable.');
      this.enabled = false;
      return;
    }

    try {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
      });
      this.enabled = true;
      this.logger.log('Stripe initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Stripe:', error.message);
      this.enabled = false;
    }
  }

  private checkEnabled() {
    if (!this.enabled || !this.stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.');
    }
  }

  async createCustomer(email: string, name?: string) {
    this.checkEnabled();
    return this.stripe.customers.create({ email, name });
  }

  async createPaymentIntent(amount: number, currency = 'usd', customerId?: string) {
    this.checkEnabled();
    return this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
    });
  }

  async createSetupIntent(customerId: string) {
    this.checkEnabled();
    return this.stripe.setupIntents.create({ customer: customerId });
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    this.checkEnabled();
    return this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  async listPaymentMethods(customerId: string) {
    this.checkEnabled();
    return this.stripe.paymentMethods.list({ customer: customerId, type: 'card' });
  }

  async createSubscription(customerId: string, priceId: string) {
    this.checkEnabled();
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  async cancelSubscription(subscriptionId: string) {
    this.checkEnabled();
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
