package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.app.FinancialOutlookViewModel
import com.tukutuku.synced.app.HomeViewModel
import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.domain.AuthState
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable fun HomeScreen(
    onAdd:()->Unit,
    onSms:()->Unit,
    onHousehold:()->Unit,
    onTransactions:()->Unit,
    onAsk:()->Unit,
    home:HomeViewModel=hiltViewModel(),
    outlook:FinancialOutlookViewModel=hiltViewModel(),
    auth:AuthViewModel=hiltViewModel(),
){
 val wallet by home.wallet.collectAsStateWithLifecycle();val tx by home.transactions.collectAsStateWithLifecycle();val insight by home.insight.collectAsStateWithLifecycle();val authState by auth.state.collectAsStateWithLifecycle();val user=(authState as? AuthState.SignedIn)?.user
 val upcoming by outlook.upcoming.collectAsStateWithLifecycle();val forecast by outlook.forecast.collectAsStateWithLifecycle();val analytics by outlook.analytics.collectAsStateWithLifecycle()
 LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(18.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
  item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Column{Text("Good to see you",color=Muted);Text(user?.name?.substringBefore(' ')?.ifBlank{null}?:"there",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black,color=Ink)};IconButton(onClick={auth.signOut()}){Icon(Icons.AutoMirrored.Outlined.Logout,"Sign out",tint=Muted)}}}
  item{Card(colors=CardDefaults.cardColors(containerColor=Primary),shape=MaterialTheme.shapes.extraLarge){Column(Modifier.fillMaxWidth().padding(22.dp)){Text("Personal balance",color=Color.White.copy(alpha=.72f));Text(money(wallet.data?.summary?.personalBalance?:0.0),style=MaterialTheme.typography.headlineLarge,fontWeight=FontWeight.Black,color=Color.White,modifier=Modifier.padding(vertical=8.dp));Text("Combined with shared spaces: ${money(wallet.data?.summary?.combinedBalance?:0.0)}",color=Color.White.copy(alpha=.75f),style=MaterialTheme.typography.bodySmall)}}}
  insight?.deterministicInsight?.takeIf{it.isNotBlank()}?.let{item{InsightCard(it)}}
  upcoming.data?.let{bills->item{SyncedCard{Column(Modifier.fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(10.dp)){Row(verticalAlignment=Alignment.CenterVertically){Icon(Icons.Outlined.ReceiptLong,null,tint=Primary);Spacer(Modifier.width(10.dp));Column{Text("Next 30 days",fontWeight=FontWeight.Bold,color=Ink);Text(if(bills.summary.count==0)"No bills or subscriptions due" else "${bills.summary.count} upcoming payment${if(bills.summary.count==1)"" else "s"}",color=Muted,style=MaterialTheme.typography.bodySmall)}};if(bills.summary.count>0){Text(money(bills.summary.totalUpcoming),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Black,color=Ink);Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text("Bills ${money(bills.summary.billsTotal)}",color=Muted,style=MaterialTheme.typography.bodySmall);Text("Subscriptions ${money(bills.summary.subscriptionsTotal)}",color=Muted,style=MaterialTheme.typography.bodySmall)};bills.summary.nextDue?.let{Text("Next due ${it.substringBefore('T')}",color=Muted,style=MaterialTheme.typography.labelMedium)}}}}}}
  analytics.data?.let{a->item{SyncedCard{Column(Modifier.fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(9.dp)){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Column{Text("Spending this month",fontWeight=FontWeight.Bold,color=Ink);Text(money(a.thisMonth.total),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Black,color=Ink)};if(a.thisMonth.change!=0){Text("${if(a.thisMonth.change>0)"+" else ""}${a.thisMonth.change}% vs last month",color=if(a.thisMonth.change>0)Error else Success,style=MaterialTheme.typography.labelMedium)}};a.byCategory.take(3).forEach{c->Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(c.category?.replace('_',' ')?:"Other",color=Muted);Text("${money(c.amount)} • ${c.percentage}%",fontWeight=FontWeight.SemiBold,color=Ink)}};if(a.byCategory.isEmpty()){Text("Categories will appear as transactions are classified.",color=Muted,style=MaterialTheme.typography.bodySmall)}}}}}
  forecast.data?.let{f->item{SyncedCard{Column(Modifier.fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(10.dp)){Row(verticalAlignment=Alignment.CenterVertically){Icon(Icons.Outlined.TrendingUp,null,tint=Primary);Spacer(Modifier.width(10.dp));Column{Text("Cash outlook",fontWeight=FontWeight.Bold,color=Ink);Text("Based on your recent 3-month pattern",color=Muted,style=MaterialTheme.typography.bodySmall)}};Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Column{Text("Monthly income",color=Muted,style=MaterialTheme.typography.labelMedium);Text(money(f.avgMonthlyIncome),fontWeight=FontWeight.Bold,color=Success)};Column(horizontalAlignment=Alignment.End){Text("Monthly spend",color=Muted,style=MaterialTheme.typography.labelMedium);Text(money(f.avgMonthlySpend+f.monthlySubscriptionCost),fontWeight=FontWeight.Bold,color=Ink)}};f.projections.firstOrNull()?.let{p->HorizontalDivider();Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text("${p.month} balance",color=Muted);Text(money(p.projectedBalance),fontWeight=FontWeight.Bold,color=Ink)}};if(f.daysUntilZero in 0..90){Text("At the current burn rate, available cash covers about ${f.daysUntilZero} days.",color=Error,style=MaterialTheme.typography.bodySmall)}}}}}
  item{SectionTitle("Quick actions");Spacer(Modifier.height(10.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){Quick("Expense",Icons.Outlined.AddCircle,onAdd,Modifier.weight(1f));Quick("SMS sync",Icons.Outlined.Sms,onSms,Modifier.weight(1f));Quick("Shared",Icons.Outlined.Group,onHousehold,Modifier.weight(1f));Quick("Ask",Icons.Outlined.AutoAwesome,onAsk,Modifier.weight(1f))}}
  item{SectionTitle("Recent transactions","See all",onTransactions)}
  if(tx.loading)item{Box(Modifier.fillMaxWidth().padding(24.dp),contentAlignment=Alignment.Center){CircularProgressIndicator()}}
  else if(tx.data.isNullOrEmpty())item{EmptyState("No transactions yet","Add an expense, fund your wallet or sync eligible mobile-money messages.","Add expense",onAdd)}
  else items(tx.data!!.take(6).size){i->TransactionRow(tx.data!![i])}
 }
}
@Composable private fun Quick(label:String,icon:androidx.compose.ui.graphics.vector.ImageVector,onClick:()->Unit,modifier:Modifier){OutlinedButton(onClick=onClick,modifier=modifier.height(78.dp),contentPadding=PaddingValues(6.dp)){Column(horizontalAlignment=Alignment.CenterHorizontally){Icon(icon,null);Spacer(Modifier.height(5.dp));Text(label,style=MaterialTheme.typography.labelSmall)}}}
@Composable fun TransactionRow(tx:Transaction){SyncedCard{Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Surface(shape=MaterialTheme.shapes.medium,color=if(tx.type=="credit")Color(0xFFE7F8F1) else Color(0xFFFFEEEE)){Icon(if(tx.type=="credit")Icons.Outlined.SouthWest else Icons.Outlined.NorthEast,null,tint=if(tx.type=="credit")Success else Error,modifier=Modifier.padding(10.dp))};Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(tx.description?:tx.merchant?:tx.category?:"Transaction",fontWeight=FontWeight.SemiBold,color=Ink,maxLines=1);Text(listOfNotNull(tx.category,tx.source).joinToString(" • "),color=Muted,style=MaterialTheme.typography.bodySmall)};Text((if(tx.type=="credit")"+" else "-")+money(tx.amount),fontWeight=FontWeight.Bold,color=if(tx.type=="credit")Success else Ink)}}}
