import route_shapes from '@/assets/shapes.json';

export const generateColorForShape = (shapeColorMap: Map<any, string>, shapeId: any): string => {
    if (shapeColorMap.has(shapeId)) {
        // Return the cached color for the shape
        return shapeColorMap.get(shapeId)!; // Use non-null assertion
    }

    // Generate a new random color for the shape
    const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    // Cache the color for this shape
    shapeColorMap.set(shapeId, color);

    return color;
};

export const loadRouteData = (shapeColorMap: any, setRoutes: any) => {
    const groupedRoutes: Record<number, Array<{ latitude: number; longitude: number; color: string }>> = {};

    route_shapes.forEach((shape) => {
        const { shape_id, shape_pt_lat, shape_pt_lon } = shape;

        if (!groupedRoutes[shape_id]) {
            groupedRoutes[shape_id] = [];
        }

        groupedRoutes[shape_id].push({
            latitude: shape_pt_lat,
            longitude: shape_pt_lon,
            color: generateColorForShape(shapeColorMap, shape_id),
        });
    });

    setRoutes(groupedRoutes);
    console.log(groupedRoutes[1]); // Debugging example
    console.log('Routes Loaded');
};

export const flush = (
    busLocations: Map<number, { latitude: number; longitude: number }>,
    data: Set<string>,
    setBusData: any
  ) => {
    const newBusLocations = new Map(busLocations);
  
    // Process each batched data item
    for (const value of data) {
      try {
        const parsedData = JSON.parse(value);
        if (parsedData?.data) {
          parsedData.data.forEach((bus: any) => {
            newBusLocations.set(bus.route_id, {
              latitude: bus.latitude,
              longitude: bus.longitude,
            });
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    }
  
    const updatedBusPositions = Array.from(newBusLocations.entries()).map(([route_id, coords]) => ({
      route_id,
      ...coords,
    }));
  
    setBusData(updatedBusPositions);
  
    // Clear old locations and batch data
    busLocations.clear();
    newBusLocations.forEach((value, key) => busLocations.set(key, value));
    data.clear();
  };
  
  export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };