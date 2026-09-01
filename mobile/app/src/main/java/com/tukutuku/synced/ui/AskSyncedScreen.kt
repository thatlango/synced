package com.tukutuku.synced.ui
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AutoAwesome
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.InsightViewModel
import com.tukutuku.synced.ui.components.SyncedCard
import com.tukutuku.synced.ui.theme.*
import kotlinx.serialization.json.JsonPrimitive
@Composable fun AskSyncedScreen(onBack:()->Unit,vm:InsightViewModel=hiltViewModel()){var q by remember{mutableStateOf("")};val a by vm.answer.collectAsStateWithLifecycle();Column(Modifier.fillMaxSize().padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){TextButton(onClick=onBack){Text("← Back")};Icon(Icons.Outlined.AutoAwesome,null,tint=Primary,modifier=Modifier.size(40.dp));Text("Ask Synced",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black);Text("Answers use only your Synced financial state and separate observed facts from suggestions.",color=Muted);OutlinedTextField(q,{q=it.take(2000)},label={Text("What should I pay attention to?")},minLines=3,modifier=Modifier.fillMaxWidth());Button(onClick={vm.ask(q)},enabled=q.isNotBlank()&&!a.loading,modifier=Modifier.fillMaxWidth()){if(a.loading)CircularProgressIndicator(Modifier.size(18.dp),strokeWidth=2.dp,color=androidx.compose.ui.graphics.Color.White) else Text("Ask")};a.error?.let{Text(it,color=Error)};a.data?.let{resp->SyncedCard{Text("Synced",fontWeight=FontWeight.Bold,color=Primary);Spacer(Modifier.height(8.dp));Text(answerText(resp.answer),color=Ink);resp.evidenceBoundary?.let{Spacer(Modifier.height(10.dp));Text(it,color=Muted,style=MaterialTheme.typography.labelSmall)}}}}}
private fun answerText(v:kotlinx.serialization.json.JsonElement?):String=when(v){is JsonPrimitive->v.content;null->"No answer returned.";else->v.toString()}
