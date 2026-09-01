package com.tukutuku.synced.data.remote

import com.tukutuku.synced.data.model.ApiEnvelope
import com.tukutuku.synced.data.model.CoreLoginRequest
import com.tukutuku.synced.data.model.CoreNativeAuthResponse
import com.tukutuku.synced.data.model.CoreRegisterRequest
import retrofit2.http.Body
import retrofit2.http.POST

interface TukuCoreApiService {
    @POST("auth/login")
    suspend fun login(@Body body: CoreLoginRequest): ApiEnvelope<CoreNativeAuthResponse>

    @POST("auth/register")
    suspend fun register(@Body body: CoreRegisterRequest): ApiEnvelope<CoreNativeAuthResponse>
}
