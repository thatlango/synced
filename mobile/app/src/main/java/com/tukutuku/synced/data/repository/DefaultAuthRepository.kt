package com.tukutuku.synced.data.repository

import com.tukutuku.synced.data.model.CoreLoginRequest
import com.tukutuku.synced.data.model.CoreRegisterRequest
import com.tukutuku.synced.data.model.CoreSessionLinkRequest
import com.tukutuku.synced.data.remote.SyncedApiService
import com.tukutuku.synced.data.remote.TukuCoreApiService
import com.tukutuku.synced.data.session.SessionStore
import com.tukutuku.synced.domain.AuthState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultAuthRepository @Inject constructor(
    private val api: SyncedApiService,
    private val coreApi: TukuCoreApiService,
    private val sessions: SessionStore,
) : AuthRepository {
    private val _state = MutableStateFlow<AuthState>(AuthState.Initializing)
    override val state: StateFlow<AuthState> = _state.asStateFlow()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    init { scope.launch { initialize() } }

    override suspend fun initialize() {
        if (sessions.token().isNullOrBlank()) {
            _state.value = AuthState.SignedOut
            return
        }
        refresh().onFailure {
            sessions.clear()
            _state.value = AuthState.SignedOut
        }
    }

    override suspend fun signIn(email: String, password: String): Result<Unit> = try {
        require(email.isNotBlank()) { "Enter your email address." }
        require(password.isNotBlank()) { "Enter your password." }
        val core = coreApi.login(CoreLoginRequest(email.trim().lowercase(), password)).data
            ?: error("Tuku Core did not return a session.")
        val token = core.session?.accessToken ?: error("Tuku Core session is unavailable.")
        linkVerifiedCoreSession(token)
        Result.success(Unit)
    } catch (error: Throwable) {
        _state.value = AuthState.SignedOut
        Result.failure(friendlyAuthError(error, false))
    }

    override suspend fun register(name: String, email: String, password: String): Result<Unit> = try {
        require(name.trim().isNotBlank()) { "Enter your name." }
        require(email.isNotBlank()) { "Enter your email address." }
        require(password.length >= 8) { "Password must contain at least 8 characters." }
        val core = coreApi.register(
            CoreRegisterRequest(
                email = email.trim().lowercase(),
                password = password,
                name = name.trim(),
            ),
        ).data ?: error("Tuku Core did not return a session.")
        val token = core.session?.accessToken ?: error("Tuku Core session is unavailable.")
        linkVerifiedCoreSession(token)
        Result.success(Unit)
    } catch (error: Throwable) {
        _state.value = AuthState.SignedOut
        Result.failure(friendlyAuthError(error, true))
    }

    private suspend fun linkVerifiedCoreSession(coreAccessToken: String) {
        val response = api.linkCoreSession(CoreSessionLinkRequest(coreAccessToken)).data
            ?: error("Synced session was not returned.")
        sessions.save(response.accessToken, response.user.id, response.user.email, response.user.name)
        _state.value = AuthState.SignedIn(response.user)
    }

    override suspend fun refresh() = runCatching {
        val user = api.me().data ?: error("Profile unavailable")
        _state.value = AuthState.SignedIn(user)
    }

    override suspend fun signOut() {
        sessions.clear()
        _state.value = AuthState.SignedOut
    }

    private fun friendlyAuthError(error: Throwable, registering: Boolean): Throwable {
        if (error is IllegalArgumentException || error !is HttpException) return error
        val message = when (error.code()) {
            400 -> if (registering) "Check your account details and try again." else "Check your email and password."
            401 -> "Email or password is incorrect."
            409 -> "A Tuku account already exists for this email. Sign in instead."
            423 -> "This account is temporarily locked. Try again later."
            429 -> "Too many attempts. Try again shortly."
            else -> "Tuku account service is unavailable. Try again."
        }
        return IllegalStateException(message, error)
    }
}
