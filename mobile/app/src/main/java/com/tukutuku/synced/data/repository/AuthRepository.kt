package com.tukutuku.synced.data.repository
import com.tukutuku.synced.domain.AuthState
import kotlinx.coroutines.flow.StateFlow
interface AuthRepository {
 val state:StateFlow<AuthState>
 suspend fun initialize()
 suspend fun login(email:String,password:String):Result<Unit>
 suspend fun register(name:String,email:String,password:String,phone:String?=null):Result<Unit>
 suspend fun refresh():Result<Unit>
 suspend fun signOut()
}
