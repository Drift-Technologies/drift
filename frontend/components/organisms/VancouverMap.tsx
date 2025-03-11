import React, { useState, useEffect, useRef } from 'react';
import { View, Easing, Animated, Text } from 'react-native';
import MapView, { Marker, AnimatedRegion, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

import { MapStyles } from '../styles/VancouverMap.styles';
import { getColorFromRouteId, setupWebSocket, fetchNearestRoutes, flushBus } from '@/components/utils/route_utils';
import {renderPolyline} from '@/components/molecules/RoutePolyline';
import BusIcon from '@/components/atoms/BusIcon';

const VancouverMap: React.FC<{
  location: any;
  setLocation: any;
  animatedBusData: any;
  setAnimatedBusData: any

}> = ({ location, setLocation, animatedBusData, setAnimatedBusData }) => {

  const [routes, setRoutes] = useState<Record<number, Array<{ shape_id: any; latitude: number; longitude: number; color: string }>> | null>(null);

  const [busBearings, setBusBearings] = useState<Map<number, [number, String]>>(new Map());

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const markerRefs = useRef<Map<number, Marker | null>>(new Map());

  // Load closest routes data and get user's current location
  useEffect(() => {
    const API_URL = "http://localhost:8000/api/v1/trips/nearest_routes?latitude=49.2827&longitude=-123.1207";
    
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      const hardcodedLocation = { latitude: 49.26077, longitude: -123.24899};

      await fetchNearestRoutes(hardcodedLocation, API_URL, setRoutes, setErrorMsg)
      setLocation(hardcodedLocation);

      // await fetchNearestRoutes(currentLocation, API_URL, setRoutes, setErrorMsg)
      // setLocation(currentLocation);
      console.log(currentLocation);
    })();
  }, []);

  // Stream bus data – update only animated markers
  useEffect(() => {
    let ws = new WebSocket('ws://localhost:8000/api/v1/trips/bus_positions');

    if (!ws || ws.readyState === WebSocket.CLOSED) {
      ws = new WebSocket('ws://localhost:8000/api/v1/trips/bus_positions');
    }

    // const ws = new WebSocket('ws://localhost:9000/ws/stream/buses?speed_multiplier=10');
    const busLocations = new Map<number, { latitude: number; longitude: number }>();
    const data = new Set<string>();

    ws.onopen = () => {
      console.log("WebSocket connected");
      
    
      const initialLocation = { latitude: 49.26077, longitude: -123.24899 };

      ws.send(JSON.stringify(initialLocation));
    };

    const timer = setInterval(() => {
      flushBus(data, busLocations, (newBusData: any) => {

        setAnimatedBusData((prevAnimatedData) => {
          const updatedData = new Map(prevAnimatedData);

          newBusData.forEach((bus: any) => {
            const { route_id, latitude, longitude, bearing, vehicle_label } = bus;

            // Use bus.route_id as the key (assumes one bus per route).
            if (!updatedData.has(bus.route_id)) {
              updatedData.set(
                route_id,
                new AnimatedRegion({
                  latitude: latitude,
                  longitude: longitude,
                })
                  
              );
            } else {
              let region = updatedData.get(route_id)!;
             
              region.stopAnimation(() => {
                region.timing({
                  latitude: bus.latitude,
                  longitude: bus.longitude,
                  duration: 2000,
                  useNativeDriver: false,
                  easing: Easing.bezier(0.42, 0, 0.58, 1),
                }).start();
              });
              updatedData.set(bus.route_id, region);
            }
          });

          return updatedData;
        });

        setBusBearings((prevBearings) => {
          const updatedBearings = new Map(prevBearings);
          newBusData.forEach((bus: any) => {
            updatedBearings.set(bus.route_id, bus.bearing);
          });
          return updatedBearings;
        });

      });
    }, 3000);

    setupWebSocket(ws, data);

    return () => {
      clearInterval(timer);
      ws.close();
    };
  }, []);

  return (
    <View style={MapStyles.container}>
      <MapView
        style={MapStyles.map}
        initialRegion={{
          latitude: 49.26077,
          longitude: -123.24899,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
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
        Object.keys(routes).map((shapeIdStr) => 
          renderPolyline(shapeIdStr, routes)
        )
      }   

      {routes &&
        Array.from(animatedBusData.entries()).map(([route_id, animatedPosition]) => {
          const bearing = busBearings.get(route_id) ?? 0; // Get bearing, default to 0 if not found
        
          return (
            <Marker.Animated
              key={`bus-${route_id}`}
              ref={(marker) => markerRefs.current.set(route_id, marker)}
              coordinate={
                animatedPosition as unknown as Animated.WithAnimatedObject<{ latitude: number; longitude: number }>
              }
            >
              {/* Apply the extracted bearing */}
              <BusIcon fillColor={getColorFromRouteId(routes, route_id)} rotation={bearing} />
              <Callout>
                <View style={{ padding: 5 }}>
                  <Text>Route ID: {route_id}</Text>
                </View>
              </Callout>
            </Marker.Animated>
          );
        })
      }
      </MapView>
    </View>
  );
};

export default VancouverMap;


