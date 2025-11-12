/**
 * View Helpers for Simbi on Elide
 *
 * Provides Rails-like helper methods for use in templates
 */

interface LinkOptions {
  class?: string;
  id?: string;
  target?: string;
  method?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

interface ImageOptions {
  alt?: string;
  class?: string;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export class ViewHelpers {
  private translations: Map<string, string>;

  constructor() {
    this.translations = new Map();
    this.loadTranslations();
  }

  /**
   * Link helper - Rails-like link_to
   */
  link_to(text: string, url: string, options: LinkOptions = {}): string {
    const attrs: string[] = [];

    // Handle standard HTML attributes
    if (options.class) attrs.push(`class="${options.class}"`);
    if (options.id) attrs.push(`id="${options.id}"`);
    if (options.target) attrs.push(`target="${options.target}"`);

    // Handle data attributes
    if (options.data) {
      Object.entries(options.data).forEach(([key, value]) => {
        attrs.push(`data-${key}="${this.escapeHtml(String(value))}"`);
      });
    }

    // Handle method (for non-GET links)
    if (options.method && options.method !== 'get') {
      attrs.push(`data-method="${options.method}"`);
    }

    // Handle any other attributes
    Object.entries(options).forEach(([key, value]) => {
      if (!['class', 'id', 'target', 'method', 'data'].includes(key)) {
        attrs.push(`${key}="${this.escapeHtml(String(value))}"`);
      }
    });

    return `<a href="${this.escapeHtml(url)}" ${attrs.join(' ')}>${text}</a>`;
  }

  /**
   * Image tag helper
   */
  image_tag(src: string, options: ImageOptions = {}): string {
    const attrs: string[] = [`src="${this.escapeHtml(src)}"`];

    if (options.alt) attrs.push(`alt="${this.escapeHtml(options.alt)}"`);
    if (options.class) attrs.push(`class="${options.class}"`);
    if (options.width) attrs.push(`width="${options.width}"`);
    if (options.height) attrs.push(`height="${options.height}"`);

    Object.entries(options).forEach(([key, value]) => {
      if (!['alt', 'class', 'width', 'height'].includes(key)) {
        attrs.push(`${key}="${this.escapeHtml(String(value))}"`);
      }
    });

    return `<img ${attrs.join(' ')} />`;
  }

  /**
   * Translation helper - Rails-like t()
   */
  t(key: string, interpolations: Record<string, any> = {}): string {
    let translation = this.translations.get(key) || key;

    // Handle interpolations
    Object.entries(interpolations).forEach(([k, v]) => {
      translation = translation.replace(`%{${k}}`, String(v));
      translation = translation.replace(`{{${k}}}`, String(v));
    });

    return translation;
  }

  /**
   * Stylesheet link tag helper
   */
  stylesheet_link_tag(...files: string[]): string {
    return files
      .map(file => {
        const href = file.startsWith('http') ? file : `/assets/css/${file}.css`;
        return `<link rel="stylesheet" href="${href}" />`;
      })
      .join('\n');
  }

  /**
   * JavaScript include tag helper
   */
  javascript_include_tag(...files: string[]): string {
    return files
      .map(file => {
        const src = file.startsWith('http') ? file : `/assets/js/${file}.js`;
        return `<script src="${src}"></script>`;
      })
      .join('\n');
  }

  /**
   * CSRF meta tags helper
   */
  csrf_meta_tags(): string {
    // Generate CSRF token (should be integrated with actual CSRF middleware)
    const token = this.generateCsrfToken();
    return `
      <meta name="csrf-param" content="authenticity_token" />
      <meta name="csrf-token" content="${token}" />
    `;
  }

  /**
   * Date/time localization helper - Rails-like l()
   */
  l(date: Date, format: Record<string, string> = {}): string {
    const formatStr = format.format || '%B %d, %Y';

    const replacements: Record<string, string> = {
      '%Y': date.getFullYear().toString(),
      '%m': String(date.getMonth() + 1).padStart(2, '0'),
      '%d': String(date.getDate()).padStart(2, '0'),
      '%B': this.getMonthName(date.getMonth()),
      '%b': this.getMonthName(date.getMonth()).substring(0, 3),
      '%A': this.getDayName(date.getDay()),
      '%a': this.getDayName(date.getDay()).substring(0, 3),
      '%H': String(date.getHours()).padStart(2, '0'),
      '%M': String(date.getMinutes()).padStart(2, '0'),
      '%S': String(date.getSeconds()).padStart(2, '0')
    };

    let result = formatStr;
    Object.entries(replacements).forEach(([pattern, value]) => {
      result = result.replace(pattern, value);
    });

    return result;
  }

  /**
   * Mount Vue component helper - generates script for Vue 0.x mounting
   */
  mount_vue_component(
    componentName: string,
    elementId: string,
    props: Record<string, any> = {}
  ): string {
    const propsJson = JSON.stringify(props);

    return `
      <script>
        simbi('createComponent').then(function(createComponent) {
          createComponent('${componentName}', {
            el: '#${elementId}',
            ${Object.keys(props).length > 0 ? `propsData: ${propsJson}` : ''}
          });
        });
      </script>
    `;
  }

  /**
   * Format user text with links
   */
  format_user_text(text: string): string {
    if (!text) return '';

    // Convert URLs to links
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlPattern, '<a href="$1" target="_blank">$1</a>');

    // Convert newlines to <br>
    text = text.replace(/\n/g, '<br>');

    return text;
  }

  /**
   * Generate asset path
   */
  asset_path(asset: string): string {
    return `/assets/${asset}`;
  }

  /**
   * Number to currency
   */
  number_to_currency(number: number, options: { unit?: string; precision?: number } = {}): string {
    const unit = options.unit || '$';
    const precision = options.precision !== undefined ? options.precision : 2;
    return `${unit}${number.toFixed(precision)}`;
  }

  /**
   * Truncate text
   */
  truncate(text: string, length: number = 30, omission: string = '...'): string {
    if (text.length <= length) return text;
    return text.substring(0, length - omission.length) + omission;
  }

  /**
   * Simple format - converts newlines to <br> tags
   */
  simple_format(text: string): string {
    if (!text) return '';
    return `<p>${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
  }

  /**
   * Distance of time in words
   */
  distance_of_time_in_words(fromDate: Date, toDate: Date = new Date()): string {
    const seconds = Math.floor((toDate.getTime() - fromDate.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return 'less than a minute';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (days < 30) return `${days} day${days > 1 ? 's' : ''}`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}`;
  }

  /**
   * Time ago in words
   */
  time_ago_in_words(date: Date): string {
    return this.distance_of_time_in_words(date) + ' ago';
  }

  /**
   * Pluralize helper
   */
  pluralize(count: number, singular: string, plural?: string): string {
    if (count === 1) {
      return `${count} ${singular}`;
    }
    return `${count} ${plural || singular + 's'}`;
  }

  /**
   * HTML escape
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Generate CSRF token
   */
  private generateCsrfToken(): string {
    // Simple token generation - should be replaced with proper implementation
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Get month name
   */
  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  }

  /**
   * Get day name
   */
  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  /**
   * Load translations
   */
  private loadTranslations(): void {
    // Sample translations - should be loaded from files
    this.translations.set('rootpage.sections.news.see-more', 'See More');
    this.translations.set('rootpage.sections.collections.title', 'Collections');
    this.translations.set('user.profile_title', "%{name}'s Profile");
    this.translations.set('review.about_you_missing', 'No reviews yet');
    this.translations.set('recommendation.write', 'Write recommendation for %{name}');
    this.translations.set('banners.self_profile.title', 'This is your profile');
  }
}
