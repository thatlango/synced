package com.tukutuku.synced.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tukutuku.synced.data.model.*
import com.tukutuku.synced.data.remote.JsonElementEnvelope
import com.tukutuku.synced.data.repository.AuthRepository
import com.tukutuku.synced.data.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoadState<T>(
    val loading: Boolean = false,
    val data: T? = null,
    val error: String? = null,
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {
    val state = auth.state
    private val _busy = MutableStateFlow(false)
    val busy = _busy.asStateFlow()
    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    fun clearError() { _error.value = null }

    fun signIn(email: String, password: String) = viewModelScope.launch {
        submit { auth.signIn(email, password) }
    }

    fun register(name: String, email: String, password: String) = viewModelScope.launch {
        submit { auth.register(name, email, password) }
    }

    private suspend fun submit(action: suspend () -> Result<Unit>) {
        if (_busy.value) return
        _busy.value = true
        _error.value = null
        action().onFailure { _error.value = it.message ?: "Tuku account request failed" }
        _busy.value = false
    }

    fun signOut() = viewModelScope.launch { auth.signOut() }
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _wallet = MutableStateFlow(LoadState<WalletSummary>())
    val wallet = _wallet.asStateFlow()
    private val _transactions = MutableStateFlow(LoadState<List<Transaction>>())
    val transactions = _transactions.asStateFlow()
    private val _insight = MutableStateFlow<InsightSummary?>(null)
    val insight = _insight.asStateFlow()
    private val _analytics = MutableStateFlow(LoadState<PersonalAnalytics>())
    val analytics = _analytics.asStateFlow()
    private val _upcoming = MutableStateFlow(LoadState<UpcomingBills>())
    val upcoming = _upcoming.asStateFlow()
    private val _forecast = MutableStateFlow(LoadState<PersonalForecast>())
    val forecast = _forecast.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _wallet.value = LoadState(loading = true)
        _analytics.value = LoadState(loading = true)
        _upcoming.value = LoadState(loading = true)
        _forecast.value = LoadState(loading = true)

        runCatching { repo.walletSummary() }
            .onSuccess { _wallet.value = LoadState(data = it) }
            .onFailure { _wallet.value = LoadState(error = it.message) }

        runCatching { repo.transactions() }
            .onSuccess { _transactions.value = LoadState(data = it) }
            .onFailure { _transactions.value = LoadState(error = it.message) }

        runCatching { repo.personalAnalytics() }
            .onSuccess { _analytics.value = LoadState(data = it) }
            .onFailure { _analytics.value = LoadState(error = it.message) }

        runCatching { repo.upcomingBills() }
            .onSuccess { _upcoming.value = LoadState(data = it) }
            .onFailure { _upcoming.value = LoadState(error = it.message) }

        runCatching { repo.personalForecast() }
            .onSuccess { _forecast.value = LoadState(data = it) }
            .onFailure { _forecast.value = LoadState(error = it.message) }

        _insight.value = repo.insight()
    }
}

@HiltViewModel
class TransactionsViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _rows = MutableStateFlow(LoadState<List<Transaction>>())
    val rows = _rows.asStateFlow()
    private val _wallet = MutableStateFlow<Wallet?>(null)
    val wallet = _wallet.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _rows.value = LoadState(loading = true)
        runCatching { repo.walletSummary() }.onSuccess { _wallet.value = it.personal }
        runCatching { repo.transactions() }
            .onSuccess { _rows.value = LoadState(data = it) }
            .onFailure { _rows.value = LoadState(error = it.message) }
    }

    fun create(
        type: String,
        amount: Double,
        category: String?,
        description: String?,
        merchant: String?,
        done: (Result<Transaction>) -> Unit,
    ) = viewModelScope.launch {
        val id = _wallet.value?.id ?: repo.personalWalletId()
        if (id == null) {
            done(Result.failure(IllegalStateException("Personal wallet unavailable")))
            return@launch
        }
        val result = runCatching {
            repo.createTransaction(
                CreateTransactionRequest(
                    walletId = id,
                    type = type,
                    amount = amount,
                    category = category,
                    description = description,
                    merchant = merchant,
                ),
            )
        }
        done(result)
        if (result.isSuccess) refresh()
    }
}

