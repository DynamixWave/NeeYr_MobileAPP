import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Image,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import ENDPOINTS from '../../endpoint/endpoints';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_PADDING = 20;
const AUTO_SCROLL_MS = 4000;
const PAGE_SIZE = 10;

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (String(url).startsWith('http')) return url;
  return `https://apineeyrdirectory.fothubtv.com${url}`;
};

const mapBrandToShop = (brand, images = []) => {
  const branches = Array.isArray(brand.branches) ? brand.branches : [];
  const firstBranch = branches[0];

  const branchImages = firstBranch
    ? images.filter(
        (img) =>
          img.branch === firstBranch.id || img.branch_id === firstBranch.id
      )
    : [];

  const image = resolveImageUrl(
    branchImages[0]?.image ||
      branchImages[0]?.file ||
      brand.logo ||
      brand.image
  );

  const cityName =
    firstBranch?.city_detail?.name || firstBranch?.city_name || '';
  const regionName =
    firstBranch?.city_detail?.region_detail?.name ||
    firstBranch?.region_name ||
    '';

  return {
    id: brand.id,
    name: brand.name || 'Untitled Shop',
    description: brand.description || '',
    categoryName: brand.category_detail?.name || 'Uncategorized',
    categoryId: brand.category || brand.category_detail?.id || null,
    image,
    location: [cityName, regionName].filter(Boolean).join(', '),
    address: firstBranch?.address || '',
    phone: firstBranch?.phone_number || '',
    branchCount: branches.length,
  };
};

