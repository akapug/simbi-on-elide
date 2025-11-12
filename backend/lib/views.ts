/**
 * View Rendering System for Simbi on Elide
 *
 * This module provides a comprehensive view rendering system that:
 * - Renders Pug templates (closest to SLIM syntax)
 * - Supports layouts and partials
 * - Provides helper methods for Rails-like functionality
 * - Integrates with Vue 0.x components via simbi() function
 */

import * as pug from 'pug';
import * as fs from 'fs';
import * as path from 'path';
import { ViewHelpers } from './helpers';

interface RenderOptions {
  layout?: string;
  locals?: Record<string, any>;
  contentFor?: Record<string, string>;
}

interface ViewContext {
  [key: string]: any;
  // Rails-like helpers
  render: (partial: string, locals?: Record<string, any>) => string;
  content_for: (name: string, content?: string) => string | void;
  yield: (section?: string) => string;
  link_to: (text: string, url: string, options?: Record<string, any>) => string;
  t: (key: string, interpolations?: Record<string, any>) => string;
  stylesheet_link_tag: (...files: string[]) => string;
  javascript_include_tag: (...files: string[]) => string;
  csrf_meta_tags: () => string;
  // User helpers
  user_signed_in: () => boolean;
  current_user: any;
  // Utilities
  raw: (html: string) => string;
  l: (date: Date, format?: Record<string, string>) => string;
}

export class ViewRenderer {
  private viewsPath: string;
  private cache: Map<string, pug.compileTemplate>;
  private helpers: ViewHelpers;
  private contentForStore: Map<string, string[]>;

  constructor(viewsPath: string = path.join(process.cwd(), 'views')) {
    this.viewsPath = viewsPath;
    this.cache = new Map();
    this.helpers = new ViewHelpers();
    this.contentForStore = new Map();
  }

  /**
   * Render a view template with layout support
   */
  async render(
    viewPath: string,
    options: RenderOptions = {}
  ): Promise<string> {
    const { layout = 'layouts/application', locals = {} } = options;

    // Reset content_for store for this render
    this.contentForStore.clear();

    // Create view context with helpers
    const context = this.createContext(locals);

    // Render the main view
    const viewContent = await this.renderTemplate(viewPath, context);

    // Store the main content
    this.contentForStore.set('main', [viewContent]);

    // Render with layout if specified
    if (layout) {
      const layoutContext = {
        ...context,
        yield: (section?: string) => this.getContentFor(section || 'main')
      };
      return await this.renderTemplate(layout, layoutContext);
    }

    return viewContent;
  }

  /**
   * Render a partial template
   */
  async renderPartial(
    partialPath: string,
    locals: Record<string, any> = {}
  ): Promise<string> {
    const context = this.createContext(locals);
    return await this.renderTemplate(partialPath, context);
  }

  /**
   * Render a template file
   */
  private async renderTemplate(
    templatePath: string,
    context: Record<string, any>
  ): Promise<string> {
    const fullPath = this.resolveTemplatePath(templatePath);

    // Check cache first
    let compiledTemplate = this.cache.get(fullPath);

    if (!compiledTemplate) {
      // Read and compile template
      const templateContent = fs.readFileSync(fullPath, 'utf-8');
      compiledTemplate = pug.compile(templateContent, {
        filename: fullPath,
        basedir: this.viewsPath,
        pretty: true
      });

      // Cache compiled template
      this.cache.set(fullPath, compiledTemplate);
    }

    return compiledTemplate(context);
  }

