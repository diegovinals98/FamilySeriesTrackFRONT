// Importaciones de React, React Native y otras librerías.
import React, { useEffect, useState } from 'react';

import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  TextInput, 
  TouchableWithoutFeedback,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  SafeAreaView ,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js'; // Importa el contexto del usuario.
import { StatusBar } from 'expo-status-bar';
import { globalStyles } from '../estilosGlobales.js'; // Importa estilos globales.
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Obtiene las dimensiones de la ventana del dispositivo.
const windowHeight = Dimensions.get('window').height;

const HomeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Accede a los datos del usuario desde el contexto.
  const { user } = useUser();
  const iniciales = user?.nombre ? `${user?.nombre.charAt(0)}${user?.apellidos.charAt(0)}` : '';

  // Estados del componente.
  const [seriesDetalles, setSeriesDetalles] = useState([]);
  const [idelegido, setIdElegido] = useState();
  const [grupoInicialSeleccionado, setGrupoInicialSeleccionado] = useState(false); 
  const [TodosGrupos, setTodosGrupos] = useState([]); 
  const [value, setValue] = useState(null); 
  const [isFocus, setIsFocus] = useState(false);
  const [refrescar, setRefrescar] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!grupoInicialSeleccionado) {
        llamarAGrupos(); 
      }
    }, [grupoInicialSeleccionado])
  );

  const onRefresh = React.useCallback(() => {
    setRefrescando(true);
    resetearBusqueda();
    setRefrescar(prev => !prev);
    obtenerSeries();
    setRefrescando(false);
  }, [value, idelegido]);

  const llamarAGrupos = async () => {
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/grupos/${user?.id}`);
      const json = await response.json();
      setTodosGrupos(json);

      if (json.length > 0 && !grupoInicialSeleccionado) {
        setValue(json[0].Nombre_grupo);
        setIdElegido(json[0].ID_Grupo);
        setGrupoInicialSeleccionado(true); 
      } else if (json.length == 0){
        setValue("Grupos");
      }

    } catch (error) {
      console.error('Error al obtener los grupos:', error);
    }
  };

  useEffect(() => {
    if (idelegido) {
      obtenerSeries();
    }
  }, [idelegido]);

  const obtenerSeriesDelUsuario = async (userId, nombre, idgrupo) => {
    try {
      const url = new URL(`https://apitfg.lapspartbox.com/series-ids-usuario/${userId}/${idgrupo}`);
      const respuesta = await fetch(url);
      if (!respuesta.ok) {
        throw new Error('Respuesta de red no fue ok.');
      }
      const seriesIds = await respuesta.json();
      return seriesIds;
    } catch (error) {
      console.error('Hubo un problema con la petición fetch:', error);
    }
  };

  const obtenerSeries = () => {
    if (!value) {
      setSeriesDetalles([]);
      return;
    }
    obtenerSeriesDelUsuario(user.id, value, idelegido).then(seriesIds => {
      if (seriesIds.length === 0) {
        return;
      }
      Promise.all(seriesIds.map(serieID =>
        fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=es-ES`)
          .then(response => response.json())
      )).then(seriesDetalles => {
        setSeriesDetalles(seriesDetalles);
      }).catch(error => console.error('Error:', error));
    });
  };

  useEffect(() => {
    llamarAGrupos();
    obtenerSeries();
  }, [refrescar]);

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  async function anadirGrupo() {
    navigation.navigate('Añadir Grupo')
  }

  const poster = (path) => {
    if (!path) {
      return null;
    }
    let imagePath = { uri: `https://image.tmdb.org/t/p/w500${path}` };
    return (
      <Image
        source={imagePath}
        style={styles.poster}
      />
    );
  };

  const [query, setQuery] = useState('');
  const [series, setSeries] = useState([]);

  const handleTextChange = (text) => {
    setQuery(text);
    buscarSeries();
  };

  const buscarSeries = async () => {
    const apiURL = `https://api.themoviedb.org/3/search/tv?api_key=c51082efa7d62553e4c05812ebf6040e&language=es-ES&page=1&query=${query}&include_adult=false`;

    try {
      const response = await fetch(apiURL);
      const data = await response.json();
      const seriesConPoster = data.results.map(serie => ({
        ...serie,
        posterURL: `https://image.tmdb.org/t/p/w500${serie.poster_path}`
      }));
      setSeries(seriesConPoster);
    } catch (error) {
      console.error(error);
    }
  };

  const agregarSerieAUsuario = async (userId, idSerie) => {
    try {
      let response = await fetch('https://apitfg.lapspartbox.com/agregar-serie-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          idSerie: idSerie
        }),
      });

      let responseJson = await response.json();
      console.log('Respuesta del servidor:', responseJson);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
    }
  };

  const seleccionSerie = (text, idSerie) => {
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres añadir la serie: ${text}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            agregarSerieAUsuario(user.id, idSerie);
            resetearBusqueda();
            setRefrescar(prev => !prev);
          },
        },
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            resetearBusqueda();
          }
        },
      ],
      { cancelable: false }
    );
  };

  const resetearBusqueda = () => {
    setQuery('');
    setSeries([]);
  };

  const navegarADetalles = (idSerie) => {
    navigation.navigate('Detalles Serie', { idSerie: idSerie, NombreGrupo: value });
  };

  const editarGrupo = (nombreGrupo) => {
    navigation.navigate('Editar Grupo', { idelegido, nombreGrupo });
  };

  const verCalendario = (nombreGrupo) => {
    navigation.navigate('Calendario', { nombreGrupo, idelegido });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7', paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
      <StatusBar />
      <TouchableWithoutFeedback onPress={() => resetearBusqueda()}>
        <View style={[globalStyles.container, styles.container]}>

          {/* Renderizado de la fila superior con las iniciales del usuario y el botón de grupos. */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.circle} onPress={() => handleSettings()}>
              <Text style={styles.initials}>{iniciales}</Text>
            </TouchableOpacity>

            <Dropdown
              style={[styles.buttonGroup, isFocus && { borderColor: 'blue' }]}
              placeholderStyle={styles.buttonText}
              selectedTextStyle={styles.selectedTextStyle}
              backgroundColor='blur'
              containerStyle={{ backgroundColor: '#6666ff', borderRadius: 15 }}
              iconStyle={styles.iconStyle}
              data={TodosGrupos}
              labelField="Nombre_grupo"
              valueField={value}
              placeholder={value}
              value={value}
              maxHeight={500}
              itemTextStyle={{ textAlign: 'left', color: 'white' }}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setValue(item.Nombre_grupo);
                setIdElegido(item.ID_Grupo);
                obtenerSeries();
                setIsFocus(false);
                onRefresh();
              }}
              renderLeftIcon={() => (
                <Text style={styles.buttonText}>{value}</Text>
              )}
            />

            <TouchableOpacity style={styles.circle} onPress={() => anadirGrupo()}>
              <Text style={styles.initials}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                value={query}
                onChangeText={handleTextChange}
                placeholder="Buscar series..."
                style={styles.searchInput}
              />
            </View>

            {series.length > 0 ? (
              <FlatList
                data={series}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ borderColor: 'black', borderBottomWidth: 2 }} onPress={() => seleccionSerie(item.name, item.id)}>
                    <Image source={{ uri: item.posterURL }} style={{ height: windowHeight * 0.20 }} />
                    <Text style={styles.textoBuscadas}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={styles.flatList}
              />
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', height: windowHeight * 0.68 }}>
            <ScrollView refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={onRefresh}
              />
            }>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {seriesDetalles.map((detalle, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.serieDetailContainer}
                    onPress={() => navegarADetalles(detalle.id)}
                  >
                    <View style={{ flex: 1 }}>
                      {poster(detalle.poster_path)}
                    </View>
                    <View style={{ flex: 5, marginBottom: '2%' }}>
                      <Text style={styles.serieTitle}>{detalle.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', textAlign: 'center' }}>
            {
              value !== 'Grupos' &&
              <TouchableOpacity style={styles.editarGrupoBoton} onPress={() => editarGrupo(value)}>
                <Text style={styles.editarGrupoTexto}>Editar Grupo: {value}</Text>
              </TouchableOpacity>
            }

            {
              value !== 'Grupos' &&
              <TouchableOpacity style={styles.editarGrupoBoton} onPress={() => verCalendario(value)}>
                <Text style={styles.editarGrupoTexto}>Calendario</Text>
              </TouchableOpacity>
            }
          </View>

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

export default HomeScreen;
