package com.tukutuku.synced.data.repository

import android.net.Uri
import android.util.Base64
import com.tukutuku.synced.data.model.CoreSsoExchangeRequest
import com.tukutuku.synced.data.remote.SyncedApiService
import com.tukutuku.synced.data.session.SessionStore
import com.tukutuku.synced.domain.AuthState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.security.MessageDigest
import java.security.SecureRandom
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultAuthRepository @Inject constructor(
    private val api: SyncedApiService,
    private val sessions: SessionStore,
) : AuthRepository {
    companion object {
        private const val CORE_AUTHORIZE_URL = "https://core.tukutuku.org/authorize"
        private const val CLIENT_ID = "synced-android"
        private const val REDIRECT_URI = "synced://auth/tuku/callback"
    }

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

    override suspend fun authorizationUrl() = runCatching {
        val verifier = randomUrlSafe(64)
        val state = randomUrlSafe(32)
        val challenge = Base64.encodeToString(
            MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)),
            Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING,
        )
        sessions.savePendingSso(state, verifier)
        Uri.parse(CORE_AUTHORIZE_URL).buildUpon()
            .appendQueryParameter("client_id", CLIENT_ID)
            .appendQueryParameter("redirect_uri", REDIRECT_URI)
            .appendQueryParameter("state", state)
            .appendQueryParameter("code_challenge", challenge)
            .appendQueryParameter("code_challenge_method", "S256")
            .build().toString()
    }

    override suspend fun handleCoreCallback(callbackUri: String) = runCatching {
        val uri = Uri.parse(callbackUri)
        require(uri.scheme == "synced" && uri.host == "auth" && uri.path == "/tuku/callback") { "Invalid Tuku callback." }
        uri.getQueryParameter("error")?.let { error(it) }
        val code = uri.getQueryParameter("code")?.takeIf { it.isNotBlank() } ?: error("Tuku authorization code is missing.")
        val returnedState = uri.getQueryParameter("state")?.takeIf { it.isNotBlank() } ?: error("Tuku authorization state is missing.")
        val pending = sessions.pendingSso() ?: error("This sign-in attempt has expired. Start again.")
        require(returnedState == pending.first) { "Tuku sign-in state did not match." }
        val response = api.exchangeCoreCode(CoreSsoExchangeRequest(code, pending.second, REDIRECT_URI)).data
            ?: error("Synced session was not returned.")
        sessions.save(response.accessToken, response.user.id, response.user.email, response.user.name)
        sessions.clearPendingSso()
        _state.value = AuthState.SignedIn(response.user)
    }.onFailure {
        sessions.clearPendingSso()
        _state.value = AuthState.SignedOut
    }

    override suspend fun refresh() = runCatching {
        val user = api.me().data ?: error("Profile unavailable")
        _state.value = AuthState.SignedIn(user)
    }

    override suspend fun signOut() {
        sessions.clear()
        _state.value = AuthState.SignedOut
    }

    private fun randomUrlSafe(byteCount: Int): String {
        val bytes = ByteArray(byteCount)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    }
}
