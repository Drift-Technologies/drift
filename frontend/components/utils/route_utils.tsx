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


  // 20250221
  export const calculateBearing = (prev: { latitude: number; longitude: number }, curr: { latitude: number; longitude: number }) => {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const toDegrees = (rad: number) => (rad * 180) / Math.PI;
  
    const lat1 = toRadians(prev.latitude);
    const lat2 = toRadians(curr.latitude);
    let dLon = toRadians(curr.longitude - prev.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360; // Normalize to [0,360]

    // 🛠 Fix #2: Detect and correct flipped bearings
    if (prev.longitude > curr.longitude) {
        bearing = (bearing + 180) % 360; // Flip bearing if needed
    }

    return bearing;
};


  export const flushBus = (
    data: any, 
    busLocations: any, 
    busHistory: Map<number, { latitude: number; longitude: number, bearing: number}>, 
    setBusData: any, 
    setBusHistory: any
  ) => {
    const newBusLocations = new Map(busLocations);
    const newBusHistory = new Map(busHistory);
  
    for (const value of data) {
      const parsedData = JSON.parse(value);
      if (parsedData?.data) {
        parsedData.data.forEach((bus: any) => {
          const prevCoords = busHistory.get(bus.route_id);
          const currCoords = { latitude: bus.latitude, longitude: bus.longitude, bearing: bus.bearing ? bus.bearing : 0 };
  
          const prevbearing = prevCoords ? prevCoords.bearing : 0;
          const bearing = prevCoords ? calculateBearing(prevCoords, currCoords) : prevbearing;
          
  
          newBusLocations.set(bus.route_id, { ...currCoords, bearing: bearing });
          newBusHistory.set(bus.route_id, currCoords);
        });
      }
    }
  
    setBusData(Array.from(newBusLocations.entries()).map(([route_id, coords]) => (typeof coords === 'object' ? { route_id, ...coords } : { route_id, coords })));
    setBusHistory(newBusHistory);
  
    busLocations.clear();
    newBusLocations.forEach((value, key) => busLocations.set(key, value));
    data.clear();
  };


