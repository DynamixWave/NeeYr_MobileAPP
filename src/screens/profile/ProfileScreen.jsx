import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons/faUserCircle';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../../endpoint/endpoints';
import {
  getProfile,
  invalidateProfileCache,
} from '../../utils/lookupCache';

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const ProfileScreen = ({ navigation, route }) => {
  const defaultUser = route?.params?.user || {
    username: 'Guest',
    email: '',
  };

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [myShops, setMyShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOwnerShops = async (ownerId, authHeader) => {
    if (!ownerId) {
      setMyShops([]);
      return;
    }

    setShopsLoading(true);
    try {
      const response = await fetch(`${ENDPOINTS.BUSINESS_BRANDS}?page_size=100`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        console.log('Failed to fetch shops:', data);
        setMyShops([]);
        return;
      }

      const brands = extractArray(data).filter(
        (brand) => String(brand.owner) === String(ownerId)
      );

      const shops = brands.map((brand) => {
        const branches = Array.isArray(brand.branches) ? brand.branches : [];
        const firstBranch = branches[0];
        const cityName =
          firstBranch?.city_detail?.name ||
          firstBranch?.city_name ||
          '';
        const regionName =
          firstBranch?.city_detail?.region_detail?.name ||
          firstBranch?.region_name ||
          '';

        let logo = brand.logo;
        if (logo && !String(logo).startsWith('http')) {
          logo = `https://apineeyrdirectory.fothubtv.com${logo}`;
        }

        return {
          id: brand.id,
          name: brand.name || 'Untitled Shop',
          description: brand.description || '',
          categoryName: brand.category_detail?.name || 'Uncategorized',
          logo,
          branchCount: branches.length,
          location: [cityName, regionName].filter(Boolean).join(', '),
          phone:
            firstBranch?.phone_number ||
            brand.phone_number ||
            '',
          status: firstBranch?.status || null,
        };
      });

      setMyShops(shops);
    } catch (e) {
      console.log('Error fetching owner shops:', e);
      setMyShops([]);
    } finally {
      setShopsLoading(false);
    }
  };

  const fetchUserProfile = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const storedToken = await AsyncStorage.getItem('bearer_token');
      const token = storedToken || route?.params?.token;

      if (!token) {
        setIsLoggedIn(false);
        setProfileData(null);
        setMyShops([]);
        return;
      }

      const authHeader = token.includes(' ')
        ? token
        : token.startsWith('eyJ')
          ? `Bearer ${token}`
          : `Token ${token}`;

      const result = await getProfile(authHeader, {
        forceRefresh: isRefresh,
        onCacheHit: (cached) => {
          setProfileData(cached);
          setIsLoggedIn(true);
          setIsLoading(false);
          const ownerId = cached?.owner?.id;
          if (ownerId) {
            fetchOwnerShops(ownerId, authHeader);
          }
        },
      });

      setProfileData(result.data);
      setIsLoggedIn(true);
      await AsyncStorage.setItem('bearer_token', authHeader);

      const ownerId = result.data?.owner?.id;
      if (ownerId) {
        await fetchOwnerShops(ownerId, authHeader);
      } else {
        setMyShops([]);
      }
    } catch (e) {
      console.log('Error fetching profile:', e);
      if (e?.status === 401) {
        setIsLoggedIn(false);
        setProfileData(null);
        setMyShops([]);
        await invalidateProfileCache();
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [route?.params?.token])
  );

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleCreateBusiness = () => {
    navigation.navigate('CreateBusiness');
  };

  const handleCreateShop = () => {
    navigation.navigate('CreateShop');
  };

  const handleEditBusiness = () => {
    navigation.navigate('ProfileUpdate', { profileData });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('bearer_token');
    await invalidateProfileCache();
    setProfileData(null);
    setMyShops([]);
    setIsLoggedIn(false);
  };

  const userData = profileData?.owner?.user || profileData?.user || profileData || defaultUser;
  const isOwner =
    !!profileData?.owner ||
    !!profileData?.is_owner ||
    !!userData?.is_owner ||
    !!profileData?.business_name;

  const businessName =
    profileData?.owner?.business_name ||
    profileData?.business_name ||
    userData?.business_name ||
    'N/A';
  const phoneNumber =
    profileData?.owner?.phone_number ||
    profileData?.phone_number ||
    userData?.phone_number ||
    'N/A';

  let logoUrl = profileData?.owner?.logo || profileData?.logo || userData?.logo;
  if (logoUrl && !String(logoUrl).startsWith('http')) {
    logoUrl = `https://apineeyrdirectory.fothubtv.com${logoUrl}`;
  }

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUserProfile(true)}
              colors={['#007BFF']}
            />
          }
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#007BFF" style={{ marginBottom: 20 }} />
          ) : (
            <View style={styles.profileHeader}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} size={80} color="#ccc" />
              )}
              <Text style={styles.username}>
                {userData.username || userData.name || userData.first_name || 'User'}
              </Text>
              <Text style={styles.email}>{userData.email || ''}</Text>

              {isOwner && (
                <View style={styles.businessCard}>
                  <Text style={styles.businessText}>Business: {businessName}</Text>
                  <Text style={styles.phoneText}>Phone: {phoneNumber}</Text>
                  <TouchableOpacity style={styles.editButton} onPress={handleEditBusiness}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {!isOwner && (
            <TouchableOpacity style={styles.createBusinessButton} onPress={handleCreateBusiness}>
              <Text style={styles.createBusinessButtonText}>Create Business Owner Account</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <>
              <TouchableOpacity style={styles.createShopButton} onPress={handleCreateShop}>
                <Text style={styles.createShopButtonText}>Create Shop</Text>
              </TouchableOpacity>

              <View style={styles.shopsSection}>
                <Text style={styles.shopsTitle}>My Shops ({myShops.length})</Text>

                {shopsLoading ? (
                  <ActivityIndicator size="small" color="#007BFF" style={{ marginVertical: 16 }} />
                ) : myShops.length === 0 ? (
                  <Text style={styles.emptyShopsText}>
                    You haven't created any shops yet.
                  </Text>
                ) : (
                  myShops.map((shop) => (
                    <View key={shop.id} style={styles.shopCard}>
                      <View style={styles.shopCardHeader}>
                        {shop.logo ? (
                          <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
                        ) : (
                          <View style={styles.shopLogoPlaceholder}>
                            <FontAwesomeIcon icon={faStore} size={18} color="#007BFF" />
                          </View>
                        )}
                        <View style={styles.shopInfo}>
                          <Text style={styles.shopName}>{shop.name}</Text>
                          <Text style={styles.shopCategory}>{shop.categoryName}</Text>
                        </View>
                      </View>

                      {!!shop.location && (
                        <View style={styles.shopMetaRow}>
                          <FontAwesomeIcon icon={faLocationDot} size={12} color="#666" />
                          <Text style={styles.shopMetaText}>{shop.location}</Text>
                        </View>
                      )}

                      <Text style={styles.shopMetaText}>
                        {shop.branchCount} branch{shop.branchCount === 1 ? '' : 'es'}
                        {shop.phone ? ` · ${shop.phone}` : ''}
                      </Text>

                      {!!shop.description && (
                        <Text style={styles.shopDescription} numberOfLines={2}>
                          {shop.description}
                        </Text>
                      )}
                    </View>
                  ))
                )}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Not Logged In</Text>
          <Text style={styles.subtitle}>
            Please log in or create an account to view your profile.
          </Text>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#007BFF',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  createBusinessButton: {
    backgroundColor: '#28a745',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  createShopButton: {
    backgroundColor: '#007BFF',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButtonText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createBusinessButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  createShopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  businessCard: {
    width: '100%',
    alignItems: 'center',
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  businessText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 15,
    color: '#495057',
    marginTop: 5,
    textAlign: 'center',
  },
  editButton: {
    marginTop: 10,
    backgroundColor: '#f0ad4e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shopsSection: {
    width: '100%',
    marginTop: 8,
  },
  shopsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  emptyShopsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  shopCard: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 14,
    marginBottom: 10,
  },
  shopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  shopLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E8F1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  shopCategory: {
    fontSize: 13,
    color: '#007BFF',
    marginTop: 2,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopMetaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  shopDescription: {
    fontSize: 13,
    color: '#555',
    marginTop: 6,
  },
});
