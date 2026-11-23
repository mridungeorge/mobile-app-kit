package com.example.habittracker.data.db

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits ORDER BY title")
    fun observeAll(): Flow<List<HabitEntity>>

    @Query("SELECT * FROM habits WHERE id = :id")
    suspend fun find(id: String): HabitEntity?

    @Upsert
    suspend fun upsertAll(habits: List<HabitEntity>)

    @Query("DELETE FROM habits")
    suspend fun clear()

    @Query("SELECT COUNT(*) FROM habits")
    suspend fun count(): Int
}
