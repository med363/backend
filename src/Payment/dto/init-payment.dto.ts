export type SubscriptionType = 'basic' | 'premium';

export class InitPaymentDto {
  receiverWalletId: string;
  token: string;
  amount: number;
  type: string;
  description: string;
  acceptedPaymentMethods: string[];
  lifespan: number;
  checkoutForm: boolean;
  addPaymentFeesToAmount: boolean;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  orderId: string;
  webhook: string;
  theme: string;
  subscriptionType: SubscriptionType;
  userId?: number;
  artisanId?: number;
  etablissementId?: number;
}