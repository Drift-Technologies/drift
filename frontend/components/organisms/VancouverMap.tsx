import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapStyles } from '../styles/VancouverMap.styles';
import route_shapes from '@/assets/shapes.json';
import BusIcon from '@/components/atoms/BusIcon';
import { loadRouteData } from '@/components/utils/route_utils';


const VancouverMap: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Record<number, Array<{ latitude: number; longitude: number; color: string }>> | null>(null);
  const [busData, setBusData] = useState<Array<{ latitude: number; longitude: number; route_id: number }>>([]);
  const shapeColorMap = new Map(); 

  const initialRegion: Region = {
    latitude: location ? location.latitude : 49.2827,
    longitude: location ? location.longitude : -123.1207,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };


  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/simulated?speed_multiplier=2.0');
    
    // Create a Set to batch WebSocket messages
    const busLocations = new Map<number, { latitude: number; longitude: number }>();
    const data = new Set<string>();

    // Flush function to process batched messages
    const flush = () => {
      const newBusLocations = new Map(busLocations);
      
      for (const value of data) {
        const parsedData = JSON.parse(value);
        if (parsedData?.data) {
          parsedData.data.forEach((bus: any) => {
            newBusLocations.set(bus.route_id, {
              latitude: bus.latitude,
              longitude: bus.longitude,
            });
          });
        }
      }

      const updatedBusPositions = Array.from(newBusLocations.entries()).map(([route_id, coords]) => ({
        route_id,
        ...coords,
      }));

      setBusData(updatedBusPositions); // Update state with complete list
      busLocations.clear(); // Clear old locations
      newBusLocations.forEach((value, key) => busLocations.set(key, value)); // Update busLocations
      data.clear(); // Clear the batch
    }
    
    let timer = setInterval(flush, 3000);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      data.add(event.data); // Add incoming messages to the Set
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      clearInterval(timer);
      ws.close(); // Close the WebSocket connection
      flush(); // Clear the data buffer
    };
  }, []);


  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      console.log(currentLocation);
      loadRouteData(shapeColorMap, setRoutes);
    })();
  }, []);


  return (
    <View style={MapStyles.container}>
      <MapView 
        style={MapStyles.map} 
        initialRegion={initialRegion}
        showsMyLocationButton
        showsUserLocation
      >
        {location && (
          <Marker
            coordinate={{
              latitude: 49.26077,
              longitude: -123.24899,
            }}
            title="You are here"
          />
        )}
        {routes &&
          Object.keys(routes).map((shapeId, index) => (
            <Polyline
              key={shapeId}
              coordinates={routes[parseInt(shapeId)]}
              strokeColor={routes[parseInt(shapeId)][0].color}
              strokeWidth={3}
            />
          ))}
        {routes && 
        busData.map((bus, index) => (
          <Marker
            key={`bus-${bus.route_id}`}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={`Bus ID: ${bus.route_id}`}
          >
            <BusIcon fillColor={routes[bus.route_id][0].color || 'black'} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default VancouverMap;
