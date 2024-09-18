import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
  Button,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js';

const windowHeigh = Dimensions.get('window').height;

const EditarGrupo = ({ route }) => {
  const navigation = useNavigation();
  const [nombreGrupo, setNombregrupo] = useState(route.params.nombreGrupo);
  const { user } = useUser();
  const [miembros, setMiembros] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNombreGrupo, setEditedNombreGrupo] = useState(nombreGrupo);
  const [idGrupo, setIdGrupo] = useState();
  const [refrescar, setRefrescar] = useState(false);
  const [admin, setAdmin] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    const fetchMiembrosGrupo = async () => {
      try {
        const response = await fetch(`https://apitfg.lapspartbox.com/miembros-grupo/${nombreGrupo}`);
        const data = await response.json();
        setMiembros(data.members);
        setIdGrupo(data.groupId);
        await fetchIDAdmin(data.groupId);
      } catch (error) {
        console.error('Error al obtener miembros del grupo:', error);
      }
    };

    const fetchIDAdmin = async (idGrupo) => {
      try {
        const response = await fetch(`https://apitfg.lapspartbox.com/id-admin/${idGrupo}`);
        const data = await response.json();
        setAdmin(data.admin[0].Admin);
      } catch (error) {
        console.error('Error al obtener id del admin:', error);
      }
    };

    fetchMiembrosGrupo();
  }, [nombreGrupo, refrescar]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleAddUserPress = () => {
    setShowAddUser(true);
  };

  const addUserToGroup = async () => {
    try {
      const responseId = await fetch(`https://apitfg.lapspartbox.com/usuario_por_id/${newUserName}`);
      const data = await responseId.json();
      const idNewUser = data.idUsuario;

      const response = await fetch(`https://apitfg.lapspartbox.com/anadir_usuario_a_grupo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idGrupo: idGrupo,
          idUsuario: idNewUser,
        }),
      });
      const data2 = await response.json();
      if (data2.success === 2) {
        Alert.alert('Error', data2.mensaje);
      } else if (data2.success === 1) {
        setRefrescar((prev) => !prev);
      }
      setShowAddUser(false);
      setNewUserName('');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const response = await fetch(`https://apitfg.lapspartbox.com/actualizar-nombre-grupo/${idGrupo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nuevoNombre: editedNombreGrupo }),
      });

      if (response.ok) {
        alert('Nombre del grupo actualizado correctamente.');
        setNombregrupo(editedNombreGrupo);
        setRefrescar((prev) => !prev);
        navigation.setParams({ nombreGrupo: editedNombreGrupo });
      } else {
        alert('Error al actualizar el nombre del grupo.');
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('Error al conectar con el servidor.');
    }
  };

  const salirdelGrupo = async (idGrupo) => {
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres salir el grupo: ${nombreGrupo}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            try {
              const response = await fetch(`https://apitfg.lapspartbox.com/eliminar-usuario_grupo/${idGrupo}/${user.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                navigation.navigate('Home');
              } else {
                alert('Error al eliminar el grupo.');
              }
            } catch (error) {
              alert('Error al conectar con el servidor.');
            }
          },
        },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const eliminargrupo = async (idGrupo) => {
    Alert.alert(
      'Confirmación',
      `¿Estás seguro de que quieres eliminar el grupo: ${nombreGrupo}?`,
      [
        {
          text: 'Sí',
          onPress: async () => {
            try {
              const response = await fetch(`https://apitfg.lapspartbox.com/eliminar-grupo/${idGrupo}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                navigation.navigate('Home');
              } else {
                alert('Error al eliminar el grupo.');
              }
            } catch (error) {
              alert('Error al conectar con el servidor.');
            }
          },
        },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.contenedorPrincipal}>
      <View style={styles.container}>
        {isEditing ? (
          <View style={styles.contenedorNombre}>
            <Text style={styles.label}>Nombre:</Text>
            <TextInput
              value={editedNombreGrupo}
              onChangeText={setEditedNombreGrupo}
              autoFocus={true}
              onBlur={handleSave}
              style={styles.inputNombre}
            />
          </View>
        ) : (
          <View style={styles.contenedorNombre}>
            <Text style={styles.label}>Nombre: </Text>
            <Text style={styles.nombregrupo}>{nombreGrupo}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.buttonEdit} onPress={isEditing ? handleSave : handleEdit}>
          <Text style={styles.buttonText}>{isEditing ? 'Guardar' : 'Editar Nombre'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>Usuarios:</Text>
        <FlatList
          data={miembros}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.contenedorNombre}>
              <Text style={styles.nombreUsuario}>{item.Nombre} {item.Apellidos}</Text>
            </View>
          )}
        />
      </View>

      {showAddUser && (
        <TextInput
          value={newUserName}
          onChangeText={setNewUserName}
          placeholder="Nombre del nuevo usuario"
          autoCapitalize="none"
          style={styles.input2}
        />
      )}

      <TouchableOpacity style={styles.buttonAdd} onPress={showAddUser ? addUserToGroup : handleAddUserPress}>
        <Text style={styles.buttonText}>{showAddUser ? 'Confirmar Añadir Usuario' : 'Añadir Usuario'}</Text>
      </TouchableOpacity>

      <View style={styles.fixToText}>
        <TouchableOpacity style={styles.buttonSalir} onPress={() => salirdelGrupo(idGrupo)}>
          <Text style={styles.buttonText}>Salir del Grupo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonEliminar} onPress={() => eliminargrupo(idGrupo)} disabled={user.id !== admin}>
          <Text style={styles.buttonText}>{user.id === admin ? 'Eliminar Grupo' : 'No eres Admin'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 20,
  },
  container: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  contenedorNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  nombregrupo: {
    fontSize: 18,
    color: '#333',
    marginLeft: 10,
  },
  nombreUsuario: {
    fontSize: 16,
    color: '#666',
  },
  inputNombre: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: 'gray',
    padding: 5,
    fontSize: 18,
  },
  input2: {
    borderBottomWidth: 1,
    borderColor: 'gray',
    width: '100%',
    padding: 10,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonEdit: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
    elevation: 5,
  },
  buttonAdd: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  buttonSalir: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    elevation: 5,
  },
  buttonEliminar: {
    backgroundColor: '#FF6347', 
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    elevation: 5,
  },
});

export default EditarGrupo;
