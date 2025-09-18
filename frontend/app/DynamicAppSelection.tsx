import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appDetectionService, DetectedApp } from './services/AppDetectionService';
import { useAppState } from './store/AppStore';

interface AppSelectionProps {
  visible: boolean;
  onClose: () => void;
  onAppsSelected: (selectedApps: DetectedApp[]) => void;
}

export default function DynamicAppSelection({ visible, onClose, onAppsSelected }: AppSelectionProps) {
  const [detectedApps, setDetectedApps] = useState<DetectedApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<DetectedApp[]>([]);
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{name: string; count: number; displayName: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const { monitoredApps } = useAppState();

  useEffect(() => {
    if (visible) {
      loadApps();
      loadCategories();
    }
  }, [visible]);

  useEffect(() => {
    filterApps();
  }, [detectedApps, searchQuery, selectedCategory]);

  const loadApps = async () => {
    setLoading(true);
    try {
      // Try to get cached apps first
      let apps = await appDetectionService.getCachedApps();
      
      if (apps.length === 0) {
        // If no cached apps, scan for new ones
        setIsScanning(true);
        apps = await appDetectionService.detectInstalledApps();
        setIsScanning(false);
      }
      
      setDetectedApps(apps);
    } catch (error) {
      console.error('Failed to load apps:', error);
      Alert.alert('Error', 'Failed to load installed apps. Please try again.');
    } finally {
      setLoading(false);
      setIsScanning(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await appDetectionService.getAppCategories();
      setCategories([
        { name: 'all', count: 0, displayName: 'All Apps' },
        ...cats
      ]);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const filterApps = () => {
    let filtered = detectedApps;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.appName.toLowerCase().includes(query) ||
        app.displayName.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }

    // Exclude already monitored apps
    const monitoredPackages = new Set(monitoredApps.map(app => app.packageName || app.name.toLowerCase()));
    filtered = filtered.filter(app => !monitoredPackages.has(app.packageName));

    // Sort by last used (most recent first)
    filtered.sort((a, b) => {
      const aTime = a.lastUsed?.getTime() || 0;
      const bTime = b.lastUsed?.getTime() || 0;
      return bTime - aTime;
    });

    setFilteredApps(filtered);
  };

  const toggleAppSelection = (appId: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const handleConfirmSelection = () => {
    const selected = detectedApps.filter(app => selectedApps.has(app.id));
    if (selected.length === 0) {
      Alert.alert('No Apps Selected', 'Please select at least one app to monitor.');
      return;
    }
    
    onAppsSelected(selected);
    setSelectedApps(new Set());
    onClose();
  };

  const handleRefreshApps = async () => {
    setIsScanning(true);
    try {
      const apps = await appDetectionService.detectInstalledApps();
      setDetectedApps(apps);
      Alert.alert('Success', `Found ${apps.length} installed apps`);
    } catch (error) {
      console.error('Failed to refresh apps:', error);
      Alert.alert('Error', 'Failed to refresh apps. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const formatLastUsed = (lastUsed?: Date) => {
    if (!lastUsed) return 'Never used';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUsed.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastUsed.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      social: 'people',
      entertainment: 'play-circle',
      communication: 'chatbubbles',
      music: 'musical-notes',
      news: 'newspaper',
      productivity: 'briefcase',
      games: 'game-controller',
      shopping: 'bag',
      finance: 'card',
      all: 'apps',
    };
    return icons[category] || 'apps';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Apps to Monitor</Text>
          <TouchableOpacity 
            onPress={handleRefreshApps} 
            style={styles.headerButton}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="refresh" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryChip,
                selectedCategory === category.name && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Ionicons 
                name={getCategoryIcon(category.name)} 
                size={16} 
                color={selectedCategory === category.name ? '#FFF' : '#007AFF'}
                style={styles.categoryIcon}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.name && styles.categoryTextSelected
              ]}>
                {category.displayName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status */}
        {isScanning && (
          <View style={styles.scanningStatus}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.scanningText}>Scanning device for apps...</Text>
          </View>
        )}

        {/* Apps List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading installed apps...</Text>
          </View>
        ) : (
          <ScrollView style={styles.appsList}>
            {filteredApps.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="apps-outline" size={64} color="#8E8E93" />
                <Text style={styles.emptyTitle}>No Apps Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or category filter'
                    : 'Pull down to refresh and scan for apps'
                  }
                </Text>
              </View>
            ) : (
              filteredApps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={[
                    styles.appItem,
                    selectedApps.has(app.id) && styles.appItemSelected
                  ]}
                  onPress={() => toggleAppSelection(app.id)}
                >
                  <View style={styles.appIcon}>
                    <Text style={styles.appIconText}>
                      {app.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app.displayName}</Text>
                    <Text style={styles.appPackage}>{app.packageName}</Text>
                    <View style={styles.appMeta}>
                      <Text style={styles.appCategory}>{app.category}</Text>
                      <Text style={styles.appLastUsed}>{formatLastUsed(app.lastUsed)}</Text>
                    </View>
                  </View>
                  <View style={styles.selectionIndicator}>
                    {selectedApps.has(app.id) ? (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    ) : (
                      <Ionicons name="radio-button-off" size={24} color="#C7C7CC" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* Footer */}
        {selectedApps.size > 0 && (
          <View style={styles.footer}>
            <Text style={styles.selectionCount}>
              {selectedApps.size} app{selectedApps.size !== 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmSelection}
            >
              <Text style={styles.confirmButtonText}>Add to Monitoring</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoriesContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFF',
  },
  scanningStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  scanningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  appsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  appItemSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  appPackage: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  appMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appCategory: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  appLastUsed: {
    fontSize: 12,
    color: '#8E8E93',
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});