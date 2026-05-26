/**
 * antd-table-impl.tsx
 * Table built on @tanstack/react-table v8 + shadcn Table primitives.
 * Accepts antd Table's column/dataSource/pagination API.
 */
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table as ShadTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

// ── antd column type ──────────────────────────────────────────────────────────
export interface AntdColumnType<T = any> {
  title?: React.ReactNode;
  dataIndex?: string | string[];
  key?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  fixed?: 'left' | 'right' | boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  className?: string;
  onCell?: (record: T, index: number) => React.TdHTMLAttributes<HTMLTableCellElement>;
  children?: AntdColumnType<T>[]; // grouped columns
  responsive?: string[];
  hidden?: boolean;
  defaultSortOrder?: 'ascend' | 'descend' | null;
  sortOrder?: 'ascend' | 'descend' | null;
  filters?: { text: React.ReactNode; value: any }[];
  filteredValue?: any[];
  filterMultiple?: boolean;
  filterDropdown?: React.ReactNode;
  onFilter?: (value: any, record: T) => boolean;
  colSpan?: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function getNestedValue(record: any, dataIndex?: string | string[]): any {
  if (dataIndex === undefined || dataIndex === null) return undefined;
  const keys = Array.isArray(dataIndex) ? dataIndex : dataIndex.split('.');
  return keys.reduce((obj, key) => (obj == null ? obj : obj[key]), record);
}

function toTanstackColumns<T>(cols: AntdColumnType<T>[]): ColumnDef<T>[] {
  return cols.map((col) => {
    const id = String(
      col.key ??
        (Array.isArray(col.dataIndex) ? col.dataIndex.join('.') : col.dataIndex) ??
        col.title ??
        Math.random()
    );
    return {
      id,
      header: ({ column }) => {
        if (!col.sorter) return <>{col.title}</>;
        const sorted = column.getIsSorted();
        return (
          <button
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors appearance-none bg-transparent border-0 p-0 m-0 cursor-pointer font-[inherit] text-[inherit]"
            onClick={() => column.toggleSorting(sorted === 'asc')}
          >
            {col.title}
            {sorted === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : sorted === 'desc' ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
            )}
          </button>
        );
      },
      accessorFn: (row: T) => getNestedValue(row, col.dataIndex),
      cell: col.render
        ? ({ getValue, row }) => col.render!(getValue(), row.original, row.index)
        : ({ getValue }) => {
            const v = getValue();
            if (col.ellipsis) {
              return (
                <span
                  title={v != null ? String(v) : ''}
                  className="block truncate"
                  style={{ maxWidth: col.width ?? 200 }}
                >
                  {v as any}
                </span>
              );
            }
            return v as React.ReactNode;
          },
      enableSorting: !!col.sorter,
      size: typeof col.width === 'number' ? col.width : undefined,
      meta: {
        align: col.align,
        fixed: col.fixed,
        colSpan: col.colSpan,
        onCell: col.onCell,
      },
    };
  });
}

// ── Table props ───────────────────────────────────────────────────────────────
export interface TablePaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  defaultPageSize?: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: (string | number)[];
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  hideOnSinglePage?: boolean;
  simple?: boolean;
  showQuickJumper?: boolean;
  position?: (
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight'
  )[];
}

