import { useState, useEffect } from 'react';

export interface OfflineData {
  id: string;
  timestamp: string;
  stroke: number;
  pressure: number;
  temperature: number;
  vibration: number;
  status: 'normal' | 'warning' | 'critical';
  synced: boolean;
}

export interface SimulationConfig {
  id: string;
  name: string;
  parameters: any;
  timestamp: string;
}

class OfflineDatabase {
  private dbName = 'HydraulicPressDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create sensor data store
        if (!db.objectStoreNames.contains('sensorData')) {
          const sensorStore = db.createObjectStore('sensorData', { keyPath: 'id' });
          sensorStore.createIndex('timestamp', 'timestamp');
          sensorStore.createIndex('synced', 'synced');
        }
        
        // Create simulation configs store
        if (!db.objectStoreNames.contains('simulations')) {
          db.createObjectStore('simulations', { keyPath: 'id' });
        }
      };
    });
  }

  async addSensorData(data: Omit<OfflineData, 'id' | 'synced'>): Promise<void> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sensorData'], 'readwrite');
    const store = transaction.objectStore('sensorData');
    
    const sensorData: OfflineData = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      synced: false
    };
    
    await store.add(sensorData);
  }

  async getSensorData(limit: number = 1000): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['sensorData'], 'readonly');
    const store = transaction.objectStore('sensorData');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: OfflineData[] = [];
      let count = 0;
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor && count < limit) {
          results.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getRecentSensorData(minutes: number = 5): Promise<OfflineData[]> {
    if (!this.db) await this.init();
    
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const transaction = this.db!.transaction(['sensorData'], 'readonly');
    const store = transaction.objectStore('sensorData');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.lowerBound(cutoffTime);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSimulation(config: Omit<SimulationConfig, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();
    
    const simulation: SimulationConfig = {
      ...config,
      id: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    const transaction = this.db!.transaction(['simulations'], 'readwrite');
    const store = transaction.objectStore('simulations');
    
    await store.put(simulation);
    return simulation.id;
  }

  async getSimulations(): Promise<SimulationConfig[]> {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['simulations'], 'readonly');
    const store = transaction.objectStore('simulations');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldData(daysToKeep: number = 7): Promise<void> {
    if (!this.db) await this.init();
    
    const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    const transaction = this.db!.transaction(['sensorData'], 'readwrite');
    const store = transaction.objectStore('sensorData');
    const index = store.index('timestamp');
    
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [db] = useState(() => new OfflineDatabase());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    db.init();
  }, [db]);

  const generateOfflineSensorData = async (count: number = 30) => {
    const now = Date.now();
    const interval = 10000; // 10 seconds between readings
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i - 1) * interval);
      const baseStroke = 125 + Math.sin(i / 10) * 100;
      const basePressure = 120 + Math.sin(i / 8) * 30 + Math.random() * 10;
      const baseTemp = 45 + Math.random() * 15;
      const vibration = 0.1 + Math.random() * 0.3;
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (basePressure > 180 || baseTemp > 65) status = 'critical';
      else if (basePressure > 160 || baseTemp > 55 || vibration > 0.3) status = 'warning';

      await db.addSensorData({
        timestamp: timestamp.toISOString(),
        stroke: Math.max(0, baseStroke),
        pressure: Math.max(0, basePressure),
        temperature: baseTemp,
        vibration: vibration,
        status
      });
    }
  };

  return {
    db,
    isOnline,
    generateOfflineSensorData
  };
};