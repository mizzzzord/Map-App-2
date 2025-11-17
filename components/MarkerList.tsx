import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Marker } from '../types';

interface MarkerListProps {
  markers: Marker[];
  onMarkerPress: (marker: Marker) => void;
}

export default function MarkerList({ markers, onMarkerPress }: MarkerListProps) {
  if (markers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Нажмите и удерживайте на карте, чтобы добавить маркер
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Маркеры ({markers.length})</Text>
      <ScrollView style={styles.list}>
        {markers.map((marker) => (
          <TouchableOpacity
            key={marker.id}
            style={styles.markerItem}
            onPress={() => onMarkerPress(marker)}
          >
            <View style={styles.markerInfo}>
              <Text style={styles.markerTitle}>
                {marker.title || `Маркер ${marker.id}`}
              </Text>
              <Text style={styles.markerCoordinates}>
                {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
              </Text>
              <Text style={styles.markerDate}>
                {marker.created_at ? new Date(marker.created_at).toLocaleDateString() : 'Дата не указана'}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '40%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    maxHeight: 300,
  },
  markerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  markerInfo: {
    flex: 1,
  },
  markerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  markerCoordinates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  markerDate: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#007AFF',
  },
});