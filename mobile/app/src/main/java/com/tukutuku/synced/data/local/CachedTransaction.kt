package com.tukutuku.synced.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tukutuku.synced.data.model.Transaction

@Entity(tableName = "transactions")
data class CachedTransaction(
    @PrimaryKey val id: String,
    val walletId: String,
    val type: String,
    val amount: Double,
    val category: String?,
    val description: String?,
    val merchant: String?,
    val source: String?,
    val createdAt: String?,
) {
    fun model() = Transaction(
        id = id,
        walletId = walletId,
        userId = null,
        type = type,
        amount = amount,
        category = category,
        description = description,
        merchant = merchant,
        source = source,
        visibility = null,
        metadata = null,
        createdAt = createdAt,
    )

    companion object {
        fun from(t: Transaction) = CachedTransaction(
            id = t.id,
            walletId = t.walletId,
            type = t.type,
            amount = t.amount,
            category = t.category,
            description = t.description,
            merchant = t.merchant,
            source = t.source,
            createdAt = t.createdAt,
        )
    }
}
