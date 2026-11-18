package __PACKAGE__.di

import android.content.Context
import androidx.room.Room
import __PACKAGE__.data.api.ApiClient
import __PACKAGE__.data.api.FakeApiClient
import __PACKAGE__.data.auth.AppleAuthProvider
import __PACKAGE__.data.auth.AuthProvider
import __PACKAGE__.data.auth.AuthRepository
import __PACKAGE__.data.auth.EmailAuthProvider
import __PACKAGE__.data.auth.GoogleAuthProvider
import __PACKAGE__.data.auth.StubAuthRepository
import __PACKAGE__.data.db.AppDatabase
import __PACKAGE__.data.db.HabitDao
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
