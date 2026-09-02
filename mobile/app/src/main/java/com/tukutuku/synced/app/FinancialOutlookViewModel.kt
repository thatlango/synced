package com.tukutuku.synced.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tukutuku.synced.data.model.PersonalAnalytics
import com.tukutuku.synced.data.model.PersonalForecast
import com.tukutuku.synced.data.model.UpcomingBills
import com.tukutuku.synced.data.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FinancialOutlookViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _upcoming = MutableStateFlow(LoadState<UpcomingBills>())
    val upcoming = _upcoming.asStateFlow()

    private val _forecast = MutableStateFlow(LoadState<PersonalForecast?>())
    val forecast = _forecast.asStateFlow()

    private val _analytics = MutableStateFlow(LoadState<PersonalAnalytics?>())
    val analytics = _analytics.asStateFlow()

    init { refresh() }

    fun refresh() = viewModelScope.launch {
        _upcoming.value = LoadState(loading = true)
        _forecast.value = LoadState(loading = true)
        _analytics.value = LoadState(loading = true)

        val upcomingRequest = async { runCatching { repo.upcomingBills() } }
        val forecastRequest = async { runCatching { repo.personalForecast() } }
        val analyticsRequest = async { runCatching { repo.personalAnalytics() } }

        upcomingRequest.await()
            .onSuccess { _upcoming.value = LoadState(data = it) }
            .onFailure { _upcoming.value = LoadState(error = it.message) }

        forecastRequest.await()
            .onSuccess { _forecast.value = LoadState(data = it) }
            .onFailure { _forecast.value = LoadState(error = it.message) }

        analyticsRequest.await()
            .onSuccess { _analytics.value = LoadState(data = it) }
            .onFailure { _analytics.value = LoadState(error = it.message) }
    }
}
