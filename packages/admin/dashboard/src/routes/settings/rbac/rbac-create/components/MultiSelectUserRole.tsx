/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from "react";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";
interface Option {
  id: number;
  name: string;
}

interface MultiSelectUserRoleProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  selectAll?: boolean;
  onModuleChange?: (modules: number[]) => void;
}

const MultiSelectUserRole = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  options,
  placeholder = "Select options",
  label,
  className = "",
  selectAll,
  onModuleChange,
}: MultiSelectUserRoleProps<TFieldValues, TName>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableOptions, setAvailableOptions] = useState<Option[]>(options);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(availableOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { field, fieldState } = useController({
    control,
    name,
    defaultValue: [] as any,
  });

  const selectedValues = Array.isArray(field.value) ? field.value : [];

  useEffect(() => {
    const available = options.filter(option => !selectedValues.includes(option.id));
    setAvailableOptions(available);
    setFilteredOptions(available);
  }, [selectedValues, options]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle selecting/deselecting an option
  const handleSelect = (id: number) => {
    const newSelectedValues = selectedValues.includes(id)
      ? selectedValues.filter((v: number) => v !== id)
      : [...selectedValues, id];

    field.onChange(newSelectedValues);

    if (onModuleChange) {
      onModuleChange(newSelectedValues);
    }

    // Update available options
    const available = options.filter(option => !newSelectedValues.includes(option.id));
    setAvailableOptions(available);
    setFilteredOptions(available);

    // Clear search after selection
    setSearchTerm("");
  };

  // Handle removing a selected option
  const handleRemove = (idToRemove: number) => {
    const newSelectedValues = selectedValues.filter((value: number) => value !== idToRemove);
    field.onChange(newSelectedValues);

    if (onModuleChange) {
      onModuleChange(newSelectedValues);
    }

    // Update available options
    const optionToAddBack = options.find(option => option.id === idToRemove);
    if (optionToAddBack) {
      const newAvailableOptions = [...availableOptions, optionToAddBack];
      setAvailableOptions(newAvailableOptions);
      setFilteredOptions(newAvailableOptions);
    }

    // Clear search after removal
    setSearchTerm("");
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Filter available options based on search term
    if (value.trim() === "") {
      setFilteredOptions(availableOptions);
    } else {
      const filtered = availableOptions.filter(option =>
        option.module.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setFilteredOptions(availableOptions);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [availableOptions]);

  const isDarkMode = document.documentElement.classList.contains("dark");
  const iconColor = isDarkMode ? "white" : "black";

  return (
    <div className={`relative z-50 ${className}`}>
      {label && <label className="mb-3 block text-sm font-medium text-ui-fg-base">{label}</label>}

      <div>
        <div className="flex flex-col items-center">
          <div className="relative z-20 inline-block w-full">
            <div className="relative flex flex-col items-center">
              <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    setIsOpen(!isOpen);
                  }
                }}
                className="w-full"
                type="button"
                tabIndex={0}
              >
                <div className="mb-2 flex rounded border border-ui-border-base py-2 pl-3 pr-3 outline-none transition focus:border-ui-border-interactive hover:bg-ui-bg-field-hover">
                  <div className="flex flex-auto flex-wrap gap-3">
                    {options
                      .filter(option => selectedValues.includes(option.id))
                      .map(option => (
                        <div
                          key={option.id}
                          className="my-1.5 flex items-center justify-center rounded border border-ui-border-base bg-ui-bg-subtle px-2.5 py-1.5 text-sm font-medium"
                        >
                          <div className="max-w-full flex-initial">{option.module}</div>
                          <div className="flex flex-auto flex-row-reverse">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleRemove(option.id);
                              }}
                              className="cursor-pointer pl-2 hover:text-ui-fg-error"
                              aria-label={`Remove ${option.module}`}
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                viewBox="0 0 12 12"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ color: iconColor }}
                              >
                                <path
                                  fill="currentColor"
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M9.35355 3.35355C9.54882 3.15829 9.54882 2.84171 9.35355 2.64645C9.15829 2.45118 8.84171 2.45118 8.64645 2.64645L6 5.29289L3.35355 2.64645C3.15829 2.45118 2.84171 2.45118 2.64645 2.64645C2.45118 2.84171 2.45118 3.15829 2.64645 3.35355L5.29289 6L2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L6 6.70711L8.64645 9.35355C8.84171 9.54882 9.15829 9.54882 9.35355 9.35355C9.54882 9.15829 9.54882 8.84171 9.35355 8.64645L6.70711 6L9.35355 3.35355Z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    {selectedValues.length === 0 && (
                      <div className="flex-1 ">
                        <input
                          placeholder={placeholder}
                          className="h-full w-full appearance-none bg-transparent p-1 px-2 outline-none"
                          readOnly
                        />
                      </div>
                    )}
                  </div>
                  {!selectAll && (
                    <div className="flex w-8 items-center py-1 pl-1 pr-1">
                      <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="h-6 w-6 cursor-pointer outline-none focus:outline-none"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        >
                          <g opacity="0.8">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.29289 8.29289C5.68342 7.90237 6.31658 7.90237 6.70711 8.29289L12 13.5858L17.2929 8.29289C17.6834 7.90237 18.3166 7.90237 18.7071 8.29289C19.0976 8.68342 19.0976 9.31658 18.7071 9.70711L12.7071 15.7071C12.3166 16.0976 11.6834 16.0976 11.2929 15.7071L5.29289 9.70711C4.90237 9.31658 4.90237 8.68342 5.29289 8.29289Z"
                              fill="currentColor"
                            ></path>
                          </g>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </button>

              {isOpen && !selectAll && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 top-full z-40 w-full overflow-y-auto rounded bg-ui-bg-base shadow-elevation-modal border border-ui-border-base"
                >
                  {/* Search input */}
                  <div className="sticky top-0 z-10 border-b border-ui-border-base bg-ui-bg-base p-2">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search options..."
                        className="w-full rounded-md border border-ui-border-base bg-transparent py-2 pl-10 pr-4 outline-none focus:border-ui-border-interactive"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M9.16666 3.33332C5.945 3.33332 3.33332 5.945 3.33332 9.16666C3.33332 12.3883 5.945 15 9.16666 15C12.3883 15 15 12.3883 15 9.16666C15 5.945 12.3883 3.33332 9.16666 3.33332ZM1.66666 9.16666C1.66666 5.02452 5.02452 1.66666 9.16666 1.66666C13.3088 1.66666 16.6667 5.02452 16.6667 9.16666C16.6667 13.3088 13.3088 16.6667 9.16666 16.6667C5.02452 16.6667 1.66666 13.3088 1.66666 9.16666Z"
                            fill="currentColor"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M13.2857 13.2857C13.6112 12.9603 14.1388 12.9603 14.4642 13.2857L18.0892 16.9107C18.4147 17.2362 18.4147 17.7638 18.0892 18.0892C17.7638 18.4147 17.2362 18.4147 16.9107 18.0892L13.2857 14.4642C12.9603 14.1388 12.9603 13.6112 13.2857 13.2857Z"
                            fill="currentColor"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Options list */}
                  <div className="flex max-h-[240px] w-full flex-col overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                      filteredOptions.map(option => (
                        <div key={option.id}>
                          <button
                            type="button"
                            className="w-full cursor-pointer border-b border-ui-border-base hover:bg-ui-bg-subtle-hover"
                            onClick={() => handleSelect(option.id)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                handleSelect(option.id);
                              }
                            }}
                          >
                            <div
                              className={`relative flex w-full items-center border-l-2 border-transparent p-2 pl-2 ${
                                selectedValues.includes(option.id) ? "border-ui-fg-interactive" : ""
                              }`}
                            >
                              <div className="flex w-full items-center">
                                <div className="mx-2 leading-6 text-ui-fg-base">
                                  {option.module}
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-ui-fg-subtle">
                        No options match your search
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {fieldState.error && (
        <p className="mt-2 text-sm text-ui-fg-error">{fieldState.error.message}</p>
      )}
    </div>
  );
};

export default MultiSelectUserRole;
