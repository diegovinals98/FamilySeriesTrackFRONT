import React, { useEffect, useState } from 'react';
import { Calendar } from 'react-native-calendars';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
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

    useEffect(() => {
        const newMarkedDates = {};
        seriesDetalles.forEach((detalle) => {
            if (detalle.next_episode_to_air && detalle.next_episode_to_air.air_date) {
                const date = detalle.next_episode_to_air.air_date;
                newMarkedDates[date] = { marked: true, selectedColor: 'blue' };
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
                    setSeriesDetalles(seriesDetalles);
                }).catch(error => console.error('Error:', error));
            });
        }
    };

    const formatDate = (dateString) => {
        const months = [
            "enero", "febrero", "marzo", "abril", 
            "mayo", "junio", "julio", "agosto", 
            "septiembre", "octubre", "noviembre", "diciembre"
        ];
        const dateParts = dateString.split("-");
        const year = dateParts[0];
        const month = months[parseInt(dateParts[1], 10) - 1];
        const day = parseInt(dateParts[2], 10);

        return `${day} de ${month} de ${year}`;
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

    return (
        <View style={styles.container}>
            <Calendar
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              height: 350
            }}
                onDayPress={day => {
                    setSelected(day.dateString);
                }}
                markedDates={{
                    ...markedDates,
                    [selected]: { ...markedDates[selected], selected: true, selectedColor: 'blue'},
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',  // Fondo del contenedor
    },
    scrollView: {
        flex: 1,
    },
    detalleContainer: {
        flex: 1,
        paddingLeft: 10,
        paddingBottom: 10,
        paddingRight: 10,
        marginVertical: 10,
        borderRadius: 10
    },
    poster: {
        height: 400,
        width: '100%',
        resizeMode: 'contain',
        borderRadius: 10,
    },
    titulo: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
        color: '#333',
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 10,
        color: '#555',
    },
    detalles: {
        fontSize: 16,
        textAlign: 'justify',
        marginVertical: 10,
        color: '#777',
    }
});

export default Calendario;