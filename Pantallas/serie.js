import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, useColorScheme } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUser } from '../userContext.js';

const Serie = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [serieId, setSerieId] = useState(route.params.serieData);
  const [serieData, setSerieData] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const apiKey = 'c51082efa7d62553e4c05812ebf6040e';
  const baseImageUrl = 'https://image.tmdb.org/t/p/w500';

  let colorScheme = useColorScheme();
  
  const styles = colorScheme === 'dark' ? darkStyles : lightStyles;

  useEffect(() => {
    fetchSerieData();
    fetchCredits();
    console.log(serieId);

  }, []);

  const fetchSerieData = async () => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/${serieId}?api_key=${apiKey}&language=${user?.idioma}`);
      const data = await response.json();
      setSerieData(data);
      setLoading(false);
      
      // Actualizar el título de la pantalla
      navigation.setOptions({ title: data.name });
    } catch (error) {
      console.error('Error fetching serie data:', error);
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/tv/${serieId}/credits?api_key=${apiKey}&language=${user?.idioma}`);
      const data = await response.json();
      setCredits(data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando información de la serie...</Text>
      </View>
    );
  }

  if (!serieData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la información de la serie.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: `${baseImageUrl}${serieData.poster_path}` }}
        style={styles.poster}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{serieData.name}</Text>
        <Text style={styles.overview}>{serieData.overview}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Puntuación: {serieData.vote_average.toFixed(1)}/10</Text>
          <Text style={styles.detailText}>Votos totales: {serieData.vote_count}</Text>
          <Text style={styles.detailText}>Popularidad: {serieData.popularity.toFixed(2)}</Text>
          <Text style={styles.detailText}>Temporadas: {serieData.number_of_seasons}</Text>
          <Text style={styles.detailText}>Episodios: {serieData.number_of_episodes}</Text>
          <Text style={styles.detailText}>
            Estado: <Text style={serieData.status === 'Canceled' || serieData.status === 'Ended' ? styles.canceledStatus : serieData.status === 'Returning Series' ? styles.returningSeriesStatus : null}>{serieData.status}</Text>
          </Text>
          <Text style={styles.detailText}>Primer episodio: {serieData.first_air_date}</Text>
          <Text style={styles.detailText}>Último episodio: {serieData.last_air_date}</Text>
          <Text style={styles.detailText}>Idioma original: {
            serieData.original_language === 'en' ? 'Inglés' :
            serieData.original_language === 'es' ? 'Español' :
            serieData.original_language === 'fr' ? 'Francés' :
            serieData.original_language === 'de' ? 'Alemán' :
            serieData.original_language === 'it' ? 'Italiano' :
            serieData.original_language === 'pt' ? 'Portugués' :
            serieData.original_language === 'ru' ? 'Ruso' :
            serieData.original_language === 'ja' ? 'Japonés' :
            serieData.original_language === 'ko' ? 'Coreano' :
            serieData.original_language === 'zh' ? 'Chino' :
            serieData.original_language // Si no coincide con ninguno, muestra el código original
          }</Text>
          {serieData.networks && serieData.networks.length > 0 && (
            <Text style={styles.detailText}>Red: {serieData.networks[0].name}</Text>
          )}
          {serieData.type && (
            <Text style={styles.detailText}>Tipo: {serieData.type}</Text>
          )}
          {serieData.in_production !== undefined && (
            <Text style={styles.detailText}>En producción: {serieData.in_production ? 'Sí' : 'No'}</Text>
          )}
          {serieData.tagline && (
            <Text style={styles.detailText}>Eslogan: "{serieData.tagline}"</Text>
          )}
          {serieData.episode_run_time && serieData.episode_run_time.length > 0 && (
            <Text style={styles.detailText}>Duración promedio por episodio: {serieData.episode_run_time[0]} minutos</Text>
          )}
          {serieData.origin_country && serieData.origin_country.length > 0 && (
            <Text style={styles.detailText}>País de origen: {
              serieData.origin_country.map(country => {
                switch(country) {
                  case 'US': return 'Estados Unidos';
                  case 'GB': return 'Reino Unido';
                  case 'CA': return 'Canadá';
                  case 'FR': return 'Francia';
                  case 'DE': return 'Alemania';
                  case 'ES': return 'España';
                  case 'IT': return 'Italia';
                  case 'JP': return 'Japón';
                  case 'KR': return 'Corea del Sur';
                  case 'CN': return 'China';
                  default: return country; // Si no coincide con ninguno, muestra el código original
                }
              }).join(', ')
            }</Text>
          )}
        </View>
        <View style={styles.seasonContainer}>
          {serieData.seasons.map((season) => (
            <View key={season.id} style={styles.seasonItem}>
              <Text style={styles.seasonTitle}>{season.name}</Text>
              <Text style={styles.seasonInfo}>Episodios: {season.episode_count}</Text>
              <Text style={styles.seasonInfo}>Fecha de estreno: {season.air_date ? new Date(season.air_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No disponible'}</Text>
              {season.overview && <Text style={styles.seasonOverview}>{season.overview}</Text>}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Géneros:</Text>
        <View style={styles.genresContainer}>
          {serieData.genres.map((genre) => (
            <Text key={genre.id} style={styles.genreText}>{genre.name}</Text>
          ))}
        </View>

        {serieData.created_by && serieData.created_by.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Creado por:</Text>
            {serieData.created_by.map((creator) => (
              <Text key={creator.id} style={styles.creatorText}>{creator.name}</Text>
            ))}
          </View>
        )}

        {credits && (
          <View>
            <Text style={styles.sectionTitle}>Reparto y Equipo:</Text>
            <View style={styles.creditsContainer}>
              {credits.cast.slice(0, 5).map((actor) => (
                <Text key={actor.id} style={styles.creditText}>Actor: {actor.name} como {actor.character}</Text>
              ))}
              {credits.crew.slice(0, 5).map((crewMember) => (
                <Text key={crewMember.id} style={styles.creditText}>{crewMember.job}: {crewMember.name}</Text>
              ))}
            </View>
          </View>
        )}

        
      </View>
    </ScrollView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6347',
    textAlign: 'center',
  },
  poster: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  overview: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailText: {
    fontSize: 18,
    color: '#2C3E50',
    marginBottom: 12,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  genreText: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  creatorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  creditsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creditText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  canceledStatus: {
    color: '#FFFFFF',
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  returningSeriesStatus: {
    color: '#FFFFFF',
    backgroundColor: 'green',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seasonInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  seasonOverview: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
    lineHeight: 20,
  },
  seasonItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2', 
  },
  seasonDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  episodeCount: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
    marginTop: 5,
  }
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    fontSize: 18,
    color: '#E0E0E0',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6347',
    textAlign: 'center',
  },
  poster: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 15,
  },
  overview: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailText: {
    fontSize: 18,
    color: '#E0E0E0',
    marginBottom: 12,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 15,
    marginTop: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  genreText: {
    fontSize: 14,
    color: '#121212',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  creatorText: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  creditsContainer: {
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  creditText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#121212',
    fontSize: 18,
    fontWeight: 'bold',
  },
  canceledStatus: {
    color: '#121212',
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  returningSeriesStatus: {
    color: '#121212',
    backgroundColor: 'green',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seasonInfo: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  seasonOverview: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 10,
    lineHeight: 20,
  },
  seasonItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2', 
  },
  seasonDate: {
    fontSize: 12,
    color: '#808080',
    marginTop: 5,
  },
  episodeCount: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: 'bold',
    marginTop: 5,
  }
});

export default Serie;