@HiltViewModel
class PlanViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(LoadState<Plan?>())
    val state = _state.asStateFlow()
    private val _forecast = MutableStateFlow(LoadState<PersonalForecast>())
    val forecast = _forecast.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = LoadState(loading = true)
        _forecast.value = LoadState(loading = true)
        runCatching { repo.currentPlan() }
            .onSuccess { _state.value = LoadState(data = it) }
            .onFailure { _state.value = LoadState(error = it.message) }
        runCatching { repo.personalForecast() }
            .onSuccess { _forecast.value = LoadState(data = it) }
            .onFailure { _forecast.value = LoadState(error = it.message) }
    }

    fun create(
        income: Double,
        allocations: List<PlanAllocation>,
        done: (Result<Plan>) -> Unit,
    ) = viewModelScope.launch {
        val result = runCatching {
            repo.createPlan(
                CreatePlanRequest(
                    expectedIncome = income,
                    allocations = allocations,
                ),
            )
        }
        done(result)
        if (result.isSuccess) refresh()
    }
}

@HiltViewModel
class BasketsViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(LoadState<List<Basket>>())
    val state = _state.asStateFlow()
    private val _invite = MutableStateFlow<Invite?>(null)
    val invite = _invite.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = LoadState(loading = true)
        runCatching { repo.baskets() }
            .onSuccess { _state.value = LoadState(data = it) }
            .onFailure { _state.value = LoadState(error = it.message) }
    }

    fun create(name: String, target: Double?, done: (Result<Basket>) -> Unit) = viewModelScope.launch {
        val result = runCatching { repo.createBasket(CreateBasketRequest(name = name, targetAmount = target)) }
        done(result)
        if (result.isSuccess) refresh()
    }

    fun contribute(
        id: String,
        amount: Double,
        done: (Result<JsonElementEnvelope?>) -> Unit,
    ) = viewModelScope.launch {
        val result = runCatching { repo.contribute(id, amount, null) }
        done(result)
        if (result.isSuccess) refresh()
    }

    fun invite(id: String) = viewModelScope.launch {
        _invite.value = runCatching { repo.createInvite("basket", id) }.getOrNull()
    }

    fun clearInvite() {
        _invite.value = null
    }
}

@HiltViewModel
class HouseholdViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(LoadState<List<Household>>())
    val state = _state.asStateFlow()
    private val _selectedId = MutableStateFlow<String?>(null)
    val selectedId = _selectedId.asStateFlow()
    private val _invite = MutableStateFlow<Invite?>(null)
    val invite = _invite.asStateFlow()
    private val _analytics = MutableStateFlow(LoadState<HouseholdAnalytics>())
    val analytics = _analytics.asStateFlow()
    private val _activity = MutableStateFlow(LoadState<List<Transaction>>())
    val activity = _activity.asStateFlow()
    private val _actionError = MutableStateFlow<String?>(null)
    val actionError = _actionError.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        val previousSelection = _selectedId.value
        _state.value = LoadState(loading = true, data = _state.value.data)
        runCatching { repo.households() }
            .onSuccess { households ->
                _state.value = LoadState(data = households)
                val selected = previousSelection
                    ?.takeIf { current -> households.any { it.id == current } }
                    ?: households.firstOrNull()?.id
                _selectedId.value = selected
                if (selected == null) {
                    _analytics.value = LoadState()
                    _activity.value = LoadState()
                } else {
                    loadSelected(selected)
                }
            }
            .onFailure { _state.value = LoadState(error = it.message) }
    }

    fun select(householdId: String) = viewModelScope.launch {
        if (_state.value.data.orEmpty().none { it.id == householdId }) return@launch
        _selectedId.value = householdId
        loadSelected(householdId)
    }

    private suspend fun loadSelected(householdId: String) {
        _analytics.value = LoadState(loading = true)
        _activity.value = LoadState(loading = true)

        runCatching { repo.householdAnalytics(householdId) }
            .onSuccess { _analytics.value = LoadState(data = it) }
            .onFailure { _analytics.value = LoadState(error = it.message) }

        val walletId = _state.value.data
            .orEmpty()
            .firstOrNull { it.id == householdId }
            ?.wallet
            ?.id

        if (walletId == null) {
            _activity.value = LoadState(error = "Shared wallet unavailable")
        } else {
            runCatching { repo.sharedTransactions(walletId) }
                .onSuccess { _activity.value = LoadState(data = it) }
                .onFailure { _activity.value = LoadState(error = it.message) }
        }
    }

    fun create(name: String, done: (Result<Household>) -> Unit = {}) = viewModelScope.launch {
        _actionError.value = null
        val result = runCatching { repo.createHousehold(name.trim()) }
        result.onFailure { _actionError.value = it.message }
        done(result)
        if (result.isSuccess) {
            _selectedId.value = result.getOrNull()?.id
            refresh()
        }
    }

    fun joinInvite(code: String, done: (Result<RedeemInviteResult>) -> Unit) = viewModelScope.launch {
        _actionError.value = null
        val result = runCatching { repo.redeemInvite(code) }
        result.onFailure { _actionError.value = it.message }
        done(result)
        if (result.isSuccess && result.getOrNull()?.targetType == "household") {
            _selectedId.value = result.getOrNull()?.householdId
            refresh()
        }
    }

    fun addSharedTransaction(
        type: String,
        amount: Double,
        category: String,
        description: String?,
        merchant: String?,
        done: (Result<Transaction>) -> Unit,
    ) = viewModelScope.launch {
        _actionError.value = null
        val selected = _selectedId.value
        val household = _state.value.data.orEmpty().firstOrNull { it.id == selected }
        val walletId = household?.wallet?.id
        if (walletId == null) {
            val error = Result.failure<Transaction>(IllegalStateException("Shared wallet unavailable"))
            _actionError.value = error.exceptionOrNull()?.message
            done(error)
            return@launch
        }

        val result = runCatching {
            repo.createTransaction(
                CreateTransactionRequest(
                    walletId = walletId,
                    type = type,
                    amount = amount,
                    category = category,
                    description = description,
                    merchant = merchant,
                    visibility = "household",
                ),
            )
        }
        result.onFailure { _actionError.value = it.message }
        done(result)
        if (result.isSuccess) refresh()
    }

    fun invite(householdId: String) = viewModelScope.launch {
        _actionError.value = null
        runCatching { repo.createInvite("household", householdId) }
            .onSuccess { _invite.value = it }
            .onFailure { _actionError.value = it.message }
    }

    fun clearInvite() {
        _invite.value = null
    }

    fun clearActionError() {
        _actionError.value = null
    }
}

