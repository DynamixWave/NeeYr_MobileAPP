import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { useFavorites } from '../context/FavoriteContext';
import { useNavigation } from '@react-navigation/native';

// Wait, the project doesn't have regular @fortawesome/free-regular-svg-icons installed, based on package.json.
// Wait, looking at package.json, there is only: "@fortawesome/free-solid-svg-icons".
// I'll use faHeart but with different styling or I'll just change the color to represent outlined (gray) vs filled (red).
// A common trick is to use a gray color for outline if the regular icon isn't available.
// Actually, solid faHeart in gray vs solid faHeart in red works.

const FavoriteButton = ({ branchId, style, size = 20 }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigation = useNavigation();
  const [isProcessing, setIsProcessing] = useState(false);

  const currentlyFavorite = isFavorite(branchId);

  const handlePress = async (e) => {
    // Prevent event bubbling if placed inside a card
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    if (isProcessing) return;

    setIsProcessing(true);
    await toggleFavorite(branchId, navigation);
    setIsProcessing(false);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, style]} 
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color={currentlyFavorite ? '#EF4444' : '#9CA3AF'} />
      ) : (
        <FontAwesomeIcon 
          icon={faHeartSolid} 
          size={size} 
          color={currentlyFavorite ? '#EF4444' : '#9CA3AF'} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default FavoriteButton;
