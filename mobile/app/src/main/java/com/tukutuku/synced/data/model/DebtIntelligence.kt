package com.tukutuku.synced.data.model

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonPrimitive

data class DebtCounterparty(
    val name: String,
    val outstandingBalance: Double? = null,
    val dueAmount: Double? = null,
    val dueDate: String? = null,
)

data class DebtSummary(
    val detectedEvents: Int = 0,
    val knownOutstanding: Double = 0.0,
    val knownDue: Double = 0.0,
    val counterparties: List<DebtCounterparty> = emptyList(),
)

fun deriveDebtSummary(transactions: List<Transaction>): DebtSummary {
    val debtRows = transactions.mapNotNull { tx ->
        val metadata = tx.metadata as? JsonObject ?: return@mapNotNull null
        val kind = metadata["financialKind"]?.jsonPrimitive?.contentOrNull?.lowercase()
        if (kind != "loan" && kind != "debt") return@mapNotNull null

        val counterparty = metadata["counterparty"]?.jsonPrimitive?.contentOrNull
            ?.trim()?.takeIf { it.isNotEmpty() }
            ?: tx.merchant?.trim()?.takeIf { it.isNotEmpty() }
            ?: "Other debt"

        DebtCounterparty(
            name = counterparty,
            outstandingBalance = metadata["outstandingBalance"]?.jsonPrimitive?.doubleOrNull,
            dueAmount = metadata["dueAmount"]?.jsonPrimitive?.doubleOrNull,
            dueDate = metadata["dueDate"]?.jsonPrimitive?.contentOrNull,
        )
    }

    // Transaction feeds are newest-first. Keep the most recent structured
    // balance/due signal per counterparty so repeated lender messages are not
    // summed as if they were separate loans.
    val latest = linkedMapOf<String, DebtCounterparty>()
    for (row in debtRows) {
        val key = row.name.trim().lowercase()
        val existing = latest[key]
        if (existing == null) {
            latest[key] = row
        } else {
            latest[key] = existing.copy(
                outstandingBalance = existing.outstandingBalance ?: row.outstandingBalance,
                dueAmount = existing.dueAmount ?: row.dueAmount,
                dueDate = existing.dueDate ?: row.dueDate,
            )
        }
    }

    return DebtSummary(
        detectedEvents = debtRows.size,
        knownOutstanding = latest.values.sumOf { it.outstandingBalance ?: 0.0 },
        knownDue = latest.values.sumOf { it.dueAmount ?: 0.0 },
        counterparties = latest.values.toList(),
    )
}
