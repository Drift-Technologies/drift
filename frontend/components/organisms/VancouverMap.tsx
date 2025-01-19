import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapStyles } from '../styles/VancouverMap.styles';
import route_shapes from '@/assets/shapes.json';
import BusIcon from '@/components/atoms/BusIcon';
import { loadRouteData, calculateDistance } from '@/components/utils/route_utils';
import { processPayment } from '@/components/utils/payment';
import busNames from '@/assets/bus_names.json';



const VancouverMap: React.FC<{user_id: any; location: any; setLocation: any; busData: Array<{ latitude: number; longitude: number; route_id: number }>; setBusData: any; closestRoutes: any; setClosestRoutes: any }> = ({
  user_id,
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
  const firstTimestampRef = useRef<string | null>(null);
  const locationHistoryRef = useRef<Array<{
    timestamp: string,
    first_timestamp: string | null,
    latitude: number,
    longitude: number
  }>>([]);
  const lastLocationRef = useRef<{latitude: number, longitude: number} | null>(null);

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
        return { routeId: parseInt(routeId), distance: minDistance, color: routeCoords[0].color };
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
      .slice(0, 5); // Take the two closest unique routes
  
    setClosestRoutes(closestUniqueRoutes.map((r) => r));
  }, [location, routes]);


  // STREAM BUS DATA
  useEffect(() => {
    const ws = new WebSocket('ws://35.153.203.112:8080/ws/stream/buses?speed_multiplier=10.0');
    
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
    
    let timer = setInterval(flush, 1500);

    ws.onopen = () => {
      console.log('Bus WebSocket connected');
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

  // STREAM USER LOCATION
  useEffect(() => {
    const ws_person = new WebSocket('ws://35.153.203.112:8080/ws/stream/person?speed_multiplier=10.0');
    
    const data_person = new Set<string>();

    const sendLocationsToAPI = async (locations: typeof locationHistoryRef.current) => {
      try {
        // Transform the locations to match the required format
        const formattedLocations = locations.map(loc => ({
          first_timestamp: loc.first_timestamp,
          timestamp: loc.timestamp,
          lat: loc.latitude,  // rename latitude to lat
          lon: loc.longitude  // rename longitude to lon
        }));

        const response = await fetch('http://35.153.203.112:8080/location-match/rule-based', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'e5834563-c8dd-4009-9828-ed8e195db0f7'
          },
          body: JSON.stringify(formattedLocations)  // send formatted locations
        });
        
        if (!response.ok) {
          throw new Error('Failed to send locations');
        }

        const data = await response.json();
        console.log("API Response:", data);
    
        locationHistoryRef.current = [];
        return data;
      } catch (error) {
        console.error('Error sending locations to API:', error);
        return {};
      }
    };

    // Flush function to process batched messages
    const flush = async () => {
      for (const value of data_person) {
        const parsedData = JSON.parse(value);
        if (parsedData?.data && parsedData.data.length > 0) {
          const locationData = parsedData.data[0];
          
          // Check if location has changed
          const hasLocationChanged = !lastLocationRef.current || 
            lastLocationRef.current.latitude !== locationData.lat || 
            lastLocationRef.current.longitude !== locationData.lon;

          if (hasLocationChanged) {
            if (firstTimestampRef.current === null) {
              firstTimestampRef.current = locationData.timestamp;
            }

            // Update last location
            lastLocationRef.current = {
              latitude: locationData.lat,
              longitude: locationData.lon
            };

            // console.log(lastLocationRef.current);

            // Add new location to history with null check
            locationHistoryRef.current.push({
              first_timestamp: firstTimestampRef.current || null,
              timestamp: locationData.timestamp,
              latitude: locationData.lat,
              longitude: locationData.lon
            });

            // If we have 30 locations, send them to the API
            if (locationHistoryRef.current.length >= 100) {
              const res = await sendLocationsToAPI([...locationHistoryRef.current]);
              // console.log(res);

              const makePayment = async () => {
                console.log({
                  user_id: user_id,
                  bus_route: busNames.find((x) => Number(x.shape_id) === 292250)?.trip_headsign || '49',
                  charge_amt: 3.50
                })
                
                const paymentResult = await processPayment({
                  user_id: user_id,
                  bus_route: busNames.find((x) => Number(x.shape_id) === 292250)?.trip_headsign || '49',
                  charge_amt: 3.50
                });
                if (paymentResult) {
                  console.log('Payment successful');
                } else {
                  console.log('Payment failed');
                }
              };

              if (!res.is_on_bus) {
                await makePayment();
              }

              locationHistoryRef.current = [];
            }

            setLocation({
              first_timestamp: firstTimestampRef.current || null,
              timestamp: locationData.timestamp,
              latitude: locationData.lat,
              longitude: locationData.lon,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      }
      data_person.clear();
    }
    
    let timer = setInterval(flush, 1500);

    ws_person.onopen = () => {
      console.log('Person WebSocket connected');
    };

    ws_person.onmessage = (event) => {
      data_person.add(event.data); // Add incoming messages to the Set
    };

    ws_person.onclose = () => {
      console.log('WebSocket closed');
      firstTimestampRef.current = null; // Reset first timestamp on close
      // Send any remaining locations before closing
      if (locationHistoryRef.current.length > 0) {
        sendLocationsToAPI([...locationHistoryRef.current]);
      }
    };

    ws_person.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on component unmount
    return () => {
      clearInterval(timer);
      if (locationHistoryRef.current.length > 0) {
        sendLocationsToAPI([...locationHistoryRef.current]);
      }
      ws_person.close(); 
      flush(); 
      firstTimestampRef.current = null;
      lastLocationRef.current = null;  // Reset last location on cleanup
    };
  }, []);


  // LOAD ROUTE DATA
  useEffect(() => {
    (async () => {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      // const hardcodedLocation = {
      //   latitude: 49.26077,
      //   longitude: -123.24899,
      //   latitudeDelta: 0.01,
      //   longitudeDelta: 0.01,
      // };
  
      // setLocation(currentLocation.coords);
      // setLocation(hardcodedLocation);
      
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
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
          />
        )}
        {routes &&
          Object.keys(routes).map((routeId, index) => {
            const closestRoute = closestRoutes.find((route: any) => route.routeId === parseInt(routeId));
            const isClosest = !!closestRoute;
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
        busData.map((bus, index) => (
          <Marker
            key={`bus-${bus.route_id}`}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            title={`Bus ID: ${busNames.find((x) => Number(x.shape_id) === bus.route_id)?.trip_headsign}`}
          >
            <BusIcon fillColor={routes[bus.route_id][0].color || 'black'} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default VancouverMap;
