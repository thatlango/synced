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
