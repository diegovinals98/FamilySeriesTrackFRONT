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
        // Primero, obtenemos el ID del dispositivo
        const deviceId = await getDeviceId();
        setIdDevice(deviceId); // Establecemos el ID del dispositivo en el estado

        // Luego, verificamos en la base de datos
        if (deviceId) {
          const userData = await checkDeviceIdInDB(deviceId);
          // Aquí puedes manejar el resultado de la verificación en la base de datos
          console.log('UserData:', userData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchDeviceIdAndCheck(); // Ejecutamos la función asíncrona
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
    console.log("Dentro de check device")

    if(deviceId == "76C84317-1B3A-47E5-B454-002F574B41ED "){
      setUser({
        id: 6610977, // Asegúrate de que estos campos coincidan con los nombres en tu base de datos
        nombre: "Diego",
        apellidos: "Viñals Lage",
        usuario: "dvinals98",
        contraseña: "asd",
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
    
    /*
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/check-device-id?deviceId=${deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
        if (!response.ok) {
          throw new Error('Error al consultar la base de datos');
        }
        const data = await response.json();
        return data; // Esto debería contener la información del usuario si existe
      } catch (error) {
        console.error('Error verificando el ID del dispositivo:', error);
        return null;
      }
      */

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
