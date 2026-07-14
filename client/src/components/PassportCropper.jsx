import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AlertTriangle, Check, Info, X } from 'lucide-react';

const MIN_PX = 300;
const PASSPORT_ASPECT = 35 / 45;

const initCrop = (width, height) =>
  centerCrop(
    makeAspectCrop({ unit: '%', width: 78 }, PASSPORT_ASPECT, width, height),
    width,
    height
  );

const getCroppedBlob = (imgEl, crop) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const scaleX = imgEl.naturalWidth / imgEl.width;
    const scaleY = imgEl.naturalHeight / imgEl.height;
    canvas.width = Math.round(crop.width * scaleX);
    canvas.height = Math.round(crop.height * scaleY);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imgEl,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
  });

const PassportCropper = ({ imageSrc, onConfirm, onCancel }) => {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [tooSmall, setTooSmall] = useState(false);

  const onImageLoad = useCallback((event) => {
    const { naturalWidth, naturalHeight, width, height } = event.currentTarget;
    setTooSmall(naturalWidth < MIN_PX || naturalHeight < MIN_PX);
    setCrop(initCrop(width, height));
  }, []);

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop);
    onConfirm(new File([blob], 'passport.jpg', { type: 'image/jpeg' }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#122536]/80 p-3 backdrop-blur-sm">
      <div className="flex w-full max-w-[26rem] flex-col overflow-hidden rounded-[24px] border border-white/25 bg-white shadow-[0_24px_70px_rgba(18,37,54,0.3)]">
        <div className="flex items-center justify-between border-b border-[#D6EAF7] px-5 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-[#1D3557]">Passport Photo</h2>
            <p className="mt-0.5 text-xs text-slate-500">Drag and resize the frame to position your photo.</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#1D3557]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[#D6EAF7] bg-[#F5FBFF] px-5 py-2 text-[#0E4E70] sm:px-6">
          {tooSmall ? <AlertTriangle size={18} strokeWidth={2.2} /> : <Info size={18} strokeWidth={2.2} />}
          <span className="text-xs font-medium">
            {tooSmall
              ? 'Low resolution detected. A sharper image will produce a better passport photo.'
              : 'Keep the head centered with a little space above the hairline.'}
          </span>
        </div>

        <div className="bg-[#EAF4FB] p-3 sm:p-4">
          <div className="flex items-center justify-center overflow-hidden rounded-[20px] border border-[#D6EAF7] bg-[radial-gradient(circle_at_top,#FDFEFF,rgba(214,234,247,0.95))] p-3 shadow-inner">
            <div className="flex w-full items-center justify-center rounded-[18px] bg-white/35 p-2">
              <ReactCrop
                crop={crop}
                onChange={(nextCrop) => setCrop(nextCrop)}
                onComplete={(nextCrop) => setCompletedCrop(nextCrop)}
                aspect={PASSPORT_ASPECT}
                minWidth={80}
                keepSelection
                className="max-w-full rounded-[18px]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  className="block h-auto w-full max-w-[18rem] rounded-[18px] object-contain"
                  style={{ maxHeight: '22rem' }}
                />
              </ReactCrop>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[#D6EAF7] bg-white px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[#BCCFDD] px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-[#1D3557]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!completedCrop}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2095D3] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1A7BB1] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Check size={16} />
            Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassportCropper;
