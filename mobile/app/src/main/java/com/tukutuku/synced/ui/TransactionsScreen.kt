package com.tukutuku.synced.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.TransactionsViewModel
import com.tukutuku.synced.ui.components.EmptyState
import com.tukutuku.synced.ui.theme.*

@Composable fun TransactionsScreen(vm:TransactionsViewModel=hiltViewModel()){
 val rows by vm.rows.collectAsStateWithLifecycle();var add by remember{mutableStateOf(false)}
 Box(Modifier.fillMaxSize()){LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(18.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){item{Text("Transactions",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black,color=Ink);Text("Your personal and shared money movement.",color=Muted)};if(rows.loading)item{LinearProgressIndicator(Modifier.fillMaxWidth())}else if(rows.data.isNullOrEmpty())item{EmptyState("Nothing here yet","Transactions will appear here as you add them or sync eligible messages.")}else items(rows.data!!.size){TransactionRow(rows.data!![it])}};FloatingActionButton(onClick={add=true},modifier=Modifier.align(androidx.compose.ui.Alignment.BottomEnd).padding(22.dp),containerColor=Primary){Icon(Icons.Outlined.Add,null,tint=androidx.compose.ui.graphics.Color.White)}}
 if(add)AddTransactionDialog(onDismiss={add=false},onCreate={type,amount,category,description,merchant->vm.create(type,amount,category,description,merchant){if(it.isSuccess)add=false}})
}
@Composable private fun AddTransactionDialog(onDismiss:()->Unit,onCreate:(String,Double,String?,String?,String?)->Unit){var type by remember{mutableStateOf("debit")};var amount by remember{mutableStateOf("")};var category by remember{mutableStateOf("general")};var desc by remember{mutableStateOf("")};var merchant by remember{mutableStateOf("")};AlertDialog(onDismissRequest=onDismiss,title={Text(if(type=="debit")"Add expense" else "Add income")},text={Column(verticalArrangement=Arrangement.spacedBy(9.dp)){Row{FilterChip(type=="debit",{type="debit"},{Text("Expense")});Spacer(Modifier.width(8.dp));FilterChip(type=="credit",{type="credit"},{Text("Income")})};OutlinedTextField(amount,{amount=it.filter{c->c.isDigit()||c=='.'}},label={Text("Amount (UGX)")});OutlinedTextField(category,{category=it},label={Text("Category")});OutlinedTextField(desc,{desc=it},label={Text("Description")});OutlinedTextField(merchant,{merchant=it},label={Text("Merchant / source")})}},confirmButton={Button(onClick={amount.toDoubleOrNull()?.takeIf{it>0}?.let{onCreate(type,it,category.ifBlank{null},desc.ifBlank{null},merchant.ifBlank{null})}},enabled=(amount.toDoubleOrNull()?:0.0)>0){Text("Save")}},dismissButton={TextButton(onClick=onDismiss){Text("Cancel")}})}
