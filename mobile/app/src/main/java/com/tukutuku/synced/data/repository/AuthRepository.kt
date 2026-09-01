package com.tukutuku.synced.data.repository
import com.tukutuku.synced.domain.AuthState
import kotlinx.coroutines.flow.StateFlow
interface AuthRepository {
 val state:StateFlow<AuthState>
 suspend fun initialize()
 suspend fun authorizationUrl():Result<String>
 suspend fun handleCoreCallback(callbackUri:String):Result<Unit>
 suspend fun refresh():Result<Unit>
 suspend fun signOut()
}
