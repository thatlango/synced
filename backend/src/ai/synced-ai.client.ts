import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type Capability = 'analyze' | 'classify' | 'extract' | 'summarize' | 'recommend' | 'draft' | 'explain';
@Injectable()
export class SyncedAiClient {
  constructor(private readonly config: ConfigService) {}
  private cfg() {
    const baseUrl = (this.config.get<string>('TUKU_CORE_INTERNAL_URL') || this.config.get<string>('TUKU_CORE_API_URL') || '').replace(/\/$/, '');
    const key = this.config.get<string>('TUKU_AI_INTEGRATION_KEY');
    if (!baseUrl || !key) throw new ServiceUnavailableException('Synced AI is not configured.');
    return { baseUrl, key };
  }
  async assist(input: { capability: Capability; instruction: string; context: Record<string, unknown>; subjectRef: string }) {
    const { baseUrl, key } = this.cfg();
    const response = await fetch(`${baseUrl}/api/v1/integrations/ai/assist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tuku-product-code': 'synced', 'x-tuku-integration-key': key },
      body: JSON.stringify(input), signal: AbortSignal.timeout(90000),
    });
    const payload: any = await response.json().catch(() => null);
    if (!response.ok) throw new ServiceUnavailableException(payload?.error?.message || `Tuku AI returned ${response.status}`);
    return payload?.data ?? payload;
  }
}
