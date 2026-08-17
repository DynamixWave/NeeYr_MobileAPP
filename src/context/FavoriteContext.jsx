import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../endpoint/endpoints';

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const getAuthHeader = async () => {
    try {
      const token = await AsyncStorage.getItem('bearer_token');
      if (!token) return null;
      return token.includes(' ')
        ? token
        : token.startsWith('eyJ')
          ? `Bearer ${token}`
          : `Token ${token}`;
    } catch (e) {
      return null;
    }
  };

  const refreshFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setFavoriteIds(new Set());
        return;
      }

      const res = await fetch(`${ENDPOINTS.USER_FAVORITES}?page_size=500`, {
        headers: { Authorization: authHeader },
      });

      if (res.ok) {
        const data = await res.json();
        const results = Array.isArray(data) ? data : (data.results || data.data || []);
        const ids = new Set(results.map(item => item.branch_id || item.branch?.id));
        setFavoriteIds(ids);
      } else {
        // Handle unauth or errors gracefully
        if (res.status === 401 || res.status === 403) {
          setFavoriteIds(new Set());
        }
      }
    } catch (e) {
      console.warn('Failed to fetch favorites', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const isFavorite = useCallback((branchId) => {
    return favoriteIds.has(branchId);
  }, [favoriteIds]);

  const toggleFavorite = useCallback(async (branchId, navigation) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      // User is not authenticated, redirect to Login
      if (navigation) {
        navigation.navigate('Login');
      } else {
        Alert.alert('Login Required', 'Please log in to save favorites.');
      }
      return false; // Toggle not successful
    }

    const currentlyFavorite = favoriteIds.has(branchId);
    
    // Optimistic UI Update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (currentlyFavorite) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });

    try {
      if (currentlyFavorite) {
        // Delete favorite
        const checkRes = await fetch(ENDPOINTS.USER_FAVORITE_CHECK(branchId), {
          headers: { Authorization: authHeader },
        });
        
        let favoriteIdToDelete = null;
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          favoriteIdToDelete = checkData.favorite_id || checkData.id;
        }

        if (favoriteIdToDelete) {
          const delRes = await fetch(ENDPOINTS.USER_FAVORITE_DELETE(favoriteIdToDelete), {
            method: 'DELETE',
            headers: { Authorization: authHeader },
          });
          if (!delRes.ok) throw new Error('Delete failed');
        } else {
           // Fallback to fetch all if check endpoint is missing/not-implemented yet
           const allRes = await fetch(`${ENDPOINTS.USER_FAVORITES}?page_size=500`, {
             headers: { Authorization: authHeader },
           });
           if (allRes.ok) {
             const allData = await allRes.json();
             const list = Array.isArray(allData) ? allData : (allData.results || allData.data || []);
             const record = list.find(r => (r.branch_id === branchId || r.branch?.id === branchId));
             if (record && record.id) {
                const delRes2 = await fetch(ENDPOINTS.USER_FAVORITE_DELETE(record.id), {
                  method: 'DELETE',
                  headers: { Authorization: authHeader },
                });
                if (!delRes2.ok) throw new Error('Delete failed');
             }
           }
        }
      } else {
        // Create Favorite
        const createRes = await fetch(ENDPOINTS.USER_FAVORITE_CREATE, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: authHeader 
          },
          body: JSON.stringify({ branch_id: branchId })
        });
        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          // if it's already a duplicate, backend might return 400. We can treat as success.
          if (createRes.status !== 400 || (errData.message && !errData.message.toLowerCase().includes('duplicate'))) {
             throw new Error('Create failed');
          }
        }
      }
      return true;
    } catch (e) {
      console.warn('Toggle favorite failed', e);
      // Rollback Optimistic Update
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (currentlyFavorite) {
          next.add(branchId);
        } else {
          next.delete(branchId);
        }
        return next;
      });
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
      return false;
    }
  }, [favoriteIds]);

  return (
    <FavoriteContext.Provider value={{
      favoriteIds,
      loading,
      refreshFavorites,
      isFavorite,
      toggleFavorite,
    }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);
