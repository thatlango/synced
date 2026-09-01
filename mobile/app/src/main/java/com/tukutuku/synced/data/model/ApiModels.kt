package com.tukutuku.synced.data.model

import com.tukutuku.synced.core.FlexibleDoubleSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable data class ApiEnvelope<T>(val success: Boolean = true, val data: T? = null, val message: String? = null)

@Serializable
data class User(
    val id: String,
    val phone: String? = null,
    val email: String? = null,
    val name: String? = null,
    val avatar: String? = null,
    val platform: String? = null,
    val isVerified: Boolean = false,
    val createdAt: String? = null,
    val lastLogin: String? = null,
    val coreUserId: String? = null,
)

@Serializable data class CoreLoginRequest(val email: String, val password: String)
@Serializable data class CoreRegisterRequest(
    val email: String,
    val password: String,
    val name: String,
    val language: String = "en",
    val country: String = "UG",
    val consent: Boolean = true,
    val intent: String = "exploring",
)
@Serializable data class CoreNativeSession(val accessToken: String, val refreshToken: String? = null)
@Serializable data class CoreNativeAuthResponse(val session: CoreNativeSession? = null)
@Serializable data class CoreSessionLinkRequest(val accessToken: String)
@Serializable data class AuthSession(val user: User, val accessToken: String, val canonicalIdentity: CanonicalIdentity? = null)
@Serializable data class CanonicalIdentity(val coreUserId: String? = null)

@Serializable
data class Wallet(
    val id: String,
    val type: String,
    @Serializable(with = FlexibleDoubleSerializer::class) val balance: Double = 0.0,
    val currency: String = "UGX",
    val userId: String? = null,
    val householdId: String? = null,
)

@Serializable
data class HouseholdWalletRef(
    val householdId: String,
    val householdName: String,
    val wallet: Wallet? = null,
    val role: String = "member",
)

@Serializable data class WalletTotals(
    @Serializable(with = FlexibleDoubleSerializer::class) val personalBalance: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val totalHouseholdBalance: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val combinedBalance: Double = 0.0,
)
@Serializable data class WalletSummary(val personal: Wallet? = null, val households: List<HouseholdWalletRef> = emptyList(), val summary: WalletTotals = WalletTotals())

@Serializable
data class Transaction(
    val id: String,
    val walletId: String,
    val userId: String? = null,
    val type: String,
    @Serializable(with = FlexibleDoubleSerializer::class) val amount: Double = 0.0,
    val category: String? = null,
    val description: String? = null,
    val merchant: String? = null,
    val source: String? = null,
    val visibility: String? = null,
    val createdAt: String? = null,
)
@Serializable data class PageMeta(val total: Int = 0, val page: Int = 1, val limit: Int = 20, val totalPages: Int = 1, val hasNext: Boolean = false, val hasPrev: Boolean = false)
@Serializable data class TransactionPage(val data: List<Transaction> = emptyList(), val meta: PageMeta = PageMeta())
@Serializable data class CreateTransactionRequest(val walletId: String, val type: String, val amount: Double, val category: String? = null, val description: String? = null, val merchant: String? = null, val source: String = "manual", val visibility: String = "personal")

@Serializable
data class PlanAllocation(
    val id: String? = null,
    val label: String,
    val category: String? = null,
    @Serializable(with = FlexibleDoubleSerializer::class) val plannedAmount: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val spentAmount: Double = 0.0,
)
@Serializable
data class Plan(
    val id: String,
    val label: String,
    val currency: String = "UGX",
    @Serializable(with = FlexibleDoubleSerializer::class) val expectedIncome: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val plannedTotal: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val spentTotal: Double = 0.0,
    val startDate: String? = null,
    val endDate: String? = null,
    val health: String? = null,
    val insight: String? = null,
    val allocations: List<PlanAllocation> = emptyList(),
)
@Serializable data class CreatePlanRequest(val label: String? = null, val currency: String = "UGX", val expectedIncome: Double, val allocations: List<PlanAllocation>)

@Serializable data class BasketMemberUser(val id: String, val name: String? = null)
@Serializable data class BasketMember(val id: String? = null, val userId: String? = null, val role: String = "contributor", val user: BasketMemberUser? = null)
@Serializable
data class Basket(
    val id: String,
    val name: String,
    val description: String? = null,
    val currency: String = "UGX",
    @Serializable(with = FlexibleDoubleSerializer::class) val targetAmount: Double = 0.0,
    @Serializable(with = FlexibleDoubleSerializer::class) val savedAmount: Double = 0.0,
    val progressPercent: Int? = null,
    val targetDate: String? = null,
    val createdBy: String? = null,
    val members: List<BasketMember> = emptyList(),
)
@Serializable data class CreateBasketRequest(val name: String, val description: String? = null, val currency: String = "UGX", val targetAmount: Double? = null, val targetDate: String? = null, val householdId: String? = null)
@Serializable data class ContributionRequest(val amount: Double, val source: String = "manual", val note: String? = null)

@Serializable data class HouseholdCount(val members: Int = 0)
@Serializable
data class Household(
    val id: String,
    val name: String,
    val inviteCode: String? = null,
    val createdBy: String? = null,
    val role: String? = null,
    val avatar: String? = null,
    val wallet: Wallet? = null,
    @SerialName("_count") val count: HouseholdCount? = null,
)
@Serializable data class CreateHouseholdRequest(val name: String)
@Serializable data class JoinHouseholdRequest(val inviteCode: String)

@Serializable
data class Invite(
    val id: String,
    val code: String,
    val targetType: String,
    val role: String? = null,
    val basketId: String? = null,
    val householdId: String? = null,
    val joinUrl: String? = null,
    val qrPayload: String? = null,
    val status: String? = null,
    val target: JsonElement? = null,
)
@Serializable data class CreateInviteRequest(val targetType: String, val basketId: String? = null, val householdId: String? = null, val role: String? = null, val maxUses: Int = 1)
@Serializable data class RedeemInviteResult(val joined: Boolean = false, val duplicate: Boolean = false, val targetType: String? = null, val basketId: String? = null, val householdId: String? = null)

@Serializable
data class SpendingTrend(val spendingVsPriorAveragePercent: Int = 0, val direction: String = "stable")
@Serializable data class InsightSummary(val trend: SpendingTrend = SpendingTrend(), val deterministicInsight: String = "", val nextBill: JsonElement? = null, val financialState: JsonElement? = null)
@Serializable data class AskInsightRequest(val question: String)
@Serializable data class AskInsightResponse(val answer: JsonElement? = null, val evidenceBoundary: String? = null, val processedVia: String? = null)

@Serializable data class StructuredSmsCandidate(
    val amount: Double,
    val type: String,
    val description: String,
    val merchant: String? = null,
    val referenceId: String? = null,
    val source: String,
    val confidence: Double? = null,
)
@Serializable data class SmsCandidateBulkRequest(val walletId: String, val candidates: List<StructuredSmsCandidate>)
@Serializable data class SmsCandidateBulkResult(val processed: Int? = null, val skipped: Int? = null, val results: List<JsonElement> = emptyList())
