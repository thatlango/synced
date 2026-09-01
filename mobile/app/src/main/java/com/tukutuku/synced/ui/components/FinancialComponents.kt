package com.tukutuku.synced.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tukutuku.synced.ui.theme.*
import java.text.NumberFormat
import java.util.Locale

fun money(v:Double,currency:String="UGX"):String="$currency ${NumberFormat.getNumberInstance(Locale.US).format(v)}"
@Composable fun SyncedCard(modifier:Modifier=Modifier,content:@Composable ColumnScope.()->Unit){ Card(modifier=modifier,shape=RoundedCornerShape(22.dp),colors=CardDefaults.cardColors(containerColor=Surface),border=CardDefaults.outlinedCardBorder(),elevation=CardDefaults.cardElevation(defaultElevation=0.dp)){Column(Modifier.padding(18.dp),content=content)} }
@Composable fun SectionTitle(title:String,action:String?=null,onAction:(()->Unit)?=null){Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text(title,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold,color=Ink);if(action!=null&&onAction!=null)TextButton(onClick=onAction){Text(action)}}}
@Composable fun ProgressBar(value:Int,color:Color=Primary){val f=(value.coerceIn(0,100)/100f);Box(Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(100.dp)).background(Border)){Box(Modifier.fillMaxHeight().fillMaxWidth(f).background(color))}}
@Composable fun EmptyState(title:String,body:String,action:String?=null,onAction:(()->Unit)?=null){Column(Modifier.fillMaxWidth().padding(28.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(title,fontWeight=FontWeight.Bold,color=Ink);Spacer(Modifier.height(8.dp));Text(body,color=Muted,style=MaterialTheme.typography.bodyMedium);if(action!=null&&onAction!=null){Spacer(Modifier.height(14.dp));Button(onClick=onAction){Text(action)}}}}
@Composable fun InsightCard(text:String){Card(shape=RoundedCornerShape(18.dp),colors=CardDefaults.cardColors(containerColor=PrimarySoft)){Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.Top){Text("✦",color=Primary,fontWeight=FontWeight.Black);Spacer(Modifier.width(10.dp));Column{Text("Synced insight",fontWeight=FontWeight.Bold,color=Ink);Text(text,color=Muted,style=MaterialTheme.typography.bodyMedium)}}}}
