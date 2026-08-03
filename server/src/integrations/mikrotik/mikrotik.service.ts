import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MikroTikService {
  constructor(private readonly config: ConfigService) {}
  private async command(path: string, body: object) {
    const base = this.config.get<string>('MIKROTIK_BASE_URL');
    if (!base) return { queued: true, reason: 'MikroTik adapter is not configured' };
    const auth = Buffer.from(`${this.config.get('MIKROTIK_USERNAME')}:${this.config.get('MIKROTIK_PASSWORD')}`).toString('base64');
    const response = await fetch(`${base.replace(/\/$/,'')}/rest/${path}`, { method:'POST', headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(8_000) });
    if (!response.ok) throw new ServiceUnavailableException('Network provisioning failed');
    return response.json() as Promise<unknown>;
  }
  activate(username:string,profile:string){return this.command('ppp/secret/set',{'.id':username,disabled:'false',profile})}
  suspend(username:string){return this.command('ppp/secret/set',{'.id':username,disabled:'true'})}
  status(username:string){return this.command('ppp/active/print',{'?name':username})}
}
