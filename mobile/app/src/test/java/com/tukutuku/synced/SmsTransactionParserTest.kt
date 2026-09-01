package com.tukutuku.synced
import com.tukutuku.synced.sms.SmsTransactionParser
import org.junit.Assert.*
import org.junit.Test
class SmsTransactionParserTest{
 @Test fun parsesMtnCredit(){val x=SmsTransactionParser.parse("MTN MoMo","You have received UGX 50,000 from JANE DOE. Your balance is UGX 60,000",1234)!!;assertEquals("credit",x.type);assertEquals(50000.0,x.amount,0.01);assertEquals("mtn",x.source);assertTrue(x.referenceId!!.length==64)}
 @Test fun parsesAirtelDebit(){val x=SmsTransactionParser.parse("AirtelMoney","You have paid UGX 12,500 to SHOP ABC. Available balance UGX 30,000",1234)!!;assertEquals("debit",x.type);assertEquals(12500.0,x.amount,0.01);assertEquals("airtel",x.source)}
 @Test fun ignoresUnrelatedSms(){assertNull(SmsTransactionParser.parse("Friend","Meet me at 5pm",1234))}
}
