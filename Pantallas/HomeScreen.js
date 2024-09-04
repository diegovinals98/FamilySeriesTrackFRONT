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
  Keyboard,
  Button,
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
import { SelectCountry, Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { set } from 'lodash';

// Obtiene las dimensiones de la ventana del dispositivo.
const windowHeight = Dimensions.get('window').height;

// Componente principal de la pantalla de inicio.
const HomeScreen = () => {
  // Hook de navegación y rutas de react-navigation.
  const route = useRoute();
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  // Estilos condicionales basados en la plataforma
  const platformStyles = Platform.select({
    ios: { paddingTop: StatusBar.currentHeight }, // para iOS usamos el inset top
    android: { paddingTop: insets.top }, // para Android usamos la altura de la barra de estado
  });

  // Accede a los datos del usuario desde el contexto.
  const { user } = useUser();
  // Calcula las iniciales del usuario para mostrar.
  const iniciales = user?.nombre ? `${user?.nombre.charAt(0)}${user?.apellidos.charAt(0)}` : '';

  // Estados del componente.
  const [data, setData] = useState([]); // Estado para datos de usuarios.
  const [seriesData, setSeriesData] = useState([]); // Estado para datos generales de series.
  const [serieDetalle, setSerieDetalle] = useState([]); // Estado para detalles específicos de una serie.
  const [seriesIds, setseriesIds] = useState([]);
  const [seriesDetalles, setSeriesDetalles] = useState([]);
  const [idelegido, setIdElegido] = useState();

  // Estado para la visibilidad del menú desplegable y el grupo seleccionado.
  const [TodosGrupos, setTodosGrupos] = useState([]); // Estado para almacenar todos los grupos.
  const [value, setValue] = useState("Grupos"); // variable que almacena en que grupo estamos
  const [isFocus, setIsFocus] = useState(false);
  const [refrescar, setRefrescar] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(TodosGrupos.map(grupo => ({ label: grupo.Nombre_grupo, value: grupo.Nombre_grupo })));
  const [ordenAscendente, setOrdenAscendente] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      // Llama a las funciones que cargan los datos
      console.log('---------------------------------------- HOME SCREEN ----------------------------------------');
      llamarAGrupos();
      obtenerSeries();
      resetearBusqueda();
      setRefrescar(prev => !prev);

    }, [])
  );

  const onRefresh = React.useCallback(() => {
    setRefrescando(true);
    // Aquí debes llamar a las funciones que actualizan tus datos
    resetearBusqueda();
    setRefrescar(prev => !prev);
    llamarAGrupos();
    obtenerSeries();
    console.log(' ---------------------- ID elegido ----------------------' + idelegido)

    setRefrescando(false);
  }, []);

  // Función para manejar la selección de un grupo.
  const handleSelectItem = (item) => {
    setSelectedItem(item.Nombre_grupo);
    setIsVisible(false);
  };

  async function anadirGrupo() {
    navigation.navigate('Añadir Grupo')
  }

  // Función para realizar la llamada a la API y obtener los grupos del Usuario
  const llamarAGrupos = () => {
    console.log('Entrado en llamarGrupos')
    fetch(`https://apitfg.lapspartbox.com/grupos/${user?.id}`)
      .then((response) => response.json())
      .then((json) => setTodosGrupos(json))
      .catch((error) => console.error('Error al obtener los grupos:', error));
    console.log("Grupos del Usuario: " + user.nombre + user.apellidos);
    console.log(TodosGrupos);

  }

  useEffect(() => {
    console.log('El ID elegido es ahora: ' + idelegido);
    obtenerSeries();
    // Cualquier otra acción que necesite el estado actualizado
  }, [idelegido]);

  const obtenerSeriesDelUsuario = async (userId, nombre, idgrupo) => {
    console.log('Obtener series del usuario con id: ' + userId);
    console.log('Obtener series del grupo con id: ' + idgrupo);
    console.log('Obtener series del grupo con nombre: ' + nombre);
    try {
      const url = new URL(`https://apitfg.lapspartbox.com/series-ids-usuario/${userId}/${idgrupo}`);

      // Llamada al endpoint con userId y value como parámetros de consulta
      const respuesta = await fetch(url);
      if (!respuesta.ok) {
        throw new Error('Respuesta de red no fue ok.');
      }
      const seriesIds = await respuesta.json();
      console.log('Series: ' + seriesIds)
      return seriesIds;
    } catch (error) {
      console.error('Hubo un problema con la petición fetch:', error);
    }
  };

  const obtenerSeries = () => {

    if (value == 'Grupos') {
      console.log('Estamos en grupos, por lo que no hay series')
      setSeriesDetalles([])
    } else {
      obtenerSeriesDelUsuario(user.id, value, idelegido).then(seriesIds => {
        // Verifica si seriesIds está vacío
        if (seriesIds.length === 0) {
          console.log('No hay series para mostrar');
          return; // Sale de la función si no hay IDs de series
        }

        // Si seriesIds no está vacío, ejecuta el resto del código
        Promise.all(seriesIds.map(serieID =>
          fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=es-ES`)
            .then(response => response.json())
        )).then(seriesDetalles => {
          setSeriesDetalles(seriesDetalles); // Guardar los detalles de las series en el estado
        }).catch(error => console.error('Error:', error));
      });
    }

  }

  // Efecto para cargar datos de una serie específica.
  useEffect(() => {
    llamarAGrupos();
    obtenerSeries();
  }, [refrescar]);

  // Función para navegar a la pantalla de ajustes.
  const handleSettings = () => {
    navigation.navigate('Settings');
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
  }

  const [query, setQuery] = useState('');
  const [series, setSeries] = useState([]);

  const handleTextChange = (text) => {
    setQuery(text);
    buscarSeries()
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
    console.log("Se quire añadir " + text + ', con el id: ' + idSerie)
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres añadir la serie: ${text}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            agregarSerieAUsuario(user.id, idSerie)
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
  }

  const verCalendario = (nombreGrupo) => {
    navigation.navigate('Calendario', { nombreGrupo, idelegido });
  }

  const ordenarSeriesPorTitulo = () => {
    const seriesOrdenadas = [...seriesDetalles].sort((a, b) => {
      if (ordenAscendente) {
        return a.name.localeCompare(b.name);
      } else {
        return b.name.localeCompare(a.name);
      }
    });
    setSeriesDetalles(seriesOrdenadas);
    setOrdenAscendente(!ordenAscendente); // Cambia el orden para la próxima vez
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
      <StatusBar />
      <TouchableWithoutFeedback onPress={() => resetearBusqueda()}>
        <View style={[globalStyles.container, styles.container, platformStyles]}>

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
                console.log('ID DE ITEM ' + item.ID_Grupo)
                setIdElegido(item.ID_Grupo);
                obtenerSeries();
                setIsFocus(false);
                onRefresh()
              }}
              renderLeftIcon={() => (
                <Text style={styles.buttonText}>{value}</Text>
              )}
            />

            {/* Botón para añadir un nuevo grupo. */}
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

          {
          /* 
          <View style={styles.ordenarBotonContainer}>
            <TouchableOpacity style={styles.ordenarBoton} onPress={ordenarSeriesPorTitulo}>
              <Text style={styles.ordenarBotonTexto}>Ordenar por Título</Text>
            </TouchableOpacity>
          </View>
          */
          }

          

          <View style={{ flexDirection: 'row', height: windowHeight * 0.65 }}>
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
                <Text style={styles.editarGrupoTexto}>Ver Calendario</Text>
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
    backgroundColor: '#6666ff',
    alignItems: 'center',
    marginRight: '1%',
    marginLeft: '1%',
    flex: 1,
    justifyContent: 'center',
  },
  initials: {
    fontSize: 25,
    color: 'white',
    fontWeight: 'bold',
  },
  buttonGroup: {
    height: '100%',
    flexDirection: 'row',
    backgroundColor: '#6666ff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 4,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25,
    marginRight: 5,
  },
  dropdownIcon: {
    color: 'white',
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
    fontSize: 12,
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
  },
  flatList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white'
  },
  textoBuscadas: {
    margin: '5%',
    textAlign: 'center'
  },
  searchButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#005f99',
    borderRadius: 10,
    padding: '4%',
  },
  cajaBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginLeft: '2%'
  },
  editarGrupoBoton: {
    backgroundColor: 'grey',
    padding: 10,
    margin: '2%',
    alignItems: 'center',
    borderRadius: 5,
  },
  editarGrupoTexto: {
    color: 'white',
    fontSize: 16,
  },
  ordenarBotonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ordenarBoton: {
    backgroundColor: '#6666ff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  ordenarBotonTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default HomeScreen;