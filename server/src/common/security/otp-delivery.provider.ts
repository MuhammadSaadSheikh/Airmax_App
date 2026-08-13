import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const OTP_DELIVERY_PROVIDER = Symbol('OTP_DELIVERY_PROVIDER');

export interface OtpDeliveryProvider {
  send(phone: string, code: string): Promise<void>;
}

/** Fails closed until a real SMS adapter is registered for OTP_DELIVERY_PROVIDER. */
@Injectable()
export class UnavailableOtpDeliveryProvider implements OtpDeliveryProvider {
  async send(_phone: string, _code: string): Promise<void> {
    throw new ServiceUnavailableException('OTP delivery is not configured');
  }
}
