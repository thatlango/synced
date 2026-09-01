package com.tukutuku.synced.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.ui.theme.*

@Composable
fun AuthScreen(viewModel: AuthViewModel = hiltViewModel()) {
    var createAccount by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()

    Box(Modifier.fillMaxSize().background(Canvas)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(Modifier.height(18.dp))
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
                modifier = Modifier.padding(top = 7.dp, bottom = 26.dp),
            )

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = CardDefaults.outlinedCardBorder(),
            ) {
                Column(Modifier.padding(20.dp)) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .background(PrimarySoft, RoundedCornerShape(14.dp))
                            .padding(4.dp),
                    ) {
                        listOf(false to "Sign in", true to "Create account").forEach { (mode, label) ->
                            FilterChip(
                                selected = createAccount == mode,
                                onClick = {
                                    createAccount = mode
                                    viewModel.clearError()
                                },
                                label = { Text(label) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(11.dp),
                                colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Surface),
                            )
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                    Text(
                        if (createAccount) "Create your Synced account" else "Welcome back",
                        fontWeight = FontWeight.Bold,
                        fontSize = 21.sp,
                        color = Ink,
                    )
                    Text(
                        "Your Tuku account stays the identity behind Synced, but everything happens inside this app.",
                        color = Muted,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 5.dp, bottom = 16.dp),
                    )
                    if (createAccount) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full name") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(10.dp))
                    }
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(10.dp))
                    if (createAccount) {
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone (optional)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(10.dp))
                    }
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        singleLine = true,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                                    contentDescription = if (showPassword) "Hide password" else "Show password",
                                )
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    error?.let {
                        Text(
                            it,
                            color = Error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(top = 10.dp),
                        )
                    }
                    Spacer(Modifier.height(18.dp))
                    Button(
                        onClick = {
                            if (createAccount) {
                                viewModel.register(name, email, password, phone)
                            } else {
                                viewModel.login(email, password)
                            }
                        },
                        enabled = !busy && email.contains('@') && password.length >= 8 && (!createAccount || name.length >= 2),
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(15.dp),
                    ) {
                        if (busy) {
                            CircularProgressIndicator(
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp),
                                color = Color.White,
                            )
                        } else {
                            Text(if (createAccount) "Create account" else "Sign in", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            Text(
                "Private by default • secured with Android Keystore",
                color = Muted,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = 18.dp),
            )
        }
    }
}
