import * as SQLite from 'expo-sqlite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  title?: string;
  created_at?: string;
}

export interface MarkerImage {
  id: number;
  marker_id: number;
  uri: string;
  created_at?: string;
}

interface DatabaseContextType {
  markers: Marker[];
  images: MarkerImage[];
  addMarker: (latitude: number, longitude: number, title?: string) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [images, setImages] = useState<MarkerImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initDB = async () => {
      try {
        console.log('🔄 Инициализация базы данных...');
        const database = SQLite.openDatabaseSync('markers.db');
        
        // Создаем таблицы
        database.execSync(`
          CREATE TABLE IF NOT EXISTS markers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            title TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        database.execSync(`
          CREATE TABLE IF NOT EXISTS marker_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            marker_id INTEGER NOT NULL,
            uri TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Загружаем данные
        const loadedMarkers = database.getAllSync<Marker>('SELECT * FROM markers ORDER BY created_at DESC');
        const loadedImages = database.getAllSync<MarkerImage>('SELECT * FROM marker_images ORDER BY created_at DESC');
        
        setMarkers(loadedMarkers);
        setImages(loadedImages);
        setDb(database);
        console.log('✅ База данных готова, загружено маркеров:', loadedMarkers.length);
      } catch (error) {
        console.error('❌ Ошибка базы данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  const addMarker = async (latitude: number, longitude: number, title?: string): Promise<number> => {
  if (!db) throw new Error('База данных не инициализирована');
  
  try {
    // ИСПОЛЬЗУЕМ ПОДГОТОВЛЕННЫЕ ВЫРАЖЕНИЯ для надежности
    const statement = db.prepareSync(
      'INSERT INTO markers (latitude, longitude, title) VALUES ($latitude, $longitude, $title)'
    );
    
    const result = statement.executeSync({
      $latitude: latitude,
      $longitude: longitude,
      $title: title || 'Метка'
    });
    
    statement.finalizeSync();
    
    // ПОЛУЧАЕМ ID НАПРЯМУЮ ИЗ РЕЗУЛЬТАТА
    const newId = result.lastInsertRowId;
    
    if (!newId) {
      throw new Error('Не удалось получить ID новой метки');
    }
    
    // Создаем новый маркер для немедленного отображения
    const newMarker: Marker = {
      id: newId,
      latitude,
      longitude,
      title: title || 'Метка',
      created_at: new Date().toISOString()
    };
    
    // НЕМЕДЛЕННО обновляем состояние
    setMarkers(prev => [newMarker, ...prev]);
    console.log('✅ Маркер добавлен немедленно:', newMarker);
    
    return newId;
  } catch (error) {
    console.error('Ошибка добавления маркера:', error);
    throw error;
  }
};

  const deleteMarker = async (id: number): Promise<void> => {
    if (!db) return;
    
    try {
      // Сначала удаляем связанные изображения
      const deleteImagesStatement = db.prepareSync('DELETE FROM marker_images WHERE marker_id = $marker_id');
      deleteImagesStatement.executeSync({ $marker_id: id });
      deleteImagesStatement.finalizeSync();
      
      // Затем удаляем сам маркер
      const deleteMarkerStatement = db.prepareSync('DELETE FROM markers WHERE id = $id');
      deleteMarkerStatement.executeSync({ $id: id });
      deleteMarkerStatement.finalizeSync();
      
      // НЕМЕДЛЕННО обновляем состояние
      setMarkers(prev => prev.filter(marker => marker.id !== id));
      setImages(prev => prev.filter(image => image.marker_id !== id));
      
      console.log('✅ Маркер удален:', id);
    } catch (error) {
      console.error('Ошибка удаления маркера:', error);
      throw error;
    }
  };

  const addImage = async (markerId: number, uri: string): Promise<void> => {
    if (!db) return;
    
    try {
      const statement = db.prepareSync(
        'INSERT INTO marker_images (marker_id, uri) VALUES ($marker_id, $uri)'
      );
      
      statement.executeSync({
        $marker_id: markerId,
        $uri: uri
      });
      
      statement.finalizeSync();
      
      // Получаем ID новой картинки
      const idResult = db.getAllSync<{id: number}>('SELECT last_insert_rowid() as id');
      const newId = idResult[0]?.id;
      
      // НЕМЕДЛЕННО обновляем состояние
      const newImage: MarkerImage = {
        id: newId,
        marker_id: markerId,
        uri: uri,
        created_at: new Date().toISOString()
      };
      
      setImages(prev => [newImage, ...prev]);
      console.log('✅ Изображение добавлено немедленно:', newImage);
    } catch (error) {
      console.error('Ошибка добавления изображения:', error);
      throw error;
    }
  };

  const deleteImage = async (id: number): Promise<void> => {
    if (!db) return;
    
    try {
      const statement = db.prepareSync('DELETE FROM marker_images WHERE id = $id');
      statement.executeSync({ $id: id });
      statement.finalizeSync();
      
      // НЕМЕДЛЕННО обновляем состояние
      setImages(prev => prev.filter(image => image.id !== id));
      console.log('✅ Изображение удалено:', id);
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      throw error;
    }
  };
  
  const value: DatabaseContextType = {
    markers,
    images,
    addMarker,
    deleteMarker,
    addImage,
    deleteImage,
    isLoading,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};