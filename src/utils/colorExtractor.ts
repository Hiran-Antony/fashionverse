/**
 * Extracts the average/dominant color from an image URL using an offscreen canvas.
 * Ignores very bright/white pixels and very dark/black pixels to find the actual garment color.
 */
export async function getDominantColorFromImage(imageUrl: string, slotType: 'top' | 'bottom' | 'shoes' = 'top'): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('#AAAAAA');

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      try {
        // Smart Cropping based on garment type
        let sx = 15, sy = 15, sw = 20, sh = 20;
        
        if (slotType === 'top') {
          // Shirts are usually in the upper-middle
          sy = 10; sh = 25; 
        } else if (slotType === 'bottom') {
          // Pants are usually in the lower-middle
          sy = 25; sh = 20;
        } else if (slotType === 'shoes') {
          // Shoes are usually at the very bottom
          sy = 35; sh = 10;
        }

        const imageData = ctx.getImageData(sx, sy, sw, sh).data;
        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < imageData.length; i += 4) {
          const pr = imageData[i];
          const pg = imageData[i + 1];
          const pb = imageData[i + 2];
          const alpha = imageData[i + 3];

          // Ignore transparent
          if (alpha < 128) continue;

          // Ignore near-white backgrounds (common in e-commerce)
          if (pr > 240 && pg > 240 && pb > 240) continue;
          
          // Ignore near-black shadows
          if (pr < 15 && pg < 15 && pb < 15) continue;

          r += pr;
          g += pg;
          b += pb;
          count++;
        }

        if (count === 0) return resolve('#AAAAAA'); // Fallback

        // Calculate average
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Convert to hex
        const hex = "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
        resolve(hex);
      } catch (e) {
        console.warn("Failed to extract color due to CORS", e);
        resolve('#AAAAAA'); // Fallback on CORS error
      }
    };

    img.onerror = () => resolve('#AAAAAA'); // Fallback on load error
    
    // Add proxy or cache buster to help with CORS sometimes if needed, 
    // but assuming images are properly hosted with CORS headers.
    img.src = imageUrl;
  });
}
