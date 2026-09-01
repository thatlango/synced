package com.tukutuku.synced.data.repository

import com.tukutuku.synced.data.model.CoreLoginRequest
import com.tukutuku.synced.data.model.CoreRegisterRequest
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
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultAuthRepository @Inject constructor(private val api:SyncedApiService,private val sessions:SessionStore):AuthRepository {
 private val _state=MutableStateFlow<AuthState>(AuthState.Initializing); override val state:StateFlow<AuthState> = _state.asStateFlow()
 private val scope=CoroutineScope(SupervisorJob()+Dispatchers.IO)
 init { scope.launch { initialize() } }
 override suspend fun initialize(){ if(sessions.token().isNullOrBlank()){_state.value=AuthState.SignedOut;return}; refresh().onFailure{sessions.clear();_state.value=AuthState.SignedOut} }
 override suspend fun refresh()=runCatching { val u=api.me().data?:error("Profile unavailable"); _state.value=AuthState.SignedIn(u) }
 override suspend fun login(email:String,password:String)=runCatching { val x=api.login(CoreLoginRequest(email.trim().lowercase(),password)).data?:error("No Synced session returned"); sessions.save(x.accessToken,x.user.id,x.user.email,x.user.name); _state.value=AuthState.SignedIn(x.user) }
 override suspend fun register(name:String,email:String,password:String,phone:String?)=runCatching { val x=api.register(CoreRegisterRequest(email.trim().lowercase(),password,name.trim(),phone?.trim()?.ifBlank{null})).data?:error("Account creation requires email confirmation or no session was returned"); sessions.save(x.accessToken,x.user.id,x.user.email,x.user.name); _state.value=AuthState.SignedIn(x.user) }
 override suspend fun signOut(){ sessions.clear(); _state.value=AuthState.SignedOut }
}
