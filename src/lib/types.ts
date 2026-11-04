export type Product = {
  id: number;
  frame_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  /** Main photo: the first photo in `media`, or a placeholder. */
  image_url: string;
  media: ProductMedia[];
  is_active: boolean;
  sort_order: number;
};

export type ProductMedia = {
  id: number;
  kind: 'image' | 'video';
  url: string;
};

export type Frame = {
  id: number;
  title: string;
  subtitle: string;
  is_active: boolean;
  sort_order: number;
};

export type FrameWithProducts = Frame & { products: Product[] };

export type Review = {
  id: number;
  customer_name: string;
  location: string;
  rating: number;
  comment: string;
};

export type AdminReview = Review & {
  mobile: string;
  source: 'website' | 'admin';
  is_approved: boolean;
  created_at: string;
};

export type SiteSettings = {
  business_name: string;
  phone: string;
  secondary_phone: string;
  email: string;
  whatsapp: string;
  address: string;
  hero_image_url: string;
  video_1_url: string;
  video_2_url: string;
  updated_at?: string;
};

export type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  price: number;
};
