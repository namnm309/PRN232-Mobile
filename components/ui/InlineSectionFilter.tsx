import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type InlineSectionFilterProps = {
  title: string; // "Sản phẩm từ"
  options: string[]; // Danh sách options (origins hoặc providers)
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string; // "Chọn nguồn gốc"
  onPressSeeAll?: () => void;
};

export function InlineSectionFilter({
  title,
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Chọn...',
  onPressSeeAll,
}: InlineSectionFilterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          
          <TouchableOpacity
            style={[styles.dropdown, { borderColor: theme.border }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.dropdownText, { color: selectedValue ? theme.text : theme.textSecondary }]} numberOfLines={1}>
              {selectedValue || placeholder}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color={theme.text} style={styles.icon} />
          </TouchableOpacity>
        </View>

        {onPressSeeAll && (
          <TouchableOpacity onPress={onPressSeeAll}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>Xem tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Chọn {title.toLowerCase()}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item === selectedValue && { backgroundColor: theme.primaryLight },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, { color: theme.text }]}>{item}</Text>
                  {item === selectedValue && (
                    <MaterialIcons name="check" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 140,
    minWidth: 100,
  },
  dropdownText: {
    fontSize: 13,
    flex: 1,
  },
  icon: {
    marginLeft: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 14,
  },
});
