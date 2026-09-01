package com.tukutuku.synced.di
import com.tukutuku.synced.data.repository.AuthRepository
import com.tukutuku.synced.data.repository.DefaultAuthRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
@Module @InstallIn(SingletonComponent::class)
abstract class RepositoryModule { @Binds @Singleton abstract fun auth(impl:DefaultAuthRepository):AuthRepository }
