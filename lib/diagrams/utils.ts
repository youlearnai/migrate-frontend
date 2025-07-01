// Utility functions for diagrams

// Color generation function (ported from Python)
export function generateColors(
  numColors: number,
  alpha: number = 1.0,
): string[] {
  // Preset vibrant colors similar to those shown in the pie chart
  const presetColors = [
    [247, 181, 56], // Vibrant Gold/Yellow
    [231, 107, 80], // Vibrant Orange/Coral
    [235, 73, 95], // Vibrant Red
    [224, 86, 184], // Vibrant Pink/Magenta
    [89, 173, 246], // Vibrant Blue
    [127, 90, 240], // Vibrant Purple
    [66, 190, 165], // Vibrant Teal
    [104, 210, 101], // Vibrant Green
    [248, 150, 110], // Vibrant Peach
    [179, 102, 255], // Vibrant Lavender
  ];

  const colors: string[] = [];

  // If we need fewer colors than preset, take a well-distributed subset
  if (numColors <= presetColors.length) {
    const step = Math.floor(presetColors.length / numColors);
    for (let i = 0; i < numColors; i++) {
      const idx = (i * step) % presetColors.length;
      const [r, g, b] = presetColors[idx];
      colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
    }
  } else {
    // For more colors than presets, use HSL for remaining colors
    // Start with the preset colors
    for (let i = 0; i < Math.min(presetColors.length, numColors); i++) {
      const [r, g, b] = presetColors[i];
      colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
    }

    // Generate additional colors using HSL distribution
    const additionalColors = numColors - presetColors.length;
    if (additionalColors > 0) {
      for (let i = 0; i < additionalColors; i++) {
        // Distribute hues evenly around the color wheel
        const hue = (i * 360) / additionalColors;
        // Use high saturation and lightness for vibrant colors
        const saturation = 85; // Higher saturation for more vibrant colors
        const lightness = 65; // Balanced lightness for visibility

        // Convert HSL to RGB
        const c =
          (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100);
        const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
        const m = lightness / 100 - c / 2;

        let r: number, g: number, b: number;

        if (0 <= hue && hue < 60) {
          [r, g, b] = [c, x, 0];
        } else if (60 <= hue && hue < 120) {
          [r, g, b] = [x, c, 0];
        } else if (120 <= hue && hue < 180) {
          [r, g, b] = [0, c, x];
        } else if (180 <= hue && hue < 240) {
          [r, g, b] = [0, x, c];
        } else if (240 <= hue && hue < 300) {
          [r, g, b] = [x, 0, c];
        } else {
          [r, g, b] = [c, 0, x];
        }

        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
      }
    }
  }

  return colors;
}

// Convert hex color to rgba
export function hexToRgba(hex: string, alpha: number = 1): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Calculate contrasting text color
export function getContrastingTextColor(bgColor: string): string {
  // Convert hex to RGB
  const color = bgColor.charAt(0) === "#" ? bgColor.substring(1, 7) : bgColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

// Format number for display
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
}

// Escape HTML entities
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Generate unique ID
export function generateUniqueId(prefix: string = "diagram"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
