import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ghnApi, type GhnProvince, type GhnDistrict, type GhnWard } from '@/lib/ghnApi';

type AddressPickerValue = {
  provinceId?: number;
  provinceName?: string;
  districtId?: number;
  districtName?: string;
  wardCode?: string;
  wardName?: string;
};

type AddressPickerProps = {
  value: AddressPickerValue;
  onChange: (v: AddressPickerValue) => void;
  error?: string;
};

type DropdownItem = { id: string; label: string } | { id: number; label: string };

function AddressDropdown<T extends DropdownItem>({
  label,
  placeholder,
  items,
  selectedId,
  selectedLabel,
  onSelect,
  loading,
}: {
  label: string;
  placeholder: string;
  items: T[];
  selectedId: string | number | undefined;
  selectedLabel?: string;
  onSelect: (item: T) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdown, { borderColor: theme.border, backgroundColor: theme.background }]}
        onPress={() => !loading && setOpen(true)}
        activeOpacity={0.8}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
        ) : (
          <Text
            style={[styles.dropdownText, { color: selectedLabel ? theme.text : theme.textSecondary }]}
            numberOfLines={1}>
            {selectedLabel || placeholder}
          </Text>
        )}
        <MaterialIcons name="arrow-drop-down" size={24} color={theme.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    (item.id === selectedId || item.label === selectedLabel) && {
                      backgroundColor: theme.primaryLight ?? `${theme.primary}20`,
                    },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}>
                  <Text style={[styles.optionText, { color: theme.text }]}>{item.label}</Text>
                  {(item.id === selectedId || item.label === selectedLabel) && (
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

export function AddressPicker({ value, onChange, error }: AddressPickerProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [provinces, setProvinces] = useState<GhnProvince[]>([]);
  const [districts, setDistricts] = useState<GhnDistrict[]>([]);
  const [wards, setWards] = useState<GhnWard[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProvinces = useCallback(async () => {
    setLoadingProvinces(true);
    setLoadError(null);
    try {
      const list = await ghnApi.getProvinces();
      setProvinces(list ?? []);
    } catch (e) {
      setProvinces([]);
      setLoadError(e instanceof Error ? e.message : 'Không thể tải danh sách địa chỉ.');
    } finally {
      setLoadingProvinces(false);
    }
  }, []);

  useEffect(() => {
    loadProvinces();
  }, [loadProvinces]);

  const loadDistricts = useCallback(async (provinceId: number) => {
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    try {
      const list = await ghnApi.getDistricts(provinceId);
      setDistricts(list ?? []);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadWards = useCallback(async (districtId: number) => {
    setLoadingWards(true);
    setWards([]);
    try {
      const list = await ghnApi.getWards(districtId);
      setWards(list ?? []);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  }, []);

  useEffect(() => {
    if (value.provinceId && value.provinceId > 0) {
      loadDistricts(value.provinceId);
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [value.provinceId]);

  useEffect(() => {
    if (value.districtId && value.districtId > 0) {
      loadWards(value.districtId);
    } else {
      setWards([]);
    }
  }, [value.districtId]);

  const provinceItems: DropdownItem[] = provinces.map((p) => ({
    id: p.provinceID,
    label: p.provinceName,
  }));
  const districtItems: DropdownItem[] = districts.map((d) => ({
    id: d.districtID,
    label: d.districtName,
  }));
  const wardItems: DropdownItem[] = wards.map((w) => ({
    id: w.wardCode,
    label: w.wardName,
  }));

  const provinceLabel = value.provinceName ?? provinces.find((p) => p.provinceID === value.provinceId)?.provinceName;
  const districtLabel = value.districtName ?? districts.find((d) => d.districtID === value.districtId)?.districtName;
  const wardLabel = value.wardName ?? wards.find((w) => w.wardCode === value.wardCode)?.wardName;

  return (
    <View style={styles.container}>
      <AddressDropdown
        label="Tỉnh/Thành phố"
        placeholder="Chọn tỉnh/thành phố"
        items={provinceItems}
        selectedId={value.provinceId}
        selectedLabel={provinceLabel}
        loading={loadingProvinces}
        onSelect={(item) => {
          const p = provinces.find((x) => x.provinceID === item.id);
          onChange({
            ...value,
            provinceId: p?.provinceID,
            provinceName: p?.provinceName,
            districtId: undefined,
            districtName: undefined,
            wardCode: undefined,
            wardName: undefined,
          });
        }}
      />
      <AddressDropdown
        label="Quận/Huyện"
        placeholder="Chọn quận/huyện"
        items={districtItems}
        selectedId={value.districtId}
        selectedLabel={districtLabel}
        loading={loadingDistricts}
        onSelect={(item) => {
          const d = districts.find((x) => x.districtID === item.id);
          onChange({
            ...value,
            districtId: d?.districtID,
            districtName: d?.districtName,
            wardCode: undefined,
            wardName: undefined,
          });
        }}
      />
      <AddressDropdown
        label="Xã/Phường"
        placeholder="Chọn xã/phường"
        items={wardItems}
        selectedId={value.wardCode}
        selectedLabel={wardLabel}
        loading={loadingWards}
        onSelect={(item) => {
          const w = wards.find((x) => x.wardCode === item.id);
          onChange({
            ...value,
            wardCode: w?.wardCode,
            wardName: w?.wardName,
          });
        }}
      />
      {(error || loadError) ? (
        <Text style={styles.error}>{error || loadError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: { flex: 1, fontSize: 16 },
  loader: { marginRight: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
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
  optionText: { fontSize: 14 },
  error: { fontSize: 12, color: '#ef4444', marginTop: 4 },
});
