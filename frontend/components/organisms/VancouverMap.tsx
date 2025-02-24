import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { View, Easing, Platform, Animated } from 'react-native';
import MapView, { Marker, Polyline, Region, AnimatedRegion } from 'react-native-maps';

import { MapStyles } from '../styles/VancouverMap.styles';
import BusIcon from '@/components/atoms/BusIcon';
import { loadRouteData, calculateDistance, calculateBearing, flushBus } from '@/components/utils/route_utils';

const VancouverMap: React.FC<{location: any; setLocation: any; busData:any; setBusData: any; closestRoutes: any; setClosestRoutes: any }> = ({
  location,
  setLocation,
  busData,
  setBusData,
  closestRoutes,
  setClosestRoutes,
})  => {
  
  const [routes, setRoutes] = useState<Record<number, Array<{ latitude: number; longitude: number; color: string }>> | null>(null);
  const [busHistory, setBusHistory] = useState<Map<number, { latitude: number; longitude: number, bearing: number }>>(new Map());
  const [animatedBusData, setAnimatedBusData] = useState<Map<number, AnimatedRegion>>(new Map());

  const shapeColorMap = new Map(); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const markerRefs = useRef<Map<number, typeof Marker | null>>(new Map());

  // ✅ Restored: CALCULATE CLOSEST ROUTES
  useEffect(() => {
    if (!location || !routes) return;

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

    const uniqueRouteIds = new Set();
    const closestUniqueRoutes = sortedRoutes
      .filter((route) => {
        if (uniqueRouteIds.has(route.routeId)) return false; 
        uniqueRouteIds.add(route); 
        return true;
      })
      .slice(0, 4);

    setClosestRoutes(closestUniqueRoutes.map((r) => r));
  }, [location, routes]);

  // ✅ Restored: LOAD ROUTE DATA AND USER CURR LOCATION
  useEffect(() => {
    (async () => {
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

      setLocation(hardcodedLocation);
      console.log(currentLocation);
      loadRouteData(shapeColorMap, setRoutes);
    })();
  }, []);

  // STREAM BUS DATA (Animation Fixes Applied)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/stream/buses?speed_multiplier=10');
  
    const busLocations = new Map<number, { latitude: number; longitude: number }>();
    const data = new Set<string>();
  
    let timer = setInterval(() => {
      flushBus(data, busLocations, busHistory, (newBusData: any) => {
        // console.log("in flush",newBusData)
        setBusData(newBusData);
  
        setAnimatedBusData((prevBusData) => {
          // console.log(animatedBusData)
          const updatedData = new Map(prevBusData);
  
          newBusData.forEach((bus: any) => {
            if (!updatedData.has(bus.route_id)) {
              console.log("JHkjbn")
              // First time seeing this bus → Create a new AnimatedRegion
              updatedData.set(bus.route_id, new AnimatedRegion({
                latitude: bus.latitude,
                longitude: bus.longitude,
              }));
            } else {
              const prevRegion = updatedData.get(bus.route_id)!;
              
              const distanceMoved = Math.abs(prevRegion.latitude._value - bus.latitude) + 
                                   Math.abs(prevRegion.longitude._value - bus.longitude);
              if (distanceMoved < 0.0001) return;

              prevRegion.stopAnimation(() => {
                prevRegion.timing({
                  latitude: bus.latitude,
                  longitude: bus.longitude,
                  latitudeDelta: 0.001,
                  longitudeDelta: 0.001,
                  duration: 1000,
                  useNativeDriver: false,
                  easing: Easing.exp
                }).start();
              });

              updatedData.set(bus.route_id, prevRegion);
            }
          });
  
          return new Map(updatedData);
        });
      }, setBusHistory);
    }, 3000);
  
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
  
    ws.onmessage = (event) => {
      data.add(event.data);
    };
  
    ws.onclose = () => {
      console.log('WebSocket closed');
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    return () => {
      clearInterval(timer);
      ws.close();
      flushBus(data, busLocations, busHistory, setBusData, setBusHistory);
    };
  }, []);
  
  

  return (
    <View style={MapStyles.container}>
      <MapView 
        style={MapStyles.map} 
        initialRegion={{
          latitude: 49.26077,
          longitude: -123.24899,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
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
          Object.keys(routes).map((routeId) => {
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
          Array.from(animatedBusData.entries()).map(([route_id, animatedPosition]) => (
            <Marker.Animated
              key={`bus-${route_id}`}
              ref={(marker) => markerRefs.current.set(route_id, marker)}
              coordinate={animatedPosition}
            >
              <BusIcon 
                fillColor={routes[route_id]?.[0]?.color || 'black'} 
                rotation={0}
              />
            </Marker.Animated>
          ))
        }
      </MapView>
    </View>
  );
};

export default VancouverMap;
