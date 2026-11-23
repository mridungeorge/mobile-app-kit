package com.example.habittracker.ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.habittracker.R
import com.example.habittracker.ui.screens.AccountDeletionScreen
import com.example.habittracker.ui.screens.AuthScreen
import com.example.habittracker.ui.screens.DetailScreen
import com.example.habittracker.ui.screens.HomeScreen
import com.example.habittracker.ui.screens.SettingsScreen

/**
 * Shell: a bottom bar on phones, a navigation rail on tablets and foldables, and a detail
 * route inside the same NavHost. Nothing here needs a network key to run.
 */
@Composable
fun App(windowSizeClass: WindowSizeClass) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val route = backStackEntry?.destination?.route
    val expanded = windowSizeClass.widthSizeClass == WindowWidthSizeClass.Expanded
    val homeLabel = stringResource(R.string.tab_home)
    val settingsLabel = stringResource(R.string.tab_settings)

    val navigateTo: (String) -> Unit = { target ->
        navController.navigate(target) {
            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    if (expanded) {
        Row(Modifier.fillMaxSize()) {
            if (route == Routes.HOME || route == Routes.SETTINGS) {
                NavigationRail {
                    NavigationRailItem(
                        selected = route == Routes.HOME,
                        onClick = { navigateTo(Routes.HOME) },
                        icon = { Icon(Icons.Filled.Home, contentDescription = null) },
                        label = { Text(homeLabel) }
                    )
                    NavigationRailItem(
                        selected = route == Routes.SETTINGS,
                        onClick = { navigateTo(Routes.SETTINGS) },
                        icon = { Icon(Icons.Filled.Settings, contentDescription = null) },
                        label = { Text(settingsLabel) }
                    )
                }
            }
            AppNavHost(navController, Modifier.weight(1f))
        }
    } else {
        Scaffold(
            bottomBar = {
                if (route == Routes.HOME || route == Routes.SETTINGS) {
                    NavigationBar {
                        NavigationBarItem(
                            selected = route == Routes.HOME,
                            onClick = { navigateTo(Routes.HOME) },
                            // The label already names the destination, so the icon is
                            // decorative here; giving it a description would double-announce.
                            icon = { Icon(Icons.Filled.Home, contentDescription = null) },
                            label = { Text(homeLabel) }
                        )
                        NavigationBarItem(
                            selected = route == Routes.SETTINGS,
                            onClick = { navigateTo(Routes.SETTINGS) },
                            icon = { Icon(Icons.Filled.Settings, contentDescription = null) },
                            label = { Text(settingsLabel) }
                        )
                    }
                }
            }
        ) { padding ->
            AppNavHost(navController, Modifier.padding(padding))
        }
    }
}

@Composable
private fun AppNavHost(navController: NavHostController, modifier: Modifier = Modifier) {
    NavHost(navController = navController, startDestination = Routes.HOME, modifier = modifier) {
        composable(Routes.HOME) {
            HomeScreen(onOpen = { id -> navController.navigate(Routes.detail(id)) })
        }
        composable(
            route = Routes.DETAIL,
            arguments = listOf(navArgument("id") { type = NavType.StringType })
        ) {
            DetailScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.SETTINGS) {
            SettingsScreen(
                onSignIn = { navController.navigate(Routes.AUTH) },
                onDeleteAccount = { navController.navigate(Routes.DELETE_ACCOUNT) }
            )
        }
        composable(Routes.AUTH) {
            AuthScreen(onBack = { navController.popBackStack() })
        }
        composable(Routes.DELETE_ACCOUNT) {
            AccountDeletionScreen(
                onBack = { navController.popBackStack() },
                onDeleted = { navController.popBackStack(Routes.SETTINGS, inclusive = false) }
            )
        }
    }
}
