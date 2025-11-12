# SLIM to Pug Migration Guide

Complete guide for converting Simbi's 414 SLIM templates to Pug format.

## Quick Reference

### Syntax Comparison

| Feature | SLIM | Pug |
|---------|------|-----|
| **Tags** | `div.class#id` | `div.class#id` ✓ Same |
| **Text** | `p Hello` | `p Hello` ✓ Same |
| **Code output (escaped)** | `= @user.name` | `= user.name` |
| **Code output (unescaped)** | `== @html` | `!= html` |
| **Code execution** | `- if condition` | `- if condition` ✓ Same |
| **Interpolation** | `p Hello #{@name}` | `p Hello #{name}` |
| **Comments** | `/ Comment` | `//- Comment` |
| **Attributes** | `a href='#' class='btn'` | `a(href='#' class='btn')` |
| **Multiline code** | `ruby:\n  code` | `script.\n  code` |

## Conversion Steps

### 1. Variable References

**SLIM:**
```slim
= @user.name
= current_user.email
- @items.each do |item|
```

**Pug:**
```pug
= user.name
= currentUser.email
each item in items
```

**Rule**: Remove `@` sigils, convert Ruby snake_case instance vars to camelCase.

### 2. Render Calls

**SLIM:**
```slim
= render 'shared/header'
= render 'users/card', user: @user
= render partial: 'item', collection: @items
```

**Pug:**
```pug
!= render('shared/header')
!= render('users/card', { user: user })
each item in items
  != render('item', { item: item })
```

**Rule**:
- Single quotes to parentheses
- Hash syntax to object literal
- Collections must use `each` loop

### 3. Helper Methods

**SLIM:**
```slim
= link_to 'Profile', user_path(@user), class: 'btn'
= stylesheet_link_tag 'app', 'common'
= t('user.greeting', name: @user.name)
```

**Pug:**
```pug
!= link_to('Profile', userPath(user), { class: 'btn' })
!= stylesheet_link_tag('app', 'common')
= t('user.greeting', { name: user.name })
```

**Rule**: Convert to function call syntax with object literals.

### 4. Conditionals

**SLIM:**
```slim
- if user_signed_in?
  p Welcome back
- elsif @guest
  p Welcome guest
- else
  p Please sign in
```

**Pug:**
```pug
if user_signed_in()
  p Welcome back
else if guest
  p Welcome guest
else
  p Please sign in
```

**Rule**:
- Drop `-` prefix for `if/else/each`
- Convert `elsif` to `else if`
- Add `()` to method calls

### 5. Loops

**SLIM:**
```slim
- @users.each do |user|
  .user-card
    = user.name

- @items.each_with_index do |item, i|
  div class="item-#{i}"
```

**Pug:**
```pug
each user in users
  .user-card
    = user.name

each item, i in items
  div(class=`item-${i}`)
```

**Rule**: Use `each...in` syntax, index comes after variable.

### 6. Content For Blocks

**SLIM:**
```slim
- content_for :head do
  = stylesheet_link_tag 'special'

- content_for :modals do
  #my-modal
```

**Pug:**
```pug
- content_for('head', function() {
  != stylesheet_link_tag('special')
- })

- content_for('modals', function() {
  #my-modal
- })
```

**Rule**: Convert to function call with callback.

### 7. JavaScript/CSS Blocks

**SLIM:**
```slim
javascript:
  $(function() {
    console.log('Ready');
  });

sass:
  .my-class
    color: red
```

**Pug:**
```pug
script.
  $(function() {
    console.log('Ready');
  });

style.
  .my-class {
    color: red;
  }
```

**Rule**:
- `javascript:` → `script.`
- `sass:` → `style.`
- Note: Pug doesn't process Sass, convert to CSS

### 8. Attributes

**SLIM:**
```slim
a href='/path' class='btn btn-primary' data-toggle='modal'
input type='text' name='email' value=(@user.email)
div class=(@active ? 'active' : '')
```

**Pug:**
```pug
a(href='/path' class='btn btn-primary' data-toggle='modal')
input(type='text' name='email' value=user.email)
div(class=(active ? 'active' : ''))
```

**Rule**: Use parentheses for attributes, expressions don't need `()`.

### 9. Vue Component Mounting

**SLIM:**
```slim
- if @show_modal
  #modal-container
  javascript:
    simbi('createComponent').then(function(createComponent) {
      createComponent('MyModal', {
        el: '#modal-container',
        propsData: {
          data: gon.modalData
        }
      })
    })
```

**Pug:**
```pug
if showModal
  #modal-container
  script.
    simbi('createComponent').then(function(createComponent) {
      createComponent('MyModal', {
        el: '#modal-container',
        propsData: {
          data: gon.modalData
        }
      });
    });
```

**Rule**: Keep Vue mounting logic intact, just convert surrounding syntax.

### 10. Inline Conditions

**SLIM:**
```slim
div class=('hide' if !@visible)
= link_to('Edit', path) if can_edit?
```

**Pug:**
```pug
div(class=(visible ? '' : 'hide'))
if canEdit
  != link_to('Edit', path)
```

**Rule**: Convert trailing conditions to full if statements or ternary.

## Common Patterns

### Pattern 1: User Info Display

**SLIM:**
```slim
.user-info
  h3 = @user.full_name
  p = @user.email
  - if @user.about.present?
    .about = simple_format(@user.about)
```

**Pug:**
```pug
.user-info
  h3= user.fullName
  p= user.email
  if user.about
    .about!= simpleFormat(user.about)
```

### Pattern 2: Service Cards

**SLIM:**
```slim
.row.condensed
  = render partial: 'services/card', collection: @services, as: :service, locals: { dashboard: true }
```

