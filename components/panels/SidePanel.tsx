'use client';

import { useState } from 'react';

interface Breadcrumb {
  label: string;
  onClick: () => void;
}

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  breadcrumbs?: Breadcrumb[];
}

export default function SidePanel({
  isOpen,
  onClose,
  title,
  children,
  actions,
  loading = false,
  breadcrumbs = []
}: SidePanelProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-full md:w-2/5 lg:w-1/3 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </button>
                  {idx < breadcrumbs.length - 1 && <span>/</span>}
                </div>
              ))}
            </div>
          )}

          {/* Title and Close */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer Actions */}
        {actions && (
          <div className="border-t border-gray-200 p-6 flex gap-3">
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