export interface TableRowSelection<T = any> {
  type?: 'checkbox' | 'radio';
  selectedRowKeys?: React.Key[];
  defaultSelectedRowKeys?: React.Key[];
  onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  onSelect?: (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void;
  onSelectAll?: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  getCheckboxProps?: (record: T) => Partial<{ disabled: boolean; name: string }>;
  renderCell?: (
    checked: boolean,
    record: T,
    index: number,
    node: React.ReactNode
  ) => React.ReactNode;
  columnWidth?: number | string;
  fixed?: boolean;
  checkStrictly?: boolean;
}

export interface TableProps<T = any> {
  columns?: AntdColumnType<T>[];
  dataSource?: T[];
  rowKey?: string | ((record: T) => string);
  loading?: boolean | { spinning?: boolean; tip?: string };
  pagination?: false | TablePaginationConfig;
  title?: (currentPageData: readonly T[]) => React.ReactNode;
  footer?: (currentPageData: readonly T[]) => React.ReactNode;
  rowSelection?: TableRowSelection<T>;
  expandable?: {
    expandedRowKeys?: React.Key[];
    defaultExpandedRowKeys?: React.Key[];
    expandedRowRender?: (
      record: T,
      index: number,
      indent: number,
      expanded: boolean
    ) => React.ReactNode;
    rowExpandable?: (record: T) => boolean;
    onExpand?: (expanded: boolean, record: T) => void;
    expandRowByClick?: boolean;
    expandedRowClassName?: (record: T, index: number, indent: number) => string;
  };
  scroll?: { x?: number | string | boolean; y?: number | string };
  size?: 'large' | 'middle' | 'small';
  bordered?: boolean;
  showHeader?: boolean;
  onChange?: (
    pagination: TablePaginationConfig,
    filters: Record<string, any>,
    sorter: any,
    extra: { currentDataSource: T[]; action: 'paginate' | 'sort' | 'filter' }
  ) => void;
  summary?: (currentData: readonly T[]) => React.ReactNode;
  sticky?: boolean | { offsetHeader?: number };
  className?: string;
  style?: React.CSSProperties;
  locale?: { emptyText?: React.ReactNode; filterReset?: React.ReactNode };
  tableLayout?: 'fixed' | 'auto';
  showSorterTooltip?: boolean;
  components?: any;
  onRow?: (record: T, index: number) => React.HTMLAttributes<HTMLTableRowElement>;
  onHeaderRow?: (
    columns: AntdColumnType<T>[],
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
}

// ── Table component ───────────────────────────────────────────────────────────
export function Table<T extends object = any>({
  columns = [],
  dataSource = [],
  rowKey = 'id',
  loading,
  pagination,
  title,
  footer,
  rowSelection,
  expandable,
  scroll,
  size = 'middle',
  bordered,
  showHeader = true,
  onChange,
  summary,
  className,
  style,
  locale,
  onRow,
}: TableProps<T>) {
  const isLoading = typeof loading === 'boolean' ? loading : loading?.spinning ?? false;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSel, setRowSel] = React.useState<RowSelectionState>({});
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  const paginationCfg = pagination === false ? null : pagination ?? {};

  const [{ pageIndex, pageSize }, setPagination] = React.useState<PaginationState>({
    pageIndex: (paginationCfg?.current ?? 1) - 1,
    pageSize: paginationCfg?.pageSize ?? paginationCfg?.defaultPageSize ?? 10,
  });

  // Sync controlled pagination
  React.useEffect(() => {
    if (paginationCfg?.current !== undefined) {
      setPagination((p) => ({ ...p, pageIndex: paginationCfg.current! - 1 }));
    }
  }, [paginationCfg?.current]);

  const getRowId = React.useCallback(
    (row: T, index: number): string => {
      if (typeof rowKey === 'function') return rowKey(row);
      return String((row as any)[rowKey] ?? index);
    },
    [rowKey]
  );

  const tanstackCols = React.useMemo(() => toTanstackColumns(columns), [columns]);

  const isRemotePagination =
    paginationCfg?.total !== undefined && paginationCfg.total > (paginationCfg?.pageSize ?? 10);

