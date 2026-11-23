package com.example.habittracker.feature.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.habittracker.data.db.HabitDao
import com.example.habittracker.data.db.HabitEntity
import com.example.habittracker.ui.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class DetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val dao: HabitDao
) : ViewModel() {
    private val id: String = savedStateHandle["id"] ?: ""
    private val _state = MutableStateFlow<UiState<HabitEntity>>(UiState.Loading)
    val state: StateFlow<UiState<HabitEntity>> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val habit = dao.find(id)
            _state.value = if (habit == null) UiState.Empty else UiState.Content(habit)
        }
    }
}
