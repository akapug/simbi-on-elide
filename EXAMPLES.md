# View Rendering System - Usage Examples

Real-world examples showing how to use the Simbi on Elide view rendering system.

## Table of Contents

1. [Basic View Rendering](#basic-view-rendering)
2. [Layouts and Partials](#layouts-and-partials)
3. [Content For Blocks](#content-for-blocks)
4. [Vue Component Integration](#vue-component-integration)
5. [Helper Methods](#helper-methods)
6. [Advanced Patterns](#advanced-patterns)

---

## Basic View Rendering

### Example 1: Simple Page

**Controller:**
```typescript
// backend/controllers/aboutController.ts
export class AboutController {
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    const html = await renderer.render('about/index', {
      locals: {
        currentUser: req.user,
        pageTitle: 'About Simbi'
      }
    });

    res.send(html);
  }
}
```

**View:**
```pug
//- views/about/index.pug
.about-page
  h1= pageTitle
  p Simbi is a community marketplace for skill sharing.

  if user_signed_in()
    p Welcome back, #{currentUser.firstName}!
  else
    p
      a(href='/signup') Join us today!
```

### Example 2: Custom Layout

**Controller:**
```typescript
const html = await renderer.render('landing/promo', {
  layout: 'layouts/minimal',  // Use different layout
  locals: {
    promoCode: 'WELCOME2024'
  }
});
```

**View:**
```pug
//- views/landing/promo.pug
.promo-banner
  h1 Special Offer
  p Use code: #{promoCode}
```

**Layout:**
```pug
//- views/layouts/minimal.pug
doctype html
html
  head
    title Simbi Promo
    != stylesheet_link_tag('promo')
  body
    != yield()
```

---

## Layouts and Partials

### Example 3: Nested Partials

**Main View:**
```pug
//- views/services/show.pug
.service-page
  != render('services/_header', { service: service })

  .service-content
    != render('services/_description', { service: service })
    != render('services/_provider', { user: service.provider })
    != render('services/_reviews', { reviews: service.reviews })

  != render('services/_cta', { service: service })
```

**Partial:**
```pug
//- views/services/_header.pug
.service-header
  h1= service.title
  .service-meta
    span.category= service.category
    span.price= service.price
```

### Example 4: Shared Components

**View:**
```pug
//- views/users/edit.pug
.user-edit
  != render('shared/breadcrumbs', {
    items: [
      { text: 'Home', url: '/' },
      { text: 'Profile', url: `/users/${user.id}` },
      { text: 'Edit', url: '#' }
    ]
  })

  != render('shared/form_errors', { errors: errors })

  form
    //- form fields
```

**Partial:**
```pug
//- views/shared/_breadcrumbs.pug
nav.breadcrumbs
  each item, index in items
    if index > 0
      span.separator /
    if item.url
      a(href=item.url)= item.text
    else
      span= item.text
```

---

## Content For Blocks

### Example 5: Adding Scripts to Layout

**View:**
```pug
//- views/services/search.pug

//- Add page-specific scripts
- content_for('bottom_scripts_section', function() {
  != javascript_include_tag('search', 'filters')

  script.
    $(function() {
      initServiceSearch({
        categories: !{JSON.stringify(categories)},
        filters: !{JSON.stringify(filters)}
      });
    });
- })

//- Main content
.service-search
  != render('services/_search_form')
  != render('services/_results', { services: services })
```

### Example 6: Multiple Content Blocks

**View:**
```pug
//- views/users/dashboard.pug

//- Custom styles
- content_for('head_section', function() {
  != stylesheet_link_tag('dashboard', 'charts')
  style.
    .dashboard { background: #f5f5f5; }
- })

//- Modals
- content_for('modals', function() {
  #settings-modal
  != render('users/modals/_settings')
- })

//- Top banner
- content_for('top_section', function() {
  .dashboard-banner
    h2 Welcome to your dashboard
- })

//- Main content
.dashboard-content
  != render('dashboard/_stats')
  != render('dashboard/_activity')

//- Bottom widgets
- content_for('bottom_section', function() {
  != render('dashboard/_recommendations')
- })
```

---

## Vue Component Integration

### Example 7: Simple Component Mount

**View:**
```pug
//- views/messages/inbox.pug
#inbox-container

script.
  simbi('createComponent').then(function(createComponent) {
    createComponent('InboxContainer', {
      el: '#inbox-container',
      propsData: {
        userId: #{currentUser.id},
        initialConversations: !{JSON.stringify(gon.conversations)}
      }
    });
  });
```

### Example 8: Conditional Component Mount

**View:**
```pug
//- views/services/show.pug
.service-details
  h1= service.title
  != render('services/_description', { service: service })

  if user_signed_in() && !ownService
    #booking-widget
    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('BookingWidget', {
          el: '#booking-widget',
          propsData: {
            serviceId: #{service.id},
            providerId: #{service.providerId},
            availability: !{JSON.stringify(service.availability)}
          }
        });
      });
  else if ownService
    p This is your service
    a(href=`/services/${service.id}/edit`) Edit Service
```

### Example 9: Multiple Components

**View:**
```pug
//- views/users/profile.pug
.user-profile
  .profile-header
    #profile-actions
    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('ProfileActions', {
          el: '#profile-actions',
          propsData: {
            userId: #{user.id},
            canMessage: #{canMessage},
            canFollow: #{canFollow}
          }
        });
      });

  .profile-reviews
    #reviews-component
    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('ReviewsList', {
          el: '#reviews-component',
          propsData: {
            reviews: !{JSON.stringify(reviews)},
            userId: #{user.id}
          }
        });
      });

  .profile-recommendations
    #recommendations-component
    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('RecommendationsList', {
          el: '#recommendations-component',
          propsData: {
            recommendations: !{JSON.stringify(gon.recommendations)}
          }
        });
      });
```

---

## Helper Methods

### Example 10: Link Helpers

**View:**
```pug
//- views/services/card.pug
.service-card
  h3
    != link_to(service.title, `/services/${service.id}`)

  .service-provider
    != link_to(service.provider.name, `/users/${service.provider.id}`, {
      class: 'provider-link',
      data: { userId: service.provider.id }
    })

  .service-actions
    != link_to('Book Now', `/services/${service.id}/book`, {
      class: 'btn btn-primary',
      data: { toggle: 'modal', target: '#booking-modal' }
    })

    if canEdit
      != link_to('Edit', `/services/${service.id}/edit`, {
        class: 'btn btn-secondary'
      })
```

### Example 11: Asset Helpers

**View:**
```pug
//- views/services/gallery.pug

//- In head section
- content_for('head_section', function() {
  != stylesheet_link_tag('gallery', 'lightbox')
- })

//- In body
.service-gallery
  each image in service.images
    .gallery-item
      != image_tag(image.url, {
        alt: image.caption,
        class: 'gallery-image',
        data: { lightbox: 'service-gallery' }
      })

//- In bottom scripts
- content_for('bottom_scripts_section', function() {
  != javascript_include_tag('gallery', 'lightbox')
  script.
    $('.gallery-image').lightbox();
- })
```

### Example 12: Text Formatting

**View:**
```pug
//- views/services/show.pug
.service-details
  .service-description
    != format_user_text(service.description)

  .service-meta
    p.posted-date
      | Posted #{time_ago_in_words(service.createdAt)}

    p.price
      = number_to_currency(service.price, { unit: '$', precision: 0 })

    p.views
      = pluralize(service.viewCount, 'view')
```

### Example 13: Translation Helpers

**View:**
```pug
//- views/users/profile.pug
.user-profile
  h1= t('user.profile.title', { name: user.firstName })

  if ownProfile
    .alert.alert-info
      = t('user.profile.own_profile_notice')

  .profile-stats
    .stat
      .stat-value= user.serviceCount
      .stat-label= t('user.profile.services_count', { count: user.serviceCount })

    .stat
      .stat-value= user.reviewCount
      .stat-label= t('user.profile.reviews_count', { count: user.reviewCount })
```

---

## Advanced Patterns

### Example 14: Dynamic Class Names

**View:**
```pug
//- views/services/card.pug
.service-card(
  class=`service-${service.type} ${service.featured ? 'featured' : ''}`
  data-service-id=service.id
)
  .service-status(class=`status-${service.status}`)
    = t(`service.status.${service.status}`)

  if service.urgent
    .urgent-badge= t('service.urgent')
```

### Example 15: Complex Conditionals

**View:**
```pug
//- views/services/show.pug
.service-page
  if service.status === 'active'
    if user_signed_in()
      if currentUser.id !== service.providerId
        if currentUser.balance >= service.price
          #booking-widget
          != mount_vue_component('BookingWidget', 'booking-widget', {
            serviceId: service.id
          })
        else
          .alert.alert-warning
            = t('service.insufficient_balance')
            != link_to(t('account.add_credits'), '/account/credits', {
              class: 'btn btn-primary'
            })
      else
        .alert.alert-info
          = t('service.own_service')
    else
      .alert.alert-info
        = t('service.login_to_book')
        != link_to(t('auth.login'), '/login', { class: 'btn btn-primary' })
  else
    .alert.alert-warning
      = t(`service.status.${service.status}`)
```

### Example 16: Data Aggregation

**Controller:**
```typescript
export class DashboardController {
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();
    const user = req.user;

    // Aggregate data
    const stats = {
      servicesOffered: await getServiceCount(user.id, 'offered'),
      servicesRequested: await getServiceCount(user.id, 'requested'),
      completedDeals: await getDealCount(user.id, 'completed'),
      totalReviews: await getReviewCount(user.id),
      averageRating: await getAverageRating(user.id),
      simbiBalance: user.balance
    };

    const recentActivity = await getRecentActivity(user.id, 10);
    const upcomingBookings = await getUpcomingBookings(user.id);

    const html = await renderer.render('users/dashboard', {
      locals: {
        currentUser: user,
        stats,
        recentActivity,
        upcomingBookings,
        gon: {
          chartData: await getChartData(user.id)
        }
      }
    });

    res.send(html);
  }
}
```

**View:**
```pug
//- views/users/dashboard.pug
.dashboard
  .dashboard-header
    h1= t('dashboard.welcome', { name: currentUser.firstName })

  .dashboard-stats
    .stat-card
      .stat-value= stats.servicesOffered
      .stat-label= t('dashboard.services_offered')

    .stat-card
      .stat-value= stats.completedDeals
      .stat-label= t('dashboard.completed_deals')

    .stat-card
      .stat-value= number_to_currency(stats.simbiBalance)
      .stat-label= t('dashboard.balance')

  .dashboard-content
    .dashboard-section
      h2= t('dashboard.recent_activity')
      if recentActivity.length > 0
        .activity-list
          each activity in recentActivity
            != render('dashboard/_activity_item', { activity: activity })
      else
        p= t('dashboard.no_activity')

    .dashboard-section
      h2= t('dashboard.upcoming_bookings')
      if upcomingBookings.length > 0
        .bookings-list
          each booking in upcomingBookings
            != render('dashboard/_booking_card', { booking: booking })
      else
        p= t('dashboard.no_bookings')

  #activity-chart
  script.
    simbi('createComponent').then(function(createComponent) {
      createComponent('ActivityChart', {
        el: '#activity-chart',
        propsData: {
          data: gon.chartData
        }
      });
    });
```

### Example 17: Error Handling

**Controller:**
```typescript
export class ServicesController {
  async show(req: Request, res: Response) {
    const renderer = getViewRenderer();
    const serviceId = req.params.id;

    try {
      const service = await getService(serviceId);

      if (!service) {
        return res.status(404).send(
          await renderer.render('errors/404', {
            layout: 'layouts/minimal',
            locals: {
              message: 'Service not found'
            }
          })
        );
      }

      const html = await renderer.render('services/show', {
        locals: {
          currentUser: req.user,
          service
        }
      });

      res.send(html);
    } catch (error) {
      console.error('Error loading service:', error);
      res.status(500).send(
        await renderer.render('errors/500', {
          layout: 'layouts/minimal',
          locals: {
            error: error.message
          }
        })
      );
    }
  }
}
```

**Error View:**
```pug
//- views/errors/404.pug
.error-page
  .error-content
    h1 404
    h2= t('errors.not_found.title')
    p= message || t('errors.not_found.message')
    != link_to(t('errors.go_home'), '/', { class: 'btn btn-primary' })
```

---

## Complete Feature Example

### Example 18: Full Service Listing Page

**Controller:**
```typescript
// backend/controllers/servicesController.ts
export class ServicesController {
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const category = req.query.category as string;
    const search = req.query.search as string;

    // Fetch data
    const { services, total } = await getServices({
      page,
      category,
      search,
      perPage: 20
    });

    const categories = await getCategories();
    const featured = await getFeaturedServices(3);

    const html = await renderer.render('services/index', {
      locals: {
        currentUser: req.user,
        services,
        featured,
        categories,
        pagination: {
          page,
          total,
          perPage: 20
        },
        filters: {
          category,
          search
        },
        gon: {
          mapData: services.map(s => ({
            id: s.id,
            lat: s.latitude,
            lng: s.longitude
          }))
        }
      }
    });

    res.send(html);
  }
}
```

**Main View:**
```pug
//- views/services/index.pug

//- Page-specific styles
- content_for('head_section', function() {
  != stylesheet_link_tag('services', 'map')
- })

.services-page
  .page-header
    h1= t('services.title')
    if user_signed_in()
      != link_to(t('services.post_new'), '/services/new', {
        class: 'btn btn-primary'
      })

  if featured.length > 0
    .featured-services
      h2= t('services.featured')
      .featured-grid
        each service in featured
          != render('services/_featured_card', { service: service })

  .services-main
    .services-sidebar
      != render('services/_filters', {
        categories: categories,
        activeCategory: filters.category
      })

    .services-content
      != render('services/_search_bar', { query: filters.search })

      if services.length > 0
        .services-grid
          each service in services
            != render('services/_card', { service: service })

        != render('shared/_pagination', { pagination: pagination })
      else
        .no-results
          p= t('services.no_results')

  #services-map
  - content_for('bottom_scripts_section', function() {
    != javascript_include_tag('services', 'map')

    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('ServicesMap', {
          el: '#services-map',
          propsData: {
            services: gon.mapData
          }
        });
      });
  - })
```

---

These examples demonstrate the full capabilities of the view rendering system. Refer to these patterns when converting your SLIM templates to Pug.
