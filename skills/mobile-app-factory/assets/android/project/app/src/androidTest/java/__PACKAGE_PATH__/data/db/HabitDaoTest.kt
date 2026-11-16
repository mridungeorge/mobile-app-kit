package __PACKAGE__.data.db

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.io.IOException
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * In-memory Room test — the DAO is the local source of truth, so an upsert that silently drops a
 * row or a delete that leaves orphans is a data-loss bug, not a cosmetic one.
 */
@RunWith(AndroidJUnit4::class)
class HabitDaoTest {
    private lateinit var database: AppDatabase
    private lateinit var dao: HabitDao

    @Before
    fun create() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        dao = database.habitDao()
    }

    @After
    @Throws(IOException::class)
    fun close() = database.close()

    @Test
    fun upsertThenObserveReturnsRowsOrderedByTitle() = runBlocking {
        dao.upsertAll(
            listOf(
                HabitEntity("2", "Read", 4, 0L),
                HabitEntity("1", "Walk", 12, 0L)
            )
        )
        val titles = dao.observeAll().first().map { it.title }
        assertEquals(listOf("Read", "Walk"), titles)
    }

    @Test
    fun upsertTheSameIdTwiceUpdatesInsteadOfDuplicating() = runBlocking {
        dao.upsertAll(listOf(HabitEntity("1", "Walk", 12, 0L)))
        dao.upsertAll(listOf(HabitEntity("1", "Walk", 13, 1L)))
        assertEquals(1, dao.count())
        assertEquals(13, dao.find("1")?.streak)
    }

    @Test
    fun findMissingIdReturnsNull() = runBlocking {
        assertNull(dao.find("nope"))
    }

    @Test
    fun clearEmptiesTheTable() = runBlocking {
        dao.upsertAll(listOf(HabitEntity("1", "Walk", 12, 0L)))
        dao.clear()
        assertEquals(0, dao.count())
    }
}
