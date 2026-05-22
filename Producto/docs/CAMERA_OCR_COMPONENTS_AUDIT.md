# Camera/OCR Components & Character Form Audit

## Summary
The frontend has **fully implemented** camera/OCR scanning for character sheet digitization. The functionality is present but only integrated in the **character creation flow**, not in the character form itself.

---

## 1. Camera Capture Component

### File: [frontend/src/components/CharacterCreation/CameraCapture.jsx](frontend/src/components/CharacterCreation/CameraCapture.jsx)

**Purpose:** Modal component for capturing or uploading character sheet images for OCR processing

**Key Features:**
- Live camera feed using `getUserMedia()` API
- Photo capture functionality
- Image upload fallback (when camera unavailable)
- Send to backend endpoint `/api/vision/digitize` for OCR
- Loading states and error handling
- Extracted data passed back to parent via `onCharacterDataExtracted()` callback

**State Management:**
```javascript
const [hasCamera, setHasCamera] = useState(false);
const [cameraActive, setCameraActive] = useState(false);
const [loading, setLoading] = useState(false);
const [capturedImage, setCapturedImage] = useState(null);
const [error, setError] = useState(null);
```

**Key Methods:**
- `initCamera()` - Initialize device camera access
- `capturePhoto()` - Capture frame from video stream
- `processImage(imageFile)` - Send to backend OCR
- `handleFileUpload()` - Handle file input
- `handleConfirmCapture()` - Process captured photo

**UI Elements:**
- 📸 Live video preview when camera active
- Camera capture button with Camera icon
- Image preview after capture
- Retry and Process buttons
- File upload fallback button
- Error messages with AlertCircle icon

**Backend Integration:**
```javascript
const response = await fetch('/api/vision/digitize', {
  method: 'POST',
  body: formData,  // multipart with image file
  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
});
// Returns: result.data with extracted character fields
```

---

## 2. Character Creation Page

### File: [frontend/src/pages/CreateCharacter.jsx](frontend/src/pages/CreateCharacter.jsx)

**Integration with Camera:**

```javascript
import CameraCapture from '../components/CharacterCreation/CameraCapture'

// State for camera/OCR
const [showCamera, setShowCamera] = useState(false)
const [scannedData, setScannedData] = useState(null)

// Handler for extracted data
const handleCharacterDataExtracted = (extractedData) => {
  setScannedData(extractedData)
  setShowCamera(false)
}
```

**Camera Button (Line ~375):**
```jsx
<button
  onClick={() => setShowCamera(true)}
  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all transform hover:scale-105"
>
  <Camera size={20} /> 📸 Escanear Hoja de Personaje
</button>
```

**Scanned Data Display:**
```jsx
{scannedData && (
  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
    <h3 className="text-green-400 font-semibold mb-2">📋 Datos Escaneados:</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-green-300">
      {scannedData.character_name && <div><strong>Nombre:</strong> {scannedData.character_name}</div>}
      {scannedData.race && <div><strong>Raza:</strong> {scannedData.race}</div>}
      {scannedData.class && <div><strong>Clase:</strong> {scannedData.class}</div>}
      {scannedData.level && <div><strong>Nivel:</strong> {scannedData.level}</div>}
      {scannedData.armor_class && <div><strong>CA:</strong> {scannedData.armor_class}</div>}
    </div>
  </div>
)}
```

**Modal Rendering:**
```jsx
{showCamera && (
  <CameraCapture
    onCharacterDataExtracted={handleCharacterDataExtracted}
    onCancel={() => setShowCamera(false)}
  />
)}
```

---

## 3. Character Form Component

### File: [frontend/src/components/shared/CharacterForm.jsx](frontend/src/components/shared/CharacterForm.jsx)

**Current State:** ❌ **NO camera button integrated**

**Image Upload Section (Line ~494):**
- Only has standard file upload
- Uses `Upload` icon (not Camera)
- File input with click handler
- Image preview with removal option

```jsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
  <h2 className="text-xl font-bold text-yellow-600 mb-6">🖼️ Imagen del Personaje</h2>

  {/* Preview or Upload Area */}
  {imagePreview ? (
    <div className="relative">
      <img src={imagePreview} alt="Vista previa del personaje" ... />
      <button onClick={handleRemoveImage} type="button" ...>
        <X size={20} className="text-white" />
      </button>
    </div>
  ) : (
    <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center ..."
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload size={32} className="text-gray-400 mx-auto mb-2" />
      <p className="text-gray-300 font-medium">Haz clic para subir una imagen</p>
    </div>
  )}

  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleImageSelect}
    className="hidden"
  />

  <button
    onClick={() => fileInputRef.current?.click()}
    type="button"
    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
  >
    <Upload size={18} />
    {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
  </button>
</div>
```

