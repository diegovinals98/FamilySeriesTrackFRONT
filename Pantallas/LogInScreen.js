import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  Alert, 
  SafeAreaView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../userContext.js';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import logoFST from '../assets/logoFST.png';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const LogInScreen = () => {
  const navigation = useNavigation();
  const { setUser } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const getDeviceId = async () => {
    let deviceId;
    if (Platform.OS === 'android') {
      deviceId = await Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }
    return deviceId;
  };

  async function handleLogin() {
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
          contraseña: hashedPassword,
        }),
      });

      let json = await response.json();
      const storedHashedPassword = json.hashPassword;

      if (storedHashedPassword === hashedPassword) {
        setUser({
          id: json.usuario.Id,
          nombre: json.usuario.Nombre,
          apellidos: json.usuario.Apellidos,
          usuario: json.usuario.Usuario,
          contraseña: json.usuario.Contraseña,
        });

        const deviceId = await getDeviceId();
        try {
          await fetch('https://apitfg.lapspartbox.com/insert-device-id', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: json.usuario.Id, deviceId }),
          });

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

  const animateInput = (toValue) => {
    Animated.spring(animatedValue, {
      toValue,
      useNativeDriver: false,
    }).start();
  };

  const inputTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, windowHeight / 2 - 100],
  });

  const renderInput = (icon, placeholder, value, onChangeText, secureTextEntry = false) => (
    <Animated.View 
      style={[
        styles.inputGroup,
        focusedInput === placeholder && {
          position: 'absolute',
          top: 0,
          left: (windowWidth - windowWidth * 0.8) / 2,
          width: windowWidth * 0.8,
          backgroundColor: 'rgba(255,255,255,1)',
          transform: [{ translateY: inputTranslateY }],
          zIndex: 2,
        },
      ]}
    >
      <Ionicons name={icon} size={24} color={focusedInput === placeholder ? "#3b5998" : "#666"} style={styles.icon} />
      <TextInput 
        style={[styles.input, focusedInput === placeholder && { color: '#000' }]}
        onChangeText={onChangeText}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={focusedInput === placeholder ? "#999" : "#666"}
        secureTextEntry={secureTextEntry && !showPassword}
        onFocus={() => {
          setFocusedInput(placeholder);
          setIsInputFocused(true);
          animateInput(1);
        }}
        onBlur={() => {
          setFocusedInput(null);
          setIsInputFocused(false);
          animateInput(0);
        }}
        autoCapitalize="none"
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={24} 
            color="#666" 
            style={styles.icon}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {isInputFocused && (
            <BlurView 
              intensity={100} 
              tint="dark"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.7)' }
              ]} 
            />
          )}
          <Image 
            source={logoFST} 
            style={[
              styles.logo, 
              isInputFocused && { opacity: 0.3 }
            ]} 
          />
          <Text style={[styles.title, isInputFocused && { opacity: 0.3 }]}>Iniciar Sesión</Text>
          {renderInput("at-outline", "Nombre de Usuario", username, setUsername)}
          {renderInput("lock-closed-outline", "Contraseña", password, setPassword, true)}

          <TouchableOpacity 
            style={[styles.button, isInputFocused && { opacity: 0.3 }]} 
            onPress={handleLogin}
            disabled={isInputFocused}
          >
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline, isInputFocused && { opacity: 0.3 }]}
            onPress={() => navigation.goBack()}
            disabled={isInputFocused}
          >
            <Text style={[styles.buttonText, styles.buttonOutlineText]}>Volver</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
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
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  button: {
    width: '80%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#005f99',
    borderRadius: 10,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#005f99',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  buttonOutlineText: {
    color: '#005f99',
  },
  logo: {
    width: windowHeight * 0.3,
    height: windowHeight * 0.3,
  },
});

export default LogInScreen;
