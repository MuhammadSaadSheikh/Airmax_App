import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService, private readonly redis: RedisService) {}
  async register(input: {name:string;phone:string;email?:string;password:string}) {
    const { password, ...profile } = input;
    const user = await this.prisma.user.create({ data: { ...profile, passwordHash: await hash(password, 12) } });
    return this.tokens(user);
  }
  async login(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { OR: [{phone:identifier},{email:identifier}] } });
    if (!user || !(await compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return this.tokens(user);
  }
  async requestOtp(phone: string) { const code = randomInt(100000,999999).toString(); await this.redis.set(`otp:${phone}`,code,'EX',300); return { challengeId: createHash('sha256').update(phone+code).digest('hex'), developmentCode: process.env.NODE_ENV==='production'?undefined:code }; }
  async verifyOtp(phone:string,code:string) { const expected=await this.redis.get(`otp:${phone}`); if(expected!==code) throw new UnauthorizedException('Invalid OTP'); await this.redis.del(`otp:${phone}`); const user=await this.prisma.user.findUniqueOrThrow({where:{phone}}); return this.tokens(user); }
  private async tokens(user:{id:string;role:string;phone:string}) {
    const payload={sub:user.id,role:user.role,phone:user.phone};
    const accessToken=await this.jwt.signAsync(payload,{secret:this.config.getOrThrow('JWT_ACCESS_SECRET'),expiresIn:'15m'});
    const refreshToken=await this.jwt.signAsync(payload,{secret:this.config.getOrThrow('JWT_REFRESH_SECRET'),expiresIn:'30d'});
    await this.prisma.refreshToken.create({data:{userId:user.id,tokenHash:createHash('sha256').update(refreshToken).digest('hex'),expiresAt:new Date(Date.now()+2_592_000_000)}});
    return {accessToken,refreshToken,user:{id:user.id,role:user.role,phone:user.phone}};
  }
}
