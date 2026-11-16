package __PACKAGE__.feature.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import __PACKAGE__.data.db.HabitDao
import __PACKAGE__.data.db.HabitEntity
import __PACKAGE__.ui.UiState
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
