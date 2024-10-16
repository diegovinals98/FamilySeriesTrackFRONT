import React, { useState } from "react";
import { globalStyles } from '../estilosGlobales.js';
import logoFST from '../assets/logoFST.png';
import { useUser } from '../userContext.js'; // Importa el hook useUser
import * as Crypto from 'expo-crypto';
import { SafeAreaView } from "react-native";
import * as Application from 'expo-application';
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
import * as AppleAuthentication from 'expo-apple-authentication';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const getDeviceId = async () => {
    let deviceId;
    if (Platform.OS === 'android') {
      deviceId = await Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }
    return deviceId;
  };

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

          const deviceId = await getDeviceId();
          try {
            await fetch('https://backendapi.familyseriestrack.com/insert-device-id', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: json.usuario.Id, deviceId }),
            });
          } catch (error) {
            console.error('Error al insertar el Device ID y User ID:', error);
          }
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

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        state: 'reset_' + Date.now()
      });

      console.log("Credenciales de Apple completas:", JSON.stringify(credential, null, 2));

      // Decodificar el token de identidad
      const [header, payload] = credential.identityToken.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      console.log("Token decodificado:", JSON.stringify(decodedPayload, null, 2));

      // Generar un ID único para el usuario
      const userId = generarIdUnico();

      // Crear un objeto de usuario con los datos de Apple
      const usuario = {
        Id: userId,
        Nombre: credential.fullName?.givenName || '',
        Apellidos: credential.fullName?.familyName || '',
        Usuario: credential.email || `apple_${credential.user}`,
        Contraseña: credential.identityToken, // Usamos el token como "contraseña"
      };
      
      console.log("datos de usuario de Apple", JSON.stringify(usuario, null, 2));
      
      // Enviar los datos a tu backend
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

        const deviceId = await getDeviceId();
        try {
          await fetch('https://backendapi.familyseriestrack.com/insert-device-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: usuario.Id, deviceId }),
          });
        } catch (error) {
          console.error('Error al insertar el Device ID y User ID:', error);
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        Alert.alert('Error', respuesta.message);
      }
    } catch (e) {
      if (e.code === 'ERR_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
        console.error('Error en el inicio de sesión con Apple:', e);
        Alert.alert('Error', 'No se pudo iniciar sesión con Apple');
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


          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={5}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          )}
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
  appleButton: {
    width: '80%',
    height: 44,
    marginTop: 10,
  },
  googleButton: {
    width: '80%',
    backgroundColor: '#4285F4',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
