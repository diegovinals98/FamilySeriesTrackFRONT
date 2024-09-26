import React, { useState, useRef, useEffect } from 'react';
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
  Dimensions,
  ScrollView,
  Animated
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { globalStyles } from '../estilosGlobales.js';
import { useUser } from '../userContext.js';
import * as Crypto from 'expo-crypto';
import * as Application from 'expo-application';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

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

  const scrollViewRef = useRef();
  const [focusedInput, setFocusedInput] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [isInputFocused, setIsInputFocused] = useState(false); // Nueva variable de estado

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 50, // Animación más rápida
          useNativeDriver: false,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 50, // Animación más rápida
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const backgroundOpacity = animatedValue.interpolate({
    inputRange: [1, 1],
    outputRange: [0, 0.8],
  });

  const inputTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -windowHeight / 4],
  });

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
        let response = await fetch(`https://backendapi.familyseriestrack.com/usuario/${userId}`, {
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
              const response = await fetch(`https://backendapi.familyseriestrack.com/eliminar-cuenta/${idUser}`, {
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
      const response = await fetch('https://backendapi.familyseriestrack.com/delete-device-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, deviceId }),
      });

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

  const renderInput = (icon, placeholder, value, onChangeText, secureTextEntry = false) => (
    <Animated.View 
      style={[
        styles.inputGroup,
        focusedInput === placeholder && {
          transform: [{ translateY: inputTranslateY }],
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,1)', // Fondo blanco y opaco
        },
      ]}
    >
      <Ionicons name={icon} size={24} color={focusedInput === placeholder ? "#3b5998" : "#fff"} style={styles.icon} />
      <TextInput 
        style={[styles.input, focusedInput === placeholder && { color: '#000' }]} // Texto negro cuando está enfocado
        onChangeText={onChangeText}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={focusedInput === placeholder ? "#999" : "#ccc"}
        secureTextEntry={secureTextEntry}
        onFocus={() => {
          setFocusedInput(placeholder);
          setIsInputFocused(true); // Establecer el estado a verdadero
        }}
        onBlur={() => {
          setFocusedInput(null);
          setIsInputFocused(false); // Establecer el estado a falso
        }}
      />
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={styles.container}
        >
          {isInputFocused && ( // Mostrar el fondo borroso si el input está enfocado
            <Animated.View style={styles.blurBackground} />
          )}
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            ref={scrollViewRef}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <View style={styles.circle}>
                <Text style={styles.initials}>{iniciales}</Text>
              </View>
              <Text style={styles.headerText}>Ajustes de Cuenta</Text>
            </View>

            <View style={styles.formContainer}>
              {renderInput("person-outline", "Nombre", nombre, setNombre)}
              {renderInput("people-outline", "Apellidos", apellidos, setApellidos)}
              {renderInput("at-outline", "Nombre de Usuario", usuario, setUsuario)}
              {renderInput("lock-closed-outline", "Nueva Contraseña", contrasena, setContrasena, true)}
              {renderInput("lock-closed-outline", "Repite Nueva Contraseña", contrasena2, setContrasena2, true)}

              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.halfButton]} onPress={guardarCambios}>
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonOutline, styles.halfButton]} onPress={cerrarSesion}>
                  <Text style={styles.buttonOutlineText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarCuenta(user.id)}>
                <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  scrollViewContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: '10%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: '7%',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: '2%',
  },
  formContainer: {
    width: '85%',
  },
  circle: {
    width: windowHeight * 0.15,
    height: windowHeight * 0.15,
    borderRadius: 1000,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '5%',
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '2.5%',
  },
  icon: {
    marginRight: '2.5%',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: '2.5%',
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: '3%',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: '3.75%',
  },
  buttonText: {
    color: '#3b5998',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonOutlineText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: '3%',
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: '3.75%',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo borroso
    zIndex: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfButton: {
    flex: 1,
    marginHorizontal: '1.25%',
  },
});

export default Settings;
