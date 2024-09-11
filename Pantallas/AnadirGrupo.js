import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';

const windowHeight = Dimensions.get('window').height;

const AnadirGrupo = () => {
  const navigation = useNavigation();
  const [nombreGrupo, setnombreGrupo] = useState('');
  const [inputsUsuarios, setInputsUsuarios] = useState([{ key: 0, value: '' }]);
  const { user } = useUser();

  useEffect(() => {
    if (user?.nombre) {
      setInputsUsuarios([{ key: 0, value: user.usuario }]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('---------------------------------------- AÑADIR GRUPO ----------------------------------------');
      return () => {
        console.log('Pantalla va a perder foco...');
      };
    }, [])
  );

  const agregarInputUsuario = () => {
    if (inputsUsuarios.length < 6) {
      const nuevoInput = { key: inputsUsuarios.length, value: '' };
      setInputsUsuarios([...inputsUsuarios, nuevoInput]);
    } else {
      alert('No puedes añadir más de 5 usuarios.');
    }
  };

  const actualizarUsuario = (index, text) => {
    const nuevosInputs = inputsUsuarios.map((input, i) => {
      if (i === index) {
        return { ...input, value: text };
      }
      return input;
    });
    setInputsUsuarios(nuevosInputs);
  };

  const agregarDatos = async () => {
    if (!nombreGrupo) {
      alert('No se puede añadir un grupo sin nombre');
      return;
    }

    const body = {
      nombreGrupo: nombreGrupo,
      nombresUsuarios: inputsUsuarios.map(input => input.value),
      admin: user.id,
    };

    try {
      const response = await fetch('https://apitfg.lapspartbox.com/crear-grupo-y-asociar-usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.message.includes('El grupo ya existe')) {
        alert('El grupo con nombre ' + nombreGrupo + ' ya existe');
      }

      if (data.detalles && data.detalles.length > 0) {
        data.detalles.forEach(detalle => {
          if (detalle.includes('no existe.')) {
            alert(detalle + ' No se ha podido añadir, pero se ha creado el grupo');
          }
        });
      }
      alert('Datos del grupo actualizados correctamente.');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error al agregar datos a la BBDD:', error);
      alert('Error al agregar datos.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Añadir Grupo</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre del Grupo</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setnombreGrupo(text)}
            placeholder="Nombre del grupo"
          />
        </View>

        {inputsUsuarios.map((input, index) => (
          <View key={input.key} style={styles.inputGroup}>
            <Text style={styles.label}>Usuario {index + 1}</Text>
            <TextInput
              style={styles.input}
              onChangeText={(text) => actualizarUsuario(index, text)}
              placeholder="Usuario a añadir"
              value={input.value}
            />
          </View>
        ))}

        <View style={styles.usuarios}>
          <TouchableOpacity onPress={agregarInputUsuario} style={styles.botonUsuario}>
            <Text style={styles.textoBoton}>Añadir Usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={agregarDatos} style={styles.botonAgregar}>
            <Text style={styles.textoBoton}>Crear Grupo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7', // Fondo claro
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#005f99',
    marginBottom: 20,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005f99',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  usuarios: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  botonUsuario: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 15,
    marginRight: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregar: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBoton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default AnadirGrupo;
