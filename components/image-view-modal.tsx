'use client';

interface ImageViewModalProps {
  imageUrl: string;
  itemName: string;
  onClose: () => void;
}

export default function ImageViewModal({ imageUrl, itemName, onClose }: ImageViewModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close
        </button>

        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={itemName}
          className="w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Caption */}
        <p className="mt-4 text-white/80 text-sm font-medium text-center">{itemName}</p>
      </div>
    </div>
  );
}
