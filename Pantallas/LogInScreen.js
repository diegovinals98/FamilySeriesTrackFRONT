import React, { useState , useEffect} from 'react';
import logoFST from '../assets/logoFST.png';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../userContext.js'; // Importa el hook useUser
import { Alert , SafeAreaView} from 'react-native';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';



import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const LogInScreen = () => {
  
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { setUser } = useUser();
  const [IdDevice, setIdDevice] = useState([])
  const [userid, setUserid] = useState();

  useEffect(() => {
   //console.log('ENTRAMOS EN PANTALLA LOGIN')
    //authenticate()
 
  }, []);

  const getDeviceId = async () => {
    let deviceId;
    
    if (Platform.OS === 'android') {
      deviceId = Application.getAndroidId();// Android ID
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync(); 
    }
    console.log('Id del dispositivo: ' , deviceId)
    return deviceId;
  };

  async function authenticate() {
    // Verificar la disponibilidad de autenticación biométrica
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    if (!isAvailable) {
      return alert('La autenticación biométrica no está disponible en este dispositivo.');
    }
  
    // Iniciar autenticación
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentícate',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
    });
  
    if (result.success) {
      console.log(result)
      alert('Autenticación exitosa');
    } else {
      console.log(result)
      alert('Autenticación fallida');
    }
  }

  async function handleLogin() {


      // Haz el hash de la contraseña ingresada usando expo-crypto
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA512,
        password
      );
    
    try {
      let response = await fetch('https://apitfg.lapspartbox.com/login2', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario: username,
          contraseña: password
        })
      });

      
      let json = await response.json();
      console.log('RESPUESTA ', json)

       // Aquí obtendrías el hash de la contraseña almacenada para el 'username' desde tu base de datos
      const storedHashedPassword = json.hashPassword; 

     
    if (storedHashedPassword == hashedPassword) {
      
      console.log('Inicio de sesión exitoso');
      // Aquí puedes agregar la navegación a otra pantalla si es necesario
      //Alert.alert("Éxito", "Inicio de sesión exitoso.");
      setUserid(json.usuario.Id);
      
      setUser({
        id: json.usuario.Id, // Asegúrate de que estos campos coincidan con los nombres en tu base de datos
        nombre: json.usuario.Nombre,
        apellidos: json.usuario.Apellidos,
        usuario: json.usuario.Usuario,
        contraseña: json.usuario.Contraseña,
      });
      console.log("id del usuario: ", json.usuario.Id);
      
      
      /** 
       *  1. Sacamos el deviceId
       *  2. Metemos en la tabla de deviceTokens el deviceId junto con el id del usuario
       */
      // Obtenemos el ID del dispositivo
      const deviceId = await getDeviceId();
      try {
        
        
        // Enviar el deviceId y userId al backend
        const response = await fetch('https://apitfg.lapspartbox.com/insert-device-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: json.usuario.Id, deviceId  }), // Enviar deviceId y userId en el cuerpo de la solicitud
        });
    
        // Verificar si la respuesta es correcta
        if (!response.ok) {
          throw new Error('Error al insertar el Device ID y User ID en la base de datos');
        }
    
        const data = await response.json();
        console.log('Inserción exitosa:', data);
    
      } catch (error) {
        console.error('Error al insertar el Device ID y User ID:', error);
        // Aquí puedes mostrar un mensaje de error al usuario
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

    
    } else {
      // Aquí manejas el caso de éxito 0 o cualquier otro caso
      console.log('Error en el inicio de sesión');
      console.log('------------- DATOS INICIO DE SESION ERRONEOS -------------')
      console.log('Contraseña puesta por usuario: ', hashedPassword)
      console.log('Contraseña de la base de datos: ', storedHashedPassword)
      console.log('-------------------------- FINAL --------------------------')
      setLoginError('Usuario o contraseña incorrectos');
      Alert.alert("Usuario o contraseña incorrectos.");
    }
  } catch (error) {
    console.error('Error en la solicitud de inicio de sesión:', error);
    setLoginError('Error al conectarse al servidor');
    Alert.alert("Error de Conexión", "Error al conectarse al servidor.");
  }
}
  



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
    <KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"} // "padding" para iOS y "height" para Android
  style={{ flex: 1 }}
  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
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
        clearButtonMode='while-editing'
        
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        secureTextEntry = {true}
        clearButtonMode='while-editing'

      />


  
    
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleLogin()}
          >
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7', // Un fondo claro para la accesibilidad
    //backgroundColor: '#ffffff'
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#222', // Un color oscuro para el título para contraste
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd', // Un color más suave para el borde
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff', // Fondo blanco para los campos de entrada
  },
  button:{
    display: 'flex', // 'display: flex' es el valor predeterminado en React Native, así que no es necesario.
    width: '80%', // En React Native usamos unidades sin 'px'.
    height: '5%',
    justifyContent: 'center', // En React Native usamos camelCase en lugar de guiones.
    alignItems: 'center',
    flexShrink: 0, // Esta propiedad funciona igual que en CSS.
    backgroundColor: '#005f99', // Ejemplo de color azul, ya que no especificaste un color.
    borderRadius: 10, // Si quieres mantener los bordes redondeados como en tu estilo original.
    margin: 10, // Para dar un poco de padding vertical si es necesario.
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#005f99',
    display: 'flex', // 'display: flex' es el valor predeterminado en React Native, así que no es necesario.
    width: '80%', // En React Native usamos unidades sin 'px'.
    height: '5%',
    justifyContent: 'center', // En React Native usamos camelCase en lugar de guiones.
    alignItems: 'center',
    flexShrink: 0, // Esta propiedad funciona igual que en CSS.
    borderRadius: 10, // Si quieres mantener los bordes redondeados como en tu estilo original.
    margin: 10, // Para dar un poco de padding vertical si es necesario.
  },
  buttonOutlineText: {
    color: '#005f99',
  },
  text:{
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'black'
  },
  logo: {
    
    width: windowHeight * 0.3,
    height: windowHeight * 0.3,
  },
});

export default LogInScreen;
