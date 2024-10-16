import { React, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import logoFST from '../../assets/logoFST.png';
import { Dimensions } from 'react-native';
import { globalStyles } from '../../estilosGlobales.js';
import * as Application from 'expo-application';
import { useUser } from '../../userContext.js';
import { styles} from './WelcomeScreenStyle';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function WelcomeScreen({ navigation }) {
  const [IdDevice, setIdDevice] = useState([]);
  const { setUser } = useUser();

  useEffect(() => {
    console.log("------------- WELCOME SCREEN -----------------");
    const fetchDeviceIdAndCheck = async () => {
      try {
        const deviceId = await getDeviceId();
        setIdDevice(deviceId);
        if (deviceId) {
          checkDeviceIdInDB(deviceId);
        }
      } catch (error) {
        console.error('Error obteniendo o verificando el ID del dispositivo:', error);
      }
    };
    fetchDeviceIdAndCheck();
  }, []);

  const getDeviceId = async () => {
    let deviceId;
    if (Platform.OS === 'android') {
      deviceId = await Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync();
    }
    console.log('Id del dispositivo: ', deviceId);
    return deviceId;
  };

  const checkDeviceIdInDB = async (deviceId) => {
    try {
      const response = await fetch(`https://backendapi.familyseriestrack.com/check-device-id/${deviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al consultar la base de datos');
      }

      const data = await response.json();

      if (data.length !== 0 && data.IdUsuario) {
        const userId = data.IdUsuario;
        const userResponse = await fetch(`https://backendapi.familyseriestrack.com/get-user/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!userResponse.ok) {
          throw new Error('Error al obtener los detalles del usuario');
        }

        const userData = await userResponse.json();
        console.log("------------- USER DATA -----------------");
        console.log(userData);

        setUser({
          id: userId,
          nombre: userData.usuario.Nombre,
          apellidos: userData.usuario.Apellidos,
          usuario: userData.usuario.Usuario,
          contraseña: userData.usuario.Contraseña,
          idioma: userData.usuario.idioma,
        });

        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        console.log('Device ID no encontrado, no se realiza ninguna acción.');
        return null;
      }
    } catch (error) {
      console.error('Error verificando el ID del dispositivo o consultando la información del usuario:', error);
      return null;
    }
  };

  const handleLoginPress = () => {
    navigation.navigate('LogInScreen');
  };

  const handleCreateAccountPress = () => {
    navigation.navigate('SignUp');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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

