package com.tukutuku.synced

import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.data.model.deriveDebtSummary
import kotlinx.serialization.json.Json
import org.junit.Assert.assertEquals
import org.junit.Test

class DebtIntelligenceTest {
    @Test
    fun keepsLatestKnownBalancePerCounterpartyWithoutDoubleCounting() {
        val newest = Transaction(
            id = "new",
            walletId = "wallet",
            type = "debit",
            amount = 10000.0,
            merchant = "Lender A",
            metadata = Json.parseToJsonElement("""{"financialKind":"loan","counterparty":"Lender A","outstandingBalance":80000,"dueAmount":20000,"dueDate":"2026-09-10"}"""),
        )
        val older = Transaction(
            id = "old",
            walletId = "wallet",
            type = "credit",
            amount = 100000.0,
            merchant = "Lender A",
            metadata = Json.parseToJsonElement("""{"financialKind":"loan","counterparty":"Lender A","outstandingBalance":100000}"""),
        )
        val ordinary = Transaction(
            id = "food",
            walletId = "wallet",
            type = "debit",
            amount = 5000.0,
            metadata = Json.parseToJsonElement("""{"classificationSource":"sms_local_parser"}"""),
        )

        val summary = deriveDebtSummary(listOf(newest, older, ordinary))

        assertEquals(2, summary.detectedEvents)
        assertEquals(80000.0, summary.knownOutstanding, 0.001)
        assertEquals(20000.0, summary.knownDue, 0.001)
        assertEquals(1, summary.counterparties.size)
        assertEquals("2026-09-10", summary.counterparties.single().dueDate)
    }
}
