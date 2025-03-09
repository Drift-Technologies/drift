import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface BackButtonProps {
  onPress: () => void;
  style?: any;
}

export function BackButton({ onPress, style }: BackButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <IconSymbol name="arrow.left" size={24} color="#333" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  }
}); 