import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import ENDPOINTS from '../../endpoint/endpoints';
import {
  getCategories,
  getRegions,
  getCities,
  getProfile,
  setProfileCache,
} from '../../utils/lookupCache';

const getAuthHeader = async () => {
  const storedToken = await AsyncStorage.getItem('bearer_token');
  if (!storedToken) return null;
  if (storedToken.includes(' ')) return storedToken;
  return storedToken.startsWith('eyJ')
    ? `Bearer ${storedToken}`
    : `Token ${storedToken}`;
};

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const normalizeShopName = (name = '') =>
  String(name).trim().toLowerCase().replace(/\s+/g, ' ');

const CreateShopScreen = ({ navigation }) => {
  const [shopName, setShopName] = useState('');
  // const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Snapshot of values from /profile/ — used to detect edits that need profile/update/
  const [originalBusinessName, setOriginalBusinessName] = useState('');
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState('');

  const [ownerId, setOwnerId] = useState(null);
  const [existingShopNames, setExistingShopNames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isRegionPickerOpen, setIsRegionPickerOpen] = useState(false);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLinks, setSocialLinks] = useState([
    { key: '1', platform_name: '', url: '' },
  ]);

  const addSocialLinkRow = () => {
    setSocialLinks((prev) => [
      ...prev,
      { key: String(Date.now()), platform_name: '', url: '' },
    ]);
  };

  const removeSocialLinkRow = (key) => {
    setSocialLinks((prev) => {
      if (prev.length <= 1) {
        return [{ key: String(Date.now()), platform_name: '', url: '' }];
      }
      return prev.filter((row) => row.key !== key);
    });
  };

  const updateSocialLinkRow = (key, field, value) => {
    setSocialLinks((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const getFilledSocialLinks = () =>
    socialLinks
      .map((row) => ({
        platform_name: (row.platform_name || '').trim(),
        url: (row.url || '').trim(),
      }))
      .filter((row) => row.platform_name && row.url);

  const fetchOwnerShopNames = async (currentOwnerId, authHeader) => {
    if (!currentOwnerId) return [];

    try {
      const response = await fetch(`${ENDPOINTS.BUSINESS_BRANDS}?page_size=100`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) return [];

      return extractArray(data)
        .filter((brand) => String(brand.owner) === String(currentOwnerId))
        .map((brand) => brand.name || '')
        .filter(Boolean);
    } catch (err) {
      console.warn('Failed to load owner shops for duplicate check:', err);
      return [];
    }
  };

  const isDuplicateShopName = (name, names = existingShopNames) => {
    const normalized = normalizeShopName(name);
    if (!normalized) return false;
    return names.some((existing) => normalizeShopName(existing) === normalized);
  };

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        Alert.alert('Error', 'Please log in again');
        navigation.goBack();
        return;
      }

      const sortByName = (list) =>
        [...(list || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      const [categoriesResult, regionsResult, citiesResult, profileResult] =
        await Promise.all([
          getCategories({
            onCacheHit: (cached) => setCategories(sortByName(cached)),
          }),
          getRegions({
            onCacheHit: (cached) => setRegions(sortByName(cached)),
          }),
          getCities({
            onCacheHit: (cached) => setCities(sortByName(cached)),
          }),
          getProfile(authHeader, {
            onCacheHit: (cached) => {
              const owner = cached?.owner;
              if (!owner?.id) return;
              setOwnerId(owner.id);
              setShopName(owner.business_name || '');
              setPhoneNumber(owner.phone_number || '');
              setOriginalBusinessName(owner.business_name || '');
              setOriginalPhoneNumber(owner.phone_number || '');
            },
          }),
        ]);

      setCategories(sortByName(categoriesResult.data));
      setRegions(sortByName(regionsResult.data));
      setCities(sortByName(citiesResult.data));

      const owner = profileResult?.data?.owner;
      if (!owner?.id) {
        Alert.alert('Error', 'Business owner profile not found.');
        navigation.goBack();
        return;
      }

      const businessName = owner.business_name || '';
      const phone = owner.phone_number || '';

      setOwnerId(owner.id);
      setShopName(businessName);
      setPhoneNumber(phone);
      setOriginalBusinessName(businessName);
      setOriginalPhoneNumber(phone);

      const ownerShopNames = await fetchOwnerShopNames(owner.id, authHeader);
      setExistingShopNames(ownerShopNames);
    } catch (err) {
      console.error('Failed to load create-shop options:', err);
      Alert.alert('Error', 'Failed to load profile, categories, regions, or cities.');
    } finally {
      setLoadingOptions(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const filteredCities = useMemo(() => {
    if (!selectedRegionId) return cities;
    return cities.filter((city) => {
      const regId = city.region || city.region_id || city.state;
      return String(regId) === String(selectedRegionId);
    });
  }, [cities, selectedRegionId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedRegion = regions.find((r) => r.id === selectedRegionId);
  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const shopNameIsDuplicate = isDuplicateShopName(shopName);

  const formatApiError = (data, fallback) => {
    if (data?.details) {
      return Object.entries(data.details)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('\n');
    }
    return data?.error || data?.detail || data?.message || fallback;
  };

  const handleCreate = async () => {
    const trimmedName = shopName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a shop / business name');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!selectedRegionId) {
      Alert.alert('Error', 'Please select a region');
      return;
    }
    if (!selectedCityId) {
      Alert.alert('Error', 'Please select a city');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address');
      return;
    }
    if (!trimmedPhone) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    if (!ownerId) {
      Alert.alert('Error', 'Business owner profile not found. Please try again.');
      return;
    }

    const lat = latitude.trim() || '0';
    const lng = longitude.trim() || '0';
    const profileChanged =
      trimmedName !== (originalBusinessName || '').trim() ||
      trimmedPhone !== (originalPhoneNumber || '').trim();

    setIsSubmitting(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      // Re-check latest shops for this owner only (other users can reuse the same name)
      const latestOwnerShopNames = await fetchOwnerShopNames(ownerId, authHeader);
      setExistingShopNames(latestOwnerShopNames);

      if (isDuplicateShopName(trimmedName, latestOwnerShopNames)) {
        Alert.alert(
          'Duplicate Shop Name',
          'You already have a shop with this name. Please use a different shop name.'
        );
        return;
      }

      const headers = {
        Accept: 'application/json',
        Authorization: authHeader,
      };

      // If shop name (business_name) or phone changed, update owner profile first
      if (profileChanged) {
        const profileForm = new FormData();
        profileForm.append('business_name', trimmedName);
        profileForm.append('phone_number', trimmedPhone);

        const profileResponse = await fetch(ENDPOINTS.PROFILE_UPDATE, {
          method: 'PATCH',
          headers,
          body: profileForm,
        });
        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          Alert.alert(
            'Error',
            formatApiError(profileData, 'Failed to update profile')
          );
          return;
        }

        // Keep profile cache in sync after owner_profile_update
        if (profileData?.owner) {
          await setProfileCache(profileData);
        } else {
          await setProfileCache({
            owner: {
              id: ownerId,
              business_name: trimmedName,
              phone_number: trimmedPhone,
            },
          });
        }

        setOriginalBusinessName(trimmedName);
        setOriginalPhoneNumber(trimmedPhone);
      }

      const brandForm = new FormData();
      brandForm.append('name', trimmedName);
      brandForm.append('category', selectedCategoryId);
      brandForm.append('owner', ownerId);
      // if (description.trim()) {
      //   brandForm.append('description', description.trim());
      // }

      const brandResponse = await fetch(ENDPOINTS.BUSINESS_BRAND_CREATE, {
        method: 'POST',
        headers,
        body: brandForm,
      });
      const brandData = await brandResponse.json();

      if (!brandResponse.ok) {
        Alert.alert(
          'Error',
          formatApiError(brandData, 'Failed to create shop brand')
        );
        return;
      }

      const brandId =
        brandData?.business_brand?.id ||
        brandData?.id ||
        brandData?.data?.id;

      if (!brandId) {
        Alert.alert('Success', 'Shop brand created, but branch could not be linked.');
        navigation.goBack();
        return;
      }

      const branchForm = new FormData();
      branchForm.append('brand', brandId);
      branchForm.append('city', selectedCityId);
      branchForm.append('branch_name', trimmedName);
      branchForm.append('address', address.trim());
      branchForm.append('phone_number', trimmedPhone);
      branchForm.append('latitude', lat);
      branchForm.append('longitude', lng);

      const branchResponse = await fetch(ENDPOINTS.BRANCH_CREATE, {
        method: 'POST',
        headers,
        body: branchForm,
      });
      const branchData = await branchResponse.json();

      if (!branchResponse.ok) {
        Alert.alert(
          'Partial Success',
          `Shop brand was created, but location failed:\n${formatApiError(
            branchData,
            'Unknown error'
          )}`
        );
        navigation.goBack();
        return;
      }

      const branchId =
        branchData?.branch?.id ||
        branchData?.id ||
        branchData?.data?.id;

      const linksToCreate = getFilledSocialLinks();
      let socialFailed = 0;

      if (branchId && linksToCreate.length > 0) {
        for (const link of linksToCreate) {
          try {
            // API requires exact field names: platform_name, url (+ branch)
            const socialResponse = await fetch(ENDPOINTS.BRANCH_SOCIAL_LINK_CREATE, {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
              },
              body: JSON.stringify({
                platform_name: link.platform_name,
                url: link.url,
                branch: branchId,
              }),
            });

            if (!socialResponse.ok) {
              socialFailed += 1;
              const socialErr = await socialResponse.json().catch(() => ({}));
              console.warn('Social link create failed:', socialErr);
            }
          } catch (socialErr) {
            socialFailed += 1;
            console.warn('Social link create error:', socialErr);
          }
        }
      }

      if (socialFailed > 0) {
        Alert.alert(
          'Shop Created',
          `Shop was created, but ${socialFailed} social link(s) could not be saved.`
        );
      } else {
        Alert.alert('Success', 'Shop created successfully!');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Create shop error:', error);
      Alert.alert('Error', 'Network request failed. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPickerModal = ({
    visible,
    onClose,
    title,
    options,
    selectedId,
    onSelect,
    emptyText,
  }) => (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesomeIcon icon={faXmark} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.length === 0 ? (
              <Text style={styles.emptyPickerText}>{emptyText}</Text>
            ) : (
              options.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => onSelect(item.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheck} size={14} color="#007BFF" />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Shop</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loadingOptions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading form options...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            Shop name and phone come from your owner profile. Editing them updates
            your profile before creating the shop.
          </Text>

          <Text style={styles.label}>Shop Name (Business Name) *</Text>
          <TextInput
            style={[styles.input, shopNameIsDuplicate && styles.inputError]}
            placeholder="Loaded from your profile"
            value={shopName}
            onChangeText={setShopName}
            placeholderTextColor="#949494"
          />
          {shopNameIsDuplicate ? (
            <Text style={styles.duplicateHint}>
              You already have a shop with this name. Choose a different one.
            </Text>
          ) : null}

          {/* <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Short description of your shop"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#949494"
            multiline
            numberOfLines={3}
          /> */}

          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setIsCategoryPickerOpen(true)}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedCategory && styles.selectorPlaceholder,
              ]}
            >
              {selectedCategory?.name || 'Select category'}
            </Text>
            <FontAwesomeIcon icon={faChevronDown} size={14} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Region *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setIsRegionPickerOpen(true)}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedRegion && styles.selectorPlaceholder,
              ]}
            >
              {selectedRegion?.name || 'Select region'}
            </Text>
            <FontAwesomeIcon icon={faChevronDown} size={14} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>City *</Text>
          <TouchableOpacity
            style={[styles.selector, !selectedRegionId && styles.selectorDisabled]}
            onPress={() => {
              if (!selectedRegionId) {
                Alert.alert('Select Region', 'Please select a region first');
                return;
              }
              setIsCityPickerOpen(true);
            }}
          >
            <Text
              style={[
                styles.selectorText,
                !selectedCity && styles.selectorPlaceholder,
              ]}
            >
              {selectedCity?.name || 'Select city'}
            </Text>
            <FontAwesomeIcon icon={faChevronDown} size={14} color="#666" />
          </TouchableOpacity>

          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Street / landmark"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#949494"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 09960408001"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholderTextColor="#949494"
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                placeholderTextColor="#949494"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                placeholderTextColor="#949494"
              />
            </View>
          </View>

          <View style={styles.socialHeader}>
            <Text style={styles.label}>Social Links</Text>
            <TouchableOpacity style={styles.addSocialButton} onPress={addSocialLinkRow}>
              <FontAwesomeIcon icon={faPlus} size={12} color="#fff" />
              <Text style={styles.addSocialButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.socialHint}>
            Optional. Tap + to add Facebook, Instagram, website, etc.
          </Text>

          {socialLinks.map((row, index) => (
            <View key={row.key} style={styles.socialRow}>
              <View style={styles.socialRowHeader}>
                <Text style={styles.socialRowTitle}>Link {index + 1}</Text>
                <TouchableOpacity onPress={() => removeSocialLinkRow(row.key)}>
                  <FontAwesomeIcon icon={faTrash} size={14} color="#DC2626" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Platform (e.g. Facebook)"
                value={row.platform_name}
                onChangeText={(text) =>
                  updateSocialLinkRow(row.key, 'platform_name', text)
                }
                placeholderTextColor="#949494"
              />
              <TextInput
                style={styles.input}
                placeholder="URL (https://...)"
                value={row.url}
                onChangeText={(text) => updateSocialLinkRow(row.key, 'url', text)}
                autoCapitalize="none"
                keyboardType="url"
                placeholderTextColor="#949494"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Shop</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {renderPickerModal({
        visible: isCategoryPickerOpen,
        onClose: () => setIsCategoryPickerOpen(false),
        title: 'Select Category',
        options: categories,
        selectedId: selectedCategoryId,
        emptyText: 'No categories available',
        onSelect: (id) => {
          setSelectedCategoryId(id);
          setIsCategoryPickerOpen(false);
        },
      })}

      {renderPickerModal({
        visible: isRegionPickerOpen,
        onClose: () => setIsRegionPickerOpen(false),
        title: 'Select Region',
        options: regions,
        selectedId: selectedRegionId,
        emptyText: 'No regions available',
        onSelect: (id) => {
          setSelectedRegionId(id);
          setSelectedCityId(null);
          setIsRegionPickerOpen(false);
        },
      })}

      {renderPickerModal({
        visible: isCityPickerOpen,
        onClose: () => setIsCityPickerOpen(false),
        title: selectedRegion
          ? `Select City (${selectedRegion.name})`
          : 'Select City',
        options: filteredCities,
        selectedId: selectedCityId,
        emptyText: 'No cities in this region',
        onSelect: (id) => {
          setSelectedCityId(id);
          setIsCityPickerOpen(false);
        },
      })}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerSpacer: {
    width: 36,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 25,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
  },
  inputError: {
    borderColor: '#DC2626',
    marginBottom: 6,
  },
  duplicateHint: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  selector: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  selectorPlaceholder: {
    color: '#949494',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    flex: 1,
    marginRight: 6,
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addSocialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addSocialButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  socialHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  socialRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 12,
    marginBottom: 12,
  },
  socialRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  modalList: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: '#E8F1FF',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  dropdownOptionTextSelected: {
    color: '#007BFF',
    fontWeight: '600',
  },
  emptyPickerText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 24,
  },
});

export default CreateShopScreen;
