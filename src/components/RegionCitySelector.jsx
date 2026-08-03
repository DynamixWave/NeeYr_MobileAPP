import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import ENDPOINTS from '../endpoint/endpoints';

const CustomDropdown = ({ label, placeholder, value, options, onSelect, disabled, loading, error, required }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.id === value);
  const displayText = selectedOption ? selectedOption.name : placeholder;

  return (
    <View style={styles.dropdownWrapper}>
      <Text style={styles.label}>{label} {required && <Text style={styles.required}>*</Text>}</Text>
      
      <TouchableOpacity 
        style={[styles.input, disabled && styles.disabledInput, error && styles.errorInput]} 
        onPress={() => !disabled && !loading && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.inputText, !selectedOption && styles.placeholderText, disabled && styles.disabledText]} numberOfLines={1}>
          {loading ? 'Loading...' : displayText}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="#007BFF" />
        ) : (
          <FontAwesomeIcon icon={faChevronDown} size={14} color={disabled ? "#ccc" : "#666"} />
        )}
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <FontAwesomeIcon icon={faTimes} size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.optionItem, item.id === value && styles.selectedOptionItem]}
                  onPress={() => {
                    onSelect(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.id === value && styles.selectedOptionText]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const RegionCitySelector = ({ 
  selectedRegionId, 
  selectedCityId, 
  onRegionChange, 
  onCityChange, 
  regionError, 
  cityError,
  required = true
}) => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  // Reusable pagination helper
  const fetchAllPages = async (initialUrl) => {
    let allResults = [];
    let currentUrl = initialUrl;
    
    while (currentUrl) {
      try {
        const response = await fetch(currentUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          allResults = [...allResults, ...data.results];
          currentUrl = data.next; // will be null when done
        } else {
          // If structure is not paginated as expected, fallback
          if (Array.isArray(data)) {
             allResults = data;
          }
          currentUrl = null;
        }
      } catch (error) {
        console.error("Error fetching all pages for", initialUrl, error);
        currentUrl = null;
      }
    }
    
    return allResults;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingRegions(true);
      setLoadingCities(true);
      
      try {
        const [fetchedRegions, fetchedCities] = await Promise.all([
          fetchAllPages(ENDPOINTS.REGION_LIST),
          fetchAllPages(ENDPOINTS.CITY_LIST)
        ]);

        // Sort alphabetically
        const sortedRegions = fetchedRegions.sort((a, b) => a.name.localeCompare(b.name));
        const sortedCities = fetchedCities.sort((a, b) => a.name.localeCompare(b.name));

        setRegions(sortedRegions);
        setCities(sortedCities);
      } catch (error) {
        console.error("Failed to load regions and cities", error);
      } finally {
        setLoadingRegions(false);
        setLoadingCities(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleRegionChange = (regionId) => {
    onRegionChange(regionId);
    // Reset city when region changes
    onCityChange('');
  };

  // Filter cities by selected region ID
  const filteredCities = cities.filter(city => {
    const cityRegionId = city.region || (city.region_detail && city.region_detail.id);
    return cityRegionId === selectedRegionId;
  });

  const cityOptions = selectedRegionId ? filteredCities : [];
  
  // Checking if region is selected but no cities available
  const noCitiesAvailable = selectedRegionId && !loadingCities && filteredCities.length === 0;

  return (
    <View style={styles.container}>
      <CustomDropdown
        label="Region / State"
        placeholder="Select a region or state"
        value={selectedRegionId}
        options={regions}
        onSelect={handleRegionChange}
        loading={loadingRegions}
        error={regionError}
        required={required}
      />

      <CustomDropdown
        label="City"
        placeholder={noCitiesAvailable ? "No cities available for this region" : "Select a city"}
        value={selectedCityId}
        options={cityOptions}
        onSelect={onCityChange}
        disabled={!selectedRegionId || noCitiesAvailable}
        loading={loadingCities}
        error={cityError}
        required={required}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdownWrapper: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginLeft: 5,
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorInput: {
    borderColor: 'red',
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    opacity: 0.8,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#949494',
  },
  disabledText: {
    color: '#6c757d',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOptionItem: {
    backgroundColor: '#f0f7ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007BFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  }
});

export default RegionCitySelector;
