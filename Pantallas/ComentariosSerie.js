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
  Platform
} from 'react-native';

// Importaciones de React Navigation
import { useNavigation, useRoute } from '@react-navigation/native';
import { sendPushNotification } from '../Pantallas/notificaciones';

// Importación del contexto de usuario
import { useUser } from '../userContext.js';

// Importaciones de Expo
import { StatusBar } from 'expo-status-bar';

// Importaciones de estilos y componentes personalizados
import { globalStyles } from '../estilosGlobales.js';

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
    const { user } = useUser();
    const [nombreGrupo,setNombregrupo ] = useState(route.params.NombreGrupo)
    const [idSerie, setIdSerie ] = useState(route.params.idSerie)
    const [nombreSerie, setNombreSerie ] = useState(route.params.nombreSerie)
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
        const response = await fetch('https://apitfg.lapspartbox.com/miembros-grupo/' + nombreGrupo, {
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
    
      const url = `https://apitfg.lapspartbox.com/anadir_comentario_a_serie`;
    
      // Datos que se enviarán al servidor
      const datosAEnviar = {
        idUsuario: userId,
        idGrupo: idGrupo,
        idSerie: idSerie,
        comentario: comentarioaEnviar,
        respuestaA: comentarioAResponder, // Añadimos el comentario padre si existe
      };
      
      // Intentamos enviar el comentario al servidor
      try {
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosAEnviar), // Datos que se envían al servidor
        });
    
        // Verificamos si la respuesta del servidor es exitosa
        if (!response.ok) {
          throw new Error('Error al enviar el comentario');
        }
        console.log("Miembros del grupo: ", miembrosGrupo);
        // Enviamos notificaciones a los miembros del grupo
        for (const miembro of miembrosGrupo) {
          console.log('Miembro del grupo: ' + miembro.Nombre + " con id: " + miembro.id);
          if (miembro.id !== userId) {
            try {
              // Obtenemos el token del miembro para enviar la notificación
              const response = await fetch(`https://apitfg.lapspartbox.com/obtener-token/${miembro.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
              });
  
              if (!response.ok) {
                throw new Error('Error al obtener el token del miembro');
              }
              const data = await response.json();
              const token = data.token;
              
              // Enviamos la notificación push
              sendPushNotification(token, 'Nuevo Comentario!', user.nombre + ': ' + comentarioaEnviar, nombreSerie + " en " + nombreGrupo, true);
            } catch (error) {
              console.error(`Error al obtener el token del miembro ${miembro.id}:`, error);
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
            const responseGrupo = await fetch(`https://apitfg.lapspartbox.com/grupo_por_nombre/${nombreGrupo}`);
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
            const responseComentarios = await fetch(`https://apitfg.lapspartbox.com/comentarios_por_grupo_serie/${dataGrupo.idGrupo}/${idSerie}`);
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
      
        obtenerYcargarDatos();
        const intervalId = setInterval(obtenerYcargarDatos, 5000);
      
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          
            <View style={styles.container}>
              <Text style={styles.title}>{nombreSerie}</Text>
              {/* ScrollView para los comentarios */}
              <ScrollView 
              ref={scrollViewRef}
              keyboardDismissMode= 'on-drag' 
              keyboardShouldPersistTaps= 'never' 
              
              style={styles.scrollView}>
              {comentarios.map((comentario, index) => (
                <View key={index} style={comentario.idUsuario === user.id ? styles.comentarioDerecha : styles.comentarioIzquierda}>
                  <Text style={[styles.autor, comentario.idUsuario === user.id ? styles.autorDerecha : styles.autorIzquierda]}>{comentario.nombreCompleto}</Text>
                  <Text style={[
                    styles.comentariotexto,
                    comentario.idUsuario === user.id ? styles.comentariotextoDerecha : styles.comentariotextoIzquierda
                  ]}>
                    {comentario.comentario}
                  </Text>
                  <Text style={[
                    styles.fecha,
                    comentario.idUsuario === user.id ? styles.fechaDerecha : styles.fechaIzquierda
                  ]}>
                    {moment(comentario.fechaHora).format('dddd D [de] MMMM, HH:mm')}
                  </Text>
                  
                  {/* Botón para responder 
                  <TouchableOpacity onPress={() => seleccionarComentarioAResponder(comentario.id)}> 
                    <Text style={styles.responderText}>Responder</Text>
                  </TouchableOpacity>
                  *
                  }

                  {/* Si el comentario tiene respuestas */}
                  {comentario.respuestas && comentario.respuestas.length > 0 && (
                    <View style={styles.respuestasContainer}>
                      {comentario.respuestas.map((respuesta, i) => (
                        <View key={i} style={styles.comentarioRespuesta}>
                          <Text>{respuesta.comentario}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            
                </ScrollView>
              {/* Área para introducir comentarios */}
              <View style={styles.commentBox}>
                <View style={styles.inputRow}>
                    <TextInput
                    style={styles.input}
                    onChangeText={newText => setComentarioaEnviar(newText)}
                    autoCapitalize="sentences"
                    placeholder="Escribe un comentario"
                    value={comentarioaEnviar} 
                    multiline={true} 
                    numberOfLines={1} // Número inicial de líneas
                    />
                    <TouchableOpacity style={styles.button} onPress={() => enviarComentario(user.id)}>
                    <Text style={styles.buttonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>
                </View>

            </View>
         
        </KeyboardAvoidingView>
    );
};
    
// Estilos del componente
const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    backgroundColor: 'white',
    paddingVertical: '4%',
    paddingHorizontal: '5%',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'black',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: '4%',
    paddingTop: '3%',
    paddingBottom: '3%',
  },
  commentBox: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
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
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: '4%',
    paddingVertical: '3%',
    marginRight: '3%',
    fontSize: 16,
    backgroundColor: '#F8F8F8',
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
    fontSize: 16,
  },
  comentarioDerecha: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderRadius: 15,
    padding: '3%',
    maxWidth: '100%',
    shadowColor: "#000",
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: '3%',
    maxWidth: '80%',
    shadowColor: "#000",
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
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: '1%',
  },
  autorIzquierda: {
    textAlign: 'left',
    fontWeight: 'bold',
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: '1%',
  },
  fecha: {
    fontSize: 11,
    color: '#888',
    marginTop: '1%',
    alignSelf: 'flex-end',
  },
  fechaDerecha:{
    fontSize: 11,
    color: '#888',
    marginTop: '1%',
    alignSelf: 'flex-end',
  },
  fechaIzquierda:{
    fontSize: 11,
    color: '#888',
    marginTop: '1%',
    alignSelf: 'flex-start',
  },
  comentarioRespuesta: {
    textAlign: 'right',
    backgroundColor: 'red',
  },

  comentariotextoDerecha: {
    textAlign: 'right',
    ontSize: 16,
    color: '#333',
    marginBottom: '2%',
  },
  comentariotextoIzquierda: {
    textAlign: 'left',
    ontSize: 16,
    color: '#333',
    marginBottom: '2%',
  },
  
});

export default ComentariosSerie;
