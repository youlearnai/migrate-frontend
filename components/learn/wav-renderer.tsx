const dataMap = new WeakMap();

/**
 * Normalizes a Float32Array to Array(m): We use this to draw amplitudes on a graph
 * If we're rendering the same audio data, then we'll often be using
 * the same (data, m, downsamplePeaks) triplets so we give option to memoize
 */
const normalizeArray = (
  data: Float32Array,
  m: number,
  downsamplePeaks: boolean = false,
  memoize: boolean = false,
) => {
  let cache, mKey, dKey;
  if (memoize) {
    mKey = m.toString();
    dKey = downsamplePeaks.toString();
    cache = dataMap.has(data) ? dataMap.get(data) : {};
    dataMap.set(data, cache);
    cache[mKey] = cache[mKey] || {};
    if (cache[mKey][dKey]) {
      return cache[mKey][dKey];
    }
  }
  const n = data.length;
  const result = new Array(m);
  if (m <= n) {
    // Downsampling
    result.fill(0);
    const count = new Array(m).fill(0);
    for (let i = 0; i < n; i++) {
      const index = Math.floor(i * (m / n));
      if (downsamplePeaks) {
        // take highest result in the set
        result[index] = Math.max(result[index], Math.abs(data[i]));
      } else {
        result[index] += Math.abs(data[i]);
      }
      count[index]++;
    }
    if (!downsamplePeaks) {
      for (let i = 0; i < result.length; i++) {
        result[i] = result[i] / count[i];
      }
    }
  } else {
    for (let i = 0; i < m; i++) {
      const index = (i * (n - 1)) / (m - 1);
      const low = Math.floor(index);
      const high = Math.ceil(index);
      const t = index - low;
      if (high >= n) {
        result[i] = data[n - 1];
      } else {
        result[i] = data[low] * (1 - t) + data[high] * t;
      }
    }
  }
  if (memoize) {
    cache[mKey as string][dKey as string] = result;
  }
  return result;
};

export const WavRenderer = {
  /**
   * Renders a point-in-time snapshot of an audio sample, usually frequency values
   * @param canvas
   * @param ctx
   * @param data
   * @param color
   * @param pointCount number of bars to render
   * @param barWidth width of bars in px
   * @param barSpacing spacing between bars in px
   * @param center vertically center the bars
   */
  drawBars: (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    data: Float32Array,
    color: string,
    pointCount: number = 0,
    barWidth: number = 0,
    barSpacing: number = 0,
    center: boolean = false,
  ) => {
    let actualPointCount: number;
    const minBarWidthForCalc = Math.max(barWidth, 1);
    const denominator = minBarWidthForCalc + barSpacing;
    let calculatedMaxFitPoints = 0;

    if (denominator > 0 && canvas.width > barSpacing) {
      calculatedMaxFitPoints = Math.floor(
        (canvas.width - barSpacing) / denominator,
      );
    }

    calculatedMaxFitPoints = Math.max(0, calculatedMaxFitPoints);

    if (pointCount > 0) {
      actualPointCount = Math.min(pointCount, calculatedMaxFitPoints);
    } else {
      actualPointCount = calculatedMaxFitPoints;
    }

    let actualBarWidth = barWidth;
    if (actualBarWidth <= 0) {
      if (actualPointCount > 0) {
        actualBarWidth =
          (canvas.width - barSpacing) / actualPointCount - barSpacing;
      } else {
        actualBarWidth = Math.max(1, canvas.width - barSpacing);
      }
    }
    actualBarWidth = Math.max(1, actualBarWidth);

    const points = normalizeArray(data, actualPointCount, true);
    const centerY = canvas.height / 2;

    const totalWidth =
      actualPointCount * actualBarWidth +
      Math.max(0, actualPointCount - 1) * barSpacing;
    const startX = (canvas.width - totalWidth) / 2;

    for (let i = 0; i < actualPointCount; i++) {
      const amplitude = Math.abs(points[i]);
      const height = Math.max(2, amplitude * (canvas.height / 2));
      const x = startX + i * (actualBarWidth + barSpacing);

      ctx.fillStyle = color;

      if (amplitude < 0.05) {
        ctx.beginPath();
        const circleRadius = 10;
        ctx.arc(x + actualBarWidth / 2, centerY, circleRadius, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.beginPath();
      const radius = actualBarWidth / 2;

      ctx.moveTo(x + radius, centerY - height);
      ctx.lineTo(x + actualBarWidth - radius, centerY - height);
      ctx.arcTo(
        x + actualBarWidth,
        centerY - height,
        x + actualBarWidth,
        centerY - height + radius,
        radius,
      );

      ctx.lineTo(x + actualBarWidth, centerY + height - radius);
      ctx.arcTo(
        x + actualBarWidth,
        centerY + height,
        x + actualBarWidth - radius,
        centerY + height,
        radius,
      );

      ctx.lineTo(x + radius, centerY + height);
      ctx.arcTo(x, centerY + height, x, centerY + height - radius, radius);

      ctx.lineTo(x, centerY - height + radius);
      ctx.arcTo(x, centerY - height, x + radius, centerY - height, radius);

      ctx.fill();
    }
  },
};
