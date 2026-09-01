package com.tukutuku.synced.di
import android.content.Context
import androidx.room.Room
import com.tukutuku.synced.data.local.SyncedDatabase
import com.tukutuku.synced.data.local.TransactionDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
@Module @InstallIn(SingletonComponent::class)
object DatabaseModule {
 @Provides @Singleton fun db(@ApplicationContext context:Context)=Room.databaseBuilder(context,SyncedDatabase::class.java,"synced-cache.db").fallbackToDestructiveMigration(dropAllTables = true).build()
 @Provides fun transactions(db:SyncedDatabase):TransactionDao=db.transactions()
}
