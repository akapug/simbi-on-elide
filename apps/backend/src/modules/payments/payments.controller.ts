import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('intent')
  async createPaymentIntent(@Req() req: any, @Body('amount') amount: number) {
    return this.paymentsService.createPaymentIntent(req.user.id, amount);
  }

  @Get('methods')
  async getPaymentMethods(@Req() req: any) {
    return this.paymentsService.getPaymentMethods(req.user.id);
  }

  @Post('subscription')
  async createSubscription(@Req() req: any, @Body('priceId') priceId: string) {
    return this.paymentsService.createSubscription(req.user.id, priceId);
  }
}
