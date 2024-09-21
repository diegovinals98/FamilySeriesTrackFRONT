import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js';
import { Ionicons } from '@expo/vector-icons';

const windowHeight = Dimensions.get('window').height;

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
       

        <View style={styles.card}>
          {isEditing ? (
            <TextInput
              value={editedNombreGrupo}
              onChangeText={setEditedNombreGrupo}
              autoFocus={true}
              onBlur={handleSave}
              style={styles.input}
            />
          ) : (
            <Text style={styles.groupName}>{nombreGrupo}</Text>
          )}
          <TouchableOpacity onPress={isEditing ? handleSave : handleEdit} style={styles.editButton}>
            <Ionicons name={isEditing ? "checkmark-circle" : "create-outline"} size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Miembros</Text>
          <FlatList
            data={miembros}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.memberItem}>
                <Ionicons name="person-circle-outline" size={24} color="#4A90E2" />
                <Text style={styles.memberName}>{item.Nombre} {item.Apellidos}</Text>
              </View>
            )}
          />
        </View>

        {showAddUser && (
          <View style={styles.addUserContainer}>
            <TextInput
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder="Nombre del nuevo usuario"
              placeholderTextColor="#999"
              autoCapitalize="none"
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowAddUser(false)} style={styles.cancelButton}>
              <Ionicons name="close-circle" size={24} color="#FF6347" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={showAddUser ? addUserToGroup : handleAddUserPress}>
          <Text style={styles.buttonText}>{showAddUser ? 'Confirmar Añadir Usuario' : 'Añadir Usuario'}</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.leaveButton]} onPress={() => salirdelGrupo(idGrupo)}>
            <Text style={styles.buttonText}>Salir del Grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.deleteButton, user.id !== admin && styles.disabledButton]} 
            onPress={() => eliminargrupo(idGrupo)} 
            disabled={user.id !== admin}
          >
            <Text style={styles.buttonText}>{user.id === admin ? 'Eliminar Grupo' : 'No eres Admin'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    fontSize: 18,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    color: '#333',
    flex: 1,
  },
  editButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberName: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaveButton: {
    backgroundColor: '#FF6347',
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#FF4500',
    flex: 1,
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  addUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    marginLeft: 10,
  },
});

export default EditarGrupo;
