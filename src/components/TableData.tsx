/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T extends Record<string, any>> {
    head: string | JSX.Element;
    dataKey: keyof T;

    cellFormat?: (rowData: any, data: T) => string | JSX.Element;

    // styling
    headClassName?: string;
    cellClassName?: string;
}

export interface DataTableProps<T extends Record<string, any>> {
    columns: DataTableColumn<T>[];
    data: T[];
    // paginationInfo?: PaginationInfo;
    // paginationActions?: PaginationActions;
    noHeaderHoverable?: boolean;
    headerClassName?: string;
}

export function TableData({
    columns,
    data,
    headerClassName,
    // noHeaderHoverable,
}: DataTableProps<any>) {
    return (
        <Table>
            <TableHeader className={`${headerClassName}`}>
                <TableRow>
                    {columns.map((columns, index) => (
                        <TableHead key={index}>{columns.head}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 ? (
                    data.map((d, rIndex) => (
                        <TableRow key={`data-row-${rIndex}`}>
                            {columns.map((c, cIndex) => {
                                const _value = d[c.dataKey];
                                return (
                                    <TableCell
                                        key={`data-cell-${rIndex}-${cIndex}`}
                                        className={c.cellClassName}
                                    >
                                        {c.cellFormat
                                            ? c.cellFormat(_value, d)
                                            : _value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                        >
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

export default TableData;