  const table = useReactTable<T>({
    data: dataSource,
    columns: tanstackCols,
    state: {
      sorting,
      rowSelection: rowSel,
      pagination: paginationCfg
        ? { pageIndex, pageSize }
        : { pageIndex: 0, pageSize: dataSource.length || 9999 },
    },
    manualPagination: isRemotePagination,
    pageCount: paginationCfg?.total ? Math.ceil(paginationCfg.total / pageSize) : undefined,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      onChange?.(
        { current: pageIndex + 1, pageSize },
        {},
        next.length
          ? {
              field: next[0].id,
              order: next[0].desc ? 'descend' : 'ascend',
              column: columns.find((c) => (c.key ?? c.dataIndex) === next[0].id),
            }
          : {},
        { currentDataSource: dataSource, action: 'sort' }
      );
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSel) : updater;
      setRowSel(next);
      if (rowSelection?.onChange) {
        const keys = Object.keys(next).filter((k) => next[k]);
        const rows = dataSource.filter((row, i) => keys.includes(getRowId(row, i)));
        rowSelection.onChange(keys, rows);
      }
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPagination(next);
      paginationCfg?.onChange?.(next.pageIndex + 1, next.pageSize);
      onChange?.(
        { current: next.pageIndex + 1, pageSize: next.pageSize },
        {},
        {},
        { currentDataSource: dataSource, action: 'paginate' }
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(paginationCfg ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getRowId,
    enableRowSelection: !!rowSelection,
  });

  const rows = table.getRowModel().rows;
  const currentData = rows.map((r) => r.original);
  const total = paginationCfg?.total ?? dataSource.length;
  const totalPages = Math.ceil(total / pageSize);
  const rangeStart = pageIndex * pageSize + 1;
  const rangeEnd = Math.min(pageIndex * pageSize + pageSize, total);

  const cellPad =
    size === 'small' ? 'px-3 py-1.5 text-xs' : size === 'large' ? 'px-4 py-4' : 'px-4 py-3 text-sm';

  // Sync external selectedRowKeys
  React.useEffect(() => {
    if (rowSelection?.selectedRowKeys) {
      const sel: RowSelectionState = {};
      rowSelection.selectedRowKeys.forEach((k) => {
        sel[String(k)] = true;
      });
      setRowSel(sel);
    }
  }, [rowSelection?.selectedRowKeys]);

  return (
    <div
      className={cn(
        'w-full rounded-[var(--radius)] overflow-hidden',
        bordered && 'border border-border',
        className
      )}
      style={style}
    >
      {title && (
        <div className="px-4 py-3 border-b border-border bg-card">{title(currentData)}</div>
      )}

      <div
        className={cn('overflow-x-auto', scroll?.y && 'overflow-y-auto')}
        style={{ maxHeight: scroll?.y as any }}
      >
        <ShadTable>
          {showHeader && (
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-border">
                  {rowSelection && (
                    <TableHead className={cn(cellPad, 'w-10')}>
                      {rowSelection.type !== 'radio' && (
                        <input
                          type="checkbox"
                          className="rounded border-border accent-primary"
                          checked={table.getIsAllRowsSelected()}
                          ref={(el) => {
                            if (el) el.indeterminate = table.getIsSomeRowsSelected();
                          }}
                          onChange={table.getToggleAllRowsSelectedHandler()}
                        />
                      )}
                    </TableHead>
                  )}
                  {expandable?.expandedRowRender && <TableHead className={cn(cellPad, 'w-8')} />}
                  {hg.headers.map((header) => {
                    const meta = header.column.columnDef.meta as any;
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={cn(
                          cellPad,
                          'bg-muted text-muted-foreground font-semibold uppercase tracking-wide text-[11px]',
                          meta?.align === 'center' && 'text-center',
                          meta?.align === 'right' && 'text-right',
                          meta?.fixed === 'right' && 'sticky right-0 bg-muted',
                          meta?.fixed === 'left' && 'sticky left-0 bg-muted'
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          )}

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  {rowSelection && (
                    <TableCell className={cellPad}>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((_, ci) => (
                    <TableCell key={ci} className={cellPad}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length +
                    (rowSelection ? 1 : 0) +
                    (expandable?.expandedRowRender ? 1 : 0)
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {locale?.emptyText ?? 'No data'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const isExpanded = expandedRows.has(row.id);
                const canExpand = expandable?.rowExpandable
                  ? expandable.rowExpandable(row.original)
                  : !!expandable?.expandedRowRender;
                const rowProps = onRow?.(row.original, row.index) ?? {};

                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() ? 'selected' : undefined}
                      className={cn(
                        'border-border hover:bg-accent/30 transition-colors',
                        row.getIsSelected() && 'bg-primary/5'
                      )}
                      {...rowProps}
                    >
                      {rowSelection && (
                        <TableCell className={cellPad}>
                          <input
                            type={rowSelection.type === 'radio' ? 'radio' : 'checkbox'}
                            className="rounded border-border accent-primary"
                            checked={row.getIsSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            onClick={(e) => {
                              rowSelection.onSelect?.(
                                row.original,
                                !row.getIsSelected(),
                                [],
                                e.nativeEvent
                              );
                            }}
                          />
                        </TableCell>
                      )}
                      {expandable?.expandedRowRender && (
                        <TableCell className={cn(cellPad, 'w-8')}>
                          {canExpand && (
                            <button
                              className="text-muted-foreground hover:text-foreground transition-colors appearance-none bg-transparent border-0 p-0 m-0 cursor-pointer"
                              onClick={() => {
                                const next = new Set(expandedRows);
                                if (isExpanded) {
                                  next.delete(row.id);
                                  expandable.onExpand?.(false, row.original);
                                } else {
                                  next.add(row.id);
                                  expandable.onExpand?.(true, row.original);
                                }
                                setExpandedRows(next);
                              }}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          )}
                        </TableCell>
                      )}
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as any;
                        const cellProps = meta?.onCell ? meta.onCell(row.original, row.index) : {};
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              cellPad,
                              meta?.align === 'center' && 'text-center',
                              meta?.align === 'right' && 'text-right',
                              meta?.fixed === 'right' && 'sticky right-0 bg-card',
                              meta?.fixed === 'left' && 'sticky left-0 bg-card'
                            )}
                            {...cellProps}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {isExpanded && expandable?.expandedRowRender && (
                      <TableRow key={`${row.id}-expanded`} className="bg-muted/30 border-border">
                        <TableCell
                          colSpan={columns.length + (rowSelection ? 1 : 0) + 1}
                          className={cellPad}
                        >
                          {expandable.expandedRowRender(row.original, row.index, 0, true)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>

          {summary && rows.length > 0 && (
            <tfoot>
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (rowSelection ? 1 : 0) +
                    (expandable?.expandedRowRender ? 1 : 0)
                  }
                >
                  {summary(currentData)}
                </td>
              </tr>
            </tfoot>
          )}
        </ShadTable>
      </div>

      {footer && (
        <div className="px-4 py-3 border-t border-border bg-card text-sm">
          {footer(currentData)}
        </div>
      )}

      {/* Pagination */}
      {(paginationCfg && !paginationCfg?.hideOnSinglePage) || (paginationCfg && totalPages > 1)
        ? paginationCfg &&
          totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
              <span className="text-sm text-muted-foreground">
                {paginationCfg.showTotal
                  ? paginationCfg.showTotal(total, [rangeStart, rangeEnd])
                  : `${rangeStart}–${rangeEnd} of ${total}`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagination((p) => ({ ...p, pageIndex: 0 }))}
                  disabled={pageIndex === 0}
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))}
                  disabled={pageIndex === 0}
                >
                  ‹
                </Button>
                {(() => {
                  const start = Math.max(0, Math.min(pageIndex - 2, totalPages - 5));
                  return Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = start + i;
                    return (
                      <Button
                        key={p}
                        variant={p === pageIndex ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPagination((prev) => ({ ...prev, pageIndex: p }))}
                      >
                        {p + 1}
                      </Button>
                    );
                  });
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
                  disabled={pageIndex >= totalPages - 1}
                >
                  ›
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPagination((p) => ({ ...p, pageIndex: totalPages - 1 }))}
                  disabled={pageIndex >= totalPages - 1}
                >
                  »
                </Button>
              </div>
            </div>
          )
        : null}
    </div>
  );
}
