import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PanResponder,
  Animated,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import axios from "axios";

const API_KEY = "YOUR_API_KEY_HERE"; // replace with your TMDb key

export default function App() {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=1`
      );
      setMovies(response.data.results);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch movies. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const addToFavorites = (movie) => {
    if (favorites.find((fav) => fav.id === movie.id)) {
      Alert.alert("Already added", `${movie.title} is already in favorites!`);
      return;
    }
    setFavorites([...favorites, movie]);
    Alert.alert("Added!", `${movie.title} was added to favorites.`);
  };

  const removeFavorite = (movieId) => {
    setFavorites(favorites.filter((fav) => fav.id !== movieId));
    Alert.alert("Removed", "Movie removed from favorites.");
  };

  const openModal = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
  };

  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx < -100) {
        Alert.alert("Clear Favorites", "Do you want to remove all favorites?", [
          { text: "Cancel", style: "cancel" },
          { text: "OK", onPress: () => setFavorites([]) },
        ]);
      }
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openModal(item)}
      onLongPress={() => addToFavorites(item)}
    >
      <Image
        source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
        style={styles.poster}
      />
      <Text style={styles.movieTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6347" />
        <Text>Loading movies...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎬 Popular Movies</Text>

      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovie}
      />

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.favContainer, { transform: [{ translateX: pan.x }] }]}
      >
        <Text style={styles.favTitle}>❤️ Favorites ({favorites.length})</Text>
        <FlatList
          data={favorites}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => removeFavorite(item.id)}>
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
                style={styles.favPoster}
              />
            </TouchableOpacity>
          )}
        />
        <Text style={styles.swipeText}>← Swipe left to clear favorites</Text>
      </Animated.View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedMovie && (
              <ScrollView>
                <Image
                  source={{ uri: `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` }}
                  style={styles.modalPoster}
                />
                <Text style={styles.modalTitle}>{selectedMovie.title}</Text>
                <Text style={styles.modalOverview}>
                  {selectedMovie.overview || "No description available."}
                </Text>
                <Text style={styles.modalInfo}>
                  ⭐ Rating: {selectedMovie.vote_average} | 🗓️ Release: {selectedMovie.release_date}
                </Text>

                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 10 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  card: { alignItems: "center", marginBottom: 20 },
  poster: { width: 200, height: 300, borderRadius: 10 },
  movieTitle: { marginTop: 5, fontSize: 16, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  favContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    elevation: 3,
  },
  favTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  favPoster: { width: 100, height: 150, marginRight: 10, borderRadius: 8 },
  swipeText: { fontSize: 12, color: "gray", textAlign: "center", marginTop: 5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    maxHeight: "85%",
  },
  modalPoster: { width: "100%", height: 400, borderRadius: 10, marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  modalOverview: { fontSize: 14, lineHeight: 20, color: "#333", marginBottom: 10 },
  modalInfo: { textAlign: "center", color: "#555", marginBottom: 15 },
  closeButton: {
    backgroundColor: "#ff6347",
    padding: 10,
    borderRadius: 10,
    alignSelf: "center",
    width: 100,
  },
  closeText: { textAlign: "center", color: "white", fontWeight: "bold" },
});
