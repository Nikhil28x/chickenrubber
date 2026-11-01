export type Product = {
  id: number;
  frame_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  image_2_url: string;
  image_3_url: string;
  product_video_url: string;
  is_active: boolean;
  sort_order: number;
};

export type Frame = {
  id: number;
  title: string;
  subtitle: string;
  is_active: boolean;
  sort_order: number;
};

export type FrameWithProducts = Frame & { products: Product[] };

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
