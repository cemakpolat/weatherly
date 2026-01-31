/**
 * ChartService - Single Responsibility: Handle chart rendering and data visualization
 * 
 * This service manages the creation and rendering of temperature charts.
 * It follows the Single Responsibility Principle by focusing solely on
 * chart-related operations.
 */
import { fetchGeocodingData } from './weatherApi.js';
import { TemperatureService } from './TemperatureService.js';

export class ChartService {
  /**
   * Fetches historical and forecast data for chart display.
   * @param {string} cityName - The city name.
   * @returns {Promise<object>} - Combined chart data.
   */
  static async fetchChartData(cityName) {
    // Get city coordinates first
    const geocodeData = await fetchGeocodingData(cityName);
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('City not found');
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Calculate date range for historical data (last 7 days)
    const today = new Date();
    const historyStartDate = new Date();
    historyStartDate.setDate(today.getDate() - 7);

    const historyStartStr = historyStartDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    // Fetch historical data
    const historyUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${historyStartStr}&end_date=${todayStr}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const historyResponse = await fetch(historyUrl);
    if (!historyResponse.ok) {
      throw new Error('Failed to fetch historical data');
    }
    const historyData = await historyResponse.json();

    // Fetch forecast data (next 7 days)
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error('Failed to fetch forecast data');
    }
    const forecastData = await forecastResponse.json();

    // Combine and format data
    const labels = [
      ...historyData.daily.time.map(t => {
        const date = new Date(t);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      ...forecastData.daily.time.map(t => {
        const date = new Date(t);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
    ];

    const maxTemps = [
      ...historyData.daily.temperature_2m_max,
      ...forecastData.daily.temperature_2m_max,
    ];

    const minTemps = [
      ...historyData.daily.temperature_2m_min,
      ...forecastData.daily.temperature_2m_min,
    ];

    return {
      labels,
      maxTemps,
      minTemps,
      historyLength: historyData.daily.time.length,
    };
  }

  /**
   * Renders a simple line chart on canvas.
   * @param {HTMLCanvasElement} canvas - The canvas element.
   * @param {object} chartData - The chart data object.
   */
  static render(canvas, chartData) {
    const { labels, maxTemps, minTemps, historyLength } = chartData;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values for scaling
    const allTemps = [...maxTemps, ...minTemps];
    const minTemp = Math.min(...allTemps) - 2;
    const maxTemp = Math.max(...allTemps) + 2;
    const tempRange = maxTemp - minTemp;

    // Draw background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw vertical line at history/forecast boundary
    const boundaryX = padding + (chartWidth / (labels.length - 1)) * (historyLength - 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(boundaryX, padding);
    ctx.lineTo(boundaryX, height - padding);
    ctx.stroke();
    ctx.setLineDash([]);

    // Function to convert temperature to y coordinate
    const tempToY = temp => {
      return height - padding - ((temp - minTemp) / tempRange) * chartHeight;
    };

    // Draw max temperature line
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    maxTemps.forEach((temp, i) => {
      const x = padding + (chartWidth / (labels.length - 1)) * i;
      const y = tempToY(temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw min temperature line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    minTemps.forEach((temp, i) => {
      const x = padding + (chartWidth / (labels.length - 1)) * i;
      const y = tempToY(temp);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    ChartService.#drawDataPoints(ctx, maxTemps, labels, padding, chartWidth, tempToY, '#ffeb3b');
    ChartService.#drawDataPoints(ctx, minTemps, labels, padding, chartWidth, tempToY, '#00e5ff');

    // Draw legend
    ChartService.#drawLegend(ctx, padding);

    // Store chart instance flag
    canvas._chartInstance = true;
  }

  /**
   * Draws data points on the chart.
   * @private
   */
  static #drawDataPoints(ctx, temps, labels, padding, chartWidth, tempToY, color) {
    temps.forEach((temp, i) => {
      const x = padding + (chartWidth / (labels.length - 1)) * i;
      const y = tempToY(temp);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  /**
   * Draws the chart legend.
   * @private
   */
  static #drawLegend(ctx, padding) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(padding, 5, 15, 4);
    ctx.fillStyle = '#fff';
    ctx.fillText('Max', padding + 20, 13);

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(padding + 60, 5, 15, 4);
    ctx.fillStyle = '#fff';
    ctx.fillText('Min', padding + 80, 13);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px Arial';
    ctx.fillText('History', padding + 120, 13);
    ctx.fillText('|', padding + 175, 13);
    ctx.fillText('Forecast', padding + 185, 13);
  }

  /**
   * Loads and renders chart data for a card.
   * @param {HTMLElement} card - The city card element.
   * @param {string} cityName - The city name.
   */
  static async loadForCard(card, cityName) {
    const chartPane = card.querySelector('[data-tab-pane="chart"]');
    const chartLoading = chartPane.querySelector('.chart-loading');
    const chartContent = chartPane.querySelector('.chart-content');
    const canvas = chartContent.querySelector('canvas');

    try {
      const chartData = await ChartService.fetchChartData(cityName);
      ChartService.render(canvas, chartData);

      chartLoading.style.display = 'none';
      chartContent.style.display = 'block';
    } catch (error) {
      console.error('Error loading chart data:', error);
      chartLoading.innerHTML =
        '<p class="text-muted small"><i class="fas fa-exclamation-circle"></i> Failed to load chart data</p>';
    }
  }
}

export default ChartService;
