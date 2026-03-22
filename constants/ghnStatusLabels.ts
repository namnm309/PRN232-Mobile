/**
 * Map GHN delivery status sang label tiếng Việt.
 * BE ShipmentService trả deliveryStatus (PascalCase) hoặc rawStatus (snake_case).
 * Tham khảo: PRM392 GhnStatusMapper, GHN docs https://api.ghn.vn/home/docs/detail?id=84
 */
const LABELS: Record<string, string> = {
  ReadyToPick: 'Chờ lấy hàng',
  ready_to_pick: 'Chờ lấy hàng',
  Picking: 'Đang lấy hàng',
  picking: 'Đang lấy hàng',
  picked: 'Đã lấy hàng',
  Storing: 'Đang lưu kho',
  storing: 'Đang lưu kho',
  sorting: 'Đang phân loại',
  InTransit: 'Đang vận chuyển',
  transporting: 'Đang vận chuyển',
  OutForDelivery: 'Đang giao hàng',
  delivering: 'Đang giao hàng',
  Delivered: 'Đã giao hàng',
  delivered: 'Đã giao hàng',
  Cancelled: 'Đã hủy',
  cancel: 'Đã hủy',
  cancelled: 'Đã hủy',
  Returned: 'Đã trả hàng',
  return: 'Đang trả hàng',
  returned: 'Đã trả hàng',
  DeliveryFailed: 'Giao hàng thất bại',
  delivery_fail: 'Giao hàng thất bại',
  waiting_to_return: 'Chờ trả hàng',
  ShipmentCreated: 'Đã tạo vận đơn',
};

export function getGhnDeliveryStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) return 'Đang xử lý';
  const key = status.trim();
  return LABELS[key] ?? status;
}
