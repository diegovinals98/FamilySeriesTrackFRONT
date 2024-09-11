import React, { useState } from 'react';
import logoFST from '../assets/logoFST.png';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../userContext.js'; // Importa el hook useUser
import { Alert, SafeAreaView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const LogInScreen = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useUser();

  // Obtener Device ID
  const getDeviceId = async () => {
    let deviceId;
    if (Platform.OS === 'android') {
      deviceId = await Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }
    return deviceId;
  };

  // Manejo del login
  async function handleLogin() {
    // Generar el hash de la contraseña ingresada usando expo-crypto
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA512,
      password
    );

    try {
      let response = await fetch('https://apitfg.lapspartbox.com/login2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: username,
          contraseña: hashedPassword, // Usar el hashedPassword aquí
        }),
      });

      let json = await response.json();
      const storedHashedPassword = json.hashPassword;

      if (storedHashedPassword === hashedPassword) {
        // Establecer el usuario en el contexto
        setUser({
          id: json.usuario.Id,
          nombre: json.usuario.Nombre,
          apellidos: json.usuario.Apellidos,
          usuario: json.usuario.Usuario,
          contraseña: json.usuario.Contraseña,
        });

        // Obtener Device ID y guardarlo
        const deviceId = await getDeviceId();
        try {
          await fetch('https://apitfg.lapspartbox.com/insert-device-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: json.usuario.Id, deviceId }),
          });

          // Navegar a la pantalla principal
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        } catch (error) {
          console.error('Error al insertar el Device ID y User ID:', error);
        }
      } else {
        Alert.alert('Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'Error al conectarse al servidor.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <Image source={logoFST} style={styles.logo} />
            <Text style={styles.title}>Iniciar Sesión</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de Usuario"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
              clearButtonMode="while-editing"
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.text}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonOutline]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.text, styles.buttonOutlineText]}>Volver</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#222',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    display: 'flex',
    width: '80%',
    height: '5%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#005f99',
    borderRadius: 10,
    margin: 10,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#005f99',
    display: 'flex',
    width: '80%',
    height: '5%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    margin: 10,
  },
  buttonOutlineText: {
    color: '#005f99',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'black',
  },
  logo: {
    width: windowHeight * 0.3,
    height: windowHeight * 0.3,
  },
});

export default LogInScreen;
