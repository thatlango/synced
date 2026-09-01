package com.tukutuku.synced.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.OpenInBrowser
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.ui.theme.*

@Composable
fun AuthScreen(viewModel: AuthViewModel = hiltViewModel()) {
    val context = LocalContext.current
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()

    Box(Modifier.fillMaxSize().background(Canvas), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(shape = RoundedCornerShape(24.dp), color = Primary) {
                Box(Modifier.size(76.dp), contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Outlined.AccountBalanceWallet,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(38.dp),
                    )
                }
            }
            Spacer(Modifier.height(18.dp))
            Text("Synced", fontSize = 34.sp, fontWeight = FontWeight.Black, color = Ink)
            Text(
                "Money, plans and shared goals in one place.",
                color = Muted,
                modifier = Modifier.padding(top = 7.dp, bottom = 28.dp),
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = CardDefaults.outlinedCardBorder(),
            ) {
                Column(Modifier.padding(22.dp)) {
                    Text("Use your Tuku account", fontWeight = FontWeight.Bold, fontSize = 21.sp, color = Ink)
                    Text(
                        "One secure account works across Synced and other Tuku products. Sign in or create your account in Tuku Auth, then return here automatically.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(top = 7.dp, bottom = 18.dp),
                    )
                    error?.let {
                        Text(it, color = Error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(bottom = 12.dp))
                    }
                    Button(
                        onClick = {
                            viewModel.beginCoreSignIn { url ->
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                            }
                        },
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(15.dp),
                    ) {
                        if (busy) {
                            CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(20.dp), color = Color.White)
                        } else {
                            Icon(Icons.Outlined.OpenInBrowser, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Continue with Tuku", fontWeight = FontWeight.Bold)
                        }
                    }
                    Text(
                        "Synced never receives or stores your Tuku password.",
                        color = Muted,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                }
            }
            Text(
                "PKCE protected • private by default • Android Keystore secured",
                color = Muted,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = 18.dp),
            )
        }
    }
}
