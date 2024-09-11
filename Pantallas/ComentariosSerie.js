// Importaciones de React, React Native y otras librerías.
import React, { useEffect, useRef, useState } from 'react';


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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js'; // Importa el contexto del usuario.
import { StatusBar } from 'expo-status-bar';
import { globalStyles } from '../estilosGlobales.js'; // Importa estilos globales.
import { SelectCountry, Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { head } from 'lodash';
import moment from 'moment';
import 'moment/locale/es';  
moment.locale('es');  // Configura globalmente moment en español
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';







// Obtiene las dimensiones de la ventana del dispositivo.
const windowHeigh = Dimensions.get('window').height;

// TODO Implementar un sistema de mensajería en tiempo real, similar a Whatsapp, para que los usuarios puedan comunicarse dentro de la plataforma.
const ComentariosSerie = () => {
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
    const [comentarioAResponder, setComentarioAResponder] = useState(null); // Almacena el comentario seleccionado para responder

    useEffect(() => {
      comentariosRef.current = comentarios;
    }, [comentarios]);
      
    // Función que permite seleccionar un comentario para responder
    const seleccionarComentarioAResponder = (idComentario) => {
      setComentarioAResponder(idComentario);
      console.log("id a responder: ", idComentario);
    };

    async function enviarComentario(userId) {
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
      
      // Log para ver los datos que se van a enviar
      console.log("✅-----------------------------------------------------------------------");
      console.log("📤 Enviando datos al servidor:");
      console.log("🆔 Usuario:", datosAEnviar.idUsuario);
      console.log("🔢 Grupo:", datosAEnviar.idGrupo);
      console.log("📺 Serie:", datosAEnviar.idSerie);
      console.log("💬 Comentario:", datosAEnviar.comentario);
      console.log("↩️ Respuesta a:", datosAEnviar.respuestaA);
      console.log("✅-----------------------------------------------------------------------");
      
    
      try {
        let response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(datosAEnviar), // Datos que se envían al servidor
        });
    
        if (!response.ok) {
          throw new Error('Error al enviar el comentario');
        }
    
        setComentarioaEnviar('');
        setComentarioAResponder(null); // Reseteamos el comentario padre
        setRefrescar(prev => !prev);
      } catch (error) {
        console.error('Error:', error);
      }
    }
    

    useEffect(() => {
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
            console.log('ID del Grupo:', dataGrupo.idGrupo);
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
              console.log(nuevosComentarios);
              setCambio(prev => !prev);
              console.log('Los comentarios SI han cambiado');
            } else {
              
              console.log('Los comentarios no han cambiado, no se actualiza el estado.');
            }

            //console.log(nuevosComentarios);
            
      
          } catch (error) {
            console.error('Error:', error);
          }
        };
      
        obtenerYcargarDatos();
        const intervalId = setInterval(obtenerYcargarDatos, 5000);
        //scrollViewRef.current.scrollToEnd({ });
      
        // Opcionalmente, define una función de limpieza si es necesario realizar alguna acción cuando el componente se desmonta o antes de que el efecto se vuelva a ejecutar.
        return () => clearInterval(intervalId);
      }, [nombreGrupo, idSerie, parar, refrescar]); // Incluye parar en las dependencias para reaccionar a sus cambios


      useEffect(() => {
        // Cuando el teclado se muestra, se hace scroll al final del ScrollView
        const keyboardDidShowListener = Keyboard.addListener(
          'keyboardDidShow',
          () => scrollViewRef.current?.scrollToEnd({ animated: true })
        );
    
        // Hacer scroll al final una vez cuando el componente se monta
        scrollViewRef.current?.scrollToEnd({ animated: false });
    
        return () => {
          // Limpieza del listener cuando el componente se desmonte
          keyboardDidShowListener.remove();
        };
      }, []); // Las dependencias vacías aseguran que el efecto solo se ejecute al montar y desmontar

      useEffect(() => {
      console.log('ENTRADO EN USE EFFECT CAMBIO')
      const timer = setTimeout(() => {
          if (comentarios.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, 100); // 1000 milisegundos = 1 segundo
    
        // Limpiar el temporizador al desmontar el componente o cambiar las dependencias
        return () => clearTimeout(timer);
      }, [cambio, enviarComentario]);
    
      

      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 40}
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
                  <Text style={styles.autor}>{comentario.nombreCompleto}</Text>
                  <Text>{comentario.comentario}</Text>
                  <Text style={styles.fecha}>{moment.utc(comentario.fechaHora).format('dddd D [de] MMMM, HH:mm')}</Text>
                  
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
    
    const styles = StyleSheet.create({
      keyboardView: {
        flex: 1,
      },
      container: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-between',
      },
      title: {
        fontSize: 30,
        fontWeight: 'bold',
        backgroundColor: 'white',
        borderColor: '#4A90E2',
        borderWidth: 4,
        width: '100%',
        paddingBottom: '2%',
        paddingTop: '2%',
        textAlign: 'center',
      },
      scrollView: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 10,
      },
      commentBox: {
        width: '100%',
        padding: 10,
        height: windowHeigh * 0.12,
      },
      inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      input: {
        flex: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: windowHeigh * 0.015,
        marginRight: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
      },
      button: {
        flex: 1,
        backgroundColor: '#005f99',
        borderRadius: 10,
        padding: windowHeigh * 0.015,
        justifyContent: 'center',
        alignItems: 'center',
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
      },
      comentarioDerecha: {
        alignSelf: 'flex-end',
        backgroundColor: '#DCF8C6',
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        maxWidth: '80%',
      },
      comentarioIzquierda: {
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginVertical: 10,
        maxWidth: '80%',
      },
      autor: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
      },
      fecha: {
        fontSize: 12,
        color: '#999',
        marginTop: '1%',
      },
    });

export default ComentariosSerie;
