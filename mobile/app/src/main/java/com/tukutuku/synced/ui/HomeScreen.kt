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
import com.tukutuku.synced.app.HomeViewModel
import com.tukutuku.synced.data.model.Transaction
import com.tukutuku.synced.domain.AuthState
import com.tukutuku.synced.ui.components.*
import com.tukutuku.synced.ui.theme.*

@Composable fun HomeScreen(onAdd:()->Unit,onSms:()->Unit,onHousehold:()->Unit,onTransactions:()->Unit,onAsk:()->Unit,home:HomeViewModel=hiltViewModel(),auth:AuthViewModel=hiltViewModel()){
 val wallet by home.wallet.collectAsStateWithLifecycle();val tx by home.transactions.collectAsStateWithLifecycle();val insight by home.insight.collectAsStateWithLifecycle();val authState by auth.state.collectAsStateWithLifecycle();val user=(authState as? AuthState.SignedIn)?.user
 LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(18.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
  item{Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Column{Text("Good to see you",color=Muted);Text(user?.name?.substringBefore(' ')?.ifBlank{null}?:"there",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black,color=Ink)};IconButton(onClick={auth.signOut()}){Icon(Icons.AutoMirrored.Outlined.Logout,"Sign out",tint=Muted)}}}
  item{Card(colors=CardDefaults.cardColors(containerColor=Primary),shape=MaterialTheme.shapes.extraLarge){Column(Modifier.fillMaxWidth().padding(22.dp)){Text("Personal balance",color=Color.White.copy(alpha=.72f));Text(money(wallet.data?.summary?.personalBalance?:0.0),style=MaterialTheme.typography.headlineLarge,fontWeight=FontWeight.Black,color=Color.White,modifier=Modifier.padding(vertical=8.dp));Text("Combined with shared spaces: ${money(wallet.data?.summary?.combinedBalance?:0.0)}",color=Color.White.copy(alpha=.75f),style=MaterialTheme.typography.bodySmall)}}}
  insight?.deterministicInsight?.takeIf{it.isNotBlank()}?.let{item{InsightCard(it)}}
  item{SectionTitle("Quick actions");Spacer(Modifier.height(10.dp));Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(9.dp)){Quick("Expense",Icons.Outlined.AddCircle,onAdd,Modifier.weight(1f));Quick("SMS sync",Icons.Outlined.Sms,onSms,Modifier.weight(1f));Quick("Shared",Icons.Outlined.Group,onHousehold,Modifier.weight(1f));Quick("Ask",Icons.Outlined.AutoAwesome,onAsk,Modifier.weight(1f))}}
  item{SectionTitle("Recent transactions","See all",onTransactions)}
  if(tx.loading)item{Box(Modifier.fillMaxWidth().padding(24.dp),contentAlignment=Alignment.Center){CircularProgressIndicator()}}
  else if(tx.data.isNullOrEmpty())item{EmptyState("No transactions yet","Add an expense, fund your wallet or sync eligible mobile-money messages.","Add expense",onAdd)}
  else items(tx.data!!.take(6).size){i->TransactionRow(tx.data!![i])}
 }
}
@Composable private fun Quick(label:String,icon:androidx.compose.ui.graphics.vector.ImageVector,onClick:()->Unit,modifier:Modifier){OutlinedButton(onClick=onClick,modifier=modifier.height(78.dp),contentPadding=PaddingValues(6.dp)){Column(horizontalAlignment=Alignment.CenterHorizontally){Icon(icon,null);Spacer(Modifier.height(5.dp));Text(label,style=MaterialTheme.typography.labelSmall)}}}
@Composable fun TransactionRow(tx:Transaction){SyncedCard{Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Surface(shape=MaterialTheme.shapes.medium,color=if(tx.type=="credit")Color(0xFFE7F8F1) else Color(0xFFFFEEEE)){Icon(if(tx.type=="credit")Icons.Outlined.SouthWest else Icons.Outlined.NorthEast,null,tint=if(tx.type=="credit")Success else Error,modifier=Modifier.padding(10.dp))};Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(tx.description?:tx.merchant?:tx.category?:"Transaction",fontWeight=FontWeight.SemiBold,color=Ink,maxLines=1);Text(listOfNotNull(tx.category,tx.source).joinToString(" • "),color=Muted,style=MaterialTheme.typography.bodySmall)};Text((if(tx.type=="credit")"+" else "-")+money(tx.amount),fontWeight=FontWeight.Bold,color=if(tx.type=="credit")Success else Ink)}}}
