"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { uploadImageApi, uploadMultipleImagesApi } from "@/lib/api";

const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Modern Real-World Image Upload Zone for Admin Portal
 * Direct file selection from smartphone camera, photo gallery, or laptop file manager
 */
export function ImageUploadZone({
  primaryImage,
  setPrimaryImage,
  secondaryImage,
  setSecondaryImage,
  galleryImages = [],
  setGalleryImages,
}) {
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [dragActivePrimary, setDragActivePrimary] = useState(false);
  const [dragActiveSecondary, setDragActiveSecondary] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUrlInputs, setShowUrlInputs] = useState(false);

  const primaryInputRef = useRef(null);
  const secondaryInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Validate file
  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    const mime = (file.type || "").toLowerCase();
    const isImage = mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name);
    if (!isImage) {
      setErrorMessage(`File "${file.name}" is not a supported image format.`);
      return false;
    }
    setErrorMessage("");
    return true;
  };

  // Upload Single File (Primary or Secondary)
  const handleSingleUpload = async (file, fieldType) => {
    if (!validateFile(file)) return;

    // Optimistic instant preview for zero lag
    const localPreviewUrl = URL.createObjectURL(file);
    if (fieldType === "primary") {
      setPrimaryImage(localPreviewUrl);
      setUploadingPrimary(true);
    } else {
      setSecondaryImage(localPreviewUrl);
      setUploadingSecondary(true);
    }

    try {
      const res = await uploadImageApi(file, "house_of_laado/products");
      if (res?.data?.url) {
        if (fieldType === "primary") {
          setPrimaryImage(res.data.url);
        } else {
          setSecondaryImage(res.data.url);
        }
      }
    } catch (err) {
      setErrorMessage(`Upload failed: ${err.message || "Could not upload image"}`);
    } finally {
      if (fieldType === "primary") setUploadingPrimary(false);
      else setUploadingSecondary(false);
    }
  };

  // Upload Multiple Gallery Files
  const handleGalleryUpload = async (files) => {
    const validFiles = Array.from(files).filter(validateFile);
    if (!validFiles.length) return;

    setUploadingGallery(true);

    // Optimistic previews
    const localPreviews = validFiles.map((f) => URL.createObjectURL(f));
    if (setGalleryImages) {
      setGalleryImages((prev) => [...prev, ...localPreviews]);
    }

    try {
      let uploadedUrls = [];
      try {
        const res = await uploadMultipleImagesApi(validFiles, "house_of_laado/products");
        if (Array.isArray(res?.data)) {
          uploadedUrls = res.data.map((item) => item.url);
        }
      } catch {
        // Fallback to sequential uploads if multiple fails
        for (const f of validFiles) {
          const res = await uploadImageApi(f, "house_of_laado/products");
          if (res?.data?.url) uploadedUrls.push(res.data.url);
        }
      }

      if (uploadedUrls.length && setGalleryImages) {
        setGalleryImages((prev) => {
          // Replace local blobs with permanent URLs
          const filtered = prev.filter((u) => !localPreviews.includes(u));
          return [...filtered, ...uploadedUrls];
        });
      }
    } catch (err) {
      setErrorMessage(`Gallery upload failed: ${err.message || "Could not upload files"}`);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove) => {
    if (setGalleryImages) {
      setGalleryImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-serif font-bold text-neutral-900">
              Product Photography & Media
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Direct Upload Active
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Directly select photos from your phone camera, photo library, or laptop. No image link required.
          </p>
        </div>

        {/* Optional URL Toggle */}
        <button
          type="button"
          onClick={() => setShowUrlInputs(!showUrlInputs)}
          className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 underline underline-offset-4 self-start sm:self-auto cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{showUrlInputs ? "Hide URL inputs" : "Paste URL instead"}</span>
          {showUrlInputs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-500 hover:text-red-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column: Primary & Secondary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= PRIMARY IMAGE (REQUIRED) ================= */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <span>Primary Cover Photo</span>
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-stone-500 font-medium">Main Storefront Image</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={primaryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleSingleUpload(e.target.files[0], "primary");
              e.target.value = "";
            }}
          />

          {primaryImage ? (
            /* Uploaded Preview Card */
            <div className="relative group rounded-2xl border-2 border-stone-200 overflow-hidden bg-stone-50 aspect-[3/4] flex items-center justify-center">
              <img
                src={primaryImage}
                alt="Primary Cover Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-[#1F2A44] text-[#FAF7F2] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C6A75E]" />
                <span>Primary Cover</span>
              </div>

              {/* Uploading Overlay */}
              {uploadingPrimary && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C6A75E] mb-2" />
                  <p className="text-xs font-medium">Uploading to Media Server...</p>
                </div>
              )}

              {/* Action Buttons Overlay */}
              {!uploadingPrimary && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => primaryInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-stone-800 text-xs font-semibold shadow-lg hover:bg-stone-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#1F2A44]" />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrimaryImage("")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-lg hover:bg-red-700 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Direct Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActivePrimary(true);
              }}
              onDragLeave={() => setDragActivePrimary(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActivePrimary(false);
                if (e.dataTransfer.files?.[0]) handleSingleUpload(e.dataTransfer.files[0], "primary");
              }}
              onClick={() => primaryInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed aspect-[3/4] flex flex-col items-center justify-center p-6 text-center transition-all ${
                dragActivePrimary
                  ? "border-[#1F2A44] bg-[#1F2A44]/5 scale-[0.99]"
                  : "border-stone-300 hover:border-[#1F2A44] bg-stone-50/70 hover:bg-stone-50"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-[#1F2A44]/10 text-[#1F2A44] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>

              <p className="text-sm font-semibold text-stone-900 mb-1">
                Select Photo from Phone or Laptop
              </p>
              <p className="text-xs text-stone-500 max-w-[220px] mb-3 leading-relaxed">
                Tap to open camera or browse files. Drag & drop works here too.
              </p>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1F2A44] text-white text-xs font-semibold shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Browse / Take Photo</span>
              </span>

              <span className="text-[10px] text-stone-400 mt-3 font-medium">
                JPG, PNG, WebP • Up to 15MB
              </span>
            </div>
          )}

          {/* Optional Paste URL Input (Only when toggled) */}
          {showUrlInputs && (
            <div className="mt-2.5">
              <input
                type="url"
                value={primaryImage}
                onChange={(e) => setPrimaryImage(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
              />
            </div>
          )}
        </div>

        {/* ================= SECONDARY IMAGE (HOVER SWAP) ================= */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Secondary Hover Image
            </label>
            <span className="text-[11px] text-stone-500 font-medium">Back / Detail Angle</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={secondaryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleSingleUpload(e.target.files[0], "secondary");
              e.target.value = "";
            }}
          />

          {secondaryImage ? (
            /* Uploaded Preview Card */
            <div className="relative group rounded-2xl border-2 border-stone-200 overflow-hidden bg-stone-50 aspect-[3/4] flex items-center justify-center">
              <img
                src={secondaryImage}
                alt="Secondary Hover Preview"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Status Badge */}
              <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-[#FAF7F2] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Eye className="w-3 h-3 text-stone-300" />
                <span>Hover View</span>
              </div>

              {/* Uploading Overlay */}
              {uploadingSecondary && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C6A75E] mb-2" />
                  <p className="text-xs font-medium">Uploading to Media Server...</p>
                </div>
              )}

              {/* Action Buttons Overlay */}
              {!uploadingSecondary && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => secondaryInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-stone-800 text-xs font-semibold shadow-lg hover:bg-stone-100 transition-transform active:scale-95 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#1F2A44]" />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSecondaryImage("")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow-lg hover:bg-red-700 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Direct Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActiveSecondary(true);
              }}
              onDragLeave={() => setDragActiveSecondary(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActiveSecondary(false);
                if (e.dataTransfer.files?.[0]) handleSingleUpload(e.dataTransfer.files[0], "secondary");
              }}
              onClick={() => secondaryInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed aspect-[3/4] flex flex-col items-center justify-center p-6 text-center transition-all ${
                dragActiveSecondary
                  ? "border-[#1F2A44] bg-[#1F2A44]/5 scale-[0.99]"
                  : "border-stone-300 hover:border-[#1F2A44] bg-stone-50/70 hover:bg-stone-50"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-stone-200/70 text-stone-600 flex items-center justify-center mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>

              <p className="text-sm font-semibold text-stone-900 mb-1">
                Select Hover / Back View Image
              </p>
              <p className="text-xs text-stone-500 max-w-[220px] mb-3 leading-relaxed">
                Appears automatically when customers hover over the garment card.
              </p>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-800 text-white text-xs font-semibold shadow-xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Select Back View</span>
              </span>

              <span className="text-[10px] text-stone-400 mt-3 font-medium">
                Optional • Swaps on card hover
              </span>
            </div>
          )}

          {/* Optional Paste URL Input (Only when toggled) */}
          {showUrlInputs && (
            <div className="mt-2.5">
              <input
                type="url"
                value={secondaryImage}
                onChange={(e) => setSecondaryImage(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1F2A44]"
              />
            </div>
          )}
        </div>
      </div>

      {/* ================= MULTI-IMAGE GALLERY (ADDITIONAL SHOTS) ================= */}
      {setGalleryImages && (
        <div className="pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Additional Gallery Angles & Fabric Details ({galleryImages.length})
              </h3>
              <p className="text-[11px] text-stone-500">
                Add close-ups, embroidery shots, dupatta styling, or model try-ons.
              </p>
            </div>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploadingGallery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploadingGallery ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Add More Photos</span>
            </button>
          </div>

          {/* Hidden Multiple File Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleGalleryUpload(e.target.files);
              }
              e.target.value = "";
            }}
          />

          {/* Gallery Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {galleryImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-stone-200 bg-stone-50"
              >
                <img
                  src={imgUrl}
                  alt={`Gallery shot ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(idx)}
                  className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* "+ Add Photos" Drop Target Card */}
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="cursor-pointer aspect-[3/4] rounded-xl border-2 border-dashed border-stone-300 hover:border-[#1F2A44] bg-stone-50/50 hover:bg-stone-50 flex flex-col items-center justify-center p-3 text-center transition-colors"
            >
              {uploadingGallery ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-[#1F2A44] mb-1.5" />
                  <span className="text-[11px] text-stone-600 font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6 text-stone-400 group-hover:text-[#1F2A44] mb-1" />
                  <span className="text-xs font-semibold text-stone-700">Add Angles</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Select multiple</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
