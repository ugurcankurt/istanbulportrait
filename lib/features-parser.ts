export function extractPhotosCount(features: string[]): number {
  if (!features || !Array.isArray(features) || features.length === 0) return 15;
  
  const keywords = ["photo", "foto", "bild", "imagen", "картинк", "صورة", "edit", "image", "kare", "shot", "retouch"];
  
  const photoFeature = features.find(f => {
    const lowerF = f.toLowerCase();
    return keywords.some(kw => lowerF.includes(kw));
  });

  if (photoFeature) {
    const match = photoFeature.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  
  return 15; // default fallback
}
