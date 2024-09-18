import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  TextInput, 
  TouchableWithoutFeedback,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../userContext.js';
import { StatusBar } from 'expo-status-bar';
import { globalStyles } from '../../estilosGlobales.js';
import { Dropdown } from 'react-native-element-dropdown';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './HomeScreenStyles.js';

const windowHeight = Dimensions.get('window').height;

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const iniciales = user?.nombre ? `${user?.nombre.charAt(0)}${user?.apellidos.charAt(0)}` : '';

  const [seriesDetalles, setSeriesDetalles] = useState([]);
  const [idelegido, setIdElegido] = useState();
  const [grupoInicialSeleccionado, setGrupoInicialSeleccionado] = useState(false);
  const [TodosGrupos, setTodosGrupos] = useState([]);
  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);
  const [refrescar, setRefrescar] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      if (!grupoInicialSeleccionado) {
        llamarAGrupos();
      }
    }, [grupoInicialSeleccionado])
  );

  useEffect(() => {
    if (idelegido) {
      obtenerSeries();
    }
  }, [idelegido]);

  useEffect(() => {
    llamarAGrupos();
    obtenerSeries();
  }, [refrescar]);

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

  const obtenerSeriesDelUsuario = async (userId, idgrupo) => {
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
    setCargando(true);
    if (!value) {
      setSeriesDetalles([]);
      setCargando(false);
      return;
    }
    obtenerSeriesDelUsuario(user.id, idelegido).then(seriesIds => {
      if (seriesIds.length === 0) {
        setSeriesDetalles([]);
        setCargando(false);
        return;
      }
      Promise.all(seriesIds.map(serieID =>
        fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=es-ES`)
          .then(response => response.json())
      )).then(seriesDetalles => {
        setSeriesDetalles(seriesDetalles);
        setCargando(false);
      }).catch(error => {
        console.error('Error:', error);
        setCargando(false);
      });
    });
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const anadirGrupo = () => {
    navigation.navigate('Añadir Grupo');
  };

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

  const agregarSerieAUsuario = async (userId, idSerie, idGrupo) => {
    try {
      let response = await fetch('https://apitfg.lapspartbox.com/agregar-serie-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          idSerie: idSerie,
          idGrupo: idGrupo
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
            agregarSerieAUsuario(user.id, idSerie, idelegido);
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

  const estadisticas = (idUsuario) => {
    console.log(idUsuario, "ha pulsado boton estadisticas");
    navigation.navigate('Estadisticas', { idUsuario });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7', paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
      <StatusBar />
      <TouchableWithoutFeedback onPress={() => resetearBusqueda()}>
        <View style={[globalStyles.container, styles.container]}>
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
                style={styles.refreshContainer}
                tintColor="#6666ff"
                title="Cargando series..."
                titleColor="#6666ff"
              />
            }>
              {seriesDetalles.length > 0 ? (
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
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4A90E2" />
                  <Text style={styles.loadingText}>Cargando series...</Text>
                  <Text style={styles.loadingText}>Por favor, espere un momento</Text>
                </View>
              )}
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

            {
              value !== 'Grupos' &&
              <TouchableOpacity style={styles.editarGrupoBoton} onPress={() => estadisticas(user.id)}>
                <Text style={styles.editarGrupoTexto}>Estadisticas</Text>
              </TouchableOpacity>
            }
          </View>

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default HomeScreen;
