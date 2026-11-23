package com.example.habittracker.di

import android.content.Context
import androidx.room.Room
import com.example.habittracker.data.api.ApiClient
import com.example.habittracker.data.api.FakeApiClient
import com.example.habittracker.data.auth.AppleAuthProvider
import com.example.habittracker.data.auth.AuthProvider
import com.example.habittracker.data.auth.AuthRepository
import com.example.habittracker.data.auth.EmailAuthProvider
import com.example.habittracker.data.auth.GoogleAuthProvider
import com.example.habittracker.data.auth.StubAuthRepository
import com.example.habittracker.data.db.AppDatabase
import com.example.habittracker.data.db.HabitDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun apiClient(): ApiClient = FakeApiClient()

    @Provides
    @Singleton
    fun database(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "app.db").build()

    @Provides
    fun habitDao(database: AppDatabase): HabitDao = database.habitDao()

    @Provides
    @Singleton
    fun authProviders(): List<AuthProvider> =
        listOf(EmailAuthProvider(), AppleAuthProvider(), GoogleAuthProvider())

    @Provides
    @Singleton
    fun authRepository(
        api: ApiClient,
        providers: List<@JvmSuppressWildcards AuthProvider>
    ): AuthRepository = StubAuthRepository(api, providers)
}
