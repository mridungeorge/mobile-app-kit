import * as SQLite from 'expo-sqlite';
import type { Habit } from './api';

let db: SQLite.SQLiteDatabase | null = null;

async function database() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('habits.db');
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS habits (id TEXT PRIMARY KEY, title TEXT NOT NULL, streak INTEGER NOT NULL);'
    );
  }
  return db;
}

/** Local source of truth: the list renders from here, even when the network is gone. */
export async function cachedHabits(): Promise<Habit[]> {
  try {
    const store = await database();
    return await store.getAllAsync<Habit>('SELECT id, title, streak FROM habits ORDER BY title');
  } catch {
    return [];
  }
}

export async function replaceHabits(habits: Habit[]): Promise<void> {
  try {
    const store = await database();
    await store.withTransactionAsync(async () => {
      await store.execAsync('DELETE FROM habits;');
      for (const habit of habits) {
        await store.runAsync('INSERT INTO habits (id, title, streak) VALUES (?, ?, ?);', habit.id, habit.title, habit.streak);
      }
    });
  } catch {
    // A failed cache write must not stop the screen; the API result is still rendered.
  }
}

export async function clearHabits(): Promise<void> {
  try {
    const store = await database();
    await store.execAsync('DELETE FROM habits;');
  } catch {
    /* already gone */
  }
}
