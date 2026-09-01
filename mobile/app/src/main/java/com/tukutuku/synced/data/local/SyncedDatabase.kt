package com.tukutuku.synced.data.local
import androidx.room.Database
import androidx.room.RoomDatabase
@Database(entities=[CachedTransaction::class],version=1,exportSchema=false)
abstract class SyncedDatabase:RoomDatabase(){ abstract fun transactions():TransactionDao }
