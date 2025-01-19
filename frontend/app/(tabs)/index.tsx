import React, { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

import { ScrollView, View, Text } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import VancouverMap from '@/components/organisms/VancouverMap'
import { useLocalSearchParams } from 'expo-router';
import busNames from '@/assets/bus_names.json';


export default function HomeScreen() {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const { username } = useLocalSearchParams();
  const [location, setLocation] = useState<any>({});
  const [closestRoutes, setClosestRoutes] = useState<Array<{ latitude: number; longitude: number; routeId: number; color: string}>>([]);
  const [busData, setBusData] = useState<Array<{ latitude: number; longitude: number; route_id: number }>>([]);
  
  const [busesOnClosestRoutes, setBusesOnClosestRoutes] = useState<
    Array<{ routeId: number; color: string; buses: Array<{ latitude: number; longitude: number; route_id: number }> }>
  >([]);

  const getTripHeadsign = (routeId: number): string => {
    const matchingBus = busNames.find((bus) => Number(bus.shape_id) === routeId);
    return matchingBus ? matchingBus.trip_headsign : 'Unknown';
  };

  useEffect(() => {
    const updatedBusesOnClosestRoutes = closestRoutes.map((route) => {
      const buses = busData.filter((bus) => bus.route_id === route.routeId);
      return { routeId: route.routeId, color: route.color, buses };
    });
    setBusesOnClosestRoutes(updatedBusesOnClosestRoutes);
  }, [closestRoutes, busData]);


  return (
    <ScrollView>
      
      <ThemedView style={[styles.titleContainer, { paddingTop: statusBarHeight + 64 }]}>
        <ThemedText type="title">Welcome {username}!</ThemedText>
        <HelloWave />
      </ThemedView>

   
      <View style={styles.mapContainer}>
        <VancouverMap 
          username={username}
          location={location}
          setLocation={setLocation}
          closestRoutes={closestRoutes} 
          setClosestRoutes={setClosestRoutes}
          busData={busData}
          setBusData={setBusData}
          />
      </View>

      {/* Current Trip Section */}
      <View style={styles.currentTripContainer}>
        <Text style={styles.currentTripTitle}>Current Trip</Text>
        <Text style={styles.currentTripText}>No active trips at the moment!</Text>
      </View>

      {/* Closest Buses Section */}
      <View style={styles.closestBusesContainer}>
        <Text style={styles.closestBusesTitle}>Closest Buses</Text>
        {busesOnClosestRoutes.length > 0 ? (
          <View style={styles.cardsContainer}>
            {busesOnClosestRoutes.map(({ routeId, color, buses }) => (
              <View key={routeId} style={[styles.card, { borderColor: color, borderWidth: 3 }]}>
                <Text style={styles.cardTitle}>
                  Route: {routeId} 
                </Text>
                <Text style={styles.cardDistance}>
                  ({busNames.find((bus) => Number(bus.shape_id) === routeId)?.trip_headsign || 'Unknown'})
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noBusesText}>No closest buses available at the moment!</Text>
        )}
      </View>
    </ScrollView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  mapContainer: {
    height: height * 0.5,
  },
  currentTripContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 16,
  },
  currentTripTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  currentTripText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  closestBusesContainer: {
    backgroundColor: '#eef6f8',
    padding: 16,
  },
  closestBusesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    width: '100%',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 8,
  },
  cardDistance: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  noBusesText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
