import { React, useState, useEffect} from 'react';

import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, SafeAreaView, Platform } from 'react-native';
import logoFST from '../assets/logoFST.png';
import { Dimensions } from 'react-native';
import { globalStyles } from '../estilosGlobales.js';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { useUser } from '../userContext.js'; // Importa el hook useUser

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;



export default function WelcomeScreen({ navigation }) {
  // data: Almacena datos de usuarios.
  const [todosUsuarios, settodosUsuarios] = useState([]);
  const [IdDevice, setIdDevice] = useState([])
  const { setUser } = useUser();

  useEffect(() => {
    const fetchDeviceIdAndCheck = async () => {
      try {
        // Obtenemos el ID del dispositivo
        const deviceId = await getDeviceId();
        
        // Guardamos el deviceId en el estado local
        setIdDevice(deviceId);
  
        // Si el deviceId es válido, lo verificamos en la base de datos
        if (deviceId) {
          checkDeviceIdInDB(deviceId);
        }
      } catch (error) {
        // Manejamos cualquier error que pueda ocurrir
        console.error('Error obteniendo o verificando el ID del dispositivo:', error);
      }
    };
  
    fetchDeviceIdAndCheck(); // Ejecutamos la función asíncrona cuando el componente se monta
  }, []);
  


  const getDeviceId = async () => {
    let deviceId;
    
    if (Platform.OS === 'android') {
      deviceId = Application.androidId; // Android ID
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync(); 
    }
    console.log('Id del dispositivo: ' , deviceId)
    return deviceId;
  };
  
  
  
  // Aqui lo que tenemos que hacer coger ese device ID, buscarlo en la BBDD, si existe un usuario para ese devide ID,
  // cogemos los datos de ese usuario e iniciamos sesion sin que haga falta que el propio usuario meta contraseña y usuario.
  const checkDeviceIdInDB = async (deviceId) => {
    console.log("Dentro de check device");

  
    try {
      // Primer fetch: Verifica si el deviceId existe en la base de datos
      console.log("Lo que se esta enviando: " , deviceId);
      const response = await fetch(`https://apitfg.lapspartbox.com/check-device-id/${deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // Manejo de errores en la consulta inicial
      if (!response.ok) {
        throw new Error('Error al consultar la base de datos');
      }
  
      const data = await response.json();
  
      // Verifica si se ha encontrado un usuario asociado al deviceId
      if (data.length !== 0 && data.IdUsuario) {
        const userId = data.IdUsuario; // Obtiene el IdUsuario del resultado
  
        // Segundo fetch: Obtiene la información completa del usuario
        const userResponse = await fetch(`https://apitfg.lapspartbox.com/get-user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        // Manejo de errores al obtener los detalles del usuario
        if (!userResponse.ok) {
          throw new Error('Error al obtener los detalles del usuario');
        }
  
        const userData = await userResponse.json();
        console.log("------------- USER DATA -----------------")
        console.log(userData);
  

        // Ahora configura el usuario en el estado
        setUser({
          id: userId, // Asegúrate de que estos campos coincidan con los nombres en tu base de datos
          nombre: userData.usuario.Nombre,
          apellidos: userData.usuario.Apellidos,
          usuario: userData.usuario.Usuario,
          contraseña: userData.usuario.Contraseña,
        });
  
        // Redirige al usuario a la página de inicio
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        // Si no se encuentra el deviceId en la base de datos, no hacemos nada
        console.log('Device ID no encontrado, no se realiza ninguna acción.');
        return null;
      }
    } catch (error) {
      console.error('Error verificando el ID del dispositivo o consultando la información del usuario:', error);
      return null;
    }
  };
  



  const imprimirUsuarios = (usuarios) => {
    console.log("---------------------- USUARIOS ----------------------");
    usuarios.forEach((usuario, index) => {
      console.log(`----------- Usuario ${index + 1}----------- `);
      console.log();
      console.log(`ID: ${usuario.Id}, Nombre: ${usuario.Nombre}, Apellidos: ${usuario.Apellidos}, Usuario: ${usuario.Usuario}, Contraseña : ${usuario.Contraseña}`);
      console.log();
    });
  };
  
  const handleLoginPress = () => {
    fetch('https://apitfg.lapspartbox.com/usuario')
      .then((response) => response.json())
      .then((json) => {
        settodosUsuarios(json);
        //imprimirUsuarios(json); // Llama a una función para imprimir los usuarios
      })
      .catch((error) => console.error(error));

      fetch('https://apitfg.lapspartbox.com/admin/health')
      .then(response => response.text()) // Convertimos la respuesta a texto (o .json() si esperas un JSON)
      .then(text => {
        if (text == 'Hello World') {
          // Si el texto es "Hello World", muestra una alerta
          //Alert.alert('Prueba de conexion', text);
        } else {
          // Si quieres hacer algo más con una respuesta diferente, puedes hacerlo aquí
          //Alert.alert('Prueba de conexion', 'No se conecta');
        }
      })
      .catch(error => console.error(error)); // Capturamos y mostramos errores en caso de que ocurran
    
    console.log('Login pressed');
    navigation.navigate('LogInScreen'); // Navegar a la pantalla 'LogInScreen'
  };

  const handleCreateAccountPress = () => {
    console.log('Create Account pressed');
    navigation.navigate('SignUp') // Navegar a la pantalla 'Home' al presionar
    // Aquí iría la lógica para manejar la creación de la cuenta
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
    <View style={globalStyles.container}>
      <Image source={logoFST} style={styles.logo} />
        <Text style={styles.titulo}>FamilySeriesTrack</Text>

        <TouchableOpacity style={globalStyles.button} onPress={handleLoginPress}>
          <Text style={globalStyles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={globalStyles.buttonOutline} onPress={handleCreateAccountPress}>
          <Text style={globalStyles.buttonText}>Crear Cuenta</Text>
        </TouchableOpacity>
    
      
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  logo: {
    //width: windowWidth,
    //height: windowWidth * (windowWidth / windowWidth),
    height: 0.5 * windowHeight,
    width: 0.5 * windowHeight
  },
  titulo: {
    fontSize: 40,
    marginBottom: '5%',
    marginTop: '5%',
  }
});
