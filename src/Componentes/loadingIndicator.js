import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const LoadingIndicator = ({ colorScheme , styles, darkStyles}) => {
    return (
      <View style={colorScheme === 'dark' ? darkStyles.loadingContainer : styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#4A90E2' : '#4A90E2'} />
        <Text style={colorScheme === 'dark' ? darkStyles.loadingText : styles.loadingText}>
          Cargando series...
        </Text>
        <Text style={colorScheme === 'dark' ? darkStyles.loadingText : styles.loadingText}>
          Por favor, espere un momento
        </Text>
      </View>
    );
  };

export default LoadingIndicator;