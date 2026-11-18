package __PACKAGE__.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import __PACKAGE__.data.settings.SettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settings: SettingsRepository
) : ViewModel() {
    val notifications: StateFlow<Boolean> = settings.notificationsEnabled
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), true)

    val reduceMotion: StateFlow<Boolean> = settings.reduceMotion
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

    fun setNotifications(enabled: Boolean) {
        viewModelScope.launch { settings.setNotifications(enabled) }
    }

    fun setReduceMotion(enabled: Boolean) {
        viewModelScope.launch { settings.setReduceMotion(enabled) }
    }
}
