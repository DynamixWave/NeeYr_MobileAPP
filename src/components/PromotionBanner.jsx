import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../endpoint/endpoints';
import { navigate } from '../navigation/RootNavigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHOWN_KEY = 'promotion_banner_shown_ids';

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

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isBannerActiveNow = (banner) => {
  const active = banner.is_active === true || banner.is_active === 1 || banner.is_active === 'true';
  if (!active) return false;

  const now = new Date();
  const start = parseDate(banner.start_date || banner.startDate);
  const end = parseDate(banner.end_date || banner.endDate);

  if (start && now < start) return false;
  if (end) {
    // Treat end_date as inclusive through end of that day when time is midnight
    const endInclusive = new Date(end);
    if (
      endInclusive.getHours() === 0 &&
      endInclusive.getMinutes() === 0 &&
      endInclusive.getSeconds() === 0
    ) {
      endInclusive.setHours(23, 59, 59, 999);
    }
    if (now > endInclusive) return false;
  }

  return true;
};

const normalizeBanner = (raw) => ({
  id: raw.id || raw.pk || `${raw.branch_id || raw.branch}-${raw.title}`,
  branch_id: raw.branch_id || raw.branch || null,
  banner_image: resolveImageUrl(raw.banner_image || raw.image || raw.banner),
  title: raw.title || raw.name || 'Promotion',
  target_url: raw.target_url || raw.url || raw.link || null,
  start_date: raw.start_date || raw.startDate || null,
  end_date: raw.end_date || raw.endDate || null,
  is_active: raw.is_active,
});

const PromotionBanner = () => {
  const [banner, setBanner] = useState(null);
  const [visible, setVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const markShown = useCallback(async (bannerId) => {
    try {
      const raw = await AsyncStorage.getItem(SHOWN_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(ids) ? ids : [];
      if (!next.includes(bannerId)) {
        next.push(bannerId);
        await AsyncStorage.setItem(SHOWN_KEY, JSON.stringify(next));
      }
    } catch (_) {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const [response, shownRaw] = await Promise.all([
          fetch(`${ENDPOINTS.BANNERS}?page_size=50`),
          AsyncStorage.getItem(SHOWN_KEY),
        ]);

        if (!response.ok) return;

        const data = await response.json();
        const shownIds = (() => {
          try {
            const parsed = shownRaw ? JSON.parse(shownRaw) : [];
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        const candidates = extractArray(data)
          .map(normalizeBanner)
          .filter(isBannerActiveNow)
          .filter((item) => item.banner_image || item.title)
          .filter((item) => !shownIds.includes(item.id));

        if (cancelled || candidates.length === 0) return;

        setBanner(candidates[0]);
        setVisible(true);
      } catch (_) {
        // API may be unavailable; fail silently
      }
    };

    loadBanner();
    return () => {
      cancelled = true;
    };
  }, []);

  const closeBanner = useCallback(async () => {
    setVisible(false);
    if (banner?.id) {
      await markShown(banner.id);
    }
  }, [banner, markShown]);

  const openBanner = useCallback(async () => {
    if (!banner) return;

    const branchId = banner.branch_id;
    const targetUrl = banner.target_url;

    await closeBanner();

    if (branchId) {
      navigate('BranchDetail', { branchId });
      return;
    }

    if (targetUrl) {
      const formatted = /^https?:\/\//i.test(targetUrl)
        ? targetUrl
        : `https://${targetUrl}`;
      Linking.openURL(formatted).catch(() => {});
    }
  }, [banner, closeBanner]);

  if (!banner) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeBanner}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={closeBanner}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={openBanner}>
            {banner.banner_image ? (
              <View style={styles.imageWrap}>
                {imageLoading && (
                  <ActivityIndicator
                    style={styles.imageLoader}
                    color="#007BFF"
                  />
                )}
                <Image
                  source={{ uri: banner.banner_image }}
                  style={styles.image}
                  resizeMode="cover"
                  onLoadEnd={() => setImageLoading(false)}
                />
              </View>
            ) : null}

            <Text style={styles.title} numberOfLines={2}>
              {banner.title}
            </Text>

            {(banner.branch_id || banner.target_url) && (
              <View style={styles.cta}>
                <Text style={styles.ctaText}>View offer</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PromotionBanner;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    paddingBottom: 18,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '600',
  },
  imageWrap: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8EEF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
  },
  title: {
    marginTop: 14,
    marginHorizontal: 16,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cta: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
