export interface Batch {
  id: string;
  course_name: string;
  course_slug: string;
  course_description: string;
  course_feature_1: string;
  course_feature_2: string;
  course_feature_3: string;
  course_feature_4: string;
  course_feature_5: string;
  exam_name: string;
  exam_category: string;
  sub_exam_category: string;
  course_thumbnail: string;
  price: string;
  price_kicker: string;
  mrp: string;
  crm_price: string;
  seats: string;
  video_count: string;
  pdf_count: string;
  test_count: string;
  start_date: string;
  end_date: string;
  validity: string;
  validity_type: string;
  likes_count: string;
  is_paid: string;
  expiryDate: string;
}

// Emptied so everything is loaded strictly and dynamically from the API proxy
export const localBatches: Batch[] = [];
