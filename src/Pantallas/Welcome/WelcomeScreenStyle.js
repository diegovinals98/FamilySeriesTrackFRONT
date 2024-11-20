import { StyleSheet, Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  logo: {
    height: 0.4 * windowHeight,
    width: 0.4 * windowHeight,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '10%',
  },
});
