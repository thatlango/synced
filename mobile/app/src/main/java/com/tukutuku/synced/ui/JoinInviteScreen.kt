package com.tukutuku.synced.ui
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.InviteViewModel
import com.tukutuku.synced.ui.theme.*
@Composable fun JoinInviteScreen(initialCode:String?=null,onDone:()->Unit,onBack:()->Unit,vm:InviteViewModel=hiltViewModel()){var code by remember(initialCode){mutableStateOf(initialCode.orEmpty())};val preview by vm.preview.collectAsStateWithLifecycle();LaunchedEffect(initialCode){if(!initialCode.isNullOrBlank())vm.preview(initialCode)};Column(Modifier.fillMaxSize().padding(20.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){TextButton(onClick=onBack){Text("← Back")};Text("Join Synced",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black);Text("Enter an invite code from a shared space or Basket.",color=Muted);OutlinedTextField(code,{code=it.uppercase().take(12)},label={Text("Invite code")},modifier=Modifier.fillMaxWidth());Button(onClick={vm.preview(code)},enabled=code.length>=4,modifier=Modifier.fillMaxWidth()){Text("Preview invite")};if(preview.loading)LinearProgressIndicator(Modifier.fillMaxWidth());preview.error?.let{Text(it,color=Error)};preview.data?.let{i->Card{Column(Modifier.padding(18.dp)){Text(i.targetType.replaceFirstChar{it.uppercase()},color=Secondary,fontWeight=FontWeight.Bold);Text("Invite ${i.code}",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Black);Text("Role: ${i.role?:"member"}",color=Muted);Spacer(Modifier.height(12.dp));Button(onClick={vm.redeem(code){if(it.isSuccess)onDone()}},modifier=Modifier.fillMaxWidth()){Text("Join")}}}}}}
