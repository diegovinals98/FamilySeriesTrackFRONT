import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  StyleSheet,
  View, 
  Appearance
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../userContext.js';
import { globalStyles } from '../estilosGlobales.js';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { sendPushNotification } from '../Pantallas/notificaciones';


const windowHeight = Dimensions.get('window').height;

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user , setUser  } = useUser();
  const iniciales = user?.nombre ? `${user?.nombre.charAt(0)}${user?.apellidos.charAt(0)}` : '';
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todas');
  const [grupoInicialSeleccionado, setGrupoInicialSeleccionado] = useState(false);
  const [idelegido, setIdElegido] = useState();
  const [isFocus, setIsFocus] = useState(false);
  const [query, setQuery] = useState('');
  const [refrescar, setRefrescar] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [series, setSeries] = useState([]);
  const [seriesDetalles, setSeriesDetalles] = useState([]);
  const [TodosGrupos, setTodosGrupos] = useState([]);
  const [value, setValue] = useState(null);
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());
  const [seriesFavoritas, setSeriesFavoritas] = useState([]);
  

  const [miembrosGrupo, setMiembrosGrupo] = useState([]); 
  const opcionesFiltro = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Favoritas', value: 'Favoritas' },
    { label: 'Viendo', value: 'Viendo' },
    { label: 'Acabadas', value: 'Acabadas' },
    { label: 'Pendientes', value: 'Pendientes' }
  ];

  console.log(user.idioma);  

  useFocusEffect(
    React.useCallback(() => {
      if (!grupoInicialSeleccionado) {
        llamarAGrupos();
        const fetchMiembrosGrrupo = async () => {

          console.log("Nombre del grupo:", value);
          try {
            
            const response = await fetch(`https://backendapi.familyseriestrack.com/miembros-grupo/${value}`);
            const data = await response.json();
            setMiembrosGrupo(data.members);
            console.log("Miembros del grupo:", data.members);
          } catch (error) {
            console.error('Error al obtener miembros del grupo:', error);
          }
        };
        fetchMiembrosGrrupo();
      }
    }, [grupoInicialSeleccionado])
  );

  const obtenerSeriesFavoritas = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/series-favoritas/${user.id}`);
      const data = await response.json();
      setSeriesFavoritas(data);
    } catch (error) {
      console.error('Error al obtener las series favoritas:', error);
    }

    console.log('Series favoritas:', seriesFavoritas);
  };



 

  useEffect(() => {
    // Establecer el contador de notificaciones a 0 siempre
    Notifications.setBadgeCountAsync(0);

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response data:', response.notification.request.content.data);
      const tipo  = response.notification.request.content.data.tipo;
      
      if (tipo === 'comentario') {
        const { nombreGrupo, idSerie, nombreSerie } = response.notification.request.content.data;
        navigation.navigate('Comentarios Serie', { NombreGrupo: nombreGrupo, idSerie: idSerie, nombreSerie: nombreSerie });
      } else if (tipo === 'visualizacion') {
        const { nombreGrupo, idSerie } = response.notification.request.content.data;
        navigation.navigate('Detalles Serie', { idSerie: idSerie, NombreGrupo: nombreGrupo });
      }
    });
    return () => {
      subscription.remove();
    };

  }, []);

  useEffect(() => {
    const fetchData = async () => {
      await obtenerSeriesFavoritas();
      await new Promise(resolve => setTimeout(resolve, 10)); // Retardo de 1 segundo
      await obtenerSeries();
    };
    fetchData();
  }, [idelegido, filtro]);

  useEffect(() => {
    llamarAGrupos();
    const fetchData = async () => {
      await obtenerSeriesFavoritas();
      await new Promise(resolve => setTimeout(resolve, 10)); // Retardo de 1 segundo
      await obtenerSeries();
    };
    fetchData();
  }, [refrescar]);

  useEffect(() => {
    comprobarApariencia();
    registerForPushNotificationsAsync();
    const fetchData = async () => {
      await obtenerSeriesFavoritas();
      await new Promise(resolve => setTimeout(resolve, 10)); // Retardo de 1 segundo
      await obtenerSeries();
    };
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      comprobarApariencia();
    }, 100); // Check every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const comprobarApariencia = () => {
    setColorScheme(Appearance.getColorScheme());
    
  }

  const onRefresh = React.useCallback(() => {
    setRefrescando(true);
    resetearBusqueda();
    setRefrescar(prev => !prev);
    obtenerSeries();
    obtenerIdioma();
    setRefrescando(false);
  }, [value, idelegido, filtro]);

  const llamarAGrupos = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/grupos/${user?.id}`);
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


  const obtenerMiembrosDelGrupo = async (nombre) => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/miembros-grupo/${nombre}`);
      const data = await response.json();
      return data.members.map(member => member.id);
    } catch (error) {
      console.error('Error al obtener los miembros del grupo:', error);
    }
  };

  const obtenerIdioma = async () => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/get-user/${user.id}`);
      const json = await response.json();
      setUser({ ...user, idioma: json.usuario.idioma });
    } catch (error) {
      console.error('Error al obtener el idioma:', error);
    }
  };

  function handleRegistrationError(errorMessage) {
    alert(errorMessage);
  }

  async function registerForPushNotificationsAsync() {
    console.log('Iniciando registerForPushNotificationsAsync');
    
    if (Platform.OS === 'android') {
      console.log('Configurando canal de notificación para Android');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    if (Device.isDevice) {
      console.log('Dispositivo físico detectado');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Estado de permisos existente:', existingStatus);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        console.log('Solicitando permisos de notificación');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('Nuevo estado de permisos:', finalStatus);
      }
      if (finalStatus !== 'granted') {
        console.error('Permiso no concedido para notificaciones push');
        handleRegistrationError('Permission not granted to get push token for push notification!');
        return;
      }
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error('ID del proyecto no encontrado');
        handleRegistrationError('Project ID not found');
      }
      console.log('ID del proyecto:', projectId);
      try {
        console.log('Obteniendo token de push...');
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log('Token de push obtenido:', pushTokenString);
        console.log('Para el usuario :', user.id);
        try {
          const response = await fetch('https://backendapi.familyseriestrack.com/registrar-token-notificacion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              token: pushTokenString
            }),
          });

          if (!response.ok) {
            throw new Error('Error al registrar el token en el servidor');
          }

          console.log('Token registrado exitosamente en el servidor');
        } catch (error) {
          console.error('Error al registrar el token:', error);
        }
        
        return pushTokenString;
      } catch (e) {
        console.error('Error al obtener el token de push:', e);
        handleRegistrationError(`${e}`);
      }
    } else {
      console.error('No es un dispositivo físico');
      handleRegistrationError('Must use physical device for push notifications');
    }

    console.log('Saliendo de registerForPushNotificationsAsync');
  }

  const obtenerSeriesDelUsuario = async (userId, idgrupo) => {
    try {
      const url = new URL(`https://backendapi.familyseriestrack.com/series-ids-usuario/${userId}/${idgrupo}`);
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
        fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=${user.idioma}`)
          .then(response => response.json())
      )).then(seriesDetalles => {
        let seriesFiltradas = seriesDetalles;
        if (filtro === 'Favoritas') {
          seriesFiltradas = seriesDetalles.filter(serie => seriesFavoritas.seriesIds.includes(serie.id));
        } else if (filtro !== 'Todas') {
          seriesFiltradas = seriesDetalles.filter(serie => serie.estado === filtro);
        }
        setSeriesDetalles(seriesFiltradas);
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
    navigation.navigate('Anadir Grupo');
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
    const apiURL = `https://api.themoviedb.org/3/search/tv?api_key=c51082efa7d62553e4c05812ebf6040e&language=${user.idioma}&page=1&query=${query}&include_adult=false`;

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

  const agregarSerieAUsuario = async (userId, idSerie, idGrupo, nombreSerie) => {
    try {
      let response = await fetch('https://backendapi.familyseriestrack.com/agregar-serie-usuario', {
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
    // Sacar los ids de los miembros del grupo
    const idsMiembros = await obtenerMiembrosDelGrupo(value);
    console.log('Ids de los miembros del grupo:', idsMiembros);
    // Enviar Notificaciones Push a los miembros del grupo

    idsMiembros.forEach(async (id) => {
      
      if (id !== user.id) {
        try {
          // Obtenemos los tokens del miembro para enviar la notificación
          const response = await fetch(`https://backendapi.familyseriestrack.com/obtener-token/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            throw new Error('Error al obtener los tokens del miembro');
          }
          const data = await response.json();
          const tokens = data.tokens;
          console.log('Tokens del miembro:', tokens);
          
          // Enviamos la notificación push a todos los tokens
          tokens.forEach(token => {
            console.log('Enviando notificación push:', {
              token: token,
              title: 'Nueva Serie!',
              body: `${user.nombre}: ${nombreSerie} ha sido añadida al grupo ${value}`
            });
            sendPushNotification(token, 'Nueva Serie!', nombreSerie + ': ' + user.nombre + ' ha añadido al grupo ' + value );
          })
        } catch (error) {
          console.error(`Error al obtener los tokens del miembro ${miembro.id}:`, error);
        }
      }
    });

  };

  const seleccionSerie = (text, idSerie) => {
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres añadir la serie: ${text}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            agregarSerieAUsuario(user.id, idSerie, idelegido, text);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#121212' : '#f7f7f7', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar 
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#f7f7f7'} 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <TouchableWithoutFeedback onPress={() => resetearBusqueda()}>
        <View style={[globalStyles.container, colorScheme === 'dark' ? darkStyles.container : styles.container]}>
          <View style={colorScheme === 'dark' ? darkStyles.row : styles.row}>
            <TouchableOpacity style={colorScheme === 'dark' ? darkStyles.circle : styles.circle} onPress={() => handleSettings()}>
              <Text style={colorScheme === 'dark' ? darkStyles.initials : styles.initials}>{iniciales}</Text>
            </TouchableOpacity>

            <Dropdown
              style={[colorScheme === 'dark' ? darkStyles.buttonGroup : styles.buttonGroup, isFocus && { borderColor: 'blue' }]}
              placeholderStyle={colorScheme === 'dark' ? darkStyles.buttonText : styles.buttonText}
              selectedTextStyle={colorScheme === 'dark' ? darkStyles.selectedTextStyle : styles.selectedTextStyle}
              blurRadius={15}
              containerStyle={{ backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', borderRadius: 15, borderWidth: 1, borderColor: '#6666ff' }}
              iconStyle={colorScheme === 'dark' ? darkStyles.iconStyle : styles.iconStyle}
              activeColor={colorScheme === 'dark' ? '#2C2C2C' : '#E8F0FE'}
              data={TodosGrupos}
              labelField="Nombre_grupo"
              valueField="Nombre_grupo"
              placeholder={value}
              value={value}
              maxHeight={500}
              itemTextStyle={{ textAlign: 'left', color: colorScheme === 'dark' ?  '#fff' : '#000' }}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={item => {
                setValue(item.Nombre_grupo);
                setIdElegido(item.ID_Grupo);
                obtenerSeries();
                setIsFocus(false);
                onRefresh();
              }}
            />

            <TouchableOpacity style={colorScheme === 'dark' ? darkStyles.circle : styles.circle} onPress={() => anadirGrupo()}>
              <Text style={colorScheme === 'dark' ? darkStyles.initials : styles.initials}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={colorScheme === 'dark' ? darkStyles.searchContainer : styles.searchContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={query}
                onChangeText={handleTextChange}
                placeholder="Buscar series..."
                style={[colorScheme === 'dark' ? darkStyles.searchInput : styles.searchInput, { flex: 3, marginRight: 10 , alignSelf: 'center'}]}
                placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              />
              <Dropdown
                style={[colorScheme === 'dark' ? darkStyles.filterDropdown : styles.filterDropdown, { width: '30%', flex: 1 }]}
                data={opcionesFiltro}
                labelField="label"
                valueField="value"
                placeholder="Filtrar"
                value={filtro}
                onChange={item => {
                  setFiltro(item.value);
                }}
                selectedTextStyle={colorScheme === 'dark' ? darkStyles.selectedTextStyle : styles.selectedTextStyle}
                itemTextStyle={colorScheme === 'dark' ? darkStyles.itemTextStyle : styles.itemTextStyle}
                containerStyle={colorScheme === 'dark' ? darkStyles.dropdownContainerStyle : styles.dropdownContainerStyle}
                activeColor={colorScheme === 'dark' ? '#2C2C2C' : '#E8F0FE'}
                iconStyle={colorScheme === 'dark' ? darkStyles.iconStyle : styles.iconStyle}
              />
            </View>

            {series.length > 0 ? (
              <FlatList
                data={series}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={{ borderColor: colorScheme === 'dark' ? '#666' : 'black', borderBottomWidth: 2 }} onPress={() => seleccionSerie(item.name, item.id)}>
                    <Image source={{ uri: item.posterURL }} style={{ height: windowHeight * 0.20 }} />
                    <Text style={colorScheme === 'dark' ? darkStyles.textoBuscadas : styles.textoBuscadas}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                style={colorScheme === 'dark' ? darkStyles.flatList : styles.flatList}
              />
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', height: windowHeight * 0.68, marginTop: '2%', borderRadius: 10 }}>
            <ScrollView refreshControl={
              <RefreshControl
                refreshing={refrescando}
                onRefresh={onRefresh}
                style={styles.refreshContainer}
                tintColor={colorScheme === 'dark' ? '#4A90E2' : '#6666ff'}
                title="Cargando series..."
                titleColor={colorScheme === 'dark' ? '#4A90E2' : '#6666ff'}
              />
            }>
              {seriesDetalles.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {seriesDetalles.map((detalle, index) => (
                    <TouchableOpacity
                      key={index}
                      style={colorScheme === 'dark' ? darkStyles.serieDetailContainer : styles.serieDetailContainer}
                      onPress={() => navegarADetalles(detalle.id)}
                    >
                      <View style={{ flex: 1 }}>
                        {poster(detalle.poster_path)}
                      </View>
                      <View style={{ flex: 5, marginBottom: '2%' }}>
                        <Text style={colorScheme === 'dark' ? darkStyles.serieTitle : styles.serieTitle}>{detalle.name}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={colorScheme === 'dark' ? darkStyles.loadingContainer : styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#4A90E2' : '#4A90E2'} />
                  <Text style={colorScheme === 'dark' ? darkStyles.loadingText : styles.loadingText}>Cargando series...</Text>
                  <Text style={colorScheme === 'dark' ? darkStyles.loadingText : styles.loadingText}>Por favor, espere un momento</Text>
                </View>
              )}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', textAlign: 'center' }}>
            {
              value !== 'Grupos' &&
              <TouchableOpacity style={colorScheme === 'dark' ? darkStyles.editarGrupoBoton : styles.editarGrupoBoton} onPress={() => editarGrupo(value)}>
                <Text style={colorScheme === 'dark' ? darkStyles.editarGrupoTexto : styles.editarGrupoTexto}>Editar Grupo: {value}</Text>
              </TouchableOpacity>
            }
            
            {
              value !== 'Grupos' &&
              <TouchableOpacity style={colorScheme === 'dark' ? darkStyles.editarGrupoBoton : styles.editarGrupoBoton} onPress={() => verCalendario(value)}>
                <Text style={colorScheme === 'dark' ? darkStyles.editarGrupoTexto : styles.editarGrupoTexto}>Calendario</Text>
              </TouchableOpacity>
            }

            {
              value !== 'Grupos' &&
              <TouchableOpacity style={colorScheme === 'dark' ? darkStyles.editarGrupoBoton : styles.editarGrupoBoton} onPress={() => estadisticas(user.id)}>
                <Text style={colorScheme === 'dark' ? darkStyles.editarGrupoTexto : styles.editarGrupoTexto}>Estadisticas</Text>
              </TouchableOpacity>
            }

          </View>

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default HomeScreen;

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
    //elevation: 5,
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
    padding: 5,
    borderColor: '#4A90E2',
    borderWidth: 1,
  },
  buttonText: {
    color: '#3A7AC2',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 5,
  },
  recommendButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  recommendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 20,
    textAlign: 'center',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  poster: {
    height: windowHeight * 0.20,
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
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    width: '90%',
    flexDirection: 'column',
    marginTop: '2%',
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
    padding: '2%',
    margin: '2%',
    alignItems: 'center',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: '0.5%' },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    //elevation: '1.25%',
  },
  editarGrupoTexto: {
    color: 'white',
  }, 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
    marginTop: '10%',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
  },
  dropdownIcon: {
    paddingRight: '3%',
    width: 30,
    height: 30,
    resizeMode: 'contain', 
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filterDropdown: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemTextStyle: {
    fontSize: 16,
    textAlign: 'left',
  },
  dropdownContainerStyle: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '40%',
  },
});

export const darkStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#121212', // Changed to dark background
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
    backgroundColor: '#1E1E1E', // Changed to dark background
    alignItems: 'center',
    marginRight: '1%',
    marginLeft: '1%',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    //elevation: 5,
  },
  initials: {
    fontSize: 28,
    color: '#FFFFFF', // Changed to white for better contrast
    fontWeight: 'bold',
  },
  buttonGroup: {
    height: '100%',
    flexDirection: 'row',
    backgroundColor: '#2C2C2C', // Changed to dark background
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 4,
    padding: 5,
    borderColor: '#4A90E2',
    borderWidth: 1,
  },
  buttonText: {
    color: '#FFFFFF', // Changed to white for better contrast
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 5,
  },
  recommendButton: {
    backgroundColor: '#4A90E2',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  recommendButtonText: {
    color: '#FFFFFF', // Changed to white for better contrast
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownIcon: {
    color: '#4A90E2',
    fontSize: 18,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444', // Changed to darker color
  },
  itemText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF', // Changed to white for better contrast
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
    color: '#FFFFFF', // Changed to white for better visibility
  },
  selectedTextStyle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#FFFFFF', // Changed to white for better visibility
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  poster: {
    height: windowHeight * 0.20,
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
    borderColor: '#444', // Changed to darker color
    padding: '4%',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#2C2C2C', // Changed to dark background
    color: '#FFFFFF', // Changed to white for better contrast
  },
  searchContainer: {
    width: '90%',
    flexDirection: 'column',
    marginTop: '2%',
  },
  flatList: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444', // Changed to darker color
    backgroundColor: '#1E1E1E', // Changed to dark background
  },
  textoBuscadas: {
    margin: '5%',
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF', // Changed to white for better contrast
  },
  editarGrupoBoton: {
    backgroundColor: '#4A90E2',
    padding: '3%',
    margin: '1%',
    alignItems: 'center',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: '0.5%' },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    //elevation: '1.25%',
  },
  editarGrupoTexto: {
    color: 'white',
  }, 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E', // Changed to dark background
    marginTop: '10%',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF', // Changed to white for better contrast
    marginTop: 10,
  },
  dropdownIcon: {
    paddingRight: '3%',
    width: 30,
    height: 30,
    resizeMode: 'contain', 
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    backgroundColor: '#2C2C2C', // Changed to dark background
    borderRadius: 20,
    padding: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: '#4A90E2', // Added background color for better visibility
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    color: '#FFFFFF', // Changed to white for better contrast
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  filterDropdown: {
    backgroundColor: '#2C2C2C', // Changed to dark background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444', // Changed to darker color
  },
  itemTextStyle: {
    fontSize: 16,
    textAlign: 'left',
    color: '#FFFFFF', // Changed to white for better contrast
  },
  dropdownContainerStyle: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444', // Changed to darker color
    width: '40%',
    backgroundColor: '#1E1E1E', // Changed to dark background for better readability
  },
});
