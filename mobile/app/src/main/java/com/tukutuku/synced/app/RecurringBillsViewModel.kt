package com.tukutuku.synced.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tukutuku.synced.data.model.RecurringDiscoveryResult
import com.tukutuku.synced.data.repository.FinanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RecurringBillsViewModel @Inject constructor(
    private val repo: FinanceRepository,
) : ViewModel() {
    private val _state = MutableStateFlow(LoadState<RecurringDiscoveryResult>())
    val state = _state.asStateFlow()

    fun scan(autoCreate: Boolean = false, onDone: (() -> Unit)? = null) = viewModelScope.launch {
        _state.value = LoadState(loading = true, data = _state.value.data)
        runCatching { repo.discoverRecurringBills(autoCreate) }
            .onSuccess {
                _state.value = LoadState(data = it)
                onDone?.invoke()
            }
            .onFailure { _state.value = LoadState(error = it.message ?: "Recurring payment analysis failed") }
    }
}
