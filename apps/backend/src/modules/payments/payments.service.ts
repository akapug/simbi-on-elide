import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
  ) {}

  async createPaymentIntent(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    return this.stripe.createPaymentIntent(
      amount * 100,
      'usd',
      subscription?.stripeCustomerId,
    );
  }

  async getPaymentMethods(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return [];
    }

    const methods = await this.stripe.listPaymentMethods(subscription.stripeCustomerId);
    return methods.data;
  }

  async createSubscription(userId: string, priceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    let subscription = await this.prisma.subscription.findFirst({ where: { userId } });

    if (!subscription?.stripeCustomerId) {
      const customer = await this.stripe.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
      );

      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          plan: 'premium',
          status: 'active',
        },
      });
    }

    const stripeSubscription = await this.stripe.createSubscription(
      subscription.stripeCustomerId,
      priceId,
    );

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });
  }
}
