export type Product = {
  id: string;
  name: string;
  price: string;
  /** Khối lượng / đơn vị hiển thị dưới tên sản phẩm, ví dụ: 500g, 1kg */
  weight?: string;
  /** Điểm rating trung bình, hiển thị cùng icon sao ở phần gợi ý */
  rating?: number;
  /** Giá gốc (nếu có khuyến mãi), sẽ hiển thị gạch ngang */
  originalPrice?: string;
  /** Badge giảm giá, ví dụ: "-10%" */
  discountBadge?: string;
};

export const featuredProducts: Product[] = [
  { id: '1', name: 'Cà chua Organic Đà Lạt', price: '25.000₫', weight: '500g' },
  { id: '2', name: 'Súp lơ xanh baby', price: '35.000₫', weight: '300g' },
  { id: '3', name: 'Cà rốt tươi Đà Lạt', price: '18.000₫', weight: '1kg' },
];

export const bestSellerProducts: Product[] = [
  {
    id: '4',
    name: 'Nấm mỡ trắng tươi sạch',
    price: '38.000₫',
    originalPrice: '45.000₫',
    weight: '200g/khay',
    rating: 4.8,
  },
  {
    id: '5',
    name: 'Dâu tây giống Nhật',
    price: '120.000₫',
    weight: '500g/hộp',
    rating: 4.9,
  },
  {
    id: '6',
    name: 'Thịt bò Úc nhập khẩu',
    price: '99.000₫',
    originalPrice: '110.000₫',
    discountBadge: '-10%',
    weight: '300g',
    rating: 5,
  },
  {
    id: '7',
    name: 'Trứng gà ta thả vườn',
    price: '35.000₫',
    weight: '10 quả',
    rating: 4.7,
  },
];

