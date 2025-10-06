import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios from 'axios';
@Injectable()
export class KonnectService {
  private readonly apiUrl = 'https://api.konnect.com'; // Replace with real Konnect API URL
  private readonly apiKey = process.env.KONNECT_API_KEY; // Add your API key in .env

  /**
   * Create a payment request for a user
   */
  async createPayment(userId: number, plan: string, amount: number) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/payments`,
        {
          user_id: userId,
          plan,
          amount,
          callback_url: process.env.KONNECT_WEBHOOK_URL, // webhook URL
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Return Konnect payment URL
      return {
        paymentId: response.data.id,
        paymentUrl: response.data.payment_url,
      };
    } catch (error) {
      console.error('Konnect payment creation failed', error.response?.data || error.message);
      throw new Error('Failed to create Konnect payment');
    }
  }

  /**
   * Verify webhook signature (if Konnect provides a signature)
   */
  verifyWebhook(signature: string, payload: any) {
    // TODO: Implement signature verification if Konnect provides HMAC/secret
    return true;
  }
}
