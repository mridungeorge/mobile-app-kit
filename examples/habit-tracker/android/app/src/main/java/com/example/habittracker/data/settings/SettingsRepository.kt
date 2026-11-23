package com.example.habittracker.data.settings

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

@Singleton
class SettingsRepository @Inject constructor(@ApplicationContext context: Context) {
    private val store = context.settingsDataStore

    val notificationsEnabled: Flow<Boolean> = store.data.map { it[NOTIFICATIONS] ?: true }
    val reduceMotion: Flow<Boolean> = store.data.map { it[REDUCE_MOTION] ?: false }

    suspend fun setNotifications(enabled: Boolean) {
        store.edit { it[NOTIFICATIONS] = enabled }
    }

    suspend fun setReduceMotion(enabled: Boolean) {
        store.edit { it[REDUCE_MOTION] = enabled }
    }

    private companion object {
        val NOTIFICATIONS = booleanPreferencesKey("notifications_enabled")
        val REDUCE_MOTION = booleanPreferencesKey("reduce_motion")
    }
}
