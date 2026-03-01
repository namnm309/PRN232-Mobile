import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FilterDropdownProps = {
  label: string;
  options: string[];
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
};

export function FilterDropdown({
  label,
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Chọn...',
}: FilterDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleSelect = (value: string) => {
    onValueChange(value === selectedValue ? null : value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.dropdownText, { color: selectedValue ? theme.text : theme.textSecondary }]}>
          {selectedValue || placeholder}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={theme.text} />
      </TouchableOpacity>

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
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 14,
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
