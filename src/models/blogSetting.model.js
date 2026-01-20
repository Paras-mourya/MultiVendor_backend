import mongoose from 'mongoose';

const blogSettingSchema = new mongoose.Schema(
  {
    isBlogEnabled: {
      type: Boolean,
      default: true,
    },
    introspectionTitle: {
      type: String,
      default: 'Our Blogs',
    },
    introspectionSubtitle: {
      type: String,
      default: 'Stay updated with our latest news and stories.',
    },
  },
  { timestamps: true }
);

/**
 * Singleton-like approach for blog settings.
 * We will only have one document in this collection.
 */
const BlogSetting = mongoose.model('BlogSetting', blogSettingSchema);

export default BlogSetting;
