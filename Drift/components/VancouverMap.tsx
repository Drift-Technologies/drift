import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapStyles } from './styles/VancouverMap.styles';
import route_shapes from '@/assets/shapes.json';


const VancouverMap: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Record<number, Array<{ latitude: number; longitude: number }>> | null>(null);

  const loadRouteData = () => {
    const groupedRoutes: Record<number, Array<{ latitude: number; longitude: number }>> = {};
    route_shapes.forEach((shape) => {
      const { shape_id, shape_pt_lat, shape_pt_lon } = shape;
      if (!groupedRoutes[shape_id]) {
        groupedRoutes[shape_id] = [];
      }
      groupedRoutes[shape_id].push({
        latitude: shape_pt_lat,
        longitude: shape_pt_lon,
      });
    });
    setRoutes(groupedRoutes);
    console.log("Routes Loaded");
  };

  // CHAT GPT
  const generateRandomColor = () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
  };

  const initialRegion: Region = {
    latitude: location ? location.latitude : 49.2827,
    longitude: location ? location.longitude : -123.1207,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };


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
      loadRouteData();    
    })();
  }, []);


  return (
    <View style={MapStyles.container}>
      <MapView style={MapStyles.map} initialRegion={initialRegion}>
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
          Object.keys(routes).map((shapeId, index) => (
            <Polyline
              key={shapeId}
              coordinates={routes[parseInt(shapeId)]}
              strokeColor={generateRandomColor()}
              strokeWidth={3}
            />
          ))}
      </MapView>
    </View>
  );
};


export default VancouverMap;
