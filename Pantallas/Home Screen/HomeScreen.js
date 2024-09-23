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
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../userContext.js';
import { globalStyles } from '../../estilosGlobales.js';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { sendPushNotification } from '../notificaciones.js';
import groupIcon from '../../assets/people-group-solid.svg';
// homeScreenStyles.js




const windowHeight = Dimensions.get('window').height;

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
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
  const [expoPushToken, setExpoPushToken] = useState('');

  const opcionesFiltro = [
    { label: 'Todas', value: 'Todas' },
    { label: 'Favoritas', value: 'Favoritas' },
    { label: 'Viendo', value: 'Viendo' },
    { label: 'Acabadas', value: 'Acabadas' },
    { label: 'Pendientes', value: 'Pendientes' }
  ];

  useFocusEffect(
    React.useCallback(() => {
      if (!grupoInicialSeleccionado) {
        llamarAGrupos();
      }
    }, [grupoInicialSeleccionado])
  );

   // Efecto para manejar la navegación cuando se recibe una notificación
   useEffect(() => {
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
    if (idelegido) {
      obtenerSeries();
    }
  }, [idelegido, filtro]);

  useEffect(() => {
    llamarAGrupos();
    obtenerSeries();
    
  }, [refrescar]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    //sendPushNotification(expoPushToken, 'Titulo de la notificacion', 'Cuerpo de la notificacion');
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefrescando(true);
    resetearBusqueda();
    setRefrescar(prev => !prev);
    obtenerSeries();
    setRefrescando(false);
  }, [value, idelegido, filtro]);

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

  function handleRegistrationError(errorMessage) {
    alert(errorMessage);
    throw new Error(errorMessage);
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
        setExpoPushToken(pushTokenString);
        console.log('Para el usuario :', user.id);
        // TODO: Guardar el token en el servidor, junto con el ID del usuario
        // Añadir en el backend en la tabla de tokens el token, el ID del usuario
        try {
          const response = await fetch('https://apitfg.lapspartbox.com/registrar-token-notificacion', {
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
        let seriesFiltradas = seriesDetalles;
        if (filtro !== 'Todas') {
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
              blurRadius={10}
              containerStyle={{ backgroundColor: '#f0f0f0', borderRadius: 15, borderWidth: 1, borderColor: '#6666ff' }}
              iconStyle={styles.iconStyle}
              data={TodosGrupos}
              labelField="Nombre_grupo"
              valueField={value}
              placeholder={value}
              value={value}
              maxHeight={500}
              itemTextStyle={{ textAlign: 'left', }}
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
                <>
                  {/* <Image source={groupIcon} style={styles.dropdownIcon} alt='Grupo'/> */}
                  <Text style={styles.buttonText}>{value}</Text>
                </>
              )}
            />

            <TouchableOpacity style={styles.circle} onPress={() => anadirGrupo()}>
              <Text style={styles.initials}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={query}
                onChangeText={handleTextChange}
                placeholder="Buscar series..."
                style={[styles.searchInput, { flex: 3, marginRight: 10 , alignSelf: 'center'}]}
              />
              <Dropdown
                style={[styles.filterDropdown, { width: '30%', flex: 1 }]}
                data={opcionesFiltro}
                labelField="label"
                valueField="value"
                placeholder="Filtrar"
                value={filtro}
                onChange={item => {
                  setFiltro(item.value);
                }}
                selectedTextStyle={styles.selectedTextStyle}
                itemTextStyle={styles.itemTextStyle}
                containerStyle={styles.dropdownContainerStyle}
                activeColor="#E8F0FE"
                iconStyle={styles.iconStyle}
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

            {
              // value !== 'Grupos' &&
              // <TouchableOpacity style={styles.editarGrupoBoton} onPress={() => {
              //   sendPushNotification(expoPushToken, "Notificación", "Cuerpo de la notificación");
              //   try {
              //     response = fetch('https://apitfg.lapspartbox.com/enviar-soporte', {
              //       method: 'POST',
              //       headers: {
              //         'Content-Type': 'application/json',
              //       },
              //       body: JSON.stringify({
              //         nombre: 'Nombre del usuario',
              //         email: 'email@example.com',
              //         mensaje: expoPushToken,
              //       }),
              //     });
              //   } catch (error) {
              //     console.error(error);
              //   }
              //   //sendPushNotification("ExponentPushToken[jek2eWF_QadVeox9Jg-Glul]", "Notificación", "Cuerpo de la notificación");
              //   //sendPushNotification("ExponentPushToken[ner7Z2Ft7BjiUBMiyjZ2bz]", "Notificación", "Cuerpo de la notificación");
        
              // }}>
              //   <Text style={styles.editarGrupoTexto}>Notificar</Text>
              // </TouchableOpacity>
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
    color: '#3A7AC2',
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
    elevation: '1.25%',
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
  }
});
