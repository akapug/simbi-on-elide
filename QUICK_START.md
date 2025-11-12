# Quick Start Guide

Get up and running with Simbi on Elide v2 in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

```bash
cd /tmp/simbi-on-elide-v2
npm install
```

## Start Development Server

```bash
npm run dev
```

Server will start on http://localhost:3000

## Test Converted Views

Open your browser and visit:

1. **Home Page**: http://localhost:3000/
   - Minimal landing page with tracking

2. **Services Feed**: http://localhost:3000/services
   - Main dashboard with feed
   - Multiple modals (welcome, geocoding, badges)
   - Vue component: FirstDealModal

3. **User Profile**: http://localhost:3000/users/123
   - Complete profile page
   - Vue components: FlagButton, RecommendationsList
   - Services, reviews, recommendations

4. **Messaging Inbox**: http://localhost:3000/talks
   - Full Vue SPA: InboxContainer
   - File upload support
   - WebPush integration

## Project Structure

```
/tmp/simbi-on-elide-v2/
├── backend/
│   ├── lib/
│   │   ├── views.ts          ← View rendering engine
│   │   └── helpers.ts        ← Rails-like helpers
│   ├── controllers/          ← Route controllers
│   └── server.ts             ← Express server
├── views/
│   ├── layouts/
│   │   └── application.pug   ← Main layout
│   ├── home/
│   │   └── index.pug
│   ├── services/
│   │   └── index.pug
│   ├── users/profile_pages/
│   │   └── show.pug
│   ├── talks/
│   │   └── index.pug
│   └── partials/             ← Reusable components
└── frontend/
    └── assets/               ← Static files
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/lib/views.ts` | Core view rendering system |
| `backend/lib/helpers.ts` | Rails-like helper methods |
| `views/layouts/application.pug` | Main layout template |
| `backend/server.ts` | Express server & routes |

## Converting More Templates

### 1. Find SLIM Template

```bash
# Original Rails app
cat /home/user/simbi/app/views/YOUR_VIEW.html.slim
```

### 2. Convert to Pug

Follow patterns in `MIGRATION_GUIDE.md`:

**SLIM:**
```slim
.container
  h1 = @title
  = render 'shared/nav'
  - @items.each do |item|
    = render 'item', item: item
```

**Pug:**
```pug
.container
  h1= title
  != render('shared/nav')
  each item in items
    != render('item', { item: item })
```

### 3. Save as .pug

```bash
# Create in views directory
touch views/YOUR_VIEW.pug
```

### 4. Update Controller

```typescript
// backend/controllers/yourController.ts
export class YourController {
  async index(req: Request, res: Response) {
    const renderer = getViewRenderer();

    const html = await renderer.render('YOUR_VIEW', {
      locals: {
        currentUser: req.user,
        title: 'My Page',
        items: []
      }
    });

    res.send(html);
  }
}
```

### 5. Add Route

```typescript
// backend/server.ts
import { YourController } from './controllers/yourController';
const yourController = new YourController();

app.get('/your-route', yourController.index.bind(yourController));
```

### 6. Test

```bash
curl http://localhost:3000/your-route
# or visit in browser
```

## Common Tasks

### Clear Template Cache

```typescript
// In development
import { getViewRenderer } from './backend/lib/views';
const renderer = getViewRenderer();
renderer.clearCache();
```

### Add New Helper

```typescript
// backend/lib/helpers.ts
export class ViewHelpers {
  // Add your helper method
  myHelper(input: string): string {
    return `Processed: ${input}`;
  }
}

// backend/lib/views.ts - Add to context
myHelper: (input: string) => this.helpers.myHelper(input)
```

### Create New Partial

```pug
//- views/shared/_my_component.pug
.my-component
  h3= title
  p= description
```

Use it:
```pug
!= render('shared/my_component', { title: 'Hello', description: 'World' })
```

### Mount Vue Component

```pug
#my-component

script.
  simbi('createComponent').then(function(createComponent) {
    createComponent('MyComponent', {
      el: '#my-component',
      propsData: {
        data: gon.myData
      }
    });
  });
```

## Debugging

### Check Server Logs

```bash
npm run dev
# Watch console for errors
```

### Validate Pug Syntax

```bash
# Install pug-cli
npm install -g pug-cli

# Validate template
pug < views/YOUR_VIEW.pug
```

### Common Errors

**Error**: `Cannot find module 'pug'`
```bash
npm install pug
```

**Error**: `Template compilation failed`
- Check Pug syntax (indentation, parentheses)
- Validate all `render()` calls have quotes
- Ensure variables are defined in locals

**Error**: `simbi is not defined`
- Include `/simbi.js` in layout
- Check script loading order

## Development Tips

### Hot Reload

```bash
npm run watch
# Server restarts on file changes
```

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

```bash
# Create .env file
NODE_ENV=development
PORT=3000
FACEBOOK_APP_ID=your-app-id
MIXPANEL_TOKEN=your-token
```

## Getting Help

1. **Documentation**:
   - `README.md` - Full system overview
   - `MIGRATION_GUIDE.md` - SLIM to Pug conversion
   - `EXAMPLES.md` - 18 usage examples

2. **Examples**:
   - Look at converted views in `/views`
   - Check controllers in `/backend/controllers`

3. **Resources**:
   - Pug docs: https://pugjs.org/
   - Express docs: https://expressjs.com/

## Next Steps

1. ✅ Review the 4 converted views
2. ⏳ Convert 20 high-traffic pages
3. ⏳ Convert shared partials
4. ⏳ Convert remaining 380+ templates
5. ⏳ Connect to database
6. ⏳ Add authentication
7. ⏳ Deploy to production

---

**Status**: System ready for development
**Progress**: 5 of 414 templates converted (1.2%)
**Estimated completion**: 2-3 hours with automation
