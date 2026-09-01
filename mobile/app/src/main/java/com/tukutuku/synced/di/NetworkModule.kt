package com.tukutuku.synced.di

import com.tukutuku.synced.BuildConfig
import com.tukutuku.synced.data.remote.AuthInterceptor
import com.tukutuku.synced.data.remote.SyncedApiService
import com.tukutuku.synced.data.remote.TukuCoreApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module @InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton fun json() = Json { ignoreUnknownKeys = true; coerceInputValues = true; explicitNulls = false; encodeDefaults = false }
    @Provides @Singleton fun client(auth: AuthInterceptor): OkHttpClient {
        val logging = HttpLoggingInterceptor().apply { level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE; redactHeader("Authorization") }
        return OkHttpClient.Builder().addInterceptor(auth).addInterceptor(logging).connectTimeout(15,TimeUnit.SECONDS).readTimeout(40,TimeUnit.SECONDS).callTimeout(55,TimeUnit.SECONDS).build()
    }
    @Provides @Singleton fun retrofit(client: OkHttpClient, json: Json): Retrofit = Retrofit.Builder().baseUrl(BuildConfig.SYNCED_API_BASE_URL).client(client).addConverterFactory(json.asConverterFactory("application/json".toMediaType())).build()
    @Provides @Singleton fun api(retrofit: Retrofit): SyncedApiService = retrofit.create(SyncedApiService::class.java)
    @Provides @Singleton fun coreApi(json: Json): TukuCoreApiService {
        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BASIC else HttpLoggingInterceptor.Level.NONE
            redactHeader("Authorization")
        }
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder()
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json")
                        .header("x-tuku-client", "synced-android-native")
                        .build(),
                )
            }
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(40, TimeUnit.SECONDS)
            .callTimeout(55, TimeUnit.SECONDS)
            .build()
        return Retrofit.Builder()
            .baseUrl(BuildConfig.TUKU_CORE_API_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(TukuCoreApiService::class.java)
    }
}
