package com.tukutuku.synced.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.tukutuku.synced.data.model.Transaction

@Entity(tableName="transactions")
data class CachedTransaction(@PrimaryKey val id:String,val walletId:String,val type:String,val amount:Double,val category:String?,val description:String?,val merchant:String?,val source:String?,val createdAt:String?) {
    fun model()=Transaction(id,walletId,null,type,amount,category,description,merchant,source,null,createdAt)
    companion object { fun from(t:Transaction)=CachedTransaction(t.id,t.walletId,t.type,t.amount,t.category,t.description,t.merchant,t.source,t.createdAt) }
}
