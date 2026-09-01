package com.tukutuku.synced

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ReceiptLong
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Savings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tukutuku.synced.app.AuthViewModel
import com.tukutuku.synced.domain.AuthState
import com.tukutuku.synced.ui.AskSyncedScreen
import com.tukutuku.synced.ui.AuthScreen
import com.tukutuku.synced.ui.BasketsScreen
import com.tukutuku.synced.ui.BillsScreen
import com.tukutuku.synced.ui.HomeScreen
import com.tukutuku.synced.ui.HouseholdScreen
import com.tukutuku.synced.ui.IntelligenceScreen
import com.tukutuku.synced.ui.JoinInviteScreen
import com.tukutuku.synced.ui.PlanScreen
import com.tukutuku.synced.ui.SmsSyncScreen
import com.tukutuku.synced.ui.TransactionsScreen
import com.tukutuku.synced.ui.theme.Ink
import com.tukutuku.synced.ui.theme.PrimarySoft
import com.tukutuku.synced.ui.theme.SyncedTheme
import dagger.hilt.android.AndroidEntryPoint

private data class Tab(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private val tabs = listOf(
    Tab("home", "Home", Icons.Outlined.Home),
    Tab("transactions", "Transactions", Icons.AutoMirrored.Outlined.ReceiptLong),
    Tab("plan", "Plan", Icons.Outlined.CalendarMonth),
    Tab("baskets", "Baskets", Icons.Outlined.Savings),
    Tab("household", "Shared", Icons.Outlined.Groups),
)

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val pendingInvite = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingInvite.value = inviteCode(intent)
        enableEdgeToEdge()
        setContent {
            SyncedTheme {
                val auth: AuthViewModel = hiltViewModel()
                val state by auth.state.collectAsStateWithLifecycle()
                when (state) {
                    AuthState.Initializing -> Splash()
                    AuthState.SignedOut,
                    is AuthState.Error,
                    -> AuthScreen(viewModel = auth)
                    is AuthState.SignedIn -> SyncedRoot(
                        inviteCode = pendingInvite.value,
                        onInviteHandled = { pendingInvite.value = null },
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        inviteCode(intent)?.let { pendingInvite.value = it }
    }

    private fun inviteCode(intent: Intent?): String? {
        if (intent?.action != Intent.ACTION_VIEW) return null
        val uri = intent.data ?: return null
        if (uri.scheme != "synced" || uri.host != "join") return null
        return uri.getQueryParameter("code")
            ?.trim()
            ?.uppercase()
            ?.takeIf { it.isNotBlank() }
    }
}

@Composable
private fun Splash() {
    Surface(modifier = Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

@Composable
private fun SyncedRoot(
    inviteCode: String?,
    onInviteHandled: () -> Unit,
) {
    val nav = rememberNavController()
    val entry by nav.currentBackStackEntryAsState()
    val route = entry?.destination?.route

    LaunchedEffect(inviteCode) {
        if (!inviteCode.isNullOrBlank()) {
            nav.navigate("join?code=${Uri.encode(inviteCode)}")
            onInviteHandled()
        }
    }

    Scaffold(
        bottomBar = {
            if (route in tabs.map { it.route }) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = route == tab.route,
                            onClick = {
                                nav.navigate(tab.route) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = null) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Ink,
                                selectedTextColor = Ink,
                                indicatorColor = PrimarySoft,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(
            navController = nav,
            startDestination = "home",
            modifier = Modifier.padding(padding),
        ) {
            composable("home") {
                HomeScreen(
                    onAdd = { nav.navigate("transactions") },
                    onSms = { nav.navigate("sms") },
                    onHousehold = { nav.navigate("household") },
                    onTransactions = { nav.navigate("transactions") },
                    onAsk = { nav.navigate("ask") },
                    onBills = { nav.navigate("bills") },
                    onInsights = { nav.navigate("intelligence") },
                )
            }
            composable("transactions") { TransactionsScreen() }
            composable("plan") { PlanScreen() }
            composable("baskets") { BasketsScreen(onJoin = { nav.navigate("join?code=") }) }
            composable("household") { HouseholdScreen() }
            composable("sms") { SmsSyncScreen(onBack = { nav.popBackStack() }) }
            composable("ask") { AskSyncedScreen(onBack = { nav.popBackStack() }) }
            composable("bills") { BillsScreen(onBack = { nav.popBackStack() }) }
            composable("intelligence") { IntelligenceScreen(onBack = { nav.popBackStack() }) }
            composable(
                route = "join?code={code}",
                arguments = listOf(
                    navArgument("code") {
                        nullable = true
                        defaultValue = ""
                    },
                ),
            ) { backStackEntry ->
                JoinInviteScreen(
                    initialCode = backStackEntry.arguments?.getString("code"),
                    onDone = {
                        nav.navigate("home") {
                            popUpTo("home") { inclusive = true }
                        }
                    },
                    onBack = { nav.popBackStack() },
                )
            }
        }
    }
}
