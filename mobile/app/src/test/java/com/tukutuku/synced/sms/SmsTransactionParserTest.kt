package com.tukutuku.synced.sms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsTransactionParserTest {
    @Test
    fun `uses transaction amount instead of balance amount`() {
        val result = SmsTransactionParser.parse(
            sender = "MTN MoMo",
            body = "Your balance is UGX 300,000. Your payment of UGX 15,000 to Cafe Javas has been completed.",
            timestamp = 1L,
        )
        assertNotNull(result)
        assertEquals(15_000.0, result!!.amount, 0.0)
        assertEquals("debit", result.type)
        assertEquals("Cafe Javas", result.merchant)
        assertEquals("mtn", result.source)
    }

    @Test
    fun `parses received mobile money`() {
        val result = SmsTransactionParser.parse(
            sender = "MobileMoney",
            body = "You have received UGX 50,000 from Jane Doe. Your new balance is UGX 80,000.",
            timestamp = 2L,
        )
        assertNotNull(result)
        assertEquals(50_000.0, result!!.amount, 0.0)
        assertEquals("credit", result.type)
        assertEquals("Jane Doe", result.merchant)
        assertEquals("mtn", result.source)
    }

    @Test
    fun `parses common bank credit without mobile money provider marker`() {
        val result = SmsTransactionParser.parse(
            sender = "Stanbic",
            body = "Stanbic Bank: UGX 500,000 credited to your account ending 1234.",
            timestamp = 3L,
        )
        assertNotNull(result)
        assertEquals(500_000.0, result!!.amount, 0.0)
        assertEquals("credit", result.type)
        assertEquals("Stanbic", result.merchant)
        assertEquals("sms", result.source)
    }

    @Test
    fun `parses airtel payment`() {
        val result = SmsTransactionParser.parse(
            sender = "AirtelMoney",
            body = "Your Airtel Money payment of UGX 25,000 to NWSC was successful.",
            timestamp = 4L,
        )
        assertNotNull(result)
        assertEquals(25_000.0, result!!.amount, 0.0)
        assertEquals("debit", result.type)
        assertEquals("NWSC", result.merchant)
        assertEquals("airtel", result.source)
    }

    @Test
    fun `parses account credited wording`() {
        val result = SmsTransactionParser.parse(
            sender = "BANK",
            body = "Your account has been credited with UGX 10,000.",
            timestamp = 5L,
        )
        assertNotNull(result)
        assertEquals(10_000.0, result!!.amount, 0.0)
        assertEquals("credit", result.type)
    }

    @Test
    fun `parses you have been debited wording`() {
        val result = SmsTransactionParser.parse(
            sender = "BANK",
            body = "You have been debited UGX 5,000.",
            timestamp = 6L,
        )
        assertNotNull(result)
        assertEquals(5_000.0, result!!.amount, 0.0)
        assertEquals("debit", result.type)
    }

    @Test
    fun `rejects payment prompt even when it contains an amount`() {
        val result = SmsTransactionParser.parse(
            sender = "AirtelMoney",
            body = "Payment request: UGX 25,000 from Merchant. Enter your PIN to approve this payment.",
            timestamp = 7L,
        )
        assertNull(result)
    }

    @Test
    fun `rejects bill reminder and future debit notice`() {
        assertNull(
            SmsTransactionParser.parse(
                sender = "BANK",
                body = "Bill reminder: UGX 40,000 is due tomorrow and your account will be debited.",
                timestamp = 8L,
            ),
        )
    }

    @Test
    fun `reconciles bank to momo movement as internal transfer`() {
        val bankDebit = SmsTransactionParser.parse(
            sender = "Stanbic",
            body = "Stanbic Bank: UGX 5,000 debited from your account.",
            timestamp = 1_000_000L,
        )!!
        val momoCredit = SmsTransactionParser.parse(
            sender = "MTN MoMo",
            body = "You have received UGX 5,000 from STANBIC BANK. Your new balance is UGX 5,000.",
            timestamp = 1_000_120L,
        )!!

        val reconciled = SmsTransferReconciler.reconcile(listOf(bankDebit, momoCredit))
        assertEquals(1, reconciled.internalTransferPairs)
        assertTrue(reconciled.candidates.isEmpty())
    }

    @Test
    fun `does not pair external income with smaller momo transfer`() {
        val bankIncome = SmsTransactionParser.parse(
            sender = "Stanbic",
            body = "Stanbic Bank: UGX 10,000 credited to your account.",
            timestamp = 2_000_000L,
        )!!
        val bankDebit = SmsTransactionParser.parse(
            sender = "Stanbic",
            body = "Stanbic Bank: UGX 5,000 debited from your account.",
            timestamp = 2_001_000L,
        )!!
        val momoCredit = SmsTransactionParser.parse(
            sender = "MTN MoMo",
            body = "You have received UGX 5,000 from STANBIC BANK.",
            timestamp = 2_001_100L,
        )!!

        val reconciled = SmsTransferReconciler.reconcile(listOf(bankIncome, bankDebit, momoCredit))
        assertEquals(1, reconciled.internalTransferPairs)
        assertEquals(1, reconciled.candidates.size)
        assertEquals(10_000.0, reconciled.candidates.single().amount, 0.0)
        assertEquals("credit", reconciled.candidates.single().type)
    }
}