import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PayBillDto, DirectPaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private transactions: TransactionsService,
  ) {}

  async payBill(userId: string, dto: PayBillDto) {
    const bill = await this.prisma.bill.findUnique({ where: { id: dto.billId } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.isPaid) throw new BadRequestException('Bill already paid');

    const wallet = await this.prisma.wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const referenceId = uuidv4();

    return this.prisma.$transaction(async (tx) => {
      // Simulate payment processing
      const paymentResult = await this.simulatePayment(dto.provider, dto.accountRef, dto.amount);

      const payment = await tx.payment.create({
        data: {
          userId,
          walletId: dto.walletId,
          billId: dto.billId,
          amount: dto.amount,
          provider: dto.provider,
          accountRef: dto.accountRef,
          status: paymentResult.success ? 'completed' : 'failed',
          referenceId,
          failReason: paymentResult.error,
        },
      });

      if (paymentResult.success) {
        // Deduct from wallet via ledger
        await this.transactions.create(userId, {
          walletId: dto.walletId,
          type: 'debit',
          amount: dto.amount,
          category: 'bill_payment',
          description: `Bill payment: ${bill.name}`,
          merchant: dto.provider,
          source: 'manual',
          referenceId,
        });

        // Mark bill as paid
        await tx.bill.update({
          where: { id: dto.billId },
          data: { isPaid: true, paidAt: new Date() },
        });
      }

      return payment;
    });
  }

  async directPayment(userId: string, dto: DirectPaymentDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: dto.walletId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const referenceId = uuidv4();
    const paymentResult = await this.simulatePayment(dto.provider, dto.accountRef, dto.amount);

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        walletId: dto.walletId,
        amount: dto.amount,
        provider: dto.provider,
        accountRef: dto.accountRef,
        status: paymentResult.success ? 'completed' : 'failed',
        referenceId,
        failReason: paymentResult.error,
      },
    });

    if (paymentResult.success) {
      await this.transactions.create(userId, {
        walletId: dto.walletId,
        type: 'debit',
        amount: dto.amount,
        category: 'bill_payment',
        description: dto.description || `Payment to ${dto.provider}`,
        merchant: dto.provider,
        source: 'manual',
        referenceId,
      });
    }

    return payment;
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { bill: { select: { name: true, category: true } } },
      }),
      this.prisma.payment.count({ where: { userId } }),
    ]);
    return { payments, total, page, limit };
  }

  private async simulatePayment(
    provider: string,
    accountRef: string,
    amount: number,
  ): Promise<{ success: boolean; error?: string }> {
    // Mock payment processing with 95% success rate
    this.logger.log(`Processing payment: ${provider} | ${accountRef} | UGX ${amount}`);
    await new Promise((r) => setTimeout(r, 100)); // simulate API call
    const success = Math.random() > 0.05;
    return success
      ? { success: true }
      : { success: false, error: 'Payment gateway timeout. Please retry.' };
  }
}
