package com.tukutuku.synced.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY createdAt DESC LIMIT :limit") suspend fun recent(limit:Int=50):List<CachedTransaction>
    @Insert(onConflict=OnConflictStrategy.REPLACE) suspend fun upsert(rows:List<CachedTransaction>)
    @Query("DELETE FROM transactions") suspend fun clear()
}
