// 全局图片错误处理
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  if (target.src !== DEFAULT_FALLBACK_IMAGE) {
    target.src = DEFAULT_FALLBACK_IMAGE;
  }
};

// 为图片元素添加错误处理的props
export const imageErrorProps = {
  onError: handleImageError,
  loading: 'lazy' as const,
};
