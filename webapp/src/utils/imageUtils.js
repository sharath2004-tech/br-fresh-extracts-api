export const getOptimizedImageUrl = (url, width) => {
  // 1. Handle missing images
  if (!url) return 'https://via.placeholder.com/300?text=No+Image';

  // 2. Handle Relative Paths (The fix for your current issue)
  // If the URL is just "products/image.jpg", we need to add the Cloudinary domain.
  if (!url.startsWith('http')) {
    // Replace 'YOUR_CLOUD_NAME' with your actual Cloudinary cloud name (e.g., 'dxy82...')
    const cloudName = 'djmrm8sgh'; 
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},c_limit,q_auto,f_auto/${url}`;
  }

  // 3. Handle Full Cloudinary URLs (Optimization)
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    const parts = url.split('/upload/');
    return `${parts[0]}/upload/w_${width},c_limit,q_auto,f_auto/${parts[1]}`;
  }

  // 4. Return original URL if it's not Cloudinary (e.g., placeholder)
  return url;
};