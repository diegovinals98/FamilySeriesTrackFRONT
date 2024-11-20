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
  Alert,
  Dimensions,
  ScrollView,
  Animated
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../userContext.js';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const Settings = () => {
  const theme = useTheme();
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
  const [isInputFocused, setIsInputFocused] = useState(false);

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
        let response = await fetch(`${global.API}/usuario/${userId}`, {
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

  const deleteToken = async () => {
    console.log('Entramos en deleteToken de notificaciones');
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error('ID del proyecto no encontrado');
      return;
    }
    console.log('ID del proyecto:', projectId);
    
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
      const pushTokenString = pushToken.data;
      console.log('Token de push obtenido para eliminar:', pushTokenString);


      
      const url = `${global.API}/eliminar-token`;
      console.log('URL de la solicitud:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: `${pushTokenString}` })
      });

      if (response.ok) {
        console.log('Token eliminado correctamente');
      } else {
        const errorText = await response.text();
        console.error('Error al eliminar el token. Estado:', response.status, 'Texto:', errorText);
      }
    } catch (error) {
      console.error('Error al eliminar el token:', error);
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
              const response = await fetch(`${global.API}/eliminar-cuenta/${idUser}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                // borrar el token de notificacion push del dispositivo
                deleteToken();
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
      const response = await fetch(`${global.API}/delete-device-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, deviceId }),
      });

      if (response.ok) {
        console.log('DeviceId eliminado correctamente');
        deleteToken();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } catch (error) {
      console.log('Error al cerrar sesión :', error);
      Alert.alert("Error", 'No se ha podido cerrar sesión');
    }
  };

  const renderInput = (icon, placeholder, value, onChangeText, secureTextEntry = false) => (
    <Animated.View 
      style={[
        styles.inputGroup,
        focusedInput === placeholder && {
          transform: [{ translateY: inputTranslateY }],
          zIndex: 1,
          backgroundColor: theme.colors.surface,
        },
      ]}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={focusedInput === placeholder ? theme.colors.primary : theme.colors.textSecondary} 
        style={styles.icon} 
      />
      <TextInput 
        style={[
          styles.input,
          focusedInput === placeholder && { color: theme.colors.text }
        ]}
        onChangeText={onChangeText}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={focusedInput === placeholder ? theme.colors.textSecondary : theme.colors.text}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        onFocus={() => {
          setFocusedInput(placeholder);
          setIsInputFocused(true);
        }}
        onBlur={() => {
          setFocusedInput(null);
          setIsInputFocused(false);
        }}
      />
    </Animated.View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    blurBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.background,
      opacity: 0.9,
    },
    scrollViewContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    headerText: {
      ...theme.typography.h1,
      color: theme.colors.text,
      marginTop: theme.spacing.sm,
    },
    formContainer: {
      width: '85%',
    },
    circle: {
      width: windowHeight * 0.15,
      height: windowHeight * 0.15,
      borderRadius: 1000,
      backgroundColor: theme.colors.primary + '40', // 40 es la opacidad en hex
      justifyContent: 'center',
      alignItems: 'center',
    },
    initials: {
      color: theme.colors.text,
      ...theme.typography.h1,
      fontWeight: 'bold',
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface + '20',
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      ...theme.typography.body,
      paddingVertical: theme.spacing.xs,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    buttonText: {
      color: theme.colors.text,
      ...theme.typography.button,
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
      backgroundColor: theme.colors.error,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      width: '85%',
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
    buttonRow: {
      flexDirection: 'row',
      width: '85%',
      justifyContent: 'space-between',
    },
    halfButton: {
      flex: 1,
      marginHorizontal: '1.25%',
    },
  });

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {isInputFocused && (
            <Animated.View style={[styles.blurBackground, {
              backgroundColor: theme.colors.background
            }]} />
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
              {renderInput("lock-closed-outline", "Confirmar Contraseña", contrasena2, setContrasena2, true)}
            </View>

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
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Settings;