**Pug:**
```pug
.row.condensed
  each service in services
    != render('services/card', { service: service, dashboard: true })
```

### Pattern 3: Modal with Vue Component

**SLIM:**
```slim
- content_for :modals do
  - if @show_welcome
    #welcome-modal
    javascript:
      simbi('createComponent').then(function(createComponent) {
        createComponent('WelcomeModal', {
          el: '#welcome-modal',
          propsData: { user: gon.user }
        })
      })
```

**Pug:**
```pug
- content_for('modals', function() {
  if showWelcome
    #welcome-modal
    script.
      simbi('createComponent').then(function(createComponent) {
        createComponent('WelcomeModal', {
          el: '#welcome-modal',
          propsData: { user: gon.user }
        });
      });
- })
```

### Pattern 4: Nested Partials

**SLIM:**
```slim
= render 'shared/header'
.main-content
  = render 'users/profile/header', user: @user
  = render 'users/profile/services', services: @user_services
  = render 'users/profile/reviews', reviews: @reviews
= render 'shared/footer'
```

**Pug:**
```pug
!= render('shared/header')
.main-content
  != render('users/profile/header', { user: user })
  != render('users/profile/services', { services: userServices })
  != render('users/profile/reviews', { reviews: reviews })
!= render('shared/footer')
```

## Automation Tips

### 1. Batch Conversion Script

```bash
# Find all SLIM files
find app/views -name "*.slim" > slim_files.txt

# Process each file
while read file; do
  # Get output path
  output="${file%.slim}.pug"
  output="${output/app\/views/views}"

  # Create directory
  mkdir -p "$(dirname "$output")"

  # Manual conversion needed - add to queue
  echo "TODO: Convert $file to $output"
done < slim_files.txt
```

### 2. Search and Replace Patterns

Use these regex patterns in your editor:

```regex
# Remove @ sigils from variables
@(\w+)  →  $1

# Convert render calls
= render '([^']+)'  →  != render('$1')

# Convert if/elsif/else
- if (.+)  →  if $1
- elsif (.+)  →  else if $1
- else  →  else

# Convert each loops
- @(\w+)\.each do \|(\w+)\|  →  each $2 in $1
```

### 3. Validation Checklist

After converting each template:

- [ ] All `@` variables converted to camelCase
- [ ] All `render` calls use function syntax
- [ ] All helper methods use parentheses
- [ ] All conditionals drop `-` prefix
- [ ] All loops use `each...in` syntax
- [ ] All `content_for` use callback syntax
- [ ] All JavaScript blocks use `script.`
- [ ] All attributes use parentheses
- [ ] Vue component mounting preserved
- [ ] Test render in browser

## Common Pitfalls

### 1. Forgetting Parentheses

❌ **Wrong:**
```pug
!= render 'shared/nav'
```

✓ **Correct:**
```pug
!= render('shared/nav')
```

### 2. Wrong Unescaped Output

❌ **Wrong:**
```pug
= render('partial')  // Will escape HTML
```

✓ **Correct:**
```pug
!= render('partial')  // Renders HTML
```

### 3. Loop Syntax

❌ **Wrong:**
```pug
each users as user  // Not Pug syntax
```

✓ **Correct:**
```pug
each user in users
```

### 4. Content For Blocks

❌ **Wrong:**
```pug
- content_for('head')
  script Here
```

✓ **Correct:**
```pug
- content_for('head', function() {
  script Here
- })
```

### 5. Conditional Attributes

❌ **Wrong:**
```pug
div(class='hide' if !visible)
```

✓ **Correct:**
```pug
div(class=(visible ? '' : 'hide'))
```

## Testing Converted Templates

### 1. Visual Testing

```bash
# Start dev server
npm run dev

# Visit each converted page
open http://localhost:3000/page-url

# Check:
# - Layout renders correctly
# - Partials appear
# - Vue components mount
# - JavaScript executes
# - Styles apply
```

### 2. Console Check

Look for errors:
```javascript
// Should see successful mounts
// Simbi component mounted: ComponentName

// Should NOT see:
// Uncaught ReferenceError: variable is not defined
// Pug compilation error
```

### 3. Compare with Original

```bash
# Render original Rails view
curl http://original-simbi.com/path > original.html

# Render new Pug view
curl http://localhost:3000/path > new.html

# Compare structure (ignore dynamic content)
diff <(grep -o '<[^>]*>' original.html | sort) \
     <(grep -o '<[^>]*>' new.html | sort)
```

## Conversion Priority

Recommend converting in this order:

1. **Layouts** (1 file)
   - `layouts/application.html.slim`

2. **Core Partials** (~20 files)
   - `shared/_navbar.html.slim`
   - `shared/_footer.html.slim`
   - `shared/_user_info.html.slim`
   - etc.

3. **High-Traffic Pages** (~10 files)
   - `home/index.html.slim`
   - `services/index.html.slim`
   - `users/profile_pages/show.html.slim`
   - `talks/index.html.slim`

4. **Remaining Views** (~380 files)
   - Convert by feature area
   - Test as you go

## Resources

- **Pug Documentation**: https://pugjs.org/
- **SLIM Documentation**: http://slim-lang.com/
- **This Project's Examples**: See `/views` directory

## Getting Help

If you encounter difficult conversions:

1. Check this guide's patterns
2. Look at already-converted examples in `/views`
3. Test small snippets in isolation
4. Consult Pug documentation

---

**Total Templates**: 414
**Converted**: 5 (1.2%)
**Remaining**: 409 (98.8%)
**Estimated Time**: ~2-3 hours with automation
