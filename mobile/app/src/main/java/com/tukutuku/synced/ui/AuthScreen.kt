package com.tukutuku.synced.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
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
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()
    var creating by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var passwordVisible by rememberSaveable { mutableStateOf(false) }

    fun submit() {
        viewModel.clearError()
        if (creating) viewModel.register(name, email, password) else viewModel.signIn(email, password)
    }

    Box(Modifier.fillMaxSize().background(Canvas)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .imePadding()
                .padding(horizontal = 24.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Surface(shape = RoundedCornerShape(24.dp), color = Primary) {
                Box(Modifier.size(72.dp), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.AccountBalanceWallet, null, tint = Color.White, modifier = Modifier.size(36.dp))
                }
            }
            Spacer(Modifier.height(16.dp))
            Text("Synced", fontSize = 34.sp, fontWeight = FontWeight.Black, color = Ink)
            Text("Money, plans and shared goals in one place.", color = Muted, modifier = Modifier.padding(top = 6.dp, bottom = 22.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(26.dp),
                colors = CardDefaults.cardColors(containerColor = Surface),
                border = CardDefaults.outlinedCardBorder(),
            ) {
                Column(Modifier.padding(20.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (!creating) {
                            Button(onClick = { creating = false; viewModel.clearError() }, modifier = Modifier.weight(1f)) { Text("Sign in") }
                            OutlinedButton(onClick = { creating = true; viewModel.clearError() }, modifier = Modifier.weight(1f)) { Text("Create account") }
                        } else {
                            OutlinedButton(onClick = { creating = false; viewModel.clearError() }, modifier = Modifier.weight(1f)) { Text("Sign in") }
                            Button(onClick = { creating = true; viewModel.clearError() }, modifier = Modifier.weight(1f)) { Text("Create account") }
                        }
                    }

                    Text(
                        if (creating) "Create your Tuku account" else "Welcome back",
                        fontWeight = FontWeight.Bold,
                        fontSize = 21.sp,
                        color = Ink,
                        modifier = Modifier.padding(top = 20.dp, bottom = 4.dp),
                    )
                    Text(
                        if (creating) "One account works across Synced and other Tuku products." else "Use the same Tuku account you use across the Tuku estate.",
                        color = Muted,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(bottom = 16.dp),
                    )

                    if (creating) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Full name") },
                            leadingIcon = { Icon(Icons.Outlined.Person, null) },
                            singleLine = true,
                            enabled = !busy,
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        )
                        Spacer(Modifier.height(10.dp))
                    }

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        leadingIcon = { Icon(Icons.Outlined.Email, null) },
                        singleLine = true,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                    )
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(if (passwordVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility, null)
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        singleLine = true,
                        enabled = !busy,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { if (!busy) submit() }),
                        supportingText = if (creating) ({ Text("At least 8 characters") }) else null,
                    )

                    error?.let {
                        Text(it, color = Error, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 10.dp))
                    }

                    Button(
                        onClick = { submit() },
                        enabled = !busy && email.isNotBlank() && password.isNotBlank() && (!creating || (name.isNotBlank() && password.length >= 8)),
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp).height(54.dp),
                        shape = RoundedCornerShape(15.dp),
                    ) {
                        if (busy) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(20.dp), color = Color.White)
                        else Text(if (creating) "Create Tuku account" else "Sign in", fontWeight = FontWeight.Bold)
                    }

                    Text(
                        "Login stays inside Synced. Credentials go directly to Tuku Core over HTTPS; Synced receives only a verified Core session for linking.",
                        color = Muted,
                        style = MaterialTheme.typography.labelSmall,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                }
            }

            Text(
                "A product of © Tuku-Tuku Innovation Labs",
                color = Muted,
                style = MaterialTheme.typography.labelSmall,
                modifier = Modifier.padding(top = 18.dp),
            )
        }
    }
}
