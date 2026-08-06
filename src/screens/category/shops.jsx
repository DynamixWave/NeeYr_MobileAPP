import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Linking,
  Modal,
  ScrollView,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons/faRotateRight';
import { faBuilding } from '@fortawesome/free-solid-svg-icons/faBuilding';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faMapPin } from '@fortawesome/free-solid-svg-icons/faMapPin';
import { faCity } from '@fortawesome/free-solid-svg-icons/faCity';
import ENDPOINTS from '../../endpoint/endpoints';
import { getRegions, getCities } from '../../utils/lookupCache';

const ShopsScreen = ({ route, navigation }) => {
  const { categoryId, categoryName } = route?.params || {};

  // Data states
  const [branches, setBranches] = useState([]);
  const [brands, setBrands] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [images, setImages] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);

  // UI status & Filter states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter selections
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Dropdown Picker Modal states
  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);

  // Safe array extraction helper
  const extractArray = (resData) => {
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.results)) return resData.results;
    if (resData && Array.isArray(resData.data)) return resData.data;
    return [];
  };

  // Main data fetching logic from all required endpoints
  const fetchShopData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const sortByName = (list) =>
      [...(list || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    try {
      const [branchesRes, brandsRes, imagesRes, socialRes, regionsResult, citiesResult] =
        await Promise.all([
          fetch(`${ENDPOINTS.BRANCHES}?page_size=100`).then((r) => r.json()),
          fetch(`${ENDPOINTS.BUSINESS_BRANDS}?page_size=100`).then((r) => r.json()),
          fetch(`${ENDPOINTS.BRANCH_IMAGES}?page_size=100`).then((r) => r.json()),
          fetch(`${ENDPOINTS.BRANCH_SOCIAL_LINKS}?page_size=100`).then((r) => r.json()),
          getRegions({
            forceRefresh: isRefresh,
            onCacheHit: (cached) => setRegions(sortByName(cached)),
          }),
          getCities({
            forceRefresh: isRefresh,
            onCacheHit: (cached) => setCities(sortByName(cached)),
          }),
        ]);

      setBranches(extractArray(branchesRes));
      setBrands(extractArray(brandsRes));
      setImages(extractArray(imagesRes));
      setSocialLinks(extractArray(socialRes));
      setRegions(sortByName(regionsResult.data));
      setCities(sortByName(citiesResult.data));
    } catch (err) {
      console.error('Error fetching shops data:', err);
      setError('Failed to load shop listings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShopData();
  }, [fetchShopData]);

  // Combine branch records with brand, image, city, region, and social link details
  const processedShops = useMemo(() => {
    return branches.map((branch) => {
      const brand = brands.find(
        (b) => b.id === branch.brand || b.id === branch.business_brand
      );

      const branchCategory =
        branch.category || branch.category_id || (brand ? brand.category : null);

      const cityObj = cities.find(
        (c) => c.id === branch.city || c.id === branch.city_id
      );

      const regionIdFromCity = cityObj
        ? cityObj.region || cityObj.region_id || cityObj.state
        : null;

      const regionObj = regions.find(
        (r) =>
          r.id === branch.region ||
          r.id === branch.region_id ||
          r.id === regionIdFromCity
      );

      const cityName = cityObj ? cityObj.name : branch.city_name || '';
      const regionName = regionObj ? regionObj.name : branch.region_name || '';

      const branchImgList = images.filter(
        (img) => img.branch === branch.id || img.branch_id === branch.id
      );
      const primaryImage =
        branchImgList.length > 0
          ? branchImgList[0].image || branchImgList[0].file
          : branch.image || (brand ? brand.logo || brand.image : null);

      const branchSocials = socialLinks.filter(
        (soc) => soc.branch === branch.id || soc.branch_id === branch.id
      );

      return {
        id: branch.id,
        name: branch.name || branch.branch_name || (brand ? brand.name : 'Shop Branch'),
        brandName: brand ? brand.name : null,
        categoryId: branchCategory,
        cityId: cityObj ? cityObj.id : branch.city || branch.city_id,
        cityName,
        regionId: regionObj ? regionObj.id : regionIdFromCity,
        regionName,
        address: branch.address || branch.location || '',
        phone: branch.phone || branch.phone_number || (brand ? brand.phone : ''),
        image: primaryImage,
        socials: branchSocials,
        openingHours: branch.opening_hours || branch.hours || 'Open Daily',
        rawBranch: branch,
      };
    });
  }, [branches, brands, cities, regions, images, socialLinks]);

  // Cities filtered dynamically based on selected Region
  const filteredCitiesForDropdown = useMemo(() => {
    if (!selectedRegionId) return cities;
    return cities.filter((city) => {
      const regId = city.region || city.region_id || city.state;
      return String(regId) === String(selectedRegionId);
    });
  }, [cities, selectedRegionId]);

  // Filter shops by categoryId, search query (name/brand), selectedRegionId, and selectedCityId
  const filteredShops = useMemo(() => {
    return processedShops.filter((shop) => {
      // Category Filter
      if (categoryId && shop.categoryId) {
        const matchesCategory =
          String(shop.categoryId) === String(categoryId) ||
          (typeof shop.categoryId === 'object' && shop.categoryId.id === categoryId);
        if (!matchesCategory) return false;
      }

      // Region Filter
      if (selectedRegionId && shop.regionId) {
        if (String(shop.regionId) !== String(selectedRegionId)) {
          return false;
        }
      }

      // City Filter
      if (selectedCityId && shop.cityId) {
        if (String(shop.cityId) !== String(selectedCityId)) {
          return false;
        }
      }

      // Name / Brand Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = shop.name && shop.name.toLowerCase().includes(q);
        const brandMatch = shop.brandName && shop.brandName.toLowerCase().includes(q);
        const addressMatch = shop.address && shop.address.toLowerCase().includes(q);
        return nameMatch || brandMatch || addressMatch;
      }

      return true;
    });
  }, [processedShops, categoryId, searchQuery, selectedRegionId, selectedCityId]);

  // Selected Region & City Labels for Dropdown Display
  const selectedRegionObj = useMemo(
    () => regions.find((r) => r.id === selectedRegionId),
    [regions, selectedRegionId]
  );

  const selectedCityObj = useMemo(
    () => cities.find((c) => c.id === selectedCityId),
    [cities, selectedCityId]
  );

  // Open external links
  const openLink = (url) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') || url.startsWith('tel:') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) =>
      console.warn('Could not open link:', err)
    );
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRegionId(null);
    setSelectedCityId(null);
  };

  // Render individual Shop Card
  const renderShopCard = ({ item }) => {
    return (
      <View style={styles.shopCard}>
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.shopImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesomeIcon icon={faStore} size={36} color="#CBD5E1" />
            </View>
          )}
          {categoryName && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
          )}
        </View>

        {/* Card Details */}
        <View style={styles.cardContent}>
          <Text style={styles.shopTitle}>{item.name}</Text>
          {item.brandName && item.brandName !== item.name && (
            <View style={styles.brandRow}>
              <FontAwesomeIcon icon={faBuilding} size={12} color="#64748B" />
              <Text style={styles.brandText}>{item.brandName}</Text>
            </View>
          )}

          {/* Location info */}
          {(item.cityName || item.regionName || item.address) && (
            <View style={styles.locationRow}>
              <FontAwesomeIcon icon={faLocationDot} size={14} color="#EF4444" style={styles.locationIcon} />
              <Text style={styles.locationText} numberOfLines={2}>
                {[item.cityName, item.regionName, item.address].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Opening Hours */}
          {item.openingHours && (
            <Text style={styles.hoursText}>🕒 {item.openingHours}</Text>
          )}

          {/* Footer Actions */}
          <View style={styles.cardFooter}>
            {item.phone ? (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => openLink(`tel:${item.phone}`)}
              >
                <FontAwesomeIcon icon={faPhone} size={12} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            ) : null}

            {item.socials && item.socials.length > 0 && (
              <View style={styles.socialIconsRow}>
                {item.socials.map((soc, idx) => (
                  <TouchableOpacity
                    key={soc.id || idx}
                    style={styles.socialChip}
                    onPress={() => openLink(soc.url || soc.link)}
                  >
                    <FontAwesomeIcon icon={faGlobe} size={12} color="#4F46E5" />
                    <Text style={styles.socialText} numberOfLines={1}>
                      {soc.platform || soc.name || 'Link'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const hasActiveFilters = searchQuery || selectedRegionId || selectedCityId;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesomeIcon icon={faArrowLeft} size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {categoryName ? `${categoryName} Shops` : 'All Shops'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {filteredShops.length} locations available
            </Text>
          </View>
        </View>

        {/* Filter Section: Search Input + Region & City Dropdown Menus */}
        <View style={styles.filterSection}>
          {/* Normal Name Search Bar */}
          <View style={styles.searchBar}>
            <FontAwesomeIcon icon={faMagnifyingGlass} size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search shop or brand name..."
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

          {/* Dropdown Menus Row for Region & City */}
          <View style={styles.dropdownRow}>
            {/* Region Dropdown Trigger */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                selectedRegionId && styles.dropdownTriggerActive,
              ]}
              onPress={() => setIsRegionPickerOpen(true)}
            >
              <FontAwesomeIcon
                icon={faMapPin}
                size={14}
                color={selectedRegionId ? '#4F46E5' : '#64748B'}
              />
              <Text
                style={[
                  styles.dropdownTriggerText,
                  selectedRegionId && styles.dropdownTriggerTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedRegionObj ? selectedRegionObj.name : 'All Regions'}
              </Text>
              <FontAwesomeIcon icon={faChevronDown} size={12} color="#94A3B8" />
            </TouchableOpacity>

            {/* City Dropdown Trigger */}
            <TouchableOpacity
              style={[
                styles.dropdownTrigger,
                selectedCityId && styles.dropdownTriggerActive,
              ]}
              onPress={() => setIsCityPickerOpen(true)}
            >
              <FontAwesomeIcon
                icon={faCity}
                size={14}
                color={selectedCityId ? '#4F46E5' : '#64748B'}
              />
              <Text
                style={[
                  styles.dropdownTriggerText,
                  selectedCityId && styles.dropdownTriggerTextActive,
                ]}
                numberOfLines={1}
              >
                {selectedCityObj ? selectedCityObj.name : 'All Cities'}
              </Text>
              <FontAwesomeIcon icon={faChevronDown} size={12} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Active Filter Indicators & Reset Action */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersRow}>
              <Text style={styles.activeFilterCount}>
                Active Filters: {[
                  selectedRegionObj?.name,
                  selectedCityObj?.name,
                  searchQuery ? `"${searchQuery}"` : null,
                ].filter(Boolean).join(' • ')}
              </Text>

              <TouchableOpacity style={styles.resetFilterButton} onPress={resetFilters}>
                <FontAwesomeIcon icon={faRotateRight} size={11} color="#EF4444" />
                <Text style={styles.resetFilterText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Shop List / Loading / Error State */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.stateText}>Loading shops & locations...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Error Loading Shops</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchShopData()}
            >
              <FontAwesomeIcon icon={faRotateRight} size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredShops}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderShopCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchShopData(true)}
                colors={['#4F46E5']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon icon={faStore} size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No shops found</Text>
                <Text style={styles.emptySubtext}>
                  {hasActiveFilters
                    ? 'No shops match your selected region, city, or search terms.'
                    : categoryName
                    ? `No shops currently listed under "${categoryName}".`
                    : 'No shops currently available.'}
                </Text>
                {hasActiveFilters && (
                  <TouchableOpacity style={styles.clearSearchButton} onPress={resetFilters}>
                    <Text style={styles.clearSearchText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}

        {/* Region Dropdown Picker Modal */}
        <Modal
          visible={isRegionPickerOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsRegionPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <FontAwesomeIcon icon={faMapPin} size={16} color="#4F46E5" />
                  <Text style={styles.modalTitle}>Select Region</Text>
                </View>
                <TouchableOpacity onPress={() => setIsRegionPickerOpen(false)}>
                  <FontAwesomeIcon icon={faXmark} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalList}>
                {/* Option: All Regions */}
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedRegionId === null && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedRegionId(null);
                    // Reset city selection if region changes
                    setSelectedCityId(null);
                    setIsRegionPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedRegionId === null && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    All Regions
                  </Text>
                  {selectedRegionId === null && (
                    <FontAwesomeIcon icon={faCheck} size={14} color="#4F46E5" />
                  )}
                </TouchableOpacity>

                {regions.map((reg) => {
                  const isSelected = selectedRegionId === reg.id;
                  return (
                    <TouchableOpacity
                      key={reg.id}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedRegionId(reg.id);
                        // Reset city if current city doesn't belong to selected region
                        setSelectedCityId(null);
                        setIsRegionPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {reg.name}
                      </Text>
                      {isSelected && (
                        <FontAwesomeIcon icon={faCheck} size={14} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* City Dropdown Picker Modal */}
        <Modal
          visible={isCityPickerOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsCityPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <FontAwesomeIcon icon={faCity} size={16} color="#4F46E5" />
                  <Text style={styles.modalTitle}>
                    Select City {selectedRegionObj ? `(${selectedRegionObj.name})` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsCityPickerOpen(false)}>
                  <FontAwesomeIcon icon={faXmark} size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalList}>
                {/* Option: All Cities */}
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedCityId === null && styles.dropdownOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCityId(null);
                    setIsCityPickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      selectedCityId === null && styles.dropdownOptionTextSelected,
                    ]}
                  >
                    All Cities
                  </Text>
                  {selectedCityId === null && (
                    <FontAwesomeIcon icon={faCheck} size={14} color="#4F46E5" />
                  )}
                </TouchableOpacity>

                {filteredCitiesForDropdown.map((city) => {
                  const isSelected = selectedCityId === city.id;
                  return (
                    <TouchableOpacity
                      key={city.id}
                      style={[
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedCityId(city.id);
                        setIsCityPickerOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}
                      >
                        {city.name}
                      </Text>
                      {isSelected && (
                        <FontAwesomeIcon icon={faCheck} size={14} color="#4F46E5" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default ShopsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  dropdownRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  dropdownTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  dropdownTriggerActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dropdownTriggerTextActive: {
    color: '#4F46E5',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeFilterCount: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  resetFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 150,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    padding: 16,
  },
  shopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  brandText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  hoursText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  socialIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  socialText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
    maxWidth: 90,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  stateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  clearSearchText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalList: {
    marginTop: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  dropdownOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
