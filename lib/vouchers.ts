/**
 * Logic voucher dùng chung cho giỏ hàng và ví voucher.
 * Đồng bộ mã, điều kiện và cách tính giảm giá.
 */

export type VoucherRule = {
  code: string;
  description: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number; // Chỉ cho Percentage
};

export const VOUCHER_RULES: VoucherRule[] = [
  {
    code: 'SALE10',
    description: 'Giảm 10% cho đơn từ 100.000đ',
    discountType: 'Percentage',
    discountValue: 10,
    minOrderValue: 100000,
    maxDiscount: 30000,
  },
  {
    code: 'SALE20',
    description: 'Giảm 20% cho đơn từ 200.000đ',
    discountType: 'Percentage',
    discountValue: 20,
    minOrderValue: 200000,
    maxDiscount: 50000,
  },
  {
    code: 'FREESHIP50',
    description: 'Miễn phí vận chuyển đơn từ 150.000đ',
    discountType: 'Fixed',
    discountValue: 15000,
    minOrderValue: 150000,
  },
  {
    code: 'TRAICAY30',
    description: 'Giảm 30.000đ cho đơn từ 100.000đ',
    discountType: 'Fixed',
    discountValue: 30000,
    minOrderValue: 100000,
  },
];

export type VoucherResult = {
  success: boolean;
  discount: number;
  message: string;
};

/**
 * Tính giảm giá khi áp dụng mã voucher.
 * @param code Mã voucher (không phân biệt hoa thường, bỏ khoảng trắng)
 * @param subtotal Tạm tính (tổng tiền hàng)
 * @param shippingFee Phí giao hàng (dùng cho FREESHIP - giới hạn discount tối đa)
 */
export function applyVoucher(
  code: string,
  subtotal: number,
  shippingFee: number = 15000
): VoucherResult {
  const upper = code.trim().toUpperCase();
  if (!upper) {
    return { success: false, discount: 0, message: 'Vui lòng nhập mã voucher.' };
  }

  const rule = VOUCHER_RULES.find((r) => r.code === upper);
  if (!rule) {
    const hints = VOUCHER_RULES.map((r) => `${r.code}`).join(', ');
    return {
      success: false,
      discount: 0,
      message: `Mã không tồn tại. Thử: ${hints}`,
    };
  }

  if (subtotal < rule.minOrderValue) {
    const minStr = new Intl.NumberFormat('vi-VN').format(rule.minOrderValue) + 'đ';
    return {
      success: false,
      discount: 0,
      message: `Đơn tối thiểu ${minStr} để dùng mã ${rule.code}.`,
    };
  }

  let discount = 0;
  if (rule.discountType === 'Percentage') {
    discount = Math.round((subtotal * rule.discountValue) / 100);
    if (rule.maxDiscount != null && discount > rule.maxDiscount) {
      discount = rule.maxDiscount;
    }
  } else {
    discount = rule.discountValue;
    // FREESHIP: giới hạn tối đa = phí ship
    if (rule.code === 'FREESHIP50' && discount > shippingFee) {
      discount = shippingFee;
    }
  }

  if (discount <= 0) {
    return { success: false, discount: 0, message: 'Không thể áp dụng mã.' };
  }

  // Giới hạn: giảm giá không vượt quá tạm tính
  if (discount > subtotal) {
    discount = subtotal;
  }

  const discountStr = new Intl.NumberFormat('vi-VN').format(discount) + 'đ';
  return {
    success: true,
    discount,
    message: `Áp dụng thành công. Giảm ${discountStr}`,
  };
}
