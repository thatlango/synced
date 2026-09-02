package com.tukutuku.synced.data.remote

import com.tukutuku.synced.data.model.*
import retrofit2.http.*

interface SyncedApiService {
    @POST("auth/core/session") suspend fun linkCoreSession(@Body body: CoreSessionLinkRequest): ApiEnvelope<AuthSession>
    @GET("auth/me") suspend fun me(): ApiEnvelope<User>

    @GET("wallets/summary") suspend fun walletSummary(): ApiEnvelope<WalletSummary>
    @GET("wallets/personal") suspend fun personalWallet(): ApiEnvelope<Wallet>

    @GET("transactions") suspend fun transactions(@Query("scope") scope: String = "all", @Query("page") page: Int = 1, @Query("limit") limit: Int = 50): ApiEnvelope<TransactionPage>
    @POST("transactions") suspend fun createTransaction(@Body body: CreateTransactionRequest): ApiEnvelope<Transaction>

    @GET("plans/current") suspend fun currentPlan(): ApiEnvelope<Plan?>
    @POST("plans") suspend fun createPlan(@Body body: CreatePlanRequest): ApiEnvelope<Plan>

    @GET("bills/upcoming") suspend fun upcomingBills(@Query("days") days: Int = 30): ApiEnvelope<UpcomingBills>
    @GET("forecasts/personal") suspend fun personalForecast(): ApiEnvelope<PersonalForecast?>

    @GET("baskets") suspend fun baskets(): ApiEnvelope<List<Basket>>
    @POST("baskets") suspend fun createBasket(@Body body: CreateBasketRequest): ApiEnvelope<Basket>
    @POST("baskets/{id}/contributions") suspend fun contribute(@Path("id") id: String, @Body body: ContributionRequest): ApiEnvelope<JsonElementEnvelope>

    @GET("households/mine") suspend fun households(): ApiEnvelope<List<Household>>
    @POST("households") suspend fun createHousehold(@Body body: CreateHouseholdRequest): ApiEnvelope<Household>
    @POST("households/join") suspend fun joinHousehold(@Body body: JoinHouseholdRequest): ApiEnvelope<Household>

    @POST("invites") suspend fun createInvite(@Body body: CreateInviteRequest): ApiEnvelope<Invite>
    @GET("invites/code/{code}") suspend fun previewInvite(@Path("code") code: String): ApiEnvelope<Invite>
    @POST("invites/code/{code}/redeem") suspend fun redeemInvite(@Path("code") code: String): ApiEnvelope<RedeemInviteResult>

    @GET("insights/summary") suspend fun insights(): ApiEnvelope<InsightSummary>
    @POST("insights/ask") suspend fun askInsight(@Body body: AskInsightRequest): ApiEnvelope<AskInsightResponse>

    @POST("ingestion/sms/candidates/bulk") suspend fun ingestSmsCandidates(@Body body: SmsCandidateBulkRequest): ApiEnvelope<SmsCandidateBulkResult>
}

@kotlinx.serialization.Serializable
data class JsonElementEnvelope(val contribution: kotlinx.serialization.json.JsonElement? = null, val basket: Basket? = null)
