import { Module } from '@nestjs/common';
import { BasketsController } from './baskets.controller';
import { BasketsService } from './baskets.service';
@Module({ controllers: [BasketsController], providers: [BasketsService], exports: [BasketsService] })
export class BasketsModule {}
