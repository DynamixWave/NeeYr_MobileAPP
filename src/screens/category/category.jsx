import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUtensils } from '@fortawesome/free-solid-svg-icons/faUtensils';
import { faBagShopping } from '@fortawesome/free-solid-svg-icons/faBagShopping';
import { faScissors } from '@fortawesome/free-solid-svg-icons/faScissors';
import { faHeartPulse } from '@fortawesome/free-solid-svg-icons/faHeartPulse';
import { faCar } from '@fortawesome/free-solid-svg-icons/faCar';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap';
import { faCoins } from '@fortawesome/free-solid-svg-icons/faCoins';
import { faFilm } from '@fortawesome/free-solid-svg-icons/faFilm';
import { faPlane } from '@fortawesome/free-solid-svg-icons/faPlane';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons/faChevronUp';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faXmark } from '@fortawesome/free-solid-svg-icons/faXmark';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons/faCheckDouble';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons/faTrashCan';
import { faSliders } from '@fortawesome/free-solid-svg-icons/faSliders';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Category Data Definition
export const CATEGORY_DATA = [
  {
    id: 'food_drink',
    title: 'Food & Drink',
    icon: faUtensils,
    color: '#FF6B6B',
    bgColor: '#FFF0F0',
    subcategories: [
      'Cafe',
      'Tea shop',
      'Bakery',
      'BBQ',
      'Hot Pot',
      'Bubble Tea',
      'Dessert shop',
    ],
  },
  {
    id: 'shopping',
    title: 'Shopping',
    icon: faBagShopping,
    color: '#2EC4B6',
    bgColor: '#E6FAF8',
    subcategories: [
      'Clothing',
      'Shoes',
      'Bags',
      'Jewelry',
      'Cosmetics',
      'Convenience store',
      'Book Store',
      'Electronics',
    ],
  },
  {
    id: 'beauty',
    title: 'Beauty',
    icon: faScissors,
    color: '#FF85A1',
    bgColor: '#FFF0F4',
    subcategories: [
      'Hair salon',
      'Barber',
      'Spa',
      'Nail salon',
      'Beauty clinic',
      'Tattoo Studio',
    ],
  },
  {
    id: 'health',
    title: 'Health',
    icon: faHeartPulse,
    color: '#3A86EF',
    bgColor: '#EBF2FE',
    subcategories: [
      'Clinic',
      'Dental Clinic',
      'Pharmacy',
      'Hospital',
    ],
  },
  {
    id: 'automotive',
    title: 'Automotive',
    icon: faCar,
    color: '#FF9F43',
    bgColor: '#FFF5EB',
    subcategories: [
      'Car showroom',
      'Repair shop',
      'Tire shop',
      'Car wash',
    ],
  },
  {
    id: 'home_living',
    title: 'Home Living',
    icon: faHouse,
    color: '#6C5CE7',
    bgColor: '#F0EEFD',
    subcategories: [
      'Furniture',
      'Hardware store',
      'Construction materials',
    ],
  },
  {
    id: 'education',
    title: 'Education',
    icon: faGraduationCap,
    color: '#8E44AD',
    bgColor: '#F4ECF7',
    subcategories: [
      'University',
      'Language center',
      'Music school',
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: faCoins,
    color: '#F1C40F',
    bgColor: '#FEFCE8',
    subcategories: [
      'Insurance',
      'Money exchange',
    ],
  },
  {
    id: 'entertainment',
    title: 'Entertainment',
    icon: faFilm,
    color: '#E056FD',
    bgColor: '#FCEBFF',
    subcategories: [
      'Cinema',
      'Karaoke',
      'Gym',
      'Swimming pool',
      'Theme park',
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    icon: faPlane,
    color: '#00CEC9',
    bgColor: '#E6FAF9',
    subcategories: [
      'Hotel',
      'Motel',
      'Travel agency',
      'Car rental',
    ],
  },
];

const CategoryScreen = ({ onSelectCategory }) => {
  // State for selected subcategories: key format "categoryId:subCategoryName"
  const [selectedOptions, setSelectedOptions] = useState({});
  // Track expanded state of category accordions
  const [expandedCategories, setExpandedCategories] = useState({
    food_drink: true,
    shopping: true,
  });
  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  // Summary modal visibility
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Toggle single subcategory selection box
  const toggleSubcategory = (categoryId, subName) => {
    const key = `${categoryId}:${subName}`;
    setSelectedOptions((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = { categoryId, subName };
      }
      return updated;
    });
  };

  // Toggle entire main category (Select All / Deselect All subcategories for that main category)
  const toggleMainCategory = (category) => {
    const categorySubKeys = category.subcategories.map(
      (sub) => `${category.id}:${sub}`
    );
    const allSelected = categorySubKeys.every((key) => selectedOptions[key]);

    setSelectedOptions((prev) => {
      const updated = { ...prev };
      categorySubKeys.forEach((key, index) => {
        if (allSelected) {
          delete updated[key];
        } else {
          updated[key] = {
            categoryId: category.id,
            subName: category.subcategories[index],
          };
        }
      });
      return updated;
    });
  };

  // Toggle expansion of a category card
  const toggleExpand = (categoryId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Expand or Collapse all categories
  const toggleExpandAll = (expand) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = {};
    CATEGORY_DATA.forEach((cat) => {
      updated[cat.id] = expand;
    });
    setExpandedCategories(updated);
  };

  // Select All Subcategories across all categories
  const selectAll = () => {
    const updated = {};
    CATEGORY_DATA.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        updated[`${cat.id}:${sub}`] = { categoryId: cat.id, subName: sub };
      });
    });
    setSelectedOptions(updated);
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedOptions({});
  };

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return CATEGORY_DATA;

    const query = searchQuery.toLowerCase().trim();
    return CATEGORY_DATA.map((cat) => {
      const titleMatch = cat.title.toLowerCase().includes(query);
      const matchingSubs = cat.subcategories.filter((sub) =>
        sub.toLowerCase().includes(query)
      );

      if (titleMatch || matchingSubs.length > 0) {
        return {
          ...cat,
          subcategories: titleMatch ? cat.subcategories : matchingSubs,
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  // Selected count computation
  const totalSelectedCount = Object.keys(selectedOptions).length;

  // Group selected options by main category title for clean display
  const selectedSummary = useMemo(() => {
    const summary = {};
    Object.values(selectedOptions).forEach(({ categoryId, subName }) => {
      const cat = CATEGORY_DATA.find((c) => c.id === categoryId);
      if (cat) {
        if (!summary[cat.title]) {
          summary[cat.title] = {
            icon: cat.icon,
            color: cat.color,
            bgColor: cat.bgColor,
            items: [],
          };
        }
        summary[cat.title].items.push(subName);
      }
    });
    return summary;
  }, [selectedOptions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Header Title Section */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.headerTitle}>Categories & Options</Text>
            <Text style={styles.headerSubtitle}>
              Select main and sub-categories below
            </Text>
          </View>
          {totalSelectedCount > 0 && (
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeText}>
                {totalSelectedCount} Selected
              </Text>
            </View>
          )}
        </View>

        {/* Search Bar & Quick Controls */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <FontAwesomeIcon icon={faMagnifyingGlass} size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category or subcategory..."
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

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => toggleExpandAll(true)}
            >
              <Text style={styles.actionChipText}>Expand All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => toggleExpandAll(false)}
            >
              <Text style={styles.actionChipText}>Collapse All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionChipPrimary} onPress={selectAll}>
              <FontAwesomeIcon icon={faCheckDouble} size={12} color="#4F46E5" />
              <Text style={styles.actionChipPrimaryText}>Select All</Text>
            </TouchableOpacity>

            {totalSelectedCount > 0 && (
              <TouchableOpacity style={styles.actionChipDanger} onPress={clearAll}>
                <FontAwesomeIcon icon={faTrashCan} size={12} color="#EF4444" />
                <Text style={styles.actionChipDangerText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Categories & Option Boxes List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesomeIcon icon={faSliders} size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No categories found</Text>
              <Text style={styles.emptySubtext}>Try searching with a different term</Text>
            </View>
          ) : (
            filteredCategories.map((category) => {
              const isExpanded =
                expandedCategories[category.id] || searchQuery.length > 0;
              const subKeys = category.subcategories.map(
                (sub) => `${category.id}:${sub}`
              );
              const selectedSubCount = subKeys.filter(
                (key) => selectedOptions[key]
              ).length;
              const isAllSubSelected =
                subKeys.length > 0 && selectedSubCount === subKeys.length;
              const isPartiallySelected =
                selectedSubCount > 0 && !isAllSubSelected;

              return (
                <View key={category.id} style={styles.categoryCard}>
                  {/* Category Header Bar Option Box */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.categoryHeader,
                      isExpanded && styles.categoryHeaderExpanded,
                    ]}
                    onPress={() => toggleExpand(category.id)}
                  >
                    <View style={styles.categoryTitleGroup}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: category.bgColor },
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={category.icon}
                          size={18}
                          color={category.color}
                        />
                      </View>
                      <View style={styles.titleTextWrapper}>
                        <Text style={styles.categoryTitleText}>
                          {category.title}
                        </Text>
                        <Text style={styles.categoryCountText}>
                          {category.subcategories.length} sub-categories
                        </Text>
                      </View>
                    </View>

                    <View style={styles.headerRightActions}>
                      {/* Select All in Category Button */}
                      <TouchableOpacity
                        style={[
                          styles.mainCategoryCheckbox,
                          isAllSubSelected && {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          },
                          isPartiallySelected && {
                            borderColor: category.color,
                            backgroundColor: category.bgColor,
                          },
                        ]}
                        onPress={() => toggleMainCategory(category)}
                      >
                        {isAllSubSelected && (
                          <FontAwesomeIcon icon={faCheck} size={12} color="#FFFFFF" />
                        )}
                        {isPartiallySelected && (
                          <View
                            style={[
                              styles.partialDot,
                              { backgroundColor: category.color },
                            ]}
                          />
                        )}
                      </TouchableOpacity>

                      {/* Expand / Collapse Chevron */}
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronUp : faChevronDown}
                        size={14}
                        color="#64748B"
                        style={{ marginLeft: 12 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Sub-categories Option Box Grid */}
                  {isExpanded && (
                    <View style={styles.subCategoryGrid}>
                      {category.subcategories.map((subName) => {
                        const optionKey = `${category.id}:${subName}`;
                        const isSelected = !!selectedOptions[optionKey];

                        return (
                          <TouchableOpacity
                            key={optionKey}
                            activeOpacity={0.7}
                            style={[
                              styles.optionBox,
                              isSelected && {
                                borderColor: category.color,
                                backgroundColor: category.bgColor,
                              },
                            ]}
                            onPress={() => toggleSubcategory(category.id, subName)}
                          >
                            <View
                              style={[
                                styles.checkbox,
                                isSelected && {
                                  backgroundColor: category.color,
                                  borderColor: category.color,
                                },
                              ]}
                            >
                              {isSelected && (
                                <FontAwesomeIcon
                                  icon={faCheck}
                                  size={10}
                                  color="#FFFFFF"
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && {
                                  color: '#0F172A',
                                  fontWeight: '600',
                                },
                              ]}
                            >
                              {subName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bottom Floating Bar when Options are Selected */}
        {totalSelectedCount > 0 && (
          <View style={styles.bottomBar}>
            <View style={styles.bottomBarInfo}>
              <Text style={styles.bottomBarTitle}>
                {totalSelectedCount} Option{totalSelectedCount > 1 ? 's' : ''} Selected
              </Text>
              <Text style={styles.bottomBarSub}>
                Ready for submission or filtering
              </Text>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.submitButtonText}>View Summary</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Modal */}
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selected Categories</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <FontAwesomeIcon icon={faXmark} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {Object.entries(selectedSummary).map(([catTitle, group]) => (
                  <View key={catTitle} style={styles.summaryGroup}>
                    <View style={styles.summaryGroupHeader}>
                      <View
                        style={[
                          styles.summaryIconBox,
                          { backgroundColor: group.bgColor },
                        ]}
                      >
                        <FontAwesomeIcon
                          icon={group.icon}
                          size={14}
                          color={group.color}
                        />
                      </View>
                      <Text style={styles.summaryGroupTitle}>{catTitle}</Text>
                    </View>

                    <View style={styles.summaryTagsRow}>
                      {group.items.map((subName) => (
                        <View key={subName} style={styles.summaryTag}>
                          <Text style={styles.summaryTagText}>{subName}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    if (onSelectCategory) {
                      onSelectCategory(selectedOptions);
                    }
                  }}
                >
                  <Text style={styles.modalConfirmButtonText}>Confirm Selection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CategoryScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  totalBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  totalBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  actionChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionChipPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionChipPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  actionChipDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  actionChipDangerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  categoryTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryCountText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCategoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: '47%',
    flexGrow: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  optionText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomBarInfo: {
    flex: 1,
  },
  bottomBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomBarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalScroll: {
    marginVertical: 16,
  },
  summaryGroup: {
    marginBottom: 16,
  },
  summaryGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  summaryGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 34,
  },
  summaryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  summaryTagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalConfirmButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
