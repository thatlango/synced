package com.tukutuku.synced.sms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
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
}
