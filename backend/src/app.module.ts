import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HouseholdsModule } from './households/households.module';
import { WalletsModule } from './wallets/wallets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LedgerModule } from './ledger/ledger.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ForecastsModule } from './forecasts/forecasts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60),
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', undefined),
        },
      }),
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HouseholdsModule,
    WalletsModule,
    TransactionsModule,
    LedgerModule,
    IngestionModule,
    SubscriptionsModule,
    BillsModule,
    PaymentsModule,
    BudgetsModule,
    ForecastsModule,
    AnalyticsModule,
    AlertsModule,
    ReconciliationModule,
    SearchModule,
  ],
})
export class AppModule {}
