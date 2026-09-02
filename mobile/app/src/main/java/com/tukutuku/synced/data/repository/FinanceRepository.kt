package com.tukutuku.synced.data.repository

import com.tukutuku.synced.data.local.CachedTransaction
import com.tukutuku.synced.data.local.TransactionDao
import com.tukutuku.synced.data.model.*
import com.tukutuku.synced.data.remote.JsonElementEnvelope
import com.tukutuku.synced.data.remote.SyncedApiService
import com.tukutuku.synced.data.session.SessionStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FinanceRepository @Inject constructor(
    private val api: SyncedApiService,
    private val transactionDao: TransactionDao,
    private val sessions: SessionStore,
) {
    suspend fun walletSummary(): WalletSummary {
        val summary = api.walletSummary().data ?: WalletSummary()
        summary.personal?.id?.let { sessions.setWallet(it) }
        return summary
    }

    suspend fun transactions(): List<Transaction> = try {
        val rows = api.transactions().data?.data.orEmpty()
        transactionDao.upsert(rows.map(CachedTransaction::from))
        rows
    } catch (_: Exception) {
        transactionDao.recent().map { it.model() }
    }

    suspend fun createTransaction(body: CreateTransactionRequest): Transaction =
        api.createTransaction(body).data ?: error("Transaction was not created")

    suspend fun currentPlan(): Plan? = api.currentPlan().data

    suspend fun createPlan(body: CreatePlanRequest): Plan =
        api.createPlan(body).data ?: error("Plan was not created")

    suspend fun upcomingBills(days: Int = 30): UpcomingBills =
        api.upcomingBills(days).data ?: UpcomingBills()

    suspend fun personalForecast(): PersonalForecast? =
        api.personalForecast().data

    suspend fun baskets(): List<Basket> = api.baskets().data.orEmpty()

    suspend fun createBasket(body: CreateBasketRequest): Basket =
        api.createBasket(body).data ?: error("Basket was not created")

    suspend fun contribute(id: String, amount: Double, note: String?): JsonElementEnvelope? =
        api.contribute(id, ContributionRequest(amount = amount, note = note)).data

    suspend fun households(): List<Household> = api.households().data.orEmpty()

    suspend fun createHousehold(name: String): Household =
        api.createHousehold(CreateHouseholdRequest(name)).data ?: error("Shared space was not created")

    suspend fun joinHousehold(code: String): Household =
        api.joinHousehold(JoinHouseholdRequest(code.trim().uppercase())).data ?: error("Could not join")

    suspend fun createInvite(targetType: String, targetId: String): Invite {
        val request = if (targetType == "basket") {
            CreateInviteRequest(
                targetType = "basket",
                basketId = targetId,
                role = "contributor",
            )
        } else {
            CreateInviteRequest(
                targetType = "household",
                householdId = targetId,
                role = "member",
            )
        }
        return api.createInvite(request).data ?: error("Invite not created")
    }

    suspend fun previewInvite(code: String): Invite =
        api.previewInvite(code.trim().uppercase()).data ?: error("Invite not found")

    suspend fun redeemInvite(code: String): RedeemInviteResult =
        api.redeemInvite(code.trim().uppercase()).data ?: error("Invite not redeemed")

    suspend fun insight(): InsightSummary? = runCatching { api.insights().data }.getOrNull()

    suspend fun ask(question: String): AskInsightResponse =
        api.askInsight(AskInsightRequest(question)).data ?: error("Synced insight unavailable")

    suspend fun personalWalletId(): String? =
        sessions.wallet() ?: runCatching { walletSummary().personal?.id }.getOrNull()

    suspend fun ingestCandidates(
        walletId: String,
        rows: List<StructuredSmsCandidate>,
    ): SmsCandidateBulkResult? = api.ingestSmsCandidates(
        SmsCandidateBulkRequest(walletId = walletId, candidates = rows),
    ).data
}
