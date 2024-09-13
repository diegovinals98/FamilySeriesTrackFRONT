import React, { useEffect, useState } from 'react';
import { LocaleConfig, Calendar } from 'react-native-calendars';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useUser } from '../userContext.js';

const windowHeight = Dimensions.get('window').height;

const Calendario = () => {
  const route = useRoute();
  const { user } = useUser();
  const [nombreGrupo, setNombregrupo] = useState(route.params.nombreGrupo);
  const [selected, setSelected] = useState('');
  const [seriesDetalles, setSeriesDetalles] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [idGrupo, setIdgrupo] = useState(route.params.idelegido);
  const [modoVista, setModoVista] = useState('calendario'); // Estado para alternar vista

  useEffect(() => {
    const newMarkedDates = {};
    seriesDetalles.forEach((detalle) => {
      if (detalle.next_episode_to_air && detalle.next_episode_to_air.air_date) {
        const date = detalle.next_episode_to_air.air_date;
        newMarkedDates[date] = { marked: true, selectedColor: '#007bff' };
      }
    });
    setMarkedDates(newMarkedDates);
  }, [seriesDetalles]);

  useEffect(() => {
    obtenerSeries();
  }, []);

  const obtenerSeriesDelUsuario = async (userId, idgrupo) => {
    try {
      const url = new URL(`https://apitfg.lapspartbox.com/series-ids-usuario/${userId}/${idgrupo}`);
      const respuesta = await fetch(url);
      if (!respuesta.ok) {
        throw new Error('Respuesta de red no fue ok.');
      }
      const seriesIds = await respuesta.json();
      return seriesIds;
    } catch (error) {
      console.error('Hubo un problema con la petición fetch:', error);
    }
  };

  const obtenerSeries = () => {
    if (nombreGrupo === 'Grupos') {
      setSeriesDetalles([]);
    } else {
      obtenerSeriesDelUsuario(user.id, idGrupo).then(seriesIds => {
        if (seriesIds.length === 0) {
          console.log('No hay series para mostrar');
          return;
        }

        Promise.all(seriesIds.map(serieID => 
          fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=es-ES`)
            .then(response => response.json())
        )).then(seriesDetalles => {
          // Ordenar series por fecha de emisión más reciente a menos reciente
          const seriesOrdenadas = seriesDetalles.sort((a, b) => {
            const fechaA = a.next_episode_to_air ? new Date(a.next_episode_to_air.air_date) : new Date(0);
            const fechaB = b.next_episode_to_air ? new Date(b.next_episode_to_air.air_date) : new Date(0);
            return fechaA - fechaB; // Más reciente a menos reciente
          });
          setSeriesDetalles(seriesOrdenadas);
        }).catch(error => console.error('Error:', error));
      });
    }
  };

  const formatearFecha = (fechaString) => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fecha = new Date(fechaString);
    let fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);
  
    // Separar por espacios para procesar cada palabra
    let partes = fechaFormateada.split(' ');
  
    // Capitalizar la primera letra del día y del mes, dejando los "de" intactos
    partes = partes.map((palabra, index) => {
      if (index === 0 || index === 3) { // Día de la semana (index 0) y mes (index 3)
        return palabra.charAt(0).toUpperCase() + palabra.slice(1);
      }
      return palabra; // No cambiar otras partes como "de"
    });
  
    // Reconstruir la fecha formateada
    return partes.join(' ');
  };
  
  
  

  const poster = (path) => {
    if (!path) {
      return null;
    }

    let imagePath = { uri: `https://image.tmdb.org/t/p/w500${path}` };

    return (
      <Image
        source={imagePath}
        style={styles.poster}
      />
    );
  };

  // Configuración del idioma para el calendario
  LocaleConfig.locales['es'] = {
    monthNames: [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
  };
  LocaleConfig.defaultLocale = 'es';

  const renderLista = () => (
    <ScrollView>
      {seriesDetalles.map((detalle, index) => {
        if (detalle.next_episode_to_air) {
          return (
            <View key={index} style={styles.detalleContainer}>
              <Text style={styles.titulo}>{detalle.name.toUpperCase()}</Text>
              {poster(detalle.poster_path)}
              <Text style={styles.title}>
                TEMPORADA: {detalle.next_episode_to_air.season_number}, EPISODIO {detalle.next_episode_to_air.episode_number}
              </Text>
              <Text style={styles.detalles}>
                {detalle.next_episode_to_air.overview}
              </Text>
              <Text style={styles.detalles}>
                Fecha de emisión: {formatearFecha(detalle.next_episode_to_air.air_date)}
              </Text>
            </View>
          );
        }
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.botonVista}
        onPress={() => setModoVista(modoVista === 'calendario' ? 'lista' : 'calendario')}
      >
        <Text style={styles.botonTexto}>
          {modoVista === 'calendario' ? "Ver Lista" : "Ver Calendario"}
        </Text>
      </TouchableOpacity>

      {modoVista === 'calendario' ? (
        <>
          <Calendar
            style={styles.calendar}
            firstDay={1}
            locale={'es'}
            onDayPress={day => {
              setSelected(day.dateString);
            }}
            markedDates={{
              ...markedDates,
              [selected]: { ...markedDates[selected], selected: true, selectedColor: '#007bff' },
            }}
          />
          <ScrollView style={styles.scrollView}>
            {seriesDetalles.map((detalle, index) => {
              if (detalle.next_episode_to_air && detalle.next_episode_to_air.air_date === selected) {
                return (
                  <View key={index} style={styles.detalleContainer}>
                    <Text style={styles.titulo}>{detalle.name.toUpperCase()}</Text>
                    {poster(detalle.poster_path)}
                    <Text style={styles.title}>
                      TEMPORADA: {detalle.next_episode_to_air.season_number}, EPISODIO {detalle.next_episode_to_air.episode_number}
                    </Text>
                    <Text style={styles.detalles}>
                      {detalle.next_episode_to_air.overview}
                    </Text>
                  </View>
                );
              }
            })}
          </ScrollView>
        </>
      ) : (
        renderLista()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    padding: 10,
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 350,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  detalleContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  poster: {
    height: 400,
    width: '100%',
    resizeMode: 'contain',
    borderRadius: 10,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    color: '#005f99',
    marginBottom: 10,
  },
  detalles: {
    fontSize: 16,
    color: '#777',
    textAlign: 'justify',
    marginTop: 10,
  },
  botonVista: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Calendario;
