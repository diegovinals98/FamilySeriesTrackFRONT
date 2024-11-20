import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const lightTheme = {
  colors: {
    primary: '#005f99',
    secondary: '#4DA6FF',
    background: '#F4F6F8',
    surface: '#FFFFFF',
    text: '#333333',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#FF6347',
    success: '#4CAF50',
    warning: '#FFC107'
  },
  spacing: {
    xs: height * 0.005,
    sm: height * 0.01,
    md: height * 0.02,
    lg: height * 0.03,
    xl: height * 0.04
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold'
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold'
    },
    body: {
      fontSize: 16
    },
    caption: {
      fontSize: 14
    },
    button: {
      fontSize: 20,
    }
  }
};

export const darkTheme = {
  colors: {
    primary: '#4DA6FF',
    secondary: '#005f99',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    border: '#333333',
    error: '#FF6347',
    success: '#4CAF50',
    warning: '#FFC107'
  },
  spacing: lightTheme.spacing,
  borderRadius: lightTheme.borderRadius,
  typography: lightTheme.typography
};
