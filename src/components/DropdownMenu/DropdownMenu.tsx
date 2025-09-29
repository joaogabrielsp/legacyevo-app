import React, { useState, useEffect, useRef } from 'react';

interface DropdownMenuProps {
  onDelete: () => void;
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ onDelete, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-700 transition-colors"
      >
        {children}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-zinc-800 rounded-md shadow-lg z-50 min-w-[120px] border border-zinc-700">
          <button
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;