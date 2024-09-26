import React, { useState } from "react";
import { globalStyles } from '../estilosGlobales.js';
import logoFST from '../assets/logoFST.png';
import { useUser } from '../userContext.js'; // Importa el hook useUser
import * as Crypto from 'expo-crypto';
import { SafeAreaView } from "react-native";

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Componente SignUp para el registro de usuarios
const SignUp = ({ navigation }) => {
  const [nombreUsuario, setnombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { setUser } = useUser();

  const volver = () => {
    navigation.goBack();
  };

  function generarIdUnico() {
    return Math.floor(Math.random() * 9999999) + 1;
  }

  function validarContraseña(contraseña) {
    const longitudValida = contraseña.length >= 8; 
    const tieneMayuscula = /[A-Z]/.test(contraseña);
    const tieneNumero = /[0-9]/.test(contraseña);
    return longitudValida && tieneMayuscula && tieneNumero;
  }

  const handleSignUp = async () => {
    if (password !== password2) {
      alert('Contraseñas no coinciden');
    } else if (!validarContraseña(password)) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula y un número');
    } else {
      try {
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA512,
          password
        );
        const usuario = {
          Id: generarIdUnico(),
          Nombre: nombre,
          Apellidos: apellidos,
          Usuario: nombreUsuario,
          Contraseña: hash
        };

        let response = await fetch('https://backendapi.familyseriestrack.com/usuario', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(usuario)
        });

        let respuesta = await response.json();
        if (respuesta.success == 1) {
          setUser({
            id: usuario.Id,
            nombre: usuario.Nombre,
            apellidos: usuario.Apellidos,
            usuario: usuario.Usuario,
            contraseña: usuario.Contraseña,
          });
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } else {
          Alert.alert('Error', respuesta.message);
        }
      } catch (error) {
        console.error('Error al registrar al usuario:', error);
        Alert.alert('Error al registrar al usuario');
      }
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={ "padding"} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 200}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Image source={logoFST} style={styles.logo} />
          <Text style={styles.title}>Crear Cuenta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            placeholderTextColor="#666"
            onChangeText={setNombre}
            autoCapitalize="words"
            autoComplete="given-name"
          />

          <TextInput
            style={styles.input}
            placeholder="Apellidos"
            placeholderTextColor="#666"
            onChangeText={setApellidos}
            autoCapitalize="words"
            autoComplete="family-name"
          />

          <TextInput
            style={styles.input}
            placeholder="Nombre de Usuario"
            placeholderTextColor="#666"
            onChangeText={setnombreUsuario}
            autoCapitalize="none"
            autoComplete="username"
          />
      
          <TextInput
            style={styles.input}
            onChangeText={setPassword}
            placeholder="Contraseña"
            keyboardType="default"
            secureTextEntry={true}
            autoCapitalize="none"
            placeholderTextColor={'#cacaca'}
          />

          <TextInput
            style={styles.input}
            onChangeText={setPassword2}
            placeholder="Repite la contraseña"
            keyboardType="default"
            secureTextEntry={true}
            autoCapitalize="none"
            placeholderTextColor={'#cacaca'}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <TouchableOpacity style={globalStyles.button} onPress={handleSignUp}>
            <Text style={globalStyles.buttonText}>Crear Cuenta</Text>
          </TouchableOpacity>
     
          <TouchableOpacity style={[globalStyles.button, globalStyles.buttonOutline]} onPress={volver}>
            <Text style={globalStyles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Fondo claro para accesibilidad
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ddd', 
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#222',
    marginBottom: 30,
  },
  logo: {
    width: windowHeight * 0.3,
    height: windowHeight * 0.3,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    width: '80%',
  },
});
