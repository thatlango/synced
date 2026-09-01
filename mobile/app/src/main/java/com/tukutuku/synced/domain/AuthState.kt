package com.tukutuku.synced.domain

import com.tukutuku.synced.data.model.User

sealed interface AuthState {
    data object Initializing : AuthState
    data object SignedOut : AuthState
    data class SignedIn(val user: User) : AuthState
    data class Error(val message: String) : AuthState
}
