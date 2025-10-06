import { Body, Controller, Post, Get, Query, Param, Res, HttpStatus, Logger } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpService } from '@nestjs/axios';
import type { Response } from 'express';
import { InitPaymentDto } from './dto/init-payment.dto';
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(private readonly paymentService: PaymentService, private readonly httpService: HttpService) {}

  @Post('init-payment')
  async initPayment(@Body() dto: InitPaymentDto) {
    // Simulate Konnect API response
    return {
      payUrl: 'https://dev.konnect.network/admin/pay?payment_ref=5e870a611631215d633fe083',
      paymentRef: '60889219a388f75c94a943ec',
    };
    // In real code, call PaymentService to handle API integration
    // return this.paymentService.initPayment(dto);
  }

  @Get('webhook')
  async paymentWebhook(@Query('payment_ref') paymentRef: string) {
    this.logger.log(`Webhook received: payment_ref=${paymentRef}`);
    if (!paymentRef) {
      this.logger.warn('Missing payment_ref in webhook');
      return { error: 'Missing payment_ref' };
    }
    const konnectApiUrl = `https://api.konnect.network/payments/${paymentRef}`;
    try {
      const response = await this.httpService.get(konnectApiUrl).toPromise();
      if (!response || !response.data) {
        this.logger.warn(`No payment found for payment_ref=${paymentRef}`);
        return { paymentRef, konnectStatus: 'UNKNOWN', konnectDetails: null };
      }
      this.logger.log(`Payment status for ${paymentRef}: ${response.data.status}`);
      // TODO: Implement idempotence and update DB if needed
      return { paymentRef, konnectStatus: response.data.status, konnectDetails: response.data };
    } catch (error) {
      this.logger.error(`Error fetching payment status for ${paymentRef}: ${error.message}`);
      return { error: 'Failed to fetch payment status', details: error.message };
    }
  }

  @Get(':paymentId')
  async getPaymentDetails(@Param('paymentId') paymentId: string, @Res() res: Response) {
    this.logger.log(`Fetching payment details for paymentId=${paymentId}`);
    const konnectApiUrl = `https://api.konnect.network/payments/${paymentId}`;
    try {
      const response = await this.httpService.get(konnectApiUrl, {
        headers: { 'Authorization': 'Bearer YOUR_KONNECT_API_KEY' },
      }).toPromise();
      if (!response || !response.data) {
        this.logger.warn(`Payment not found: ${paymentId}`);
        return res.status(HttpStatus.NOT_FOUND).json({ error: 'Payment not found' });
      }
      return res.status(HttpStatus.OK).json({ payment: response.data });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.logger.error(`Authentication failed for paymentId=${paymentId}`);
        return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid API key' });
      }
      this.logger.error(`Error fetching payment details for ${paymentId}: ${error.message}`);
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'Payment not found', details: error.message });
    }
  }
}
