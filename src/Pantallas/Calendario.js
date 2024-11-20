import React, { useEffect, useState, useRef } from 'react';
import { LocaleConfig, Calendar } from 'react-native-calendars';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TouchableOpacity, useColorScheme, Animated } from 'react-native';
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
  let colorScheme = useColorScheme();
  colorScheme = 'light';
  const styles = colorScheme  === 'dark' ? darkStyles : lightStyles;
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const newMarkedDates = {};
    seriesDetalles.forEach((detalle) => {
      detalle.episodes.forEach((episode) => {
        if (new Date(episode.air_date) >= new Date()) {
          newMarkedDates[episode.air_date] = { marked: true, selectedColor: '#007bff' };
        }
      });
    });
    setMarkedDates(newMarkedDates);
    console.log(seriesDetalles)
  }, [seriesDetalles]);

  useEffect(() => {
    obtenerSeries();
    irAHoy();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Scroll to top when a new date is selected
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0});
    }
  }, [selected]);

  const obtenerSeriesDelUsuario = async (userId, idgrupo) => {
    try {
      const url = new URL(`${global.API}/series-ids-usuario/${userId}/${idgrupo}`);
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
          fetch(`https://api.themoviedb.org/3/tv/${serieID}?api_key=c51082efa7d62553e4c05812ebf6040e&language=${user?.idioma}&append_to_response=season/1,season/2,season/3,season/4,season/5`)
            .then(response => response.json())
        )).then(seriesDetalles => {
          // Procesar y ordenar los episodios futuros
          const seriesConEpisodiosFuturos = seriesDetalles.map(serie => {
            const episodiosFuturos = [];
            Object.keys(serie).forEach(key => {
              if (key.startsWith('season/')) {
                serie[key].episodes.forEach(episode => {
                  if (new Date(episode.air_date) >= new Date()) {
                    episodiosFuturos.push({
                      ...episode,
                      serie_name: serie.name,
                      serie_poster: serie.poster_path,
                      serie_backdrop: serie.backdrop_path,
                      serie_genres: serie.genres,
                      serie_vote_average: serie.vote_average
                    });
                  }
                });
              }
            });
            return { ...serie, episodes: episodiosFuturos };
          });

          // Ordenar series por fecha de emisión más reciente a menos reciente
          const seriesOrdenadas = seriesConEpisodiosFuturos.sort((a, b) => {
            const fechaA = a.episodes[0] ? new Date(a.episodes[0].air_date) : new Date(0);
            const fechaB = b.episodes[0] ? new Date(b.episodes[0].air_date) : new Date(0);
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
      {seriesDetalles.flatMap(serie => 
        serie.episodes.map((episode, index) => (
          <View key={`${serie.id}-${index}`} style={styles.detalleContainer}>
            <Text style={styles.titulo}>{serie.name.toUpperCase()}</Text>
            {poster(serie.poster_path)}
            <Text style={styles.title}>
              TEMPORADA: {episode.season_number}, EPISODIO {episode.episode_number}
            </Text>
            <Text style={styles.detalles}>
              {episode.overview || "No hay descripción disponible."}
            </Text>
            <Text style={styles.detalles}>
              Fecha de emisión: {formatearFecha(episode.air_date)}
            </Text>
            <Text style={styles.detalles}>
              Duración: {episode.runtime || "No disponible"} minutos
            </Text>
            <Text style={styles.detalles}>
              Géneros: {serie.genres ? serie.genres.map(g => g.name).join(", ") : "No disponible"}
            </Text>
            <Text style={styles.detalles}>
              Calificación promedio: {serie.vote_average ? serie.vote_average.toFixed(1) : "No disponible"}/10
            </Text>
            {episode.guest_stars && episode.guest_stars.length > 0 && (
              <Text style={styles.detalles}>
                Estrellas invitadas: {episode.guest_stars.map(star => star.name).join(", ")}
              </Text>
            )}
            {episode.crew && episode.crew.length > 0 && (
              <Text style={styles.detalles}>
                Director: {episode.crew.find(c => c.job === "Director")?.name || "No disponible"}
              </Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  const irAHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setSelected(hoy);
  };

  return (
    <View style={styles.container}>
    
      {/* <TouchableOpacity 
        style={styles.botonVista}
        onPress={() => setModoVista(modoVista === 'calendario' ? 'lista' : 'calendario')}
      >
        <Text style={styles.botonTexto}>
          {modoVista === 'calendario' ? "Ver Lista" : "Ver Calendario"}
        </Text>
      </TouchableOpacity> */}

      {modoVista === 'calendario' ? (
        <>
          <Calendar
            style={styles.calendar}
            firstDay={1}
            locale={'es'}
            onDayPress={day => {
              setSelected(day.dateString);
              slideAnim.setValue(-Dimensions.get('window').width);
            }}
            markedDates={{
              ...markedDates,
              [selected]: markedDates[selected]
                ? { ...markedDates[selected], selected: true, selectedColor: '#007bff' }
                : { selected: true, selectedColor: '#007bff' },
            }}
            theme={{
              backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff',
              calendarBackground: colorScheme === 'dark' ? '#121212' : '#ffffff',
              textSectionTitleColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
              selectedDayBackgroundColor: '#007bff',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007bff',
              dayTextColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
              textDisabledColor: colorScheme === 'dark' ? '#4d4d4d' : '#d9e1e8',
              dotColor: '#007bff',
              selectedDotColor: '#ffffff',
              arrowColor: '#007bff',
              monthTextColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 16,
            }}
          />
          <TouchableOpacity style={styles.botonHoy} onPress={irAHoy}>
            <Text style={styles.botonTextoHoy}>Hoy</Text>
          </TouchableOpacity>
          <Animated.ScrollView 
            ref={scrollViewRef}
            style={[
              styles.scrollView,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {seriesDetalles.flatMap(serie => 
              serie.episodes.filter(episode => episode.air_date === selected)
                .map((episode, index) => (
                  <View key={`${serie.id}-${index}`} style={styles.detalleContainer}>
                    <Text style={styles.titulo}>{serie.name.toUpperCase()}</Text>
                    {poster(serie.poster_path)}
                    <Text style={styles.title}>
                      TEMPORADA: {episode.season_number}, EPISODIO {episode.episode_number}
                    </Text>
                    <Text style={styles.detalles}>
                      {episode.overview || "No hay descripción disponible."}
                    </Text>
                    <Text style={styles.detalles}>
                      Duración: {episode.runtime || "No disponible"} minutos
                    </Text>
                    <Text style={styles.detalles}>
                      Géneros: {serie.genres ? serie.genres.map(g => g.name).join(", ") : "No disponible"}
                    </Text>
                    <Text style={styles.detalles}>
                      Calificación promedio: {serie.vote_average ? serie.vote_average.toFixed(1) : "No disponible"}/10
                    </Text>
                    {episode.guest_stars && episode.guest_stars.length > 0 && (
                      <Text style={styles.detalles}>
                        Estrellas invitadas: {episode.guest_stars.map(star => star.name).join(", ")}
                      </Text>
                    )}
                    {episode.crew && episode.crew.length > 0 && (
                      <Text style={styles.detalles}>
                        Director: {episode.crew.find(c => c.job === "Director")?.name || "No disponible"}
                      </Text>
                    )}
                  </View>
                ))
            )}
          </Animated.ScrollView>
        </>
      ) : (
        renderLista()
      )}
    </View>
  );
};

const lightStyles = StyleSheet.create({
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
  botonHoy: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
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
  botonHoy: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    width: '25%',
    alignSelf: 'flex-end',
  },

  botonTextoHoy: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  ...lightStyles,
  container: {
    ...lightStyles.container,
    backgroundColor: '#121212',
  },
  calendar: {
    ...lightStyles.calendar,
    backgroundColor: '#121212',
    borderColor: '#333',
  },
  detalleContainer: {
    ...lightStyles.detalleContainer,
    backgroundColor: '#1e1e1e',
    shadowColor: '#fff',
  },
  titulo: {
    ...lightStyles.titulo,
    color: '#fff',
  },
  title: {
    ...lightStyles.title,
    color: '#4da6ff',
  },
  detalles: {
    ...lightStyles.detalles,
    color: '#bbb',
  },
  botonVista: {
    ...lightStyles.botonVista,
    backgroundColor: '#4da6ff',
  },
  botonHoy: {
    ...lightStyles.botonHoy,
    backgroundColor: '#4da6ff',
  },
});

export default Calendario;
