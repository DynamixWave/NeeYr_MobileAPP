import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faArrowLeft,
  faStore,
  faLocationDot,
  faPhone,
  faGlobe,
  faBuilding,
  faStar,
  faPen,
  faTrash,
  faEnvelope,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import ENDPOINTS from '../../endpoint/endpoints';
import { getProfile } from '../../utils/lookupCache';
import FavoriteButton from '../../components/FavoriteButton';


const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const BranchDetailScreen = ({ route, navigation }) => {
  const { branchId } = route.params;

  const [branch, setBranch] = useState(null);
  const [images, setImages] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [authHeader, setAuthHeader] = useState(null);

  // Review Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Load User Profile to check review ownership
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem('bearer_token');
        if (token) {
          const header = token.includes(' ')
            ? token
            : token.startsWith('eyJ')
              ? `Bearer ${token}`
              : `Token ${token}`;
          setAuthHeader(header);
          
          const result = await getProfile(header);
          if (result && result.data) {
            // Profile serializer usually returns user object or id directly
            setCurrentUser(result.data.user || result.data);
          }
        }
      } catch (err) {
        console.log('User not logged in or token invalid');
      }
    };
    loadUser();
  }, []);

  // Post View Log once
  useEffect(() => {
    if (branchId) {
      fetch(ENDPOINTS.BRANCH_VIEW_LOGS_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: branchId }),
      }).catch((e) => console.log('View log failed to create safely', e));
    }
  }, [branchId]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [branchRes, imgRes, socialRes, revRes] = await Promise.all([
        fetch(ENDPOINTS.BRANCH_DETAIL(branchId)).then((r) => r.json()),
        fetch(`${ENDPOINTS.BRANCH_IMAGES}?page_size=100`).then((r) => r.json()),
        fetch(`${ENDPOINTS.BRANCH_SOCIAL_LINKS}?page_size=100`).then((r) => r.json()),
        fetch(`${ENDPOINTS.BRANCH_REVIEWS}?page_size=100`).then((r) => r.json()),
      ]);

      setBranch(branchRes);
      
      const allImages = extractArray(imgRes);
      setImages(allImages.filter((i) => i.branch === branchId || i.branch_id === branchId));

      const allSocials = extractArray(socialRes);
      setSocialLinks(allSocials.filter((s) => s.branch === branchId || s.branch_id === branchId));

      const allReviews = extractArray(revRes);
      setReviews(allReviews.filter((r) => r.branch === branchId || r.branch_id === branchId));
    } catch (error) {
      console.error('Error fetching branch details', error);
      Alert.alert('Error', 'Could not load branch details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openLink = (url) => {
    if (!url) return;
    const formattedUrl = url.startsWith('http') || url.startsWith('tel:') ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) =>
      console.warn('Could not open link:', err)
    );
  };

  const currentUserId = currentUser?.id;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) / reviews.length).toFixed(1) 
    : 0;

  const handleReviewSubmit = async () => {
    if (!authHeader) {
      Alert.alert('Please log in', 'You must be logged in to leave a review.');
      navigation.navigate('Login');
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Validation Error', 'Please select a rating between 1 and 5.');
      return;
    }
    
    setIsSubmittingReview(true);
    const body = {
      branch: branchId,
      rating: reviewRating,
      comment: reviewComment.trim(),
    };

    try {
      const url = editingReviewId 
        ? ENDPOINTS.BRANCH_REVIEW_UPDATE(editingReviewId)
        : ENDPOINTS.BRANCH_REVIEW_CREATE;
        
      const method = editingReviewId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to submit review');
      }

      setReviewRating(0);
      setReviewComment('');
      setEditingReviewId(null);
      setIsReviewModalVisible(false);
      fetchData(true);
      Alert.alert('Success', 'Review saved successfully!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(ENDPOINTS.BRANCH_REVIEW_DELETE(reviewId), {
              method: 'DELETE',
              headers: { Authorization: authHeader },
            });
            if (res.ok) {
              fetchData(true);
              Alert.alert('Deleted', 'Review has been removed.');
            } else {
              throw new Error('Failed to delete review');
            }
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const renderHeaderComponent = () => {
    if (!branch) return null;

    const brandName = branch.brand_name || (branch.business_brand?.name) || branch.brand?.name;
    const primaryImage = images.length > 0 ? (images[0].image || images[0].file) : branch.image;

    return (
      <View style={styles.headerContent}>
        {/* Branch Image */}
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.mainImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <FontAwesomeIcon icon={faStore} size={48} color="#CBD5E1" />
            </View>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.branchName} numberOfLines={2}>{branch.name || branch.branch_name}</Text>
            <FavoriteButton branchId={branchId} size={24} style={styles.detailFavoriteButton} />
          </View>
          {brandName && (
            <View style={styles.row}>
              <FontAwesomeIcon icon={faBuilding} size={14} color="#64748B" />
              <Text style={styles.brandNameText}>{brandName}</Text>
            </View>
          )}

          {(branch.address || branch.location || branch.city_name || branch.region_name) && (
            <View style={styles.row}>
              <FontAwesomeIcon icon={faLocationDot} size={14} color="#EF4444" style={styles.iconSpaced} />
              <Text style={styles.infoText}>
                {[branch.address || branch.location, branch.city_name, branch.region_name].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {(branch.opening_hours || branch.hours) && (
            <View style={styles.row}>
              <FontAwesomeIcon icon={faClock} size={14} color="#4F46E5" style={styles.iconSpaced} />
              <Text style={styles.infoText}>{branch.opening_hours || branch.hours}</Text>
            </View>
          )}

          {branch.email && (
            <View style={styles.row}>
              <FontAwesomeIcon icon={faEnvelope} size={14} color="#64748B" style={styles.iconSpaced} />
              <Text style={styles.infoText}>{branch.email}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {branch.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => openLink(`tel:${branch.phone}`)}
              >
                <FontAwesomeIcon icon={faPhone} size={16} color="#FFFFFF" />
                <Text style={styles.callButtonText}>Call Now</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Social Links */}
          {socialLinks.length > 0 && (
            <View style={styles.socialRow}>
              {socialLinks.map((soc, idx) => (
                <TouchableOpacity
                  key={soc.id || idx}
                  style={styles.socialChip}
                  onPress={() => openLink(soc.url || soc.link)}
                >
                  <FontAwesomeIcon icon={faGlobe} size={14} color="#4F46E5" />
                  <Text style={styles.socialText}>{soc.platform || soc.name || 'Link'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Rating Summary Header */}
        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>Reviews ({reviews.length})</Text>
          {reviews.length > 0 && (
            <View style={styles.ratingSummaryRow}>
              <FontAwesomeIcon icon={faStar} size={18} color="#F59E0B" />
              <Text style={styles.averageRating}>{avgRating}</Text>
              <Text style={styles.outOfRating}>/ 5.0</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => {
              setEditingReviewId(null);
              setReviewRating(0);
              setReviewComment('');
              setIsReviewModalVisible(true);
            }}
          >
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReviewItem = ({ item }) => {
    // Review author could be user.id or user_id or author.id depending on serializer
    const authorId = item.user?.id || item.user_id || item.author?.id || item.author_id;
    const isOwner = currentUserId && String(currentUserId) === String(authorId);
    const authorName = item.user?.name || item.user?.username || item.author?.name || 'User';

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.reviewAuthor}>{authorName}</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesomeIcon
                key={star}
                icon={faStar}
                size={12}
                color={star <= item.rating ? '#F59E0B' : '#E2E8F0'}
              />
            ))}
          </View>
        </View>
        {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
        {item.created_at && (
          <Text style={styles.reviewDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        )}

        {isOwner && (
          <View style={styles.ownerActionsRow}>
            <TouchableOpacity
              style={styles.ownerActionButton}
              onPress={() => {
                setEditingReviewId(item.id);
                setReviewRating(item.rating);
                setReviewComment(item.comment || '');
                setIsReviewModalVisible(true);
              }}
            >
              <FontAwesomeIcon icon={faPen} size={12} color="#4F46E5" />
              <Text style={styles.ownerActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ownerActionButton, { marginLeft: 16 }]}
              onPress={() => handleDeleteReview(item.id)}
            >
              <FontAwesomeIcon icon={faTrash} size={12} color="#EF4444" />
              <Text style={[styles.ownerActionText, { color: '#EF4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {branch?.name || branch?.branch_name || 'Branch Details'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderReviewItem}
          ListHeaderComponent={renderHeaderComponent}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
          ListEmptyComponent={
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyReviewsText}>No reviews yet. Be the first!</Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={isReviewModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingReviewId ? 'Edit Review' : 'Write Review'}</Text>
            
            <View style={styles.interactiveStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <FontAwesomeIcon
                    icon={faStar}
                    size={32}
                    color={star <= reviewRating ? '#F59E0B' : '#E2E8F0'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Leave a comment (optional)"
              multiline
              value={reviewComment}
              onChangeText={setReviewComment}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsReviewModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleReviewSubmit}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingBottom: 40 },
  headerContent: { backgroundColor: '#F8FAFC' },
  imageContainer: { width: '100%', height: 250, backgroundColor: '#E2E8F0' },
  mainImage: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  branchName: { fontSize: 22, fontWeight: 'bold', color: '#0F172A', flex: 1, marginRight: 12 },
  detailFavoriteButton: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandNameText: { fontSize: 16, color: '#64748B', marginLeft: 8 },
  iconSpaced: { marginRight: 8 },
  infoText: { fontSize: 15, color: '#334155', flex: 1 },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  callButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginLeft: 8 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  socialText: { color: '#4F46E5', fontSize: 13, marginLeft: 6, fontWeight: '600' },
  reviewsHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  reviewsTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  ratingSummaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  averageRating: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginLeft: 8 },
  outOfRating: { fontSize: 14, color: '#64748B', marginLeft: 4 },
  writeReviewButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  writeReviewText: { color: '#FFFFFF', fontWeight: 'bold' },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewAuthor: { fontWeight: 'bold', color: '#0F172A' },
  starsRow: { flexDirection: 'row' },
  reviewComment: { color: '#334155', marginBottom: 8 },
  reviewDate: { fontSize: 12, color: '#94A3B8' },
  ownerActionsRow: { flexDirection: 'row', marginTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 },
  ownerActionButton: { flexDirection: 'row', alignItems: 'center' },
  ownerActionText: { marginLeft: 4, color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  emptyReviews: { padding: 32, alignItems: 'center' },
  emptyReviewsText: { color: '#94A3B8', fontSize: 15 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 16, textAlign: 'center' },
  interactiveStars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#0F172A',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalCancelButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 8 },
  modalCancelText: { color: '#64748B', fontWeight: 'bold' },
  modalSubmitButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, backgroundColor: '#4F46E5', marginLeft: 8 },
  modalSubmitText: { color: '#FFFFFF', fontWeight: 'bold' },
});

export default BranchDetailScreen;
