package com.tukutuku.synced.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.tukutuku.synced.data.repository.FinanceRepository
import com.tukutuku.synced.data.session.SessionStore
import com.tukutuku.synced.sms.SmsReader
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class SmsSyncWorker @AssistedInject constructor(@Assisted context:Context,@Assisted params:WorkerParameters,private val reader:SmsReader,private val repo:FinanceRepository,private val sessions:SessionStore):CoroutineWorker(context,params){
 override suspend fun doWork():Result{
  val wallet=repo.personalWalletId()?:return Result.retry(); val since=sessions.smsLastTimestamp().takeIf{it>0}?:System.currentTimeMillis()-7*86_400_000L
  val scan=reader.scan(since); if(scan.candidates.isNotEmpty()) repo.ingestCandidates(wallet,scan.candidates)
  if(scan.newestTimestamp>since)sessions.setSmsLastTimestamp(scan.newestTimestamp)
  return Result.success(workDataOf("scanned" to scan.scanned,"candidates" to scan.candidates.size))
 }
 companion object{
  const val UNIQUE="synced-sms-finance-sync"
  fun schedule(context:Context){val constraints=Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();val request=PeriodicWorkRequestBuilder<SmsSyncWorker>(15,TimeUnit.MINUTES).setConstraints(constraints).build();WorkManager.getInstance(context).enqueueUniquePeriodicWork(UNIQUE,ExistingPeriodicWorkPolicy.UPDATE,request)}
  fun cancel(context:Context)=WorkManager.getInstance(context).cancelUniqueWork(UNIQUE)
  fun runNow(context:Context)=WorkManager.getInstance(context).enqueue(OneTimeWorkRequestBuilder<SmsSyncWorker>().setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build())
 }
}
