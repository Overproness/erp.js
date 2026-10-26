import React from 'react';
import {
  AppstoreOutlined,
  FileSearchOutlined,
  FilterOutlined,
  RedoOutlined,
  SearchOutlined,
  TableOutlined,
  UnorderedListOutlined,
} from '@/components/icons';
import { Button, Tooltip } from '@/components/ui';

export type ViewModeType = 'table' | 'grid' | 'kanban' | 'list';

export interface MasterToolbarProps {
  // Search
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
  searchWidth?: string | number;

  // Advanced Search - Explicitly customizable per module
  showAdvancedSearch?: boolean;
  onAdvancedSearchClick?: () => void;
  advancedSearchLabel?: string;
  isAdvancedSearchActive?: boolean;

  // Filters & Custom Dropdowns
  filters?: React.ReactNode;

  // View Switcher (Table / Grid / Kanban / List)
  viewMode?: {
    current: ViewModeType;
    options?: ViewModeType[];
    onChange: (mode: ViewModeType) => void;
  };

  // Refresh
  onRefresh?: () => void;
  isRefreshing?: boolean;

  // Extra Slots
  extraLeft?: React.ReactNode;
  extraRight?: React.ReactNode;
  className?: string;
}

export const MasterToolbar: React.FC<MasterToolbarProps> = ({
  showSearch = true,
  searchPlaceholder = 'Search records...',
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchWidth = '320px',

  showAdvancedSearch = false,
  onAdvancedSearchClick,
  advancedSearchLabel = 'Advanced Search',
  isAdvancedSearchActive = false,

  filters,
  viewMode,
  onRefresh,
  isRefreshing = false,

  extraLeft,
  extraRight,
  className = '',
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit?.(searchValue);
    }
  };

  return (
    <div className={`master-toolbar ${className}`}>
      {/* Left side: Search & Advanced Search & Filters */}
      <div className="master-toolbar-left">
        {showSearch && (
          <div
            className="etched-input-box"
            style={{
              width: typeof searchWidth === 'number' ? `${searchWidth}px` : searchWidth,
              height: '36px',
            }}
          >
            <div className="etched-input-prefix">
              <SearchOutlined style={{ color: '#9ca3af', fontSize: '14px' }} />
            </div>
            <input
              type="text"
              className="etched-input-raw"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchValue && (
              <button
                type="button"
                className="etched-input-clear-btn"
                onClick={() => {
                  onSearchChange?.('');
                  onSearchSubmit?.('');
                }}
              >
                ×
              </button>
            )}
          </div>
        )}

        {/* Advanced Search Button - Fully toggleable per module */}
        {showAdvancedSearch && (
          <Button
            className="master-secondary-btn"
            style={{
              height: '36px',
              borderColor: isAdvancedSearchActive ? '#0058c3' : undefined,
              color: isAdvancedSearchActive ? '#0058c3' : undefined,
              background: isAdvancedSearchActive ? 'rgba(0, 88, 195, 0.06)' : undefined,
            }}
            onClick={onAdvancedSearchClick}
            icon={<FileSearchOutlined />}
          >
            {advancedSearchLabel}
          </Button>
        )}

        {/* Custom Filter Controls / Dropdowns */}
        {filters}

        {extraLeft}
      </div>

      {/* Right side: View Switcher, Refresh, Actions */}
      <div className="master-toolbar-right">
        {extraRight}

        {/* View Switcher (Table / Grid / Kanban) */}
        {viewMode && viewMode.options && viewMode.options.length > 1 && (
          <div className="etched-segmented">
            {viewMode.options.map((opt) => {
              const isActive = viewMode.current === opt;
              let icon = <TableOutlined />;
              let label = 'Table';

              if (opt === 'grid') {
                icon = <AppstoreOutlined />;
                label = 'Grid';
              } else if (opt === 'kanban') {
                icon = <UnorderedListOutlined />;
                label = 'Kanban';
              } else if (opt === 'list') {
                icon = <UnorderedListOutlined />;
                label = 'List';
              }

              return (
                <button
                  key={opt}
                  type="button"
                  className={`etched-segmented-item ${isActive ? 'active' : ''}`}
                  onClick={() => viewMode.onChange(opt)}
                  title={label}
                >
                  {icon}
                  <span style={{ fontSize: '12px' }}>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <Tooltip title="Refresh data">
            <Button
              className="master-secondary-btn"
              style={{ height: '36px', padding: '0 10px' }}
              onClick={onRefresh}
              loading={isRefreshing}
              icon={<RedoOutlined spin={isRefreshing} />}
            />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default MasterToolbar;
