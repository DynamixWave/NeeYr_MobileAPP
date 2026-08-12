import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons/faRotateRight';
import ENDPOINTS from '../../endpoint/endpoints';

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

const getAuthHeader = async () => {
  const storedToken = await AsyncStorage.getItem('bearer_token');
  if (!storedToken) return null;
  if (storedToken.includes(' ')) return storedToken;
  return storedToken.startsWith('eyJ')
    ? `Bearer ${storedToken}`
    : `Token ${storedToken}`;
};

const formatMoney = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value ?? '-');
  return num.toLocaleString();
};

const PaymentScreen = ({ navigation, route }) => {
  const shop = route?.params?.shop || null;

  const [plans, setPlans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState(null);

  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const pollRef = useRef(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => clearPoll(), []);

  const fetchPaymentData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        Alert.alert('Error', 'Please log in again');
        navigation.goBack();
        return;
      }

      const headers = {
        Accept: 'application/json',
        Authorization: authHeader,
      };

      const [plansRes, txRes, subRes] = await Promise.all([
        fetch(`${ENDPOINTS.PLAN_LIST}?page_size=100`, { headers }).then((r) =>
          r.json()
        ),
        fetch(`${ENDPOINTS.PAYMENT_TRANSACTIONS}?page_size=20`, { headers }).then(
          (r) => r.json()
        ),
        fetch(`${ENDPOINTS.SUBSCRIPTION_HISTORY}?page_size=20`, {
          headers,
        }).then((r) => r.json()),
      ]);

      const planList = extractArray(plansRes);
      const activePlans = planList.filter((p) => p.is_active !== false);
      const displayPlans = activePlans.length > 0 ? activePlans : planList;

      setPlans(displayPlans);
      setTransactions(extractArray(txRes));
      setSubscriptions(extractArray(subRes));

      setSelectedPlanId((prev) => prev || displayPlans[0]?.id || null);
    } catch (err) {
      console.error('Failed to load payment data:', err);
      setError('Failed to load plans or payment history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  const checkPaymentStatus = async (orderId, { silent = false } = {}) => {
    if (!orderId) return null;

    if (!silent) setCheckingStatus(true);
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(ENDPOINTS.PAYMENT_CHECK_STATUS(orderId), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        if (!silent) {
          Alert.alert(
            'Error',
            data?.error || data?.detail || 'Failed to check payment status'
          );
        }
        return null;
      }

      const status = data?.status || data?.condition || data?.payment_status;
      setPaymentStatus(data);

      if (String(status).toUpperCase() === 'SUCCESS' || String(status).toUpperCase() === 'PAID') {
        clearPoll();
        if (!silent) {
          Alert.alert('Payment Success', 'Your subscription plan is now active.');
        }
        fetchPaymentData(true);
      }

      return data;
    } catch (err) {
      if (!silent) {
        Alert.alert('Error', 'Could not check payment status.');
      }
      return null;
    } finally {
      if (!silent) setCheckingStatus(false);
    }
  };

  const startStatusPolling = (orderId) => {
    clearPoll();
    pollRef.current = setInterval(() => {
      checkPaymentStatus(orderId, { silent: true });
    }, 5000);
  };

  const handleInitiatePayment = async () => {
    if (!selectedPlanId) {
      Alert.alert('Select Plan', 'Please choose a package first.');
      return;
    }

    setPaying(true);
    setPaymentResult(null);
    setPaymentStatus(null);
    clearPoll();

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      const formData = new FormData();
      formData.append('plan_id', selectedPlanId);

      const response = await fetch(ENDPOINTS.PAYMENT_INITIATE, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Payment Failed',
          data?.error || data?.detail || data?.message || 'Could not initiate payment'
        );
        return;
      }

      setPaymentResult(data);
      setPaymentStatus({
        status: data.status || 'PENDING',
        order_id: data.merchant_order_id,
        amount: data.amount,
      });

      if (data.merchant_order_id) {
        startStatusPolling(data.merchant_order_id);
      }
    } catch (err) {
      console.error('Initiate payment error:', err);
      Alert.alert('Error', 'Network request failed while starting payment.');
    } finally {
      setPaying(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const orderId =
    paymentResult?.merchant_order_id ||
    paymentStatus?.order_id ||
    paymentStatus?.merchant_order_id;
  const qrPayload = paymentResult?.qr;
  const qrImageUri = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        qrPayload
      )}`
    : null;
  const currentStatus = (
    paymentStatus?.status ||
    paymentStatus?.condition ||
    paymentResult?.status ||
    ''
  ).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Branches</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => fetchPaymentData(true)}
          disabled={refreshing}
        >
          <FontAwesomeIcon icon={faRotateRight} size={16} color="#007BFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.centerText}>Loading packages...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPaymentData(true)}
              colors={['#007BFF']}
            />
          }
        >
          {shop ? (
            <View style={styles.shopBanner}>
              <Text style={styles.shopBannerLabel}>Shop</Text>
              <Text style={styles.shopBannerName}>{shop.name}</Text>
              <Text style={styles.shopBannerMeta}>
                {shop.branchCount} branch{shop.branchCount === 1 ? '' : 'es'}
                {shop.categoryName ? ` · ${shop.categoryName}` : ''}
              </Text>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.sectionTitle}>Available Packages</Text>
          <Text style={styles.sectionHint}>
            Choose a plan to increase your branch limit (max_branches).
          </Text>

          {plans.length === 0 ? (
            <Text style={styles.emptyText}>No packages available.</Text>
          ) : (
            plans.map((plan) => {
              const selected = selectedPlanId === plan.id;
              const inactive = plan.is_active === false;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    selected && styles.planCardSelected,
                    inactive && styles.planCardInactive,
                  ]}
                  disabled={inactive}
                  onPress={() => setSelectedPlanId(plan.id)}
                >
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {selected ? (
                      <FontAwesomeIcon icon={faCheck} size={14} color="#007BFF" />
                    ) : null}
                  </View>
                  <Text style={styles.planPrice}>
                    {formatMoney(plan.price)} MMK
                  </Text>
                  <Text style={styles.planMeta}>
                    {plan.duration_days} days · up to {plan.max_branches} branch
                    {Number(plan.max_branches) === 1 ? '' : 'es'}
                  </Text>
                  {inactive ? (
                    <Text style={styles.inactiveBadge}>Inactive</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.payButton, paying && styles.payButtonDisabled]}
            onPress={handleInitiatePayment}
            disabled={paying || !selectedPlan}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay {selectedPlan ? `${formatMoney(selectedPlan.price)} MMK` : ''}
              </Text>
            )}
          </TouchableOpacity>

          {paymentResult ? (
            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>MMPay QR</Text>
              <Text style={styles.orderText}>Order: {orderId}</Text>
              <Text style={styles.statusText}>Status: {currentStatus || 'PENDING'}</Text>

              {qrImageUri ? (
                <Image source={{ uri: qrImageUri }} style={styles.qrImage} />
              ) : null}

              <Text style={styles.sectionHint}>
                Scan with MMPay / KBZPay QR. Status auto-checks every 5s.
              </Text>

              <TouchableOpacity
                style={styles.checkButton}
                onPress={() => checkPaymentStatus(orderId)}
                disabled={checkingStatus || !orderId}
              >
                {checkingStatus ? (
                  <ActivityIndicator color="#007BFF" />
                ) : (
                  <Text style={styles.checkButtonText}>Check Payment Status</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
            Recent Transactions
          </Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>
                  {tx.plan_detail?.name || 'Plan'} · {formatMoney(tx.amount)} MMK
                </Text>
                <Text style={styles.historyMeta}>
                  {tx.merchant_order_id} · {tx.payment_status}
                </Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>
            Subscription History
          </Text>
          {subscriptions.length === 0 ? (
            <Text style={styles.emptyText}>No subscription history yet.</Text>
          ) : (
            subscriptions.map((sub) => (
              <View key={sub.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>
                  {sub.plan_detail?.name || sub.plan_name || 'Subscription'}
                </Text>
                <Text style={styles.historyMeta}>
                  {[sub.status, sub.starts_at || sub.start_date, sub.ends_at || sub.end_date]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.webhookNote}>
            MMPay webhook (`/webhooks/mmpay/`) is handled by the server. This app
            confirms payment via check-status.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default PaymentScreen;

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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 12,
    color: '#666',
  },
  shopBanner: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D6E8FF',
  },
  shopBannerLabel: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: '700',
  },
  shopBannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 4,
  },
  shopBannerMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 12,
  },
  emptyText: {
    color: '#888',
    marginBottom: 12,
  },
  planCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  planCardSelected: {
    borderColor: '#007BFF',
    backgroundColor: '#F0F7FF',
  },
  planCardInactive: {
    opacity: 0.45,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  planPrice: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
    color: '#007BFF',
  },
  planMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  inactiveBadge: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qrSection: {
    marginTop: 22,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007BFF',
    marginBottom: 12,
  },
  qrImage: {
    width: 220,
    height: 220,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  checkButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 180,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#007BFF',
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  historyMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  webhookNote: {
    marginTop: 20,
    fontSize: 11,
    color: '#999',
    lineHeight: 16,
    textAlign: 'center',
  },
});
