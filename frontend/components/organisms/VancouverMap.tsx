import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapStyles } from '../styles/VancouverMap.styles';
import route_shapes from '@/assets/shapes.json';
import BusIcon from '@/components/atoms/BusIcon';
import { loadRouteData, calculateDistance } from '@/components/utils/route_utils';


const VancouverMap: React.FC<{location: any; setLocation: any; busData:any; setBusData: any; closestRoutes: any; setClosestRoutes: any }> = ({
  location,
  setLocation,
  busData,
  setBusData,
  closestRoutes,
  setClosestRoutes,
})  => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Record<number, Array<{ latitude: number; longitude: number; color: string }>> | null>(null);
  const shapeColorMap = new Map(); 


  // Initial Region is UBC
  const initialRegion: Region = {
    latitude: 49.26077,
    longitude: -123.24899,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // CALCULATE CLOSEST ROUTES
  useEffect(() => {
    if (!location || !routes) return;
  
    // Calculate distances for all routes
    const sortedRoutes = Object.entries(routes)
      .map(([routeId, routeCoords]) => {
        const minDistance = Math.min(
          ...routeCoords.map((point) =>
            calculateDistance(location.latitude, location.longitude, point.latitude, point.longitude)
          )
        );
        return { routeId: parseInt(routeId, 10), distance: minDistance, color: routeCoords[0].color };
      })
      .sort((a, b) => a.distance - b.distance);
  
    // Use a Set to ensure uniqueness and extract only the closest two route IDs
    const uniqueRouteIds = new Set();
    const closestUniqueRoutes = sortedRoutes
      .filter((route) => {
        if (uniqueRouteIds.has(route.routeId)) return false; // Skip duplicates
        uniqueRouteIds.add(route); // Add unique route ID
        return true;
      })
      .slice(0, 4); // Take the two closest unique routes
  
    setClosestRoutes(closestUniqueRoutes.map((r) => r));
  }, [location, routes]);


  // STREAM BUS DATA
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/stream/buses?speed_multiplier=10.0');
    
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


  // LOAD ROUTE DATA AND USER CURR LOCATION
  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }


      let currentLocation = await Location.getCurrentPositionAsync({});
      const hardcodedLocation = {
        latitude: 49.26077,
        longitude: -123.24899,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
  
      // setLocation(currentLocation.coords);
      setLocation(hardcodedLocation);
      
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
          Object.keys(routes).map((routeId, index) => {
            const isClosest = closestRoutes.includes(parseInt(routeId));
          
            return (
              <Polyline
                key={routeId}
                coordinates={routes[parseInt(routeId)]}
                strokeColor={isClosest ? routes[parseInt(routeId)][0].color : 'gray'}
                strokeWidth={isClosest ? 6 : 2}
              />
            );
          })}
        {routes && 
        busData.map((bus: any, index: number) => (
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