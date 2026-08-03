import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons/faUtensils';
import { faFire } from '@fortawesome/free-solid-svg-icons/faFire';
import { faBagShopping } from '@fortawesome/free-solid-svg-icons/faBagShopping';
import { faBreadSlice } from '@fortawesome/free-solid-svg-icons/faBreadSlice';
import { faBook } from '@fortawesome/free-solid-svg-icons/faBook';
import { faMugHot } from '@fortawesome/free-solid-svg-icons/faMugHot';
import { faShirt } from '@fortawesome/free-solid-svg-icons/faShirt';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons/faWandMagicSparkles';
import { faIceCream } from '@fortawesome/free-solid-svg-icons/faIceCream';
import { faTv } from '@fortawesome/free-solid-svg-icons/faTv';
import { faBurger } from '@fortawesome/free-solid-svg-icons/faBurger';
import { faBowlFood } from '@fortawesome/free-solid-svg-icons/faBowlFood';
import { faGem } from '@fortawesome/free-solid-svg-icons/faGem';
import { faMobileScreenButton } from '@fortawesome/free-solid-svg-icons/faMobileScreenButton';
import { faPizzaSlice } from '@fortawesome/free-solid-svg-icons/faPizzaSlice';
import { faFish } from '@fortawesome/free-solid-svg-icons/faFish';
import { faShoePrints } from '@fortawesome/free-solid-svg-icons/faShoePrints';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons/faCartShopping';
import { faScissors } from '@fortawesome/free-solid-svg-icons/faScissors';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons/faHeartPulse';
import { faCar } from '@fortawesome/free-solid-svg-icons/faCar';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap';
import { faCoins } from '@fortawesome/free-solid-svg-icons/faCoins';
import { faFilm } from '@fortawesome/free-solid-svg-icons/faFilm';
import { faPlane } from '@fortawesome/free-solid-svg-icons/faPlane';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons/faChevronUp';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons/faRotateRight';
import { faStore as faStoreIcon } from '@fortawesome/free-solid-svg-icons/faStore';
import ENDPOINTS from '../../endpoint/endpoints';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Fallback Color Palette
const PALETTE = [
  { color: '#4F46E5', bgColor: '#EEF2FF' },
  { color: '#0EA5E9', bgColor: '#E0F2FE' },
  { color: '#10B981', bgColor: '#D1FAE5' },
  { color: '#F59E0B', bgColor: '#FEF3C7' },
  { color: '#EC4899', bgColor: '#FCE7F3' },
  { color: '#8B5CF6', bgColor: '#EDE9FE' },
  { color: '#14B8A6', bgColor: '#CCFBF1' },
  { color: '#F97316', bgColor: '#FFEDD5' },
];

