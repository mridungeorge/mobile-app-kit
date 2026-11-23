package com.example.habittracker.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.habittracker.data.api.ApiClient
import com.example.habittracker.data.db.HabitDao
import com.example.habittracker.data.db.HabitEntity
import com.example.habittracker.ui.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import java.io.IOException
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: ApiClient,
    private val dao: HabitDao
) : ViewModel() {
    private val _state = MutableStateFlow<UiState<List<HabitEntity>>>(UiState.Loading)
    val state: StateFlow<UiState<List<HabitEntity>>> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = UiState.Loading
            // Room is the source of truth; the network only fills an empty cache.
            if (dao.observeAll().first().isEmpty()) {
                val result = runCatching { api.habits() }
                result.onFailure { error ->
                    _state.value = if (error is IOException) UiState.Offline else UiState.Error(error.message ?: "Could not load")
                    return@launch
                }
                val remote = result.getOrThrow()
                dao.upsertAll(remote.map { HabitEntity(it.id, it.title, it.streak, System.currentTimeMillis()) })
            }
            val habits = dao.observeAll().first()
            _state.value = if (habits.isEmpty()) UiState.Empty else UiState.Content(habits)
        }
    }
}
