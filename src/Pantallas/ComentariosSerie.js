// Importaciones de React, React Native y otras librerías.
import React, { useEffect, useRef, useState } from 'react';

// Importaciones de componentes y APIs de React Native
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  TextInput, 
  FlatList,
  Keyboard,
  Button,
  Alert,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ImageBackground
} from 'react-native';

// Importaciones de React Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
import { sendPushNotification } from './notificaciones';

// Importación del contexto de usuario
import { useUser } from '../userContext.js';

// Importaciones de Expo
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Importaciones de estilos y componentes personalizados
import { globalStyles } from '../../estilosGlobales.js';

// Importaciones de componentes de terceros
import { SelectCountry, Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { head } from 'lodash';

// Importación y configuración de moment para manejar fechas
import moment from 'moment';
import 'moment/locale/es';  
moment.locale('es');  // Configura globalmente moment en español

// Importación de componentes de gesture handler
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

// Obtiene las dimensiones de la ventana del dispositivo.
const windowHeigh = Dimensions.get('window').height;


// TODO Implementar un sistema de mensajería en tiempo real, similar a Whatsapp, para que los usuarios puedan comunicarse dentro de la plataforma.
const ComentariosSerie = () => {
    console.log('Iniciando componente ComentariosSerie');
    // Referencias y estados
    const scrollViewRef = useRef();
    const route = useRoute()
    const navigation = useNavigation();
    const { user } = useUser();
    const [nombreGrupo,setNombregrupo ] = useState(route.params.NombreGrupo)
    const [idSerie, setIdSerie ] = useState(route.params.idSerie)
    const [nombreSerie, setNombreSerie ] = useState(route.params.nombreSerie)
    const [posterSerie, setPosterSerie] = useState(route.params.posterSerie);
    console.log('Poster de la serie:', posterSerie);
    const [comentarioaEnviar, setComentarioaEnviar] = useState()
    const [idGrupo, setIdGrupo] = useState()
    const [comentarios, setComentarios] = useState([]);
    const [cargandoComentarios, setCargandoComentarios] = useState(false);
    const [parar, setParar] = useState(false);
    const [refrescar, setRefrescar] = useState(false);
    const [cambio, setCambio] = useState(false);
    const comentariosRef = useRef(comentarios);
    const [comentarioAResponder, setComentarioAResponder] = useState(null);
    const [miembrosGrupo, setMiembrosGrupo] = useState([]);
    const [visualizaciones, setVisualizaciones] = useState([]);
    let colorScheme = useColorScheme();
    
  
   
    

    // Actualiza la referencia de comentarios cuando cambia el estado
    useEffect(() => {
      console.log('Actualizando referencia de comentarios');
      comentariosRef.current = comentarios;
    }, [comentarios]);
      
    // Función que permite seleccionar un comentario para responder
    const seleccionarComentarioAResponder = (idComentario) => {
      console.log('Seleccionando comentario para responder');
      setComentarioAResponder(idComentario);
    };

  

    const obtenerMiembrosGrupo = async () => {
      console.log('Obteniendo miembros del grupo');
      try {
        const response = await fetch(`${global.API}/miembros-grupo/${nombreGrupo}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        setMiembrosGrupo(data.members);
      } catch (error) {
        console.error('Error al obtener miembros del grupo: ', error);
      }
    };

    // Función para enviar un comentario
    async function enviarComentario(userId) {
      console.log('Enviando comentario');
      if (!comentarioaEnviar) return;
    
      const url = `${global.API}/anadir_comentario_a_serie`;
    
      // Datos que se enviarán al servidor
      const datosAEnviar = {
        tipo: 'comentario',
        idUsuario: userId,
        idGrupo: idGrupo,
        nombreGrupo: nombreGrupo,
        nombreSerie: nombreSerie,
        idSerie: idSerie,
        comentario: comentarioaEnviar,
        respuestaA: comentarioAResponder,
      };
      
      try {
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: JSON.stringify(datosAEnviar),
        });
    
        if (!response.ok) {
          throw new Error('Error al enviar el comentario');
        }
        console.log("Miembros del grupo: ", miembrosGrupo);
        // Enviamos notificaciones a los miembros del grupo
        for (const miembro of miembrosGrupo) {
          console.log('Miembro del grupo: ' + miembro.Nombre + " con id: " + miembro.id);
          if (miembro.id !== userId) {
            try {
              // Obtenemos los tokens del miembro para enviar la notificación
              const response = await fetch(`${global.API}/obtener-token/${miembro.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
  
              if (!response.ok) {
                throw new Error('Error al obtener los tokens del miembro');
              }
              const data = await response.json();
              const tokens = data.tokens;
              
              // Enviamos la notificación push a todos los tokens
              tokens.forEach(token => {
                sendPushNotification(token, 'Nuevo Comentario!', user.nombre + ' - ' + comentarioaEnviar, nombreGrupo + ": " + nombreSerie, datosAEnviar);
              });
            } catch (error) {
              console.error(`Error al obtener los tokens del miembro ${miembro.id}:`, error);
            }
          }
        }
    
        // Limpiamos el estado después de enviar el comentario
        setComentarioaEnviar('');
        setComentarioAResponder(null); // Reseteamos el comentario padre
        setRefrescar(prev => !prev); // Actualizamos para refrescar la lista de comentarios

      } catch (error) {
        console.error('Error:', error);
      }
    }

    
    // Efecto para obtener y cargar datos
    useEffect(() => {
        console.log('Iniciando efecto para obtener y cargar datos');
        // Función para obtener el ID del grupo y cargar los datos
        const obtenerYcargarDatos = async () => {
         if (parar) return; // Detiene la ejecución si parar es true
      
          try {
            // Lógica para obtener el ID del grupo
            const responseGrupo = await fetch(`${global.API}/grupo_por_nombre/${nombreGrupo}`);
            if (!responseGrupo.ok) {
              throw new Error('Grupo no encontrado');
            }
            const dataGrupo = await responseGrupo.json();
            setIdGrupo(dataGrupo.idGrupo);
      
            // Asegúrate de que idGrupo esté definido antes de continuar
            if (!dataGrupo.idGrupo) {
              console.error('ID del Grupo no está definido');
              return;
            }
      
            // Lógica para cargar los datos con el ID del grupo obtenido
            const responseComentarios = await fetch(`${global.API}/comentarios_por_grupo_serie/${dataGrupo.idGrupo}/${idSerie}`);
            if (!responseComentarios.ok) {
              throw new Error('Respuesta de red no fue ok');
            }
            const nuevosComentarios = await responseComentarios.json();

            // Comprobar si los nuevos comentarios son diferentes a los actuales antes de actualizar
            if (JSON.stringify(comentariosRef.current) !== JSON.stringify(nuevosComentarios)) {
              setComentarios(nuevosComentarios);
              setCambio(prev => !prev);
              console.log('Los comentarios han sido actualizados');
            } else {
              console.log('Los comentarios no han cambiado');
            }
          } catch (error) {
            console.error('Error:', error);
          }
        };

        // Función para obtener las visualizaciones del grupo para esta serie
        const obtenerVisualizaciones = async () => {
          
          try {
            const responseGrupo = await fetch(`${global.API}/grupo_por_nombre/${nombreGrupo}`);
            if (!responseGrupo.ok) {
              throw new Error('Grupo no encontrado');
            }
            const dataGrupo = await responseGrupo.json();
            console.log('ID del grupo:', dataGrupo.idGrupo);
            setIdGrupo(dataGrupo.idGrupo);
            console.log('ID del grupo (seteado):', idGrupo);
      
            // Asegúrate de que idGrupo esté definido antes de continuar
            if (!dataGrupo.idGrupo) {
              console.error('ID del Grupo no está definido');
              return;
            }

            const response = await fetch(`${global.API}/visualizaciones-grupo-serie/${dataGrupo.idGrupo}/${idSerie}`);
            console.log('Respuesta de visualizaciones:', response);
            if (!response.ok) {
              throw new Error('Error al obtener las visualizaciones');
            }
            const data = await response.json();
            console.log('Visualizaciones obtenidas:', JSON.stringify(data));
            setVisualizaciones(data);
            setCambio(prev => !prev);
            console.log('Visualizaciones actualizadas:', JSON.stringify(visualizaciones));
          } catch (error) {
            console.error('Error al obtener visualizaciones:', error);
          }
        };
      
        obtenerYcargarDatos();
        obtenerVisualizaciones();
        const intervalId = setInterval(() => {
          obtenerYcargarDatos();
          obtenerVisualizaciones();
        }, 5000);
        
      
        // Función de limpieza
        return () => clearInterval(intervalId);
    }, [nombreGrupo, idSerie, parar, refrescar]);

    // Efecto para manejar el scroll cuando se muestra el teclado
    useEffect(() => {
      console.log('Configurando efecto para manejar el scroll con el teclado');
      obtenerMiembrosGrupo();
        const keyboardDidShowListener = Keyboard.addListener(
          'keyboardDidShow',
          () => scrollViewRef.current?.scrollToEnd({ animated: true })
        );
    
        // Hacer scroll al final una vez cuando el componente se monta
        scrollViewRef.current?.scrollToEnd({ animated: false });
        return () => {
          keyboardDidShowListener.remove();
        };
        
    }, []);

    // Efecto para manejar el scroll cuando cambian los comentarios
    useEffect(() => {
      console.log('Manejando scroll después de cambios en comentarios');
      const timer = setTimeout(() => {
          if (comentarios.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, 100);
    
        return () => clearTimeout(timer);
    }, [cambio, enviarComentario]);

   
    
    // Renderizado del componente
    return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles(colorScheme).keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          
            <View style={styles(colorScheme).container}>
              <Text style={styles(colorScheme).title}>{nombreSerie}</Text>
              {/* ScrollView para los comentarios */}
              <ImageBackground 
                source={{ uri: `https://image.tmdb.org/t/p/w500${posterSerie}` }} 
                style={styles(colorScheme).backgroundImage}
              >
                <ScrollView 
                  ref={scrollViewRef}
                  keyboardDismissMode= 'on-drag' 
                  keyboardShouldPersistTaps= 'never' 
                  style={styles(colorScheme).scrollView}
                >
                  {comentarios.map((comentario, index) => {
                    // Verificar si es el primer mensaje del día o si la fecha es diferente del mensaje anterior
                    const fechaActual = moment(comentario.fechaHora).format('LL');
                    const fechaAnterior = index > 0 ? moment(comentarios[index-1].fechaHora).format('LL') : null;
                    const mostrarFecha = index === 0 || fechaActual !== fechaAnterior;

                    return (
                      <View key={index}>
                        {mostrarFecha && (
                          <View style={{alignItems: 'center', marginVertical: 10, borderRadius: 20}}>
                            <Text style={{
                              color: colorScheme === 'dark' ? 'white' : '#666',
                              backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,0.3)',
                              padding: 5,
                              borderRadius: 20
                            }}>
                              {(() => {
                                const fecha = moment(comentario.fechaHora);
                                const hoy = moment();
                                const ayer = moment().subtract(1, 'days');
                                
                                if (fecha.isSame(hoy, 'day')) {
                                  return 'Hoy';
                                } else if (fecha.isSame(ayer, 'day')) {
                                  return 'Ayer';
                                } else if (fecha.isSame(hoy, 'week')) {
                                  return fecha.format('dddd');
                                } else if (fecha.isSame(hoy, 'year')) {
                                  return fecha.format('dddd, D MMM').charAt(0).toUpperCase() + fecha.format('dddd, D MMM').slice(1);
                                } else {
                                  return fecha.format('D [de] MMMM [de] YYYY');
                                }
                              })()}
                            </Text>
                          </View>
                        )}
                        
                        <View style={[
                          comentario.idUsuario === user.id ? styles(colorScheme).comentarioDerecha : styles(colorScheme).comentarioIzquierda,
                          index > 0 && comentarios[index-1].idUsuario === comentario.idUsuario ? {marginTop: -10} : null
                        ]}>
                          {(index === 0 || comentarios[index-1].idUsuario !== comentario.idUsuario) && comentario.idUsuario !== user.id && (
                            <Text style={[styles(colorScheme).autor, comentario.idUsuario === user.id ? styles(colorScheme).autorDerecha : styles(colorScheme).autorIzquierda]}>
                              {comentario.nombreCompleto}
                            </Text>
                          )}
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'bottom'}}>
                            <Text style={[
                              styles(colorScheme).comentariotexto,
                              comentario.idUsuario === user.id ? styles(colorScheme).comentariotextoDerecha : styles(colorScheme).comentariotextoIzquierda
                            ]}>
                              {comentario.comentario} 
                            </Text>
                            <Text style={[
                              styles(colorScheme).fecha,
                              styles(colorScheme).fechaDerecha
                            ]}>
                              {moment(comentario.fechaHora).format('HH:mm')}
                            </Text>
                          </View>
                        </View>
                        {visualizaciones
                          .filter(visualizacion => {
                            const fechaVisualizacion = moment(visualizacion.fecha);
                            const fechaComentarioActual = moment(comentario.fechaHora);
                            const fechaComentarioSiguiente = index < comentarios.length - 1 ? 
                              moment(comentarios[index + 1].fechaHora) : null;
                            
                            return fechaVisualizacion.isAfter(fechaComentarioActual) && 
                                   (!fechaComentarioSiguiente || fechaVisualizacion.isBefore(fechaComentarioSiguiente));
                          })
                          .map((visualizacion, index) => (
                            <View key={index} style={{alignItems: 'center', marginTop: 10, marginBottom: 10, borderRadius: 20}}>
                              <Text style={{
                                color: colorScheme === 'dark' ? 'white' : '#666',
                                backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,0.3)', 
                                padding: 5,
                                borderRadius: 20
                              }}>
                                {`${visualizacion.nombreUsuario} - Temporada ${visualizacion.temporada} Capítulo ${visualizacion.capitulo}`}
                              </Text>
                            </View>
                          ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </ImageBackground>
              {/* Área para introducir comentarios */}
              <View style={styles(colorScheme).commentBox}>
                <View style={styles(colorScheme).inputRow}>
                    <TextInput
                    style={styles(colorScheme).input}
                    onChangeText={newText => setComentarioaEnviar(newText)}
                    autoCapitalize="sentences"
                    placeholder="Escribe un comentario"
                    value={comentarioaEnviar} 
                    multiline={true} 
                    numberOfLines={1} // Número inicial de líneas
                    />
                    <TouchableOpacity style={styles(colorScheme).button} onPress={() => enviarComentario(user.id)}>
                    <Text style={styles(colorScheme).buttonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>
                </View>
 
            </View>
         
        </KeyboardAvoidingView>
    );
};
    
// Estilos del componente
const styles = (colorScheme) => StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#F0F2F5',
    marginBottom: Platform.OS === "ios" ? 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? '#121212' : '#F0F2F5',
    
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colorScheme === 'dark' ? '#4A90E2' : '#4A90E2',
    backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : 'white',
    paddingVertical: '4%',
    paddingHorizontal: '5%',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: colorScheme === 'dark' ? '#333' : 'black',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingRight: '2%',
    paddingLeft: '2%',  
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semi-transparente para mejorar la legibilidad
  },
  commentBox: {
    backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : 'white',
    borderTopWidth: 1,
    borderTopColor: colorScheme === 'dark' ? '#333' : '#E0E0E0',
    paddingVertical: '3%',
    paddingHorizontal: '5%'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333' : '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: '4%',
    paddingVertical: '3%',
    marginRight: '3%',
    fontSize: 14,
    backgroundColor: colorScheme === 'dark' ? '#2C2C2C' : '#F8F8F8',
    color: colorScheme === 'dark' ? '#E0E0E0' : '#000',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 20,
    paddingVertical: '3%',
    paddingHorizontal: '5%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  comentarioDerecha: {
    alignSelf: 'flex-end',
    backgroundColor: colorScheme === 'dark' ? 'rgba(11, 61, 145, 1)' : 'rgba(220, 248, 198, 1)',
    borderRadius: 20,
    paddingTop: '2%',
    paddingLeft: '3%',
    paddingRight: '3%',
    maxWidth: '100%',
    shadowColor: colorScheme === 'dark' ? "#FFF" : "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginBottom: '3%',
  },
  comentarioIzquierda: {
    alignSelf: 'flex-start',
    backgroundColor: colorScheme === 'dark' ? 'rgba(44, 44, 44, 1)' : 'rgba(255, 255, 255, 1)',
    borderRadius: 20,
    paddingTop: '2%',
    paddingLeft: '3%',
    paddingRight: '3%',
    maxWidth: '80%',
    shadowColor: colorScheme === 'dark' ? "#FFF" : "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
    marginBottom: '3%',
  },
  autorDerecha: {
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 15,
    color: colorScheme === 'dark' ? '#E0E0E0' : '#4A4A4A',
    marginBottom: '1%',
  },
  autorIzquierda: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 15,
    color: colorScheme === 'dark' ? '#E0E0E0' : '#4A4A4A',
    marginBottom: '1%',
  },
  fechaDerecha:{
    paddingBottom: '3%',
    fontSize: 10,
    color: colorScheme === 'dark' ? '#888' : '#888',
    marginTop: '1%',
    marginLeft: '3%',
    alignSelf: 'flex-end',
  },
  comentarioRespuesta: {
    textAlign: 'right',
    backgroundColor: colorScheme === 'dark' ? '#1E1E1E' : 'red',
  },

  comentariotextoDerecha: {
    textAlign: 'right',
    fontSize: 13,
    color: colorScheme === 'dark' ? '#E0E0E0' : '#333',
    marginBottom: '2%',
  },
  comentariotextoIzquierda: {
    textAlign: 'left',
    fontSize: 13,
    color: colorScheme === 'dark' ? '#E0E0E0' : '#333',
    marginBottom: '2%',
  },
  
});

export default ComentariosSerie;