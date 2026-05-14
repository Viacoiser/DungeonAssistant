# 📱 TESTING GUIDE - Frontend Responsive Refactor

## 🧪 Quick Start Testing

### 1. Run Development Server
```bash
cd frontend
npm run dev
```

This starts the dev server on `http://localhost:5173`

---

## 🖥️ Desktop Testing (1920px+)

### Expected Behavior
- ✅ **Sidebar visible** on the left (w-64 = 256px)
- ✅ **BottomNav hidden**
- ✅ Full campaign details displayed
- ✅ All header info visible (user, player name, role badge)
- ✅ Tab bar fully visible with all tabs

### Test Cases
1. **Sidebar Navigation**
   - Click "Campañas" → Should navigate to campaigns list
   - Click "Personajes" → Should navigate to characters
   - Click "Enciclopedia" → Should expand/collapse menu
   - Each sub-item should work

2. **Campaign Details**
   - Open any campaign
   - Verify header shows campaign name, description, user info
   - All tabs should be clickable and functional

3. **Responsive Elements**
   - Resize browser window to confirm sidebar stays visible
   - Scroll campaign content → sidebar should stay sticky

---

## 📱 Tablet Testing (768px)

### Expected Behavior
- ✅ **Sidebar visible** (but narrower)
- ✅ **BottomNav hidden**
- ✅ Content takes remaining space
- ✅ Header info might be more compact

### Test Cases
1. **Layout**
   - Open DevTools (F12)
   - Change to tablet view (iPad, 768px)
   - Verify sidebar is still visible
   - Content should not be hidden

2. **Touch Friendly**
   - Buttons should be at least 44px (touch-friendly)
   - All buttons should work with touch

---

## 📲 Mobile Testing (375px - iPhone 12)

### Expected Behavior
- ❌ **Sidebar hidden** (`hidden md:flex`)
- ✅ **BottomNav visible** at bottom
- ✅ Content takes full width
- ✅ Spacer at bottom prevents content overlap

### Test Cases

#### 1. **Navigation**
- ✅ Bottom navigation bar visible with 5 items:
  - Campañas (Castle icon)
  - Personajes (Users icon)
  - Enciclopedia (Book icon) - with sub-menu
  - Ajustes (Settings icon)
  - Salir (Logout, red)

- ✅ Each tab should:
  - Change text color to orange when active
  - Show smooth transition
  - Scale slightly on hover

#### 2. **Encyclopedia Menu** (Tap "Enciclopedia")
- ✅ Pop-up menu appears above BottomNav
- ✅ Shows 2-column grid:
  - Rasgos, Equipamiento
  - Monstruos, Hechizos
  - Dados, Dice 3D
- ✅ Each has icon + label
- ✅ All items clickable

#### 3. **Campaign View**
- Open campaign on mobile
- ✅ Header should be compact:
  - Back button visible
  - Campaign name (truncated if long)
  - Role badge (GM/Jugador)
  - User info hidden or minimal
- ✅ Tab bar horizontal scrollable if many tabs
- ✅ Tab content below tabs
- ✅ Spacer at bottom (20px padding prevents BottomNav overlap)

#### 4. **No Content Hiding**
- ✅ Scroll campaign content
- ✅ BottomNav should NOT cover any content
- ✅ Spacer takes care of this automatically

#### 5. **Small Phone (320px - iPhone SE)**
- ✅ Everything should still work
- ✅ All buttons clickable
- ✅ No horizontal scroll needed
- ✅ Text might be smaller but readable

---

## 🔄 Breakpoint Testing Checklist

### xs (320px) - iPhone SE
- [ ] All buttons clickable
- [ ] No horizontal scrolling
- [ ] BottomNav visible and functional
- [ ] Content readable

### sm (640px)
- [ ] Same as xs
- [ ] Should be wider

### md (768px) - iPad
- [ ] Sidebar appears
- [ ] BottomNav disappears
- [ ] Layout shifts correctly
- [ ] Transition smooth

### lg (1024px) - Large tablet
- [ ] Sidebar comfortable width
- [ ] Lots of space for content

### xl (1280px+) - Desktop
- [ ] Full layout optimal
- [ ] No weird spacing
- [ ] All elements readable

---

## 🎨 Visual Testing

### Colors
- ✅ Gold text = `#e2d1a6` (fantasy-gold)
- ✅ Accent orange = `#d9531e` (fantasy-accent)  
- ✅ Dark background = `#0d0d0d` (fantasy-bg)

### Typography
- ✅ Display font = Almendra (Cinzel for serif)
- ✅ Body font = Inter
- ✅ Sizes responsive: `text-xs md:text-sm md:text-base`

### Spacing
- ✅ Mobile padding: `px-3` (12px)
- ✅ Desktop padding: `md:px-7` (28px)
- ✅ Gap between elements responsive

### Animations
- ✅ Smooth transitions (200-300ms)
- ✅ Hover effects on buttons
- ✅ Tab animations working

---

## 🐛 Common Issues & Solutions

### Issue: BottomNav overlaps content
**Solution**: Spacer `h-20` should be included. Check `BottomNavResponsive.jsx` has the spacer div at the end.

### Issue: Sidebar not appearing on desktop
**Solution**: Check Tailwind classes. Sidebar should have `hidden md:flex`

### Issue: Tab content not scrolling
**Solution**: Parent should have `overflow-y-auto` on the content div.

### Issue: Mobile header too cramped
**Solution**: This is expected. User info hidden with `hidden sm:flex` to save space.

---

## ✅ Final Checklist

### Functionality
- [ ] All navigation works
- [ ] Campaigns open
- [ ] Characters display
- [ ] Dice roller works
- [ ] Tabs switch content properly
- [ ] Logout works

### Responsive
- [ ] Works at 320px
- [ ] Works at 768px  
- [ ] Works at 1920px
- [ ] Sidebar toggle works at md breakpoint
- [ ] BottomNav spacing correct

### Visual
- [ ] Colors correct
- [ ] No layout breaks
- [ ] Text readable at all sizes
- [ ] Icons visible
- [ ] Animations smooth

### Performance
- [ ] No console errors (F12)
- [ ] Page loads in < 3s
- [ ] Smooth scrolling
- [ ] Animations don't lag

---

## 🚀 Deployment Checklist

- [ ] All tests pass ✅
- [ ] No console errors
- [ ] Tested on 3+ real devices (phone, tablet, desktop)
- [ ] Manager/PO approval
- [ ] Ready to merge to main
- [ ] Deploy to staging first
- [ ] Final QA on staging
- [ ] Deploy to production

---

## 📸 Screenshots to Take

For documentation:
1. Desktop 1920px - Full layout with Sidebar
2. Tablet 768px - Sidebar transition
3. Mobile 375px - BottomNav layout
4. Mobile 320px - iPhone SE smallest screen
5. Mobile campaign view - Tab scrolling

---

## 📞 Questions?

If something doesn't work:
1. Check console (F12 → Console tab)
2. Look for red errors
3. Verify build: `npm run build`
4. Clear cache: `Ctrl+Shift+Delete` in browser
5. Restart dev server: `npm run dev`

---

**Happy Testing! 🎉**
