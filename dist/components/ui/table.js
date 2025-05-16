import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
const Table = React.forwardRef(({ className, ...props }, ref) => (_jsx("table", { ref: ref, className: className, ...props })));
Table.displayName = "Table";
const TableHeader = React.forwardRef(({ className, ...props }, ref) => (_jsx("thead", { ref: ref, className: className, ...props })));
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef(({ className, ...props }, ref) => (_jsx("tbody", { ref: ref, className: className, ...props })));
TableBody.displayName = "TableBody";
const TableRow = React.forwardRef(({ className, ...props }, ref) => (_jsx("tr", { ref: ref, className: className, ...props })));
TableRow.displayName = "TableRow";
const TableHead = React.forwardRef(({ className, ...props }, ref) => (_jsx("th", { ref: ref, className: className, ...props })));
TableHead.displayName = "TableHead";
const TableCell = React.forwardRef(({ className, ...props }, ref) => (_jsx("td", { ref: ref, className: className, ...props })));
TableCell.displayName = "TableCell";
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, };
//# sourceMappingURL=table.js.map