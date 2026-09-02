package com.tukutuku.synced.data.model

import com.tukutuku.synced.core.FlexibleDoubleSerializer
import kotlinx.serialization.Serializable

@Serializable
data class UpcomingBill(
    val id: String,
    val name: String,
    val category: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val dueDate: String? = null,
    val recurring: Boolean = false,
    val provider: String? = null,
)

@Serializable
data class UpcomingSubscription(
    val id: String,
    val name: String,
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val nextDueDate: String? = null,
    val billingCycle: String? = null,
)

@Serializable
data class UpcomingSummary(
    @Serializable(with = FlexibleDoubleSerializer::class) val totalUpcoming: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val billsTotal: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val subscriptionsTotal: Double = 0.0,
    val count: Int = 0,
    val nextDue: String? = null,
)

@Serializable
data class UpcomingBills(
    val bills: List<UpcomingBill> = emptyList(),
    val subscriptions: List<UpcomingSubscription> = emptyList(),
    val summary: UpcomingSummary = UpcomingSummary(),
)

@Serializable
data class ForecastProjection(
    val month: String,
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedBalance: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedSpend: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedIncome: Double = 0.0,
)

@Serializable
data class RecurringExpense(
    val name: String,
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val nextDue: String? = null,
)

@Serializable
data class PersonalForecast(
    @Serializable(with = FlexibleDoubleSerializer::class) val currentBalance: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val burnRate: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val avgMonthlySpend: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val avgMonthlyIncome: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val monthlySubscriptionCost: Double = 0.0,
    val daysUntilZero: Int = 999,
    val projections: List<ForecastProjection> = emptyList(),
    val recurringExpenses: List<RecurringExpense> = emptyList(),
)