// Helper function to resolve specific FontAwesome icon & color theme based on category name
const getCategoryTheme = (name = '', index = 0) => {
  const lowerName = name.toLowerCase().trim();

  if (lowerName.includes('bbq') || lowerName.includes('barbecue') || lowerName.includes('grill')) {
    return { icon: faFire, color: '#EF4444', bgColor: '#FEE2E2' };
  }
  if (lowerName.includes('bag')) {
    return { icon: faBagShopping, color: '#0EA5E9', bgColor: '#E0F2FE' };
  }
  if (lowerName.includes('baker') || lowerName.includes('bread') || lowerName.includes('cake')) {
    return { icon: faBreadSlice, color: '#D97706', bgColor: '#FEF3C7' };
  }
  if (lowerName.includes('book')) {
    return { icon: faBook, color: '#8B5CF6', bgColor: '#EDE9FE' };
  }
  if (lowerName.includes('bubble tea') || lowerName.includes('boba')) {
    return { icon: faMugHot, color: '#EC4899', bgColor: '#FCE7F3' };
  }
  if (lowerName.includes('cafe') || lowerName.includes('coffee') || lowerName.includes('tea')) {
    return { icon: faMugHot, color: '#B45309', bgColor: '#FEF3C7' };
  }
  if (lowerName.includes('cloth') || lowerName.includes('apparel') || lowerName.includes('fashion')) {
    return { icon: faShirt, color: '#4F46E5', bgColor: '#EEF2FF' };
  }
  if (lowerName.includes('convenience') || lowerName.includes('mart')) {
    return { icon: faStore, color: '#10B981', bgColor: '#D1FAE5' };
  }
  if (lowerName.includes('cosmetic') || lowerName.includes('beauty') || lowerName.includes('makeup')) {
    return { icon: faWandMagicSparkles, color: '#F43F5E', bgColor: '#FFE4E6' };
  }
  if (lowerName.includes('dessert') || lowerName.includes('ice cream') || lowerName.includes('sweets')) {
    return { icon: faIceCream, color: '#F472B6', bgColor: '#FCE7F3' };
  }
  if (lowerName.includes('electronic') || lowerName.includes('tech') || lowerName.includes('device')) {
    return { icon: faTv, color: '#3B82F6', bgColor: '#DBEAFE' };
  }
  if (lowerName.includes('fast food') || lowerName.includes('burger')) {
    return { icon: faBurger, color: '#F59E0B', bgColor: '#FEF3C7' };
  }
  if (lowerName.includes('hot pot') || lowerName.includes('soup')) {
    return { icon: faBowlFood, color: '#DC2626', bgColor: '#FEE2E2' };
  }
  if (lowerName.includes('jewel') || lowerName.includes('diamond') || lowerName.includes('gold')) {
    return { icon: faGem, color: '#EAB308', bgColor: '#FEF9C3' };
  }
  if (lowerName.includes('mobile') || lowerName.includes('phone') || lowerName.includes('smartphone')) {
    return { icon: faMobileScreenButton, color: '#6366F1', bgColor: '#EEF2FF' };
  }
  if (lowerName.includes('pizza')) {
    return { icon: faPizzaSlice, color: '#F97316', bgColor: '#FFEDD5' };
  }
  if (lowerName.includes('restaurant') || lowerName.includes('food') || lowerName.includes('dine')) {
    return { icon: faUtensils, color: '#EA580C', bgColor: '#FFEDD5' };
  }
  if (lowerName.includes('seafood') || lowerName.includes('fish')) {
    return { icon: faFish, color: '#0284C7', bgColor: '#E0F2FE' };
  }
  if (lowerName.includes('shoe') || lowerName.includes('footwear')) {
    return { icon: faShoePrints, color: '#475569', bgColor: '#F1F5F9' };
  }
  if (lowerName.includes('supermarket') || lowerName.includes('shopping') || lowerName.includes('market')) {
    return { icon: faCartShopping, color: '#059669', bgColor: '#D1FAE5' };
  }
  if (lowerName.includes('salon') || lowerName.includes('hair') || lowerName.includes('barber')) {
    return { icon: faScissors, color: '#EC4899', bgColor: '#FCE7F3' };
  }
  if (lowerName.includes('health') || lowerName.includes('clinic') || lowerName.includes('hospital') || lowerName.includes('pharmacy')) {
    return { icon: faHeartPulse, color: '#0284C7', bgColor: '#E0F2FE' };
  }
  if (lowerName.includes('car') || lowerName.includes('auto') || lowerName.includes('vehicle') || lowerName.includes('repair')) {
    return { icon: faCar, color: '#F97316', bgColor: '#FFEDD5' };
  }
  if (lowerName.includes('home') || lowerName.includes('furniture') || lowerName.includes('living')) {
    return { icon: faHouse, color: '#8B5CF6', bgColor: '#EDE9FE' };
  }
  if (lowerName.includes('education') || lowerName.includes('school') || lowerName.includes('university')) {
    return { icon: faGraduationCap, color: '#6D28D9', bgColor: '#EDE9FE' };
  }
  if (lowerName.includes('finance') || lowerName.includes('money') || lowerName.includes('bank') || lowerName.includes('insurance')) {
    return { icon: faCoins, color: '#D97706', bgColor: '#FEF3C7' };
  }
  if (lowerName.includes('entertainment') || lowerName.includes('cinema') || lowerName.includes('movie') || lowerName.includes('gym')) {
    return { icon: faFilm, color: '#DB2777', bgColor: '#FCE7F3' };
  }
  if (lowerName.includes('travel') || lowerName.includes('hotel') || lowerName.includes('flight')) {
    return { icon: faPlane, color: '#06B6D4', bgColor: '#CFFAFE' };
  }

  const fallback = PALETTE[index % PALETTE.length];
  return { icon: faTags, color: fallback.color, bgColor: fallback.bgColor };
};

const CategoryScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories from API
  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const url = ENDPOINTS.CATEGORIES.includes('?')
        ? `${ENDPOINTS.CATEGORIES}&page_size=100`
        : `${ENDPOINTS.CATEGORIES}?page_size=100`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const json = await response.json();
      let list = [];
      if (Array.isArray(json)) {
        list = json;
      } else if (json && Array.isArray(json.results)) {
        list = json.results;
      } else if (json && Array.isArray(json.data)) {
        list = json.data;
      }

      const formattedList = list.map((item, index) => {
        const catName = item.name || item.title || 'Unnamed Category';
        const theme = getCategoryTheme(catName, index);

        let subcategories = Array.isArray(item.subcategories)
          ? item.subcategories
          : Array.isArray(item.children)
          ? item.children
          : [];
        
        // Sort subcategories alphabetically
        subcategories = [...subcategories].sort((a, b) => {
          const nameA = typeof a === 'string' ? a : a.name || '';
          const nameB = typeof b === 'string' ? b : b.name || '';
          return nameA.localeCompare(nameB);
        });

        return {
          id: item.id || String(index),
          name: catName,
          imageIcon: item.icon || item.image || null,
          fontAwesomeIcon: theme.icon,
          color: theme.color,
          bgColor: theme.bgColor,
          subcategories: subcategories,
        };
      });

      // Sort categories alphabetically
      formattedList.sort((a, b) => a.name.localeCompare(b.name));

      setCategories(formattedList);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Navigate to Shops screen
  const navigateToShops = (cat) => {
    navigation.navigate('Shops', {
      categoryId: cat.id,
      categoryName: cat.name,
    });
  };

  // Toggle accordion expansion
  const toggleExpand = (catId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase().trim();
    return categories.map((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(query);
      const matchingSubs = cat.subcategories.filter((sub) => {
        const subName = typeof sub === 'string' ? sub : sub.name || '';
        return subName.toLowerCase().includes(query);
      });

      if (nameMatch || matchingSubs.length > 0) {
        return {
          ...cat,
          subcategories: nameMatch ? cat.subcategories : matchingSubs,
        };
      }
      return null;
    }).filter(Boolean);
  }, [categories, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Categories</Text>
            <Text style={styles.headerSubtitle}>
              Tap any category to view shops
            </Text>
          </View>

          <TouchableOpacity
            style={styles.allShopsButton}
            onPress={() => navigation.navigate('Shops')}
          >
            <FontAwesomeIcon icon={faStoreIcon} size={14} color="#FFFFFF" />
            <Text style={styles.allShopsButtonText}>All Shops</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <FontAwesomeIcon icon={faMagnifyingGlass} size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesomeIcon icon={faXmark} size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Fetching categories...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorTitle}>Error Loading Categories</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchCategories()}>
              <FontAwesomeIcon icon={faRotateRight} size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchCategories(true)}
                colors={['#4F46E5']}
              />
            }
          >
            {filteredCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon icon={faTags} size={44} color="#CBD5E1" />
                <Text style={styles.emptyText}>No categories found</Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ? 'Try searching with a different term' : 'No categories available'}
                </Text>
              </View>
            ) : (
              filteredCategories.map((category) => {
                const hasSub = category.subcategories && category.subcategories.length > 0;
                const isExpanded = expandedCategories[category.id] || searchQuery.length > 0;

                return (
                  <View key={category.id} style={styles.categoryCard}>
                    {/* Category Button Header */}
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={[
                        styles.categoryHeader,
                        hasSub && isExpanded && styles.categoryHeaderExpanded,
                      ]}
                      onPress={() => navigateToShops(category)}
                    >
                      <View style={styles.categoryTitleGroup}>
                        <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
                          {category.imageIcon ? (
                            <Image
                              source={{ uri: category.imageIcon }}
                              style={styles.categoryIconImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={category.fontAwesomeIcon}
                              size={18}
                              color={category.color}
                            />
                          )}
                        </View>

                        <View style={styles.titleTextWrapper}>
                          <Text style={styles.categoryTitleText}>{category.name}</Text>
                          {hasSub && (
                            <Text style={styles.categoryCountText}>
                              {category.subcategories.length} sub-categories
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={styles.headerRightActions}>
                        {hasSub && (
                          <TouchableOpacity
                            style={styles.expandButton}
                            onPress={() => toggleExpand(category.id)}
                          >
                            <FontAwesomeIcon
                              icon={isExpanded ? faChevronUp : faChevronDown}
                              size={14}
                              color="#64748B"
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.shopActionButton, { backgroundColor: category.bgColor }]}
                          onPress={() => navigateToShops(category)}
                        >
                          <Text style={[styles.shopActionButtonText, { color: category.color }]}>
                            View Shops
                          </Text>
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            size={11}
                            color={category.color}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Subcategories */}
                    {hasSub && isExpanded && (
                      <View style={styles.subCategoryGrid}>
                        {category.subcategories.map((subItem, idx) => {
                          const subName = typeof subItem === 'string' ? subItem : subItem.name;
                          const subTheme = getCategoryTheme(subName, idx);
                          return (
                            <TouchableOpacity
                              key={idx}
                              activeOpacity={0.7}
                              style={styles.subCategoryButton}
                              onPress={() => navigateToShops(category)}
                            >
                              <View style={[styles.subIconContainer, { backgroundColor: subTheme.bgColor }]}>
                                <FontAwesomeIcon icon={subTheme.icon} size={12} color={subTheme.color} />
                              </View>
                              <Text style={styles.subCategoryButtonText}>{subName}</Text>
                              <FontAwesomeIcon icon={faChevronRight} size={10} color="#94A3B8" />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CategoryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  allShopsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  allShopsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 6,
  },
  errorSubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconImage: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  titleTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  categoryTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryCountText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 6,
  },
  shopActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  shopActionButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  subCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: '47%',
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  subIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCategoryButtonText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
