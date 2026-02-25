/**
 * AI Presentation Generator
 * 
 * Gamma.app-like presentation generation using Claude API.
 * Takes raw text and generates professional slide decks with:
 * - Content analysis and enhancement
 * - Intelligent slide layout selection
 * - Multi-column layouts
 * - Data tables and charts
 * - Professional Farther branding
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export class AIPresentationGenerator {

  /**
   * Generate presentation from raw text.
   */
  async generateFromText(rawText, options = {}) {
    const {
      title = 'Presentation',
      clientName = null,
      includeCharts = true,
      brandingStyle = 'farther', // farther, professional, modern
    } = options;

    console.log('[AI Presentation] Analyzing content...');

    // Step 1: Analyze and structure content with Claude
    const analysis = await this.analyzeContent(rawText, { title, clientName });

    console.log(`[AI Presentation] Generated ${analysis.slides.length} slides`);

    // Step 2: Enhance each slide with layout and visuals
    const enhancedSlides = analysis.slides.map((slide, index) => 
      this.enhanceSlide(slide, index, brandingStyle, includeCharts)
    );

    return {
      title: analysis.title || title,
      subtitle: analysis.subtitle,
      clientName: analysis.clientName || clientName,
      slides: enhancedSlides,
      metadata: {
        generatedAt: new Date().toISOString(),
        slideCount: enhancedSlides.length,
        brandingStyle,
      },
    };
  }

  /**
   * Analyze content and generate slide structure using Claude.
   */
  async analyzeContent(rawText, context) {
    const prompt = `You are a professional presentation designer creating a client-facing financial advisory presentation.

Analyze this content and create a professional slide deck structure:

${rawText}

Context:
${context.title ? `- Presentation title: ${context.title}` : ''}
${context.clientName ? `- Client name: ${context.clientName}` : ''}

Output a JSON structure with:
1. Overall presentation title and subtitle
2. Array of slides, each with:
   - type: "title", "content", "data_table", "two_column", "three_column", "metrics", "diagram", "quote", "image_text"
   - title: Slide heading
   - content: Enhanced, professional content (expand and improve the input)
   - bullets: Array of bullet points (if applicable)
   - data: Structured data (if table/chart)
   - layout: Additional layout hints
   - visualSuggestion: Icon or image suggestion

Guidelines:
- Make content more professional and polished
- Add strategic insights and context
- Format financial data into tables
- Create compelling openings and closings
- Use clear, benefit-oriented language
- Keep slides focused (3-5 bullets max)
- Suggest visual elements (icons, charts, images)

Return ONLY valid JSON with this structure:
{
  "title": "string",
  "subtitle": "string",
  "clientName": "string or null",
  "slides": [
    {
      "type": "title|content|data_table|two_column|three_column|metrics|diagram|quote|image_text",
      "title": "string",
      "subtitle": "string (optional)",
      "content": "string (for paragraph slides)",
      "bullets": ["string"] (for bullet slides),
      "columns": [{ title, content, bullets }] (for multi-column),
      "data": { headers: [], rows: [[]] } (for tables),
      "metrics": [{ label, value, change }] (for metrics),
      "quote": { text, author } (for quotes),
      "visualSuggestion": "icon-name or image-description",
      "layout": "optional layout hints"
    }
  ]
}`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0].text;
      
      // Extract JSON from response (Claude sometimes wraps in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from Claude response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;

    } catch (error) {
      console.error('[AI Presentation] Claude API error:', error);
      
      // Fallback: Basic structure from raw text
      return this.fallbackStructure(rawText, context);
    }
  }

  /**
   * Fallback structure if Claude API fails.
   */
  fallbackStructure(rawText, context) {
    const lines = rawText.split('\n').filter(l => l.trim());
    const slides = [];

    // Title slide
    slides.push({
      type: 'title',
      title: context.title || 'Presentation',
      subtitle: context.clientName ? `Prepared for ${context.clientName}` : '',
    });

    // Content slides from paragraphs
    let currentSlide = null;
    for (const line of lines) {
      if (line.startsWith('##') || line.startsWith('#')) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = {
          type: 'content',
          title: line.replace(/^#+\s*/, ''),
          bullets: [],
        };
      } else if ((line.startsWith('- ') || line.startsWith('* ')) && currentSlide) {
        currentSlide.bullets.push(line.replace(/^[*-]\s*/, ''));
      } else if (line.trim() && currentSlide) {
        currentSlide.bullets.push(line.trim());
      }
    }
    if (currentSlide) slides.push(currentSlide);

    return {
      title: context.title || 'Presentation',
      subtitle: '',
      clientName: context.clientName,
      slides,
    };
  }

  /**
   * Enhance slide with layout and visual details.
   */
  enhanceSlide(slide, index, brandingStyle, includeCharts) {
    // Add index for ordering
    slide.index = index;

    // Add branding colors
    slide.branding = this.getBrandingColors(brandingStyle);

    // Add visual suggestions if missing
    if (!slide.visualSuggestion) {
      slide.visualSuggestion = this.suggestVisual(slide.type, slide.title);
    }

    // Add chart config if data present
    if (slide.data && includeCharts) {
      slide.chartConfig = this.generateChartConfig(slide.data, slide.title);
    }

    return slide;
  }

  /**
   * Get branding colors by style.
   */
  getBrandingColors(style) {
    const schemes = {
      farther: {
        primary: '#1a7a82',
        secondary: '#2d9da6',
        accent: '#40c0ca',
        text: '#FCFDFC',
        background: '#333333',
        cardBg: '#5b6a71',
      },
      professional: {
        primary: '#003d5c',
        secondary: '#0066a1',
        accent: '#0091d5',
        text: '#ffffff',
        background: '#1a1a1a',
        cardBg: '#2d2d2d',
      },
      modern: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        text: '#ffffff',
        background: '#0f172a',
        cardBg: '#1e293b',
      },
    };

    return schemes[style] || schemes.farther;
  }

  /**
   * Suggest visual for slide type.
   */
  suggestVisual(type, title) {
    const typeMap = {
      title: 'presentation',
      content: 'list',
      data_table: 'table',
      two_column: 'columns',
      three_column: 'layout-grid',
      metrics: 'bar-chart',
      diagram: 'workflow',
      quote: 'quote',
      image_text: 'image',
    };

    // Try to infer from title
    const titleLower = title.toLowerCase();
    if (titleLower.includes('benefit') || titleLower.includes('advantage')) return 'check-circle';
    if (titleLower.includes('risk') || titleLower.includes('consideration')) return 'alert-triangle';
    if (titleLower.includes('strategy') || titleLower.includes('approach')) return 'target';
    if (titleLower.includes('income') || titleLower.includes('revenue')) return 'dollar-sign';
    if (titleLower.includes('growth') || titleLower.includes('increase')) return 'trending-up';
    if (titleLower.includes('timeline') || titleLower.includes('schedule')) return 'calendar';

    return typeMap[type] || 'presentation';
  }

  /**
   * Generate chart config from data.
   */
  generateChartConfig(data, title) {
    if (!data.headers || !data.rows) return null;

    // Detect if it's a financial table with numbers
    const hasNumbers = data.rows.some(row => 
      row.some(cell => typeof cell === 'number' || /^\$?[\d,]+(\.\d+)?%?$/.test(cell))
    );

    if (!hasNumbers) return null;

    return {
      type: 'bar', // Default to bar chart
      data: {
        labels: data.rows.map(r => r[0]), // First column as labels
        datasets: [{
          label: data.headers[1] || title,
          data: data.rows.map(r => this.parseNumber(r[1])),
        }],
      },
    };
  }

  /**
   * Parse number from string (handles $, %, commas).
   */
  parseNumber(str) {
    if (typeof str === 'number') return str;
    const cleaned = str.toString().replace(/[$,%]/g, '').replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
}

export default AIPresentationGenerator;