@HiltViewModel
class BillsViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(LoadState<UpcomingBills>())
    val state = _state.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _state.value = LoadState(loading = true)
        runCatching { repo.upcomingBills(60) }
            .onSuccess { _state.value = LoadState(data = it) }
            .onFailure { _state.value = LoadState(error = it.message) }
    }

    fun create(body: CreateBillRequest, done: (Result<Bill>) -> Unit) = viewModelScope.launch {
        val result = runCatching { repo.createBill(body) }
        done(result)
        if (result.isSuccess) refresh()
    }

    fun markPaid(id: String) = viewModelScope.launch {
        runCatching { repo.markBillPaid(id) }
        refresh()
    }
}

@HiltViewModel
class IntelligenceViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _analytics = MutableStateFlow(LoadState<PersonalAnalytics>())
    val analytics = _analytics.asStateFlow()
    private val _trends = MutableStateFlow(LoadState<List<MonthlyTrend>>())
    val trends = _trends.asStateFlow()
    private val _forecast = MutableStateFlow(LoadState<PersonalForecast>())
    val forecast = _forecast.asStateFlow()
    private val _insight = MutableStateFlow<InsightSummary?>(null)
    val insight = _insight.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _analytics.value = LoadState(loading = true)
        _trends.value = LoadState(loading = true)
        _forecast.value = LoadState(loading = true)
        runCatching { repo.personalAnalytics() }
            .onSuccess { _analytics.value = LoadState(data = it) }
            .onFailure { _analytics.value = LoadState(error = it.message) }
        runCatching { repo.personalTrends() }
            .onSuccess { _trends.value = LoadState(data = it) }
            .onFailure { _trends.value = LoadState(error = it.message) }
        runCatching { repo.personalForecast() }
            .onSuccess { _forecast.value = LoadState(data = it) }
            .onFailure { _forecast.value = LoadState(error = it.message) }
        _insight.value = repo.insight()
    }
}

@HiltViewModel
class InviteViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _preview = MutableStateFlow(LoadState<Invite>())
    val preview = _preview.asStateFlow()

    fun preview(code: String) = viewModelScope.launch {
        _preview.value = LoadState(loading = true)
        runCatching { repo.previewInvite(code) }
            .onSuccess { _preview.value = LoadState(data = it) }
            .onFailure { _preview.value = LoadState(error = it.message) }
    }

    fun redeem(code: String, done: (Result<RedeemInviteResult>) -> Unit) = viewModelScope.launch {
        done(runCatching { repo.redeemInvite(code) })
    }
}

@HiltViewModel
class InsightViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _answer = MutableStateFlow(LoadState<AskInsightResponse>())
    val answer = _answer.asStateFlow()

    fun ask(question: String) = viewModelScope.launch {
        _answer.value = LoadState(loading = true)
        runCatching { repo.ask(question) }
            .onSuccess { _answer.value = LoadState(data = it) }
            .onFailure { _answer.value = LoadState(error = it.message) }
    }
}
