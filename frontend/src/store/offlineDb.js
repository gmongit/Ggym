/**
 * IndexedDB für Offline-Speicherung von Workouts.
 * Sync wenn die App wieder online geht.
 */
import { openDB } from 'idb'

const DB_NAME = 'fittrack'
const DB_VERSION = 1

let _db = null

async function getDb() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pending_workouts')) {
        const store = db.createObjectStore('pending_workouts', {
          keyPath: 'localId',
          autoIncrement: true,
        })
        store.createIndex('synced', 'synced')
      }
      if (!db.objectStoreNames.contains('cached_workouts')) {
        db.createObjectStore('cached_workouts', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('cached_exercises')) {
        db.createObjectStore('cached_exercises', { keyPath: 'id' })
      }
    },
  })
  return _db
}

export const offlineDb = {
  // Workout lokal speichern wenn offline
  savePendingWorkout: async (workout) => {
    const db = await getDb()
    return db.add('pending_workouts', { ...workout, synced: false, createdAt: Date.now() })
  },

  getPendingWorkouts: async () => {
    const db = await getDb()
    return db.getAllFromIndex('pending_workouts', 'synced', false)
  },

  markSynced: async (localId) => {
    const db = await getDb()
    const item = await db.get('pending_workouts', localId)
    if (item) await db.put('pending_workouts', { ...item, synced: true })
  },

  // Cache für schnelle UI
  cacheWorkouts: async (workouts) => {
    const db = await getDb()
    const tx = db.transaction('cached_workouts', 'readwrite')
    await Promise.all(workouts.map((w) => tx.store.put(w)))
    await tx.done
  },

  getCachedWorkouts: async () => {
    const db = await getDb()
    return db.getAll('cached_workouts')
  },

  cacheExercises: async (exercises) => {
    const db = await getDb()
    const tx = db.transaction('cached_exercises', 'readwrite')
    await Promise.all(exercises.map((e) => tx.store.put(e)))
    await tx.done
  },

  getCachedExercises: async () => {
    const db = await getDb()
    return db.getAll('cached_exercises')
  },
}

// Sync beim Online-Werden
export function setupOfflineSync(syncFn) {
  window.addEventListener('online', async () => {
    const pending = await offlineDb.getPendingWorkouts()
    for (const workout of pending) {
      try {
        await syncFn(workout)
        await offlineDb.markSynced(workout.localId)
      } catch (e) {
        console.error('Sync failed for workout:', workout.localId, e)
      }
    }
  })
}
