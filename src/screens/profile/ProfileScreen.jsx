import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserCircle } from '@fortawesome/free-solid-svg-icons/faUserCircle';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
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
  const [authHeader, setAuthHeader] = useState(null);

  const [socialModalVisible, setSocialModalVisible] = useState(false);
  const [editingSocial, setEditingSocial] = useState(null);
  const [socialPlatform, setSocialPlatform] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialBranchId, setSocialBranchId] = useState(null);
  const [socialSaving, setSocialSaving] = useState(false);

  const fetchOwnerShops = async (ownerId, header) => {
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
          Authorization: header,
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

        const socialLinks = branches.flatMap((branch) => {
          const links = Array.isArray(branch.social_links) ? branch.social_links : [];
          return links.map((link) => ({
            id: link.id,
            platform_name: link.platform_name || link.platform || link.name || 'Link',
            url: link.url || link.link || '',
            branchId: branch.id,
          }));
        });

        return {
          id: brand.id,
          name: brand.name || 'Untitled Shop',
          description: brand.description || '',
          categoryName: brand.category_detail?.name || 'Uncategorized',
          logo,
          branchCount: branches.length,
          primaryBranchId: firstBranch?.id || null,
          location: [cityName, regionName].filter(Boolean).join(', '),
          phone:
            firstBranch?.phone_number ||
            brand.phone_number ||
            '',
          status: firstBranch?.status || null,
          socialLinks,
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

      const header = token.includes(' ')
        ? token
        : token.startsWith('eyJ')
          ? `Bearer ${token}`
          : `Token ${token}`;

      const result = await getProfile(header, {
        forceRefresh: isRefresh,
        onCacheHit: (cached) => {
          setProfileData(cached);
          setIsLoggedIn(true);
          setIsLoading(false);
          setAuthHeader(header);
          const ownerId = cached?.owner?.id;
          if (ownerId) {
            fetchOwnerShops(ownerId, header);
          }
        },
      });

      setProfileData(result.data);
      setIsLoggedIn(true);
      setAuthHeader(header);
      await AsyncStorage.setItem('bearer_token', header);

      const ownerId = result.data?.owner?.id;
      if (ownerId) {
        await fetchOwnerShops(ownerId, header);
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

  const handleAddBranches = (shop) => {
    navigation.navigate('Payment', { shop });
  };

  const openSocialLink = (url) => {
    if (!url) return;
    const formatted = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() =>
      Alert.alert('Error', 'Could not open this link')
    );
  };

  const openAddSocialModal = (shop) => {
    if (!shop.primaryBranchId) {
      Alert.alert('No Branch', 'Create a branch for this shop before adding social links.');
      return;
    }
    setEditingSocial(null);
    setSocialBranchId(shop.primaryBranchId);
    setSocialPlatform('');
    setSocialUrl('');
    setSocialModalVisible(true);
  };

  const openEditSocialModal = (link) => {
    setEditingSocial(link);
    setSocialBranchId(link.branchId);
    setSocialPlatform(link.platform_name || '');
    setSocialUrl(link.url || '');
    setSocialModalVisible(true);
  };

  const closeSocialModal = () => {
    setSocialModalVisible(false);
    setEditingSocial(null);
    setSocialPlatform('');
    setSocialUrl('');
    setSocialBranchId(null);
  };

  const refreshOwnerShops = async () => {
    const ownerId = profileData?.owner?.id;
    if (ownerId && authHeader) {
      await fetchOwnerShops(ownerId, authHeader);
    }
  };

  const handleSaveSocialLink = async () => {
    const platform = socialPlatform.trim();
    const url = socialUrl.trim();

    if (!platform || !url) {
      Alert.alert('Error', 'Please enter platform name and URL');
      return;
    }
    if (!authHeader) {
      Alert.alert('Error', 'Please log in again');
      return;
    }

    setSocialSaving(true);
    try {
      const payload = {
        platform_name: platform,
        url: url,
      };

      let response;
      if (editingSocial?.id) {
        response = await fetch(ENDPOINTS.BRANCH_SOCIAL_LINK_UPDATE(editingSocial.id), {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify(payload),
        });
      } else {
        if (!socialBranchId) {
          Alert.alert('Error', 'Branch not found for this shop');
          return;
        }
        response = await fetch(ENDPOINTS.BRANCH_SOCIAL_LINK_CREATE, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            ...payload,
            branch: socialBranchId,
          }),
        });
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = data?.details
          ? Object.entries(data.details)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('\n')
          : null;
        Alert.alert(
          'Error',
          details || data?.error || data?.detail || 'Failed to save social link'
        );
        return;
      }

      closeSocialModal();
      await refreshOwnerShops();
    } catch (e) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setSocialSaving(false);
    }
  };

  const handleDeleteSocialLink = (link) => {
    Alert.alert(
      'Delete Social Link',
      `Remove ${link.platform_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                ENDPOINTS.BRANCH_SOCIAL_LINK_DELETE(link.id),
                {
                  method: 'DELETE',
                  headers: {
                    Accept: 'application/json',
                    Authorization: authHeader,
                  },
                }
              );
              if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                Alert.alert(
                  'Error',
                  data?.error || data?.detail || 'Failed to delete social link'
                );
                return;
              }
              await refreshOwnerShops();
            } catch (e) {
              Alert.alert('Error', 'Network request failed');
            }
          },
        },
      ]
    );
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

                      <View style={styles.socialSection}>
                        <View style={styles.socialSectionHeader}>
                          <Text style={styles.socialSectionTitle}>Social Links</Text>
                          <TouchableOpacity
                            style={styles.addSocialChip}
                            onPress={() => openAddSocialModal(shop)}
                          >
                            <FontAwesomeIcon icon={faPlus} size={10} color="#fff" />
                            <Text style={styles.addSocialChipText}>Add</Text>
                          </TouchableOpacity>
                        </View>

                        {(!shop.socialLinks || shop.socialLinks.length === 0) ? (
                          <Text style={styles.noSocialText}>No social links yet</Text>
                        ) : (
                          shop.socialLinks.map((link) => (
                            <View key={link.id} style={styles.socialLinkRow}>
                              <TouchableOpacity
                                style={styles.socialLinkMain}
                                onPress={() => openSocialLink(link.url)}
                              >
                                <FontAwesomeIcon icon={faGlobe} size={12} color="#007BFF" />
                                <View style={styles.socialLinkTextWrap}>
                                  <Text style={styles.socialPlatform}>
                                    {link.platform_name}
                                  </Text>
                                  <Text style={styles.socialUrl} numberOfLines={1}>
                                    {link.url}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.socialUpdateBtn}
                                onPress={() => openEditSocialModal(link)}
                              >
                                <Text style={styles.socialUpdateText}>Update</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.socialDeleteBtn}
                                onPress={() => handleDeleteSocialLink(link)}
                              >
                                <Text style={styles.socialDeleteText}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          ))
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.addBranchesButton}
                        onPress={() => handleAddBranches(shop)}
                      >
                        <Text style={styles.addBranchesButtonText}>Add Branches</Text>
                      </TouchableOpacity>
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

      <Modal
        visible={socialModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeSocialModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSocial ? 'Update Social Link' : 'Add Social Link'}
              </Text>
              <TouchableOpacity onPress={closeSocialModal}>
                <FontAwesomeIcon icon={faXmark} size={18} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Platform (e.g. Facebook)"
              value={socialPlatform}
              onChangeText={setSocialPlatform}
              placeholderTextColor="#949494"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="URL (https://...)"
              value={socialUrl}
              onChangeText={setSocialUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholderTextColor="#949494"
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveSocialLink}
              disabled={socialSaving}
            >
              {socialSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSaveText}>
                  {editingSocial ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  socialSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  socialSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  socialSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  addSocialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007BFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addSocialChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  noSocialText: {
    fontSize: 12,
    color: '#888',
  },
  socialLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    padding: 8,
  },
  socialLinkMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  socialLinkTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  socialPlatform: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  socialUrl: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
  socialUpdateBtn: {
    backgroundColor: '#f0ad4e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 4,
  },
  socialUpdateText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  socialDeleteBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
  },
  socialDeleteText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  addBranchesButton: {
    marginTop: 12,
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addBranchesButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    fontSize: 15,
    color: '#333',
  },
  modalSaveBtn: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
