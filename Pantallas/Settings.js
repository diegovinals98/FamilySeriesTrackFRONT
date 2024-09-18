import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Button,
  Alert,
  Dimensions
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../estilosGlobales.js';
import { useUser } from '../userContext.js';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';

const windowHeight = Dimensions.get('window').height;

const Settings = () => {

  const navigation = useNavigation();
  const { user, setUser } = useUser();
  const [errorMessage, setErrorMessage] = useState('');

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [apellidos, setApellidos] = useState(user?.apellidos || '');
  const [usuario, setUsuario] = useState(user?.usuario || '');
  const [contrasena, setContrasena] = useState('');
  const [contrasena2, setContrasena2] = useState('');
  const iniciales = user?.nombre ? `${user?.nombre.charAt(0)}${user?.apellidos.charAt(0)}` : '';

  function validarContraseña(contraseña) {
    const longitudValida = contraseña.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(contraseña);
    const tieneNumero = /[0-9]/.test(contraseña);
  
    return longitudValida && tieneMayuscula && tieneNumero;
  }
  
  async function updateUser(userId, newNombre, newApellidos, newUsuario, newContrasena) {
    if (contrasena !== contrasena2) {
      alert('Las contraseñas no coinciden');
    } else if (!validarContraseña(contrasena)) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula y un número');
      return;
    } else {
      const newContrasenaHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, contrasena);
      try {
        let response = await fetch(`https://apitfg.lapspartbox.com/usuario/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newNombre,
            newApellidos,
            newUsuario,
            newContrasena: newContrasenaHash
          })
        });
    
        if (response.ok) {
          setUser({ id: userId, nombre: newNombre, apellidos: newApellidos, usuario: newUsuario });
          alert('Datos del usuario actualizados correctamente.');
          navigation.goBack();
        } else {
          alert('Error al actualizar usuario.');
        }
      } catch (error) {
        alert('Error al actualizar usuario.');
      }
    }
  }

  async function eliminarCuenta(idUser) {
    Alert.alert(
      '¿Estás seguro de que quieres eliminar la cuenta?',
      'Se borrará toda la información',
      [
        {
          text: 'Sí',
          onPress: async () => {
            try {
              const response = await fetch(`https://apitfg.lapspartbox.com/eliminar-cuenta/${idUser}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
              } else {
                alert('Error al eliminar la cuenta.');
              }
            } catch (error) {
              alert('Error al conectar con el servidor.');
            }
          },
        },
        {
          text: 'No',
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  }

  const guardarCambios = () => {
    if (nombre.trim() && apellidos.trim() && usuario.trim() && contrasena.trim()) {
      updateUser(user.id, nombre, apellidos, usuario, contrasena);
    } else {
      alert('Por favor, rellena todos los campos.');
    }
  };

  const cerrarSesion = async () => {
    try {
      let deviceId;
      if (Platform.OS === 'ios') {
        deviceId = await Application.getIosIdForVendorAsync();
      } else if (Platform.OS === 'android') {
        deviceId = await Application.getAndroidId();
      }
      console.log('Device ID: ', deviceId);
      const response = await fetch('https://apitfg.lapspartbox.com/delete-device-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, deviceId }),
      });

      // Verificar si la respuesta es correcta
      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Error al cerrar sesión: ${errorMessage}`);
      }

      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
      alert('No se ha podido cerrar sesión');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[globalStyles.container, styles.container]}>
          <View style={styles.circle}>
            <Text style={styles.initials}>{iniciales}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput 
              style={styles.input}
              onChangeText={setNombre}
              value={nombre}
              placeholder="Nombre"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Apellidos</Text>
            <TextInput 
              style={styles.input}
              onChangeText={setApellidos}
              value={apellidos}
              placeholder="Apellidos"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de Usuario</Text>
            <TextInput 
              style={styles.input}
              onChangeText={setUsuario}
              value={usuario}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nueva Contraseña</Text>
            <TextInput 
              style={styles.input}
              onChangeText={setContrasena}
              value={contrasena}
              placeholder="Nueva Contraseña"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repite Nueva Contraseña</Text>
            <TextInput 
              style={styles.input}
              onChangeText={setContrasena2}
              value={contrasena2}
              placeholder="Repite Nueva Contraseña"
              secureTextEntry
            />
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={globalStyles.button} onPress={guardarCambios}>
            <Text style={globalStyles.buttonText}>Guardar Cambios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[globalStyles.button, globalStyles.buttonOutline]} onPress={cerrarSesion}>
            <Text style={globalStyles.buttonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          <View style={styles.eliminar}>
            <Button title='Eliminar Cuenta' color='white' onPress={() => eliminarCuenta(user.id)}></Button>  
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  eliminar: {
    backgroundColor: 'red',
    borderRadius: 10,
    width: '80%',
    margin: '2%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  circle: {
    marginBottom: '5%',
    width: windowHeight * 0.1,
    height: windowHeight * 0.1,
    borderRadius: 1000,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: windowHeight * 0.015,
    borderRadius: 10,
    marginBottom: '3%',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputGroup: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    marginBottom: '1%',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    width: '80%',
    justifyContent: 'center',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default Settings;
