package com.tukutuku.synced.data.model

import com.tukutuku.synced.core.FlexibleDoubleSerializer
import kotlinx.serialization.Serializable

@Serializable
data class MonthSpend(
    @Serializable(with = FlexibleDoubleSerializer::class) val total: Double = 0.0,
    val change: Int = 0,
    val trend: String = "stable",
)

@Serializable
data class PriorMonthSpend(
    @Serializable(with = FlexibleDoubleSerializer::class) val total: Double = 0.0,
)

@Serializable
data class CategorySpend(
    val category: String = "other",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val percentage: Int = 0,
)

@Serializable
data class MerchantSpend(
    val merchant: String = "",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val count: Int = 0,
)

@Serializable
data class DailySpend(
    val date: String = "",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
)

@Serializable
data class PersonalAnalytics(
    val thisMonth: MonthSpend = MonthSpend(),
    val lastMonth: PriorMonthSpend = PriorMonthSpend(),
    val byCategory: List<CategorySpend> = emptyList(),
    val topMerchants: List<MerchantSpend> = emptyList(),
    val dailySpend: List<DailySpend> = emptyList(),
)

@Serializable
data class MonthlyTrend(
    val month: String = "",
    @Serializable(with = FlexibleDoubleSerializer::class) val spend: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val income: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val net: Double = 0.0,
)

@Serializable
data class ForecastProjection(
    val month: String = "",
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedBalance: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedSpend: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val projectedIncome: Double = 0.0,
)

@Serializable
data class RecurringExpense(
    val name: String = "",
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
    @Serializable(with = FlexibleDoubleSerializer::class) val upcomingObligations: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val runwayBalance: Double = currentBalance,
    val historyWindowMonths: Int = 3,
    val daysUntilZero: Int = 0,
    val projections: List<ForecastProjection> = emptyList(),
    val recurringExpenses: List<RecurringExpense> = emptyList(),
)

@Serializable
data class Bill(
    val id: String,
    val ownerType: String = "user",
    val userId: String? = null,
    val householdId: String? = null,
    val name: String,
    val category: String = "utilities",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val currency: String = "UGX",
    val dueDate: String,
    val isPaid: Boolean = false,
    val paidAt: String? = null,
    val recurring: Boolean = false,
    val billingCycle: String? = null,
    val provider: String? = null,
    val accountRef: String? = null,
)

@Serializable
data class Subscription(
    val id: String,
    val ownerType: String = "user",
    val userId: String? = null,
    val householdId: String? = null,
    val name: String,
    val category: String = "subscriptions",
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val currency: String = "UGX",
    val billingCycle: String = "monthly",
    val nextDueDate: String,
    val status: String = "active",
    val autoRenew: Boolean = true,
    val logo: String? = null,
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
    val bills: List<Bill> = emptyList(),
    val subscriptions: List<Subscription> = emptyList(),
    val summary: UpcomingSummary = UpcomingSummary(),
)

@Serializable
data class CreateBillRequest(
    val ownerType: String = "user",
    val householdId: String? = null,
    val name: String,
    val category: String = "utilities",
    val amount: Double,
    val dueDate: String,
    val recurring: Boolean = false,
    val billingCycle: String? = null,
    val provider: String? = null,
    val accountRef: String? = null,
)

@Serializable
data class HouseholdMemberSpend(
    val userId: String = "",
    val name: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class) val totalSpent: Double = 0.0,
    val topCategories: List<CategorySpend> = emptyList(),
)

@Serializable
data class HouseholdAnalytics(
    @Serializable(with = FlexibleDoubleSerializer::class) val totalSpentThisMonth: Double = 0.0,
    val memberBreakdown: List<HouseholdMemberSpend> = emptyList(),
    val biggestSpender: HouseholdMemberSpend? = null,
    val byCategory: List<CategorySpend> = emptyList(),
)

val FINANCE_CATEGORIES = listOf(
    "food",
    "transport",
    "utilities",
    "subscriptions",
    "rent",
    "school_fees",
    "entertainment",
    "savings",
    "healthcare",
    "shopping",
    "fuel",
    "mobile_data",
    "salary",
    "transfer",
    "bill_payment",
    "other",
)
