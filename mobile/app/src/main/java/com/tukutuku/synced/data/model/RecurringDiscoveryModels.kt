package com.tukutuku.synced.data.model

import com.tukutuku.synced.core.FlexibleDoubleSerializer
import kotlinx.serialization.Serializable

@Serializable
data class RecurringDiscoveryRequest(
    val autoCreate: Boolean = false,
)

@Serializable
data class RecurringEvidence(
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val date: String = "",
)

@Serializable
data class RecurringBillCandidate(
    val fingerprint: String = "",
    val name: String = "",
    val category: String = "other",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val billingCycle: String = "monthly",
    val nextDueDate: String = "",
    val occurrences: Int = 0,
    @Serializable(with = FlexibleDoubleSerializer::class) val confidence: Double = 0.0,
    val cadenceDays: Int = 0,
    val amountVariationPercent: Int = 0,
    val source: String = "manual",
    val autoCreateEligible: Boolean = false,
    val alreadyTracked: Boolean = false,
    val inferred: Boolean = true,
    val evidence: List<RecurringEvidence> = emptyList(),
)

@Serializable
data class RecurringDiscoveryResult(
    val analysedTransactions: Int = 0,
    @Serializable(with = FlexibleDoubleSerializer::class) val suggestionThreshold: Double = 0.68,
    @Serializable(with = FlexibleDoubleSerializer::class) val autoCreateThreshold: Double = 0.86,
    val autoCreate: Boolean = false,
    val created: List<Bill> = emptyList(),
    val candidates: List<RecurringBillCandidate> = emptyList(),
)