const HomeScreen = ({ navigation }) => {
  const [shops, setShops] = useState([]);
  const [branchImages, setBranchImages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const carouselRef = useRef(null);
  const activeIndexRef = useRef(0);
  const autoScrollRef = useRef(null);
  const pageRef = useRef(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchShops = useCallback(async (pageNum = 1, options = {}) => {
    const { isRefresh = false, isPageChange = false } = options;

    if (isRefresh) {
      setRefreshing(true);
    } else if (isPageChange) {
      setPageLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const imagesPromise =
        branchImages.length > 0 && !isRefresh
          ? Promise.resolve(branchImages)
          : fetch(`${ENDPOINTS.BRANCH_IMAGES}?page_size=100`)
              .then((r) => r.json())
              .then(extractArray)
              .catch(() => []);

      const [brandsJson, images] = await Promise.all([
        fetch(
          `${ENDPOINTS.BUSINESS_BRANDS}?page=${pageNum}&page_size=${PAGE_SIZE}`
        ).then((r) => r.json()),
        imagesPromise,
      ]);

      if (Array.isArray(images) && (branchImages.length === 0 || isRefresh)) {
        setBranchImages(images);
      }

      const brands = extractArray(brandsJson);
      const mapped = brands.map((brand) => mapBrandToShop(brand, images));

      setShops(mapped);
      setPage(pageNum);
      pageRef.current = pageNum;
      setTotalCount(brandsJson?.count ?? mapped.length);
      setHasNext(!!brandsJson?.next);
      setHasPrevious(!!brandsJson?.previous);
      setActiveIndex(0);
      activeIndexRef.current = 0;
    } catch (err) {
      console.error('Failed to fetch home shops:', err);
      setError('Failed to load shops. Please try again.');
    } finally {
      setLoading(false);
      setPageLoading(false);
      setRefreshing(false);
    }
  }, [branchImages]);

  useFocusEffect(
    useCallback(() => {
      fetchShops(1);
    }, [])
  );

  const displayedShops = searchQuery.trim()
    ? shops.filter((shop) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          shop.name.toLowerCase().includes(q) ||
          shop.categoryName.toLowerCase().includes(q) ||
          shop.location.toLowerCase().includes(q) ||
          shop.address.toLowerCase().includes(q)
        );
      })
    : shops;

  // Keep index in range when displayed list / page changes
  useEffect(() => {
    if (displayedShops.length === 0) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
      return;
    }
    if (activeIndexRef.current >= displayedShops.length) {
      setActiveIndex(0);
      activeIndexRef.current = 0;
      carouselRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [displayedShops.length, page]);

  // Auto-scroll carousel (current page shops)
  useEffect(() => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }

    if (displayedShops.length <= 1) return undefined;

    autoScrollRef.current = setInterval(() => {
      const next = (activeIndexRef.current + 1) % displayedShops.length;
      activeIndexRef.current = next;
      setActiveIndex(next);
      carouselRef.current?.scrollTo({
        x: next * SCREEN_WIDTH,
        animated: true,
      });
    }, AUTO_SCROLL_MS);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [displayedShops.length, page]);

  const onCarouselScrollEnd = (event) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );
    if (index >= 0 && index < displayedShops.length) {
      activeIndexRef.current = index;
      setActiveIndex(index);
    }
  };

  const openShopCategory = (shop) => {
    if (!shop.categoryId) return;
    navigation.navigate('Shops', {
      categoryId: shop.categoryId,
      categoryName: shop.categoryName,
    });
  };

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === pageRef.current) {
      return;
    }
    setSearchQuery('');
    fetchShops(nextPage, { isPageChange: true });
  };

  const renderCarouselItem = (item) => (
    <View key={item.id} style={styles.carouselPage}>
      <TouchableOpacity
        style={styles.carouselCard}
        activeOpacity={0.9}
        onPress={() => openShopCategory(item)}
      >
        <View style={styles.imageWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.carouselImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FontAwesomeIcon icon={faStore} size={42} color="#CBD5E1" />
            </View>
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.categoryName}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.name}
          </Text>

          {(item.location || item.address) ? (
            <View style={styles.metaRow}>
              <FontAwesomeIcon icon={faLocationDot} size={12} color="#EF4444" />
              <Text style={styles.metaText} numberOfLines={1}>
                {[item.location, item.address].filter(Boolean).join(' · ')}
              </Text>
            </View>
          ) : null}

          {item.phone ? (
            <View style={styles.metaRow}>
              <FontAwesomeIcon icon={faPhone} size={12} color="#007BFF" />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderShopRow = ({ item }) => (
    <TouchableOpacity
      style={styles.shopRow}
      activeOpacity={0.85}
      onPress={() => openShopCategory(item)}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.shopThumb} />
      ) : (
        <View style={styles.shopThumbPlaceholder}>
          <FontAwesomeIcon icon={faStore} size={18} color="#007BFF" />
        </View>
      )}

      <View style={styles.shopRowInfo}>
        <Text style={styles.shopRowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.shopRowCategory}>{item.categoryName}</Text>
        {(item.location || item.address) ? (
          <View style={styles.metaRow}>
            <FontAwesomeIcon icon={faLocationDot} size={11} color="#EF4444" />
            <Text style={styles.shopRowMeta} numberOfLines={1}>
              {[item.location, item.address].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}
        {item.phone ? (
          <Text style={styles.shopRowMeta}>{item.phone}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    if (totalCount === 0) return null;

    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageBtn, (!hasPrevious || pageLoading) && styles.pageBtnDisabled]}
          onPress={() => goToPage(page - 1)}
          disabled={!hasPrevious || pageLoading}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            size={12}
            color={!hasPrevious || pageLoading ? '#AAA' : '#007BFF'}
          />
        </TouchableOpacity>

        {pages.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.pageNumber, p === page && styles.pageNumberActive]}
            onPress={() => goToPage(p)}
            disabled={pageLoading || p === page}
          >
            <Text
              style={[
                styles.pageNumberText,
                p === page && styles.pageNumberTextActive,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.pageBtn, (!hasNext || pageLoading) && styles.pageBtnDisabled]}
          onPress={() => goToPage(page + 1)}
          disabled={!hasNext || pageLoading}
        >
          <FontAwesomeIcon
            icon={faChevronRight}
            size={12}
            color={!hasNext || pageLoading ? '#AAA' : '#007BFF'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const ListHeader = (
    <>
      <View style={styles.headerContainer}>
        <Image
          source={require('../../assets/image/Logo.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to NeeYr</Text>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesomeIcon icon={faMagnifyingGlass} size={14} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops on this page..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <TouchableOpacity
          onPress={() => fetchShops(page, { isRefresh: true })}
          disabled={refreshing}
        >
          <Text style={styles.refreshText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.carouselLoading}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : error ? (
        <View style={styles.carouselLoading}>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchShops(1)}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : displayedShops.length === 0 ? (
        <View style={styles.carouselLoading}>
          <FontAwesomeIcon icon={faStore} size={32} color="#CBD5E1" />
          <Text style={styles.stateText}>
            {searchQuery ? 'No shops match your search' : 'No shops available yet'}
          </Text>
        </View>
      ) : (
        <View style={styles.carouselSection}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={onCarouselScrollEnd}
          >
            {displayedShops.map((shop) => renderCarouselItem(shop))}
          </ScrollView>

          <View style={styles.dotsRow}>
            {displayedShops.slice(0, 10).map((shop, index) => (
              <View
                key={shop.id}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Text style={styles.counterText}>
            {Math.min(activeIndex + 1, displayedShops.length)} /{' '}
            {displayedShops.length}
          </Text>
        </View>
      )}

      <View style={[styles.sectionHeader, styles.listSectionHeader]}>
        <Text style={styles.sectionTitle}>
          All Shops
          {totalCount > 0 ? ` (${totalCount})` : ''}
        </Text>
        <Text style={styles.pageInfo}>
          Page {page} of {totalPages}
        </Text>
      </View>

      {pageLoading ? (
        <ActivityIndicator
          size="small"
          color="#007BFF"
          style={{ marginVertical: 12 }}
        />
      ) : null}
    </>
  );

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <FlatList
        data={loading || error ? [] : displayedShops}
        keyExtractor={(item) => `list-${item.id}`}
        renderItem={renderShopRow}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={
          !loading && !error ? (
            <View style={styles.footer}>
              {renderPagination()}
              <Text style={styles.footerHint}>
                Showing {displayedShops.length} of {totalCount} shops · {PAGE_SIZE}{' '}
                per page
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && !error ? (
            <Text style={styles.emptyListText}>No shops on this page</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    paddingBottom: 28,
  },
  headerContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    marginLeft: 10,
  },
  logo: {
    width: 48,
    height: 48,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 20,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listSectionHeader: {
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pageInfo: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007BFF',
  },
  carouselLoading: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 12,
    color: '#666',
    textAlign: 'center',
    fontSize: 14,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: '#007BFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  carouselSection: {
    marginBottom: 4,
  },
  carouselPage: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CAROUSEL_PADDING,
  },
  carouselCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  imageWrap: {
    width: '100%',
    height: 170,
    backgroundColor: '#E2E8F0',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,123,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
  },
  shopName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#D0D5DD',
    marginHorizontal: 3,
    marginVertical: 2,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#007BFF',
  },
  counterText: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  shopRow: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  shopThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  shopThumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopRowInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  shopRowCategory: {
    fontSize: 12,
    color: '#007BFF',
    marginTop: 2,
    marginBottom: 4,
    fontWeight: '600',
  },
  shopRowMeta: {
    marginLeft: 5,
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  emptyListText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 20,
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageNumber: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  pageNumberActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },
  footerHint: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    color: '#888',
  },
});
