package com.example.habittracker.data.api

import kotlinx.coroutines.delay

/** One network boundary. Swap [FakeApiClient] for a real Retrofit/Ktor implementation later. */
interface ApiClient {
    suspend fun habits(): List<RemoteHabit>
    suspend fun deleteAccount(): Boolean
}

data class RemoteHabit(val id: String, val title: String, val streak: Int)

/**
 * Deterministic offline stand-in. No key, no network, no secrets — a starter must build and run
 * before anyone has a backend. The ViewModel treats it exactly like a real client.
 */
class FakeApiClient : ApiClient {
    override suspend fun habits(): List<RemoteHabit> {
        delay(180)
        return listOf(
            RemoteHabit("1", "Morning walk", 12),
            RemoteHabit("2", "Read 20 pages", 4),
            RemoteHabit("3", "No phone after 22:00", 1)
        )
    }

    override suspend fun deleteAccount(): Boolean {
        delay(120)
        return true
    }
}
