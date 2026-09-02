package com.tukutuku.synced

import com.tukutuku.synced.sms.SmsTransactionParser
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsTransactionParserTest {
    @Test
    fun parsesMtnCredit() {
        val result = SmsTransactionParser.parse(
            "MTN MoMo",
            "You have received UGX 50,000 from JANE DOE. Your balance is UGX 60,000",
            1234,
        )!!

        assertEquals("credit", result.type)
        assertEquals(50000.0, result.amount, 0.01)
        assertEquals("mtn", result.source)
        assertTrue(result.referenceId!!.length == 64)
    }

    @Test
    fun parsesAirtelDebit() {
        val result = SmsTransactionParser.parse(
            "AirtelMoney",
            "You have paid UGX 12,500 to SHOP ABC. Available balance UGX 30,000",
            1234,
        )!!

        assertEquals("debit", result.type)
        assertEquals(12500.0, result.amount, 0.01)
        assertEquals("airtel", result.source)
    }

    @Test
    fun recognisesBankSalaryAsIncome() {
        val result = SmsTransactionParser.parse(
            "Stanbic Bank",
            "Your salary of UGX 1,500,000 has been credited to your account. Available balance UGX 1,800,000.",
            1234,
        )!!

        assertEquals("credit", result.type)
        assertEquals("sms", result.source)
        assertTrue(result.description.startsWith("Salary income received"))
    }

    @Test
    fun recognisesWaterBillFromProviderClue() {
        val result = SmsTransactionParser.parse(
            "MTN MoMo",
            "MTN MoMo: Payment of UGX 45,000 for NWSC-00312 received. Your balance is UGX 90,000.",
            1234,
        )!!

        assertEquals("debit", result.type)
        assertTrue(result.description.startsWith("Water bill payment"))
    }

    @Test
    fun recognisesRefundAsCreditNotDebit() {
        val result = SmsTransactionParser.parse(
            "Centenary Bank",
            "UGX 20,000 has been refunded to your account after a reversed card transaction.",
            1234,
        )!!

        assertEquals("credit", result.type)
        assertTrue(result.description.startsWith("Refund or reversal received"))
    }

    @Test
    fun recognisesLoanDisbursementAndOutstandingBalance() {
        val result = SmsTransactionParser.parse(
            "Village SACCO",
            "Your loan disbursement of UGX 1,000,000 has been credited. Outstanding loan balance UGX 1,100,000.",
            1234,
        )!!

        assertEquals("credit", result.type)
        assertEquals(1000000.0, result.amount, 0.01)
        assertEquals("loan", result.financialKind)
        assertEquals("loan_disbursement", result.financialSubtype)
        assertEquals(1100000.0, result.outstandingBalance!!, 0.01)
        assertTrue(result.description.startsWith("Loan disbursement received"))
    }

    @Test
    fun picksRepaymentInsteadOfEarlierOutstandingBalanceAndSplitsComponents() {
        val result = SmsTransactionParser.parse(
            "Pride Microfinance",
            "Outstanding loan balance UGX 900,000. Loan repayment of UGX 100,000 was deducted from your account. Principal UGX 80,000 interest UGX 20,000.",
            1234,
        )!!

        assertEquals("debit", result.type)
        assertEquals(100000.0, result.amount, 0.01)
        assertEquals("loan", result.financialKind)
        assertEquals("loan_repayment", result.financialSubtype)
        assertEquals(80000.0, result.principalAmount!!, 0.01)
        assertEquals(20000.0, result.interestAmount!!, 0.01)
        assertEquals(900000.0, result.outstandingBalance!!, 0.01)
    }

    @Test
    fun recognisesCreditCardDebtRepaymentAndCardBalance() {
        val result = SmsTransactionParser.parse(
            "Card Services",
            "Your credit card payment of UGX 250,000 has been debited from your account. Outstanding card balance UGX 750,000.",
            1234,
        )!!

        assertEquals("debit", result.type)
        assertEquals(250000.0, result.amount, 0.01)
        assertEquals("debt", result.financialKind)
        assertEquals("debt_repayment", result.financialSubtype)
        assertEquals(750000.0, result.outstandingBalance!!, 0.01)
    }

    @Test
    fun recognisesRepaymentReceivedAsCredit() {
        val result = SmsTransactionParser.parse(
            "JOHN DOE",
            "Loan repayment received UGX 120,000 from JOHN DOE. Outstanding loan balance UGX 480,000.",
            1234,
        )!!

        assertEquals("credit", result.type)
        assertEquals(120000.0, result.amount, 0.01)
        assertEquals("loan", result.financialKind)
        assertEquals("loan_repayment_received", result.financialSubtype)
        assertEquals(480000.0, result.outstandingBalance!!, 0.01)
    }

    @Test
    fun ignoresLoanReminderWithoutCompletedMoneyMovement() {
        assertNull(
            SmsTransactionParser.parse(
                "Village SACCO",
                "Reminder: your loan repayment of UGX 100,000 is due on 05/09/2026. Outstanding balance UGX 900,000.",
                1234,
            ),
        )
    }

    @Test
    fun ignoresLoanOfferEvenWhenAmountIsPresent() {
        assertNull(
            SmsTransactionParser.parse(
                "QuickCash",
                "You are pre-approved for a loan offer of UGX 500,000. Apply today.",
                1234,
            ),
        )
    }

    @Test
    fun ignoresOtpEvenWhenAmountIsPresent() {
        assertNull(
            SmsTransactionParser.parse(
                "Stanbic Bank",
                "OTP 482911 authorises a payment of UGX 50,000. Do not share this verification code.",
                1234,
            ),
        )
    }

    @Test
    fun ignoresUnrelatedSms() {
        assertNull(SmsTransactionParser.parse("Friend", "Meet me at 5pm", 1234))
    }
}
