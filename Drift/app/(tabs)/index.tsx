import React from 'react';
import { Image, StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';

import { ScrollView, View, Text } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import VancouverMap from '@/components/VancouverMap'

export default function HomeScreen() {
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <ScrollView>
      
      <ThemedView style={[styles.titleContainer, { paddingTop: statusBarHeight + 64 }]}>
        <ThemedText type="title">Welcome User!</ThemedText>
        <HelloWave />
      </ThemedView>

   
      <View style={styles.mapContainer}>
        <VancouverMap />
      </View>

      {/* Additional Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.contentText}>
          You do not have any active trips at the moment!
        </Text>
      </View>
    </ScrollView>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  mapContainer: {
    height: height * 0.6,
  },
  contentContainer: {
    padding: 16,
    height: 64,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
  },
});