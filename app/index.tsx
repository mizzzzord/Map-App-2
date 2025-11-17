import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { LongPressEvent, Marker as MapMarker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useDatabase } from '../contexts/DatabaseContext';

export default function MapScreen() {
  const router = useRouter();
  const { markers, addMarker, deleteMarker, isLoading } = useDatabase();
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);

  const handleMapLongPress = async (event: LongPressEvent) => {
    if (isAddingMarker) return;
    
    const { coordinate } = event.nativeEvent;
    setIsAddingMarker(true);
    
    try {
      console.log('🔄 Начало добавления маркера...');
      
      // Добавляем маркер и ЖДЕМ завершения
      await addMarker(
        coordinate.latitude, 
        coordinate.longitude, 
        `Метка ${markers.length + 1}`
      );

      console.log('✅ Маркер успешно добавлен в состояние');
      
      Alert.alert(
        'Метка добавлена', 
        `Метка создана в точке: ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Ошибка добавления маркера:', error);
      Alert.alert('Ошибка', 'Не удалось добавить метку');
    } finally {
      setIsAddingMarker(false);
    }
  };

  const handleMarkerPress = (marker: any) => {
    setSelectedMarker(marker);
  };

  const handleMarkerCalloutPress = (marker: any) => {
    router.push({
      pathname: '/marker/[id]',
      params: {
        id: marker.id.toString(),
        latitude: marker.latitude,
        longitude: marker.longitude,
        title: marker.title || 'Метка',
      },
    });
  };

  const handleDeleteMarker = () => {
    if (!selectedMarker) return;

    Alert.alert(
      'Удалить метку',
      `Вы уверены, что хотите удалить метку "${selectedMarker.title || 'Метка'}"?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMarker(selectedMarker.id);
              setSelectedMarker(null);
              Alert.alert('Успех', 'Метка удалена');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить метку');
            }
          },
        },
      ]
    );
  };

  if (isLoading && markers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка карты...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 58.0105,
          longitude: 56.2502,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onLongPress={handleMapLongPress}
      >
        {markers.map(marker => (
          <MapMarker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title || 'Метка'}
            description="Нажмите для действий"
            onPress={() => handleMarkerPress(marker)}
            onCalloutPress={() => handleMarkerCalloutPress(marker)}
          />
        ))}
      </MapView>

      {/* Информация о количестве маркеров */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>Карта Перми</Text>
        <Text style={styles.infoText}>
          Количество меток: {markers.length}
        </Text>
        <Text style={styles.helpText}>
          {isAddingMarker ? 'Добавляем метку...' : 'Нажмите и удерживайте на карте чтобы добавить метку'}
        </Text>
        <Text style={styles.helpText}>
          Нажмите на метку для действий
        </Text>
      </View>

      {/* Кнопка удаления выбранной метки */}
      {selectedMarker && (
        <View style={styles.actionPanel}>
          <Text style={styles.actionTitle}>Выбрана метка: {selectedMarker.title || 'Метка'}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.detailsButton} 
              onPress={() => handleMarkerCalloutPress(selectedMarker)}
            >
              <Text style={styles.detailsButtonText}>📋 Детали</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDeleteMarker}
            >
              <Text style={styles.deleteButtonText}>🗑️ Удалить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  infoPanel: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});