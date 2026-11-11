import type { Review } from './types';

// Placeholder wording for a design preview, not customers' own words.
// Only shown on the local dev server while there are no real reviews, never in production.
export const sampleReviews: Review[] = [
  {
    id: -1,
    customer_name: 'Ravi',
    location: '',
    rating: 5,
    comment: 'Rubber fits well and lasts long. Good quality for the price.'
  },
  {
    id: -2,
    customer_name: 'Shankar',
    location: '',
    rating: 4.5,
    comment: 'Feather cleaning machine works well and saves us a lot of time every day.'
  },
  {
    id: -3,
    customer_name: 'Sai',
    location: '',
    rating: 4.2,
    comment: 'Good product. They explained everything on the phone before I ordered.'
  },
  {
    id: -4,
    customer_name: 'Kumar',
    location: '',
    rating: 4.8,
    comment: 'Reached on time and cash on delivery made it easy. Will order again.'
  },
  {
    id: -5,
    customer_name: 'Santosh',
    location: '',
    rating: 5,
    comment: 'Flexible rubber is strong and easy to replace. Happy with the purchase.'
  }
];
