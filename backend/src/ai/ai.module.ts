import { Module } from '@nestjs/common';
import { SyncedAiClient } from './synced-ai.client';
@Module({ providers: [SyncedAiClient], exports: [SyncedAiClient] })
export class AiModule {}
