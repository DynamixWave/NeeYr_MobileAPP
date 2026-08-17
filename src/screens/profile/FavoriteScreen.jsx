import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStore, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../../endpoint/endpoints';
import FavoriteButton from '../../components/FavoriteButton';
import { useFavorites } from '../../context/FavoriteContext';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (String(url).startsWith('http')) return url;
  return `https://apineeyrdirectory.fothubtv.com${url}`;
};

const FavoriteScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { favoriteIds } = useFavorites();

  const fetchFavorites = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('bearer_token');
      if (!token) {
        setError('Please log in to view your favorite shops.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const authHeader = token.includes(' ') ? token : (token.startsWith('eyJ') ? `Bearer ${token}` : `Token ${token}`);
      
      const res = await fetch(`${ENDPOINTS.USER_FAVORITES}?page_size=100`, {
        headers: { Authorization: authHeader },
      });

      if (!res.ok) throw new Error('Failed to load favorites');

      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setFavorites(list);
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Keep the local list in sync with context (if a user unfavorites from this screen, remove it)
  useEffect(() => {
    if (!loading && favorites.length > 0) {
      const syncedFavorites = favorites.filter(fav => {
        const bId = fav.branch_id || fav.branch?.id;
        return favoriteIds.has(bId);
      });
      if (syncedFavorites.length !== favorites.length) {
        setFavorites(syncedFavorites);
      }
    }
  }, [favoriteIds, loading]);

  const renderItem = ({ item }) => {
    const branch = item.branch || {};
    const branchId = item.branch_id || branch.id;
    const name = branch.name || branch.branch_name || 'Unknown Shop';
    const categoryName = branch.category_name || branch.category?.name || '';
    
    // Attempt to resolve image
    let imageUrl = branch.image || branch.logo;
    if (!imageUrl && branch.images && branch.images.length > 0) {
      imageUrl = branch.images[0].image || branch.images[0].file;
    }
    const finalImage = resolveImageUrl(imageUrl);

    const locationStr = [branch.city?.name || branch.city_name, branch.region?.name || branch.region_name].filter(Boolean).join(', ');
    const address = branch.address;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BranchDetail', { branchId })}
      >
        <View style={styles.imageContainer}>
          {finalImage ? (
            <Image source={{ uri: finalImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesomeIcon icon={faStore} size={24} color="#007BFF" />
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {categoryName ? <Text style={styles.category}>{categoryName}</Text> : null}
          
          {(locationStr || address) ? (
            <View style={styles.metaRow}>
              <FontAwesomeIcon icon={faLocationDot} size={11} color="#EF4444" />
              <Text style={styles.metaText} numberOfLines={1}>
                {[locationStr, address].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ) : null}

          {branch.phone_number || branch.phone ? (
            <View style={styles.metaRow}>
              <FontAwesomeIcon icon={faPhone} size={11} color="#007BFF" />
              <Text style={styles.metaText} numberOfLines={1}>{branch.phone_number || branch.phone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.favoriteWrapper}>
          <FavoriteButton branchId={branchId} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Shops</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchFavorites()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => fetchFavorites(true)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon={faStore} size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>You have not saved any favorite shops yet.</Text>
              <Text style={styles.emptySubText}>Tap the heart icon on a shop to save it here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  imageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    color: '#007BFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  favoriteWrapper: {
    padding: 4,
  },
});

export default FavoriteScreen;
