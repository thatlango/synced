package com.tukutuku.synced.sms

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.tukutuku.synced.data.model.StructuredSmsCandidate
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

data class SmsScanResult(val candidates:List<StructuredSmsCandidate>,val newestTimestamp:Long,val scanned:Int)
@Singleton class SmsReader @Inject constructor(@param:ApplicationContext private val context:Context){
 fun scan(since:Long,limit:Int=250):SmsScanResult{
  if(ContextCompat.checkSelfPermission(context,Manifest.permission.READ_SMS)!=PackageManager.PERMISSION_GRANTED) return SmsScanResult(emptyList(),since,0)
  val rows=mutableListOf<StructuredSmsCandidate>(); var newest=since; var scanned=0
  val projection=arrayOf(Telephony.Sms.ADDRESS,Telephony.Sms.BODY,Telephony.Sms.DATE)
  context.contentResolver.query(Telephony.Sms.Inbox.CONTENT_URI,projection,"${Telephony.Sms.DATE} > ?",arrayOf(since.toString()),"${Telephony.Sms.DATE} ASC")?.use{c->
   val a=c.getColumnIndex(Telephony.Sms.ADDRESS);val b=c.getColumnIndex(Telephony.Sms.BODY);val d=c.getColumnIndex(Telephony.Sms.DATE)
   while(c.moveToNext()&&scanned<limit){scanned++;val sender=if(a>=0)c.getString(a) else null;val body=if(b>=0)c.getString(b).orEmpty() else "";val ts=if(d>=0)c.getLong(d) else 0L;newest=maxOf(newest,ts);SmsTransactionParser.parse(sender,body,ts)?.let(rows::add)}
  }
  return SmsScanResult(rows,newest,scanned)
 }
}
