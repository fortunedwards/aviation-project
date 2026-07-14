import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

const selectShellClass =
  'group relative block w-full min-w-0 min-h-[60px] max-w-full rounded-[22px] border border-[#D6EAF7] bg-gradient-to-b from-[#F8FCFF] to-[#EFF8FF] px-4 py-3 shadow-[0_10px_25px_rgba(32,149,211,0.06)] transition-all duration-200';

const SelectField = ({
  id,
  name,
  value,
  onChange,
  children,
  required = false,
  searchable = false,
  placeholder = 'Select an option',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const options = React.Children.toArray(children)
    .filter((child) => React.isValidElement(child))
    .map((child) => ({
      value: child.props.value ?? '',
      label: child.props.children,
      disabled: !!child.props.disabled,
    }));

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const displayLabel = selectedOption?.label || options[0]?.label || placeholder;
  const filteredOptions = options.filter((option) => {
    if (!searchable || !searchTerm.trim()) return true;
    return String(option.label).toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (nextValue) => {
    onChange({ target: { name, value: nextValue } });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`${selectShellClass} ${isOpen ? 'border-[#2095D3] shadow-[0_0_0_4px_rgba(32,149,211,0.12)]' : ''}`}
    >
      <input name={name} value={value} readOnly required={required} className="hidden" />
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((current) => !current);
          if (isOpen) setSearchTerm('');
        }}
        className="flex h-[34px] w-full min-w-0 max-w-full items-center justify-between gap-3 text-left"
      >
        <span
          className={`block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-[15px] font-medium ${value ? 'text-[#1D3557]' : 'text-slate-400'}`}
        >
          {displayLabel}
        </span>
        <span
          className={`shrink-0 rounded-full bg-white/90 p-1 text-[#2095D3] shadow-sm transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <ChevronDown size={18} strokeWidth={2.4} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[22px] border border-[#D6EAF7] bg-white shadow-[0_24px_60px_rgba(29,53,87,0.18)]">
          {searchable && (
            <div className="border-b border-[#E6F2F9] p-2">
              <div className="flex items-center gap-2 rounded-2xl bg-[#F4FAFE] px-3 py-2.5">
                <Search size={18} className="text-[#45A1D6]" strokeWidth={2.2} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search options..."
                  className="w-full bg-transparent text-sm text-[#1D3557] outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.map((option) => {
              const isSelected = String(option.value) === String(value);
              const isPlaceholder = option.value === '';

              return (
                <button
                  key={`${name}-${option.value || 'placeholder'}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled || isPlaceholder}
                  onClick={() => handleSelect(option.value)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#2095D3] text-white'
                      : isPlaceholder
                        ? 'cursor-not-allowed text-slate-300'
                        : 'text-[#1D3557] hover:bg-[#EEF8FE]'
                  }`}
                >
                  <span className="pr-3">{option.label}</span>
                  {isSelected && <Check size={18} strokeWidth={2.4} />}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectField;
