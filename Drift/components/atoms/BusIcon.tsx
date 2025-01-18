import React from 'react';
import { Svg, Rect, Circle, Line, Text } from 'react-native-svg';

const BusIcon = ({ width = 40, height = 40, fillColor = 'blue', borderColor = 'black', wheelColor = 'black' }) => (
  <Svg width={width} height={height} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <Rect x="8" y="18" width="84" height="54" rx="10" ry="10" fill={borderColor} />
    
    {/* Bus Body */}
    <Rect x="10" y="20" width="80" height="50" rx="8" ry="8" fill={fillColor} />

    {/* Windows */}
    <Rect x="15" y="25" width="20" height="15" rx="3" ry="3" fill="white" />
    <Rect x="40" y="25" width="20" height="15" rx="3" ry="3" fill="white" />
    <Rect x="65" y="25" width="20" height="15" rx="3" ry="3" fill="white" />

    {/* Divider Line */}
    <Line x1="10" y1="45" x2="90" y2="45" stroke="white" strokeWidth="2" />

    {/* Wheels */}
    <Circle cx="25" cy="75" r="8" fill={wheelColor} />
    <Circle cx="75" cy="75" r="8" fill={wheelColor} />

    {/* Route Number (Optional) */}
    <Rect x="35" y="50" width="30" height="12" rx="3" ry="3" fill="white" />
    <Text
      x="50"
      y="58"
      fontSize="8"
      fontWeight="bold"
      textAnchor="middle"
      fill={fillColor}
    >
      Route
    </Text>
  </Svg>
);

export default BusIcon;