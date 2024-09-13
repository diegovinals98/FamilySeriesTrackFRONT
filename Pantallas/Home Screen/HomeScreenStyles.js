// homeScreenStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '2%',
  },
  circle: {
    aspectRatio: 1,
    borderRadius: 1000,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    marginRight: '1%',
    marginLeft: '1%',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  initials: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  buttonGroup: {
    height: '100%',
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 4,
    justifyContent: 'center',
    padding: 5,
    borderColor: '#4A90E2',
    borderWidth: 1,
  },
  buttonText: {
    color: '#4A90E2',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 5,
  },
  dropdownIcon: {
    color: '#4A90E2',
    fontSize: 18,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemText: {
    textAlign: 'center',
    fontSize: 16,
  },
  serieTitle: {
    marginTop: '5%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: '1%',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#aaa',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  poster: {
    height: windowHeight * 0.19,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  serieDetailContainer: {
    width: '33%',
    padding: 10,
    flexDirection: 'column',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: '4%',
    borderRadius: 8,
    marginBottom: '2%',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    width: '80%',
    flexDirection: 'column',
    marginVertical: 10,
  },
  flatList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white'
  },
  textoBuscadas: {
    margin: '5%',
    textAlign: 'center',
    fontSize: 14,
  },
  editarGrupoBoton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    margin: '2%',
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editarGrupoTexto: {
    color: 'white',
    fontSize: 16,
  }
});
