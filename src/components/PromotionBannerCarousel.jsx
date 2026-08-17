import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ENDPOINTS from '../endpoint/endpoints';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_PADDING = 20;
const ITEM_WIDTH = SCREEN_WIDTH - CAROUSEL_PADDING * 2;
const AUTO_SCROLL_MS = 5000;

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (String(url).startsWith('http')) return url;
  return `https://apineeyrdirectory.fothubtv.com${url}`;
};

const PromotionBannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const autoScrollRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(`${ENDPOINTS.PROMOTION_BANNERS}?page_size=50`);
        if (!response.ok) {
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.results || data.data || []);
        
        // Filter active banners (assuming backend might not fully filter, just in case)
        const activeBanners = list.filter(item => item.is_active !== false);
        setBanners(activeBanners);
      } catch (e) {
        console.warn('Failed to load promotion banners', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % banners.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: next * SCREEN_WIDTH,
            animated: true,
          });
        }
        return next;
      });
    }, AUTO_SCROLL_MS);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [banners.length]);

  const onScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handlePress = (banner) => {
    if (banner.branch_id || banner.branch) {
      navigation.navigate('BranchDetail', { branchId: banner.branch_id || banner.branch });
    } else if (banner.target_url) {
      const url = banner.target_url.startsWith('http') ? banner.target_url : `https://${banner.target_url}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007BFF" />
      </View>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        decelerationRate="fast"
      >
        {banners.map((banner) => (
          <View key={banner.id} style={styles.carouselPage}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => handlePress(banner)}
              style={styles.card}
            >
              {banner.banner_image || banner.image ? (
                <Image 
                  source={{ uri: resolveImageUrl(banner.banner_image || banner.image) }} 
                  style={styles.image} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>{banner.title || 'Promotion'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, idx) => (
            <View 
              key={idx} 
              style={[styles.dot, activeIndex === idx && styles.dotActive]} 
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CAROUSEL_PADDING,
  },
  card: {
    width: ITEM_WIDTH,
    height: 140,
    backgroundColor: '#EEF2F7',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#007BFF',
    width: 16,
  },
});

export default PromotionBannerCarousel;
