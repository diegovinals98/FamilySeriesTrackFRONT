import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { sendPushNotification } from './notificaciones.js';

const windowHeight = Dimensions.get('window').height;

const AnadirGrupo = () => {
  const navigation = useNavigation();
  const [nombreGrupo, setnombreGrupo] = useState('');
  const [inputsUsuarios, setInputsUsuarios] = useState([{ key: 0, value: '' }]);
  const { user } = useUser();
  let colorScheme = useColorScheme();
  
  const styles = colorScheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    if (user?.nombre) {
      setInputsUsuarios([{ key: 0, value: user.usuario }]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('---------------------------------------- AÑADIR GRUPO ----------------------------------------');
      return () => {
        console.log('Pantalla va a perder foco...');
      };
    }, [])
  );

  const agregarInputUsuario = () => {
    if (inputsUsuarios.length < 6) {
      const nuevoInput = { key: inputsUsuarios.length, value: '' };
      setInputsUsuarios([...inputsUsuarios, nuevoInput]);
    } else {
      alert('No puedes añadir más de 5 usuarios.');
    }
  };

  const obtenerTokensUsuario = async (userId) => {
    try {
      const response = await fetch(`${global.API}/obtener-token/${userId}`);
      if (!response.ok) {
        throw new Error('No se pudieron obtener los tokens');
      }
      const data = await response.json();
      return data.tokens;
    } catch (error) {
      console.error(`Error al obtener tokens para el usuario ${userId}:`, error);
      return [];
    }
  };



  const actualizarUsuario = (index, text) => {
    const nuevosInputs = inputsUsuarios.map((input, i) => {
      if (i === index) {
        return { ...input, value: text };
      }
      return input;
    });
    setInputsUsuarios(nuevosInputs);
  };

  const agregarDatos = async () => {
    if (!nombreGrupo) {
      alert('No se puede añadir un grupo sin nombre');
      return;
    }

    const body = {
      nombreGrupo: nombreGrupo,
      nombresUsuarios: inputsUsuarios.map(input => input.value),
      admin: user.id,
    };

    try {
      const response = await fetch(`${global.API}/crear-grupo-y-asociar-usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.message.includes('El grupo ya existe')) {
        alert('El grupo con nombre ' + nombreGrupo + ' ya existe');
      }

      if (data.detalles && data.detalles.length > 0) {
        data.detalles.forEach(detalle => {
          if (detalle.includes('no existe.')) {
            alert(detalle + ' No se ha podido añadir, pero se ha creado el grupo');
          }
        });
      }
      alert('Datos del grupo actualizados correctamente.');
      
      console.log("Usuarios a enviar notificaciones: ", inputsUsuarios); // de aqui solo tengo el value
      // tengo que obtener el id de usuario de cada uno de estos valores
      // y luego obtener el token de cada uno de esos ids
      // y luego enviar la notificacion push a cada uno de esos tokens
      // Función para obtener el ID de usuario a partir del nombre de usuario
      const obtenerIdUsuario = async (nombreUsuario) => {
        try {
          const response = await fetch(`${global.API}/usuario/${nombreUsuario}`);
          if (!response.ok) {
            throw new Error('Usuario no encontrado');
          }
          const userData = await response.json();
          return userData.Id; // Asumiendo que el ID del usuario se llama 'Id' en la respuesta
        } catch (error) {
          console.error(`Error al obtener ID para el usuario ${nombreUsuario}:`, error);
          return null;
        }
      };

      // Obtener los IDs de los usuarios
      const userIds = await Promise.all(
        inputsUsuarios.map(async (input) => {
          const userId = await obtenerIdUsuario(input.value);
          return userId;
        })
      );

      // Filtrar los IDs nulos (usuarios no encontrados)
      const validUserIds = userIds.filter(id => id !== null);

      console.log("IDs de usuarios obtenidos:", validUserIds);
      // Función para obtener los tokens de un usuario
      

      // Obtener todos los tokens para cada usuario válido
      for (const userId of validUserIds) {
        const tokens = await obtenerTokensUsuario(userId);
        console.log(`Tokens obtenidos para el usuario ${userId}:`, tokens);
        
        // Enviar notificación a cada token del usuario
        tokens.forEach(token => {
          if (token) {
            sendPushNotification(token, 'Grupo Nuevo!', `${user.nombre} te ha añadido al grupo: ${nombreGrupo}`);
          }
        });
      }
     
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error al agregar datos a la BBDD:', error);
      alert('Error al agregar datos.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.titulo}>Crear Grupo</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre del Grupo</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => setnombreGrupo(text)}
              placeholder="Nombre del grupo"
              placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
            />
          </View>

          {inputsUsuarios.map((input, index) => (
            <View key={input.key} style={styles.inputGroup}>
              <Text style={styles.label}>Usuario {index + 1}</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => actualizarUsuario(index, text)}
                placeholder="Usuario a añadir"
                autoCapitalize="none"
                value={input.value}
                placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
              />
            </View>
          ))}

          <View style={styles.usuarios}>
            <TouchableOpacity onPress={agregarInputUsuario} style={styles.botonUsuario}>
              <Text style={styles.textoBoton}>Añadir Usuario</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={agregarDatos} style={styles.botonAgregar}>
              <Text style={styles.textoBoton}>Crear Grupo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const lightStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#005f99',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f99',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  usuarios: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  botonUsuario: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregar: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

const darkStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#121212',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4da6ff',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4da6ff',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#333',
    color: '#fff',
  },
  usuarios: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  botonUsuario: {
    flex: 1,
    backgroundColor: '#0056b3',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregar: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0056b3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AnadirGrupo;
