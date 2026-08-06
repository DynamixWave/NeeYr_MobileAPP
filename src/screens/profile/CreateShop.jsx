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

      Alert.alert('Success', 'Shop created successfully!');
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
            style={styles.input}
            placeholder="Loaded from your profile"
            value={shopName}
            onChangeText={setShopName}
            placeholderTextColor="#949494"
          />

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
