import React, { useState, useEffect } from 'react';
import {Platform, StatusBar } from 'react-native';

import { ScrollView, View, Text} from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import VancouverMap from '@/components/organisms/VancouverMap'
import { useParams } from '@/context/ParamsContext';
import {getTripHeadsign} from '@/components/utils/route_utils';
import { AnimatedRegion } from 'react-native-maps';
import { HomeStyle } from '@/components/styles/HomePage.styles';

export default function HomeScreen() {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const { username, user_id } = useParams();
  const [location, setLocation] = useState<any>({});

  const [onBus, setOnBus] = useState('');

  // const [routes, setRoutes] = useState<Record<number, Array<{ shape_id: any; latitude: number; longitude: number; color: string }>> | null>(null);
  const [animatedBusData, setAnimatedBusData] = useState<Map<number, AnimatedRegion>>(new Map());
  const [busesOnRoutes, setBusesOnRoutes] = useState<Array<{latitude: number; longitude: number; route_id: number }>>([]);
  

  useEffect(() => {
    if (!animatedBusData || animatedBusData.size === 0) return; // Ensure there is bus data
    
    // Convert animatedBusData (Map) into an array of buses
    const updatedBusesOnRoutes = Array.from(animatedBusData.entries()).map(([routeId, animatedRegion]) => (
      {
        latitude: animatedRegion.latitude, 
        longitude: animatedRegion.longitude, 
        route_id: routeId 
      }
    ));
  
    setBusesOnRoutes(updatedBusesOnRoutes);
  }, [animatedBusData]);

  

  return (
    <ScrollView>
      
      <ThemedView style={[HomeStyle.titleContainer, { paddingTop: statusBarHeight + 64 }]}>
        <ThemedText type="title">Welcome {username}!</ThemedText>
        <HelloWave />
      </ThemedView>

   
      <View style={HomeStyle.mapContainer}>
        <VancouverMap 
          location={location}
          setLocation={setLocation}
          // routes={routes} 
          // setRoutes={setRoutes}
          animatedBusData={animatedBusData}
          setAnimatedBusData={setAnimatedBusData}
          // onBus={onBus}
          // setOnBus={setOnBus}
          />
      </View>

      {/* Current Trip Section */}
      <View style={HomeStyle.currentTripContainer}>
        <Text style={HomeStyle.currentTripTitle}>Current Trip</Text>
        {onBus === '' ? (
          <Text style={HomeStyle.currentTripText}>
            No active trips at the moment!
          </Text>
        ) : (
          <Text style={HomeStyle.currentTripText}>
            Current Trip: {onBus}
          </Text>
        )}
      </View>

      {/* Closest Buses Section */}
      <View style={HomeStyle.closestBusesContainer}>
        <Text style={HomeStyle.closestBusesTitle}>Closest Bus Routes</Text>
        {busesOnRoutes.length > 0 ? (
          <View style={HomeStyle.cardsContainer}>
            {busesOnRoutes.map((bus) => (
              <View key={bus["route_id"]} style={[HomeStyle.card, { borderColor: "green", borderWidth: 3 }]}>
                <Text style={HomeStyle.cardTitle}>
                  Bus: {getTripHeadsign(bus["route_id"]).split(' ')[0] || 'Unknown'}
                  {/* busNames.find((bus) => Number(bus.shape_id) === routeId)?.trip_headsign.split(' ')[0] || 'Unknown'}  */}
                </Text>
                <Text style={HomeStyle.cardDistance}>
                  ({getTripHeadsign(bus["route_id"]) || 'Unknown'})
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={HomeStyle.noBusesText}>No closest buses available at the moment!</Text>
        )}
      </View>
    </ScrollView>
  );
}