**Image Handling:**
```javascript
const handleImageSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'La imagen no debe superar 5MB' }))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target.result)
      setFormData(prev => ({ ...prev, image_url: event.target.result }))
      setErrors(prev => ({ ...prev, image: '' }))
    }
    reader.readAsDataURL(file)
  }
}
```

---

## 4. OCR Tab Component

### File: [frontend/src/pages/CampaignView.jsx](frontend/src/pages/CampaignView.jsx#L2053)

**Purpose:** OCR functionality in campaign view (separate from character creation)

**Location:** Line ~2053 as `export function OCRTab()`

**Features:**
- Drag-and-drop image upload
- File input for images/PDFs
- Preview/Result display area

**Rendered in Campaign Details:**
- [CampaignDetail.jsx](frontend/src/components/desktop/CampaignDetail.jsx#L43) - Desktop
- [CampaignDetailTablet.jsx](frontend/src/components/tablet/CampaignDetailTablet.jsx#L41) - Tablet
- [CampaignDetailMobile.jsx](frontend/src/components/mobile/CampaignDetailMobile.jsx#L41) - Mobile

All variants have: `{ id: 'ocr', label: 'OCR', Icon: Camera }`

---

## 5. API Integration

### Backend Endpoint: `/api/vision/digitize`

**Expected Response:**
```javascript
{
  success: true,
  data: {
    character_name: "string",
    race: "string",
    class: "string",
    level: number,
    armor_class: number,
    // ... other extracted fields
  }
}
```

**Used In:**
1. Character creation flow (CameraCapture → CreateCharacter)
2. Campaign OCR tab (OCRTab component)

---

## 6. Hooks & Services

### Frontend Hooks:
- **useVoice.js** (in `frontend/hooks/`) - Only voice-related, no camera functionality

### API Service:
- [frontend/src/services/api.js](frontend/src/services/api.js#L117) - Section labeled "Vision / OCR"

---

## Summary Table

| Component | Location | Status | Camera Button | OCR Integration |
|-----------|----------|--------|---|---|
| CameraCapture | `components/CharacterCreation/` | ✅ Implemented | ✅ Yes | ✅ Yes |
| CreateCharacter page | `pages/` | ✅ Integrated | ✅ Yes (separate button) | ✅ Yes |
| CharacterForm | `components/shared/` | ✅ Implemented | ❌ No | ❌ No |
| CampaignDetail (Desktop) | `components/desktop/` | ✅ Implemented | ✅ Yes (tab) | ✅ Yes (OCRTab) |
| CampaignDetail (Tablet) | `components/tablet/` | ✅ Implemented | ✅ Yes (tab) | ✅ Yes (OCRTab) |
| CampaignDetail (Mobile) | `components/mobile/` | ✅ Implemented | ✅ Yes (tab) | ✅ Yes (OCRTab) |
| OCRTab | `pages/CampaignView.jsx` | ✅ Implemented | ✅ Yes (drop zone) | ✅ Yes |

---

## Current Architecture

```
CreateCharacter Page (entry point)
    ├─ "📸 Escanear Hoja" Button
    │   └─ CameraCapture Modal (on click)
    │       ├─ Camera feed (live or file upload)
    │       └─ → /api/vision/digitize → extractedData
    │           └─ setScannedData() → displays results
    │
    └─ CharacterForm Component
        ├─ Image section (upload only, NO camera button)
        └─ Other form fields (name, class, race, etc.)
        
Campaign View (separate flow)
    ├─ CampaignDetail tabs
    │   └─ OCR Tab
    │       ├─ Drag-drop zone
    │       ├─ File input (images/PDFs)
    │       └─ → /api/vision/digitize
    │
    └─ Character List
        └─ Character views
```

---

## Recommendations

### ❌ **NOT Hidden or Commented Out**
The camera button is NOT commented out or hidden. It's fully visible in:
- CreateCharacter page (as separate button before form)
- Campaign OCR tabs (as dedicated tab)

### ✅ **To Add Camera to CharacterForm**
If you want to add camera scanning to the CharacterForm's image section, you would need to:

1. **Import CameraCapture** in CharacterForm.jsx
2. **Add state** for `showCameraModal` and `scannedImage`
3. **Add button** next to "Subir Imagen" that opens CameraCapture
4. **Handle callback** to populate image_url
5. **Display result** in image preview section

This is not currently needed since the CreateCharacter page already provides the camera scanning UI separately before the form.
