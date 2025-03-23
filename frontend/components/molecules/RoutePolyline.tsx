import React from 'react';
import { Polyline } from 'react-native-maps';

export const renderPolyline = (shapeIdStr: string, routes: any) => {
    const shapeId = parseInt(shapeIdStr, 10);
    const routePoints = routes[shapeId];
  
    if (!routePoints || routePoints.length === 0) return null; // Skip if empty
  
    // Extract route details from the first point
    const routeId = routePoints[0].route_id;
    const routeColor = routePoints[0].color;
    // console.log("Rendering polyline for shapeId:", shapeIdStr);

    return (
        <Polyline
            key={shapeId} // Use shape_id as key
            coordinates={routePoints.map(({ latitude, longitude }) => ({ latitude, longitude }))} // Extract coordinates
            strokeColor={routeColor} // Use color from first point
            strokeWidth={6}
        />
    );
  };