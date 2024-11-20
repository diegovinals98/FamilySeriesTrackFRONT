import 'react-native-gesture-handler/jestSetup';

jest.mock('expo-constants', () => ({
  Constants: {
    expoConfig: {
      extra: {
        eas: {
          projectId: '286b0202-4e1a-4aa8-810d-d9f42de76efe'
        }
      }
    }
  }
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('expo-notifications');
global.fetch = jest.fn();