  /**
   * Create view context with all helpers
   */
  private createContext(locals: Record<string, any>): ViewContext {
    const self = this;

    return {
      ...locals,

      // Render partial helper
      render: (partial: string, partialLocals: Record<string, any> = {}) => {
        // Handle Rails-style partial paths
        const partialPath = this.resolvePartialPath(partial);
        const context = this.createContext({ ...locals, ...partialLocals });
        return this.renderTemplateSync(partialPath, context);
      },

      // Content for helper (like Rails content_for)
      content_for: (name: string, content?: string) => {
        if (content !== undefined) {
          // Set content
          if (!this.contentForStore.has(name)) {
            this.contentForStore.set(name, []);
          }
          this.contentForStore.get(name)!.push(content);
          return;
        } else {
          // Get content
          return this.getContentFor(name);
        }
      },

      // Yield helper for layouts
      yield: (section?: string) => {
        return this.getContentFor(section || 'main');
      },

      // Link helper
      link_to: (text: string, url: string, options: Record<string, any> = {}) => {
        return this.helpers.link_to(text, url, options);
      },

      // Translation helper
      t: (key: string, interpolations: Record<string, any> = {}) => {
        return this.helpers.t(key, interpolations);
      },

      // Asset helpers
      stylesheet_link_tag: (...files: string[]) => {
        return this.helpers.stylesheet_link_tag(...files);
      },

      javascript_include_tag: (...files: string[]) => {
        return this.helpers.javascript_include_tag(...files);
      },

      csrf_meta_tags: () => {
        return this.helpers.csrf_meta_tags();
      },

      // User authentication helpers
      user_signed_in: () => {
        return locals.currentUser != null;
      },

      current_user: locals.currentUser,

      // Utility helpers
      raw: (html: string) => html,

      l: (date: Date, format: Record<string, string> = {}) => {
        return this.helpers.l(date, format);
      },

      // Additional Rails-like helpers
      image_tag: (src: string, options: Record<string, any> = {}) => {
        return this.helpers.image_tag(src, options);
      },

      capture: (fn: () => string) => fn(),

      // Simbi-specific helper for mounting Vue components
      mount_vue_component: (componentName: string, elementId: string, props: Record<string, any> = {}) => {
        return this.helpers.mount_vue_component(componentName, elementId, props);
      }
    };
  }

  /**
   * Synchronous template rendering for partials
   */
  private renderTemplateSync(
    templatePath: string,
    context: Record<string, any>
  ): string {
    const fullPath = this.resolveTemplatePath(templatePath);

    let compiledTemplate = this.cache.get(fullPath);

    if (!compiledTemplate) {
      const templateContent = fs.readFileSync(fullPath, 'utf-8');
      compiledTemplate = pug.compile(templateContent, {
        filename: fullPath,
        basedir: this.viewsPath,
        pretty: true
      });
      this.cache.set(fullPath, compiledTemplate);
    }

    return compiledTemplate(context);
  }

  /**
   * Resolve template path to full filesystem path
   */
  private resolveTemplatePath(templatePath: string): string {
    // Remove leading slash if present
    templatePath = templatePath.replace(/^\//, '');

    // Add .pug extension if not present
    if (!templatePath.endsWith('.pug')) {
      templatePath += '.pug';
    }

    return path.join(this.viewsPath, templatePath);
  }

  /**
   * Resolve Rails-style partial path
   * 'shared/user_info' -> 'shared/_user_info.pug'
   */
  private resolvePartialPath(partialPath: string): string {
    const parts = partialPath.split('/');
    const fileName = parts.pop()!;

    // Add underscore prefix for partials
    if (!fileName.startsWith('_')) {
      parts.push('_' + fileName);
    } else {
      parts.push(fileName);
    }

    return parts.join('/');
  }

  /**
   * Get content from content_for store
   */
  private getContentFor(name: string): string {
    const content = this.contentForStore.get(name);
    return content ? content.join('\n') : '';
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Singleton instance for easy access
 */
let viewRenderer: ViewRenderer | null = null;

export function getViewRenderer(viewsPath?: string): ViewRenderer {
  if (!viewRenderer) {
    viewRenderer = new ViewRenderer(viewsPath);
  }
  return viewRenderer;
}

/**
 * Express middleware for view rendering
 */
export function setupViewEngine(app: any, viewsPath?: string) {
  const renderer = getViewRenderer(viewsPath);

  // Add render method to response
  app.use((req: any, res: any, next: any) => {
    res.renderView = async (
      viewPath: string,
      locals: Record<string, any> = {},
      layout: string = 'layouts/application'
    ) => {
      try {
        const html = await renderer.render(viewPath, {
          layout,
          locals: {
            ...locals,
            currentUser: req.user,
            req,
            res
          }
        });
        res.send(html);
      } catch (error) {
        console.error('View rendering error:', error);
        res.status(500).send('Error rendering view');
      }
    };
    next();
  });
}
