import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const RecuperarContrasena = () => {
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const navigation = useNavigation();
  const handleSubmit = () => {
    if (!email || !usuario) {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }
    console.log('Email: ', email);
    console.log('Usuario: ', usuario);

    // Enviar los datos a un endpoint usando POST
    fetch('https://backendapi.familyseriestrack.com/solicitar-recuperacion-contrasena', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, usuarioParams: usuario }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la solicitud');
      }
      return response.json();
    })
    .then(data => {
      if (data.success === 1) {
        Alert.alert('Éxito', 'Solicitud de recuperación enviada.');
        navigation.navigate('Recuperar Contrasena2');
      } else {
        Alert.alert('Error', 'Hubo un problema al enviar la solicitud.');
      }
    })
    .catch(error => {
      
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recuperar Contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="nombre de usuario"
        value={usuario}
        onChangeText={setUsuario}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar Solicitud</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#005f99',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default RecuperarContrasena;